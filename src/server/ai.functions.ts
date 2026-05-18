import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

async function callLovableAI(body: Record<string, unknown>) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ============ Insights (existing) ============
export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(50);

    if (!transactions || transactions.length < 3) {
      return { insight: "Keep adding transactions so Monique can generate personalized insights for you!" };
    }
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const catSpend: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      const name = (t as Record<string, unknown>).categories
        ? ((t as Record<string, unknown>).categories as { name: string })?.name || "Other"
        : "Other";
      catSpend[name] = (catSpend[name] || 0) + Number(t.amount);
    });
    const topCat = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0];
    const insights: string[] = [];
    if (topCat) {
      const pct = Math.round((topCat[1] / totalExpense) * 100);
      insights.push(`Your top spending category is ${topCat[0]} at ${pct}% of total expenses (${topCat[1].toFixed(2)} MAD).`);
    }
    if (totalIncome > 0 && totalExpense > 0) {
      const saveRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
      if (saveRate > 0) insights.push(`You're saving ${saveRate}% of your income. Great discipline!`);
      else insights.push(`You're spending more than you earn. Consider cutting back on ${topCat?.[0] || "non-essentials"}.`);
    }
    const insight = insights.join(" ");
    await supabase.from("ai_insights").insert({ user_id: userId, insight, type: "spending_analysis" });
    return { insight };
  });

// ============ Auto categorize ============
export const autoCategorize = createServerFn({ method: "POST" })
  .inputValidator((data: { description: string; amount: number }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const desc = data.description.toLowerCase();
    const categoryMap: Record<string, string[]> = {
      "Food & Dining": ["cafe", "restaurant", "coffee", "lunch", "dinner", "breakfast", "food", "eat", "snack", "pizza", "burger", "tagine", "couscous", "marjane", "carrefour"],
      "Transport": ["taxi", "bus", "train", "tram", "uber", "careem", "gas", "fuel", "parking", "essence"],
      "Shopping": ["shop", "store", "clothes", "shoes", "bag", "amazon", "jumia", "market", "souk", "h&m", "zara"],
      "Entertainment": ["cinema", "movie", "netflix", "spotify", "game", "concert", "fun"],
      "Bills & Utilities": ["bill", "electric", "water", "internet", "phone", "rent", "insurance", "facture"],
      "Health": ["pharmacy", "doctor", "hospital", "gym", "clinic", "medicine", "pharmacie"],
      "Education": ["book", "course", "school", "university", "tuition", "library", "ecole"],
      "Salary": ["salary", "paycheck", "wage", "salaire"],
      "Freelance": ["freelance", "gig", "project", "client"],
    };
    let matched = "Other";
    for (const [cat, kws] of Object.entries(categoryMap)) {
      if (kws.some((kw) => desc.includes(kw))) { matched = cat; break; }
    }
    const { data: cats } = await supabase.from("categories").select("id, name").eq("name", matched).limit(1);
    return { category: matched, categoryId: cats?.[0]?.id || null };
  });

// ============ Chat assistant with real data ============
export const chatAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: { message: string; history?: { role: string; content: string }[] }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Pull real dashboard data
    const [txRes, profRes, budgetRes, goalRes, subRes] = await Promise.all([
      supabase.from("transactions").select("amount, type, description, date, categories(name)").eq("user_id", userId).order("date", { ascending: false }).limit(80),
      supabase.from("profiles").select("full_name, salary, currency, fds_score, financial_profile_type").eq("id", userId).maybeSingle(),
      supabase.from("budgets").select("amount, month, year, categories(name)").eq("user_id", userId),
      supabase.from("goals").select("name, target_amount, current_amount, deadline").eq("user_id", userId),
      supabase.from("subscriptions").select("name, amount, billing_cycle").eq("user_id", userId).eq("is_active", true),
    ]);

    const txs = txRes.data || [];
    const totalIncome = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const catSpend: Record<string, number> = {};
    txs.filter(t => t.type === "expense").forEach(t => {
      const c = (t as { categories?: { name?: string } | null }).categories?.name || "Other";
      catSpend[c] = (catSpend[c] || 0) + Number(t.amount);
    });
    const topCats = Object.entries(catSpend).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const profile = profRes.data;
    const currency = profile?.currency || "MAD";

    const context_summary = `USER FINANCIAL CONTEXT (use this real data to answer):
- Name: ${profile?.full_name || "User"}
- Currency: ${currency}
- Monthly salary: ${profile?.salary || "not set"}
- FDS score: ${profile?.fds_score || 0}
- Profile type: ${profile?.financial_profile_type || "unknown"}
- Recent transactions: ${txs.length}
- Total income (recent): ${totalIncome.toFixed(2)} ${currency}
- Total expenses (recent): ${totalExpense.toFixed(2)} ${currency}
- Savings: ${(totalIncome - totalExpense).toFixed(2)} ${currency}
- Top spending categories: ${topCats.map(([n, v]) => `${n}: ${v.toFixed(0)} ${currency}`).join(", ") || "none"}
- Active budgets: ${(budgetRes.data || []).length}
- Goals: ${(goalRes.data || []).map(g => `${g.name} (${g.current_amount}/${g.target_amount})`).join("; ") || "none"}
- Active subscriptions: ${(subRes.data || []).map(s => `${s.name}: ${s.amount} ${currency}/${s.billing_cycle}`).join(", ") || "none"}
- Last 10 transactions: ${txs.slice(0, 10).map(t => `${t.date} ${t.type} ${t.amount} ${currency} (${t.description || "?"})`).join(" | ")}`;

    const messages = [
      {
        role: "system",
        content: `You are Monique, a friendly personal finance assistant. Answer the user's question using ONLY the real data below. Be concise (2-4 sentences), specific with numbers, and actionable. Reply in the user's language (French if they write in French).\n\n${context_summary}`,
      },
      ...(data.history || []).slice(-6),
      { role: "user", content: data.message },
    ];

    const result = await callLovableAI({ model: MODEL, messages });
    const reply = result?.choices?.[0]?.message?.content || "I couldn't generate a response right now.";
    return { reply };
  });

// ============ Scan receipt (vision) ============
export const scanReceipt = createServerFn({ method: "POST" })
  .inputValidator((data: { imageBase64: string }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data }) => {
    const result = await callLovableAI({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You extract receipt data. Reply ONLY with raw JSON (no markdown) matching: {\"description\":\"merchant name\",\"amount\":\"123.45\",\"date\":\"YYYY-MM-DD\",\"category\":\"Food & Dining|Transport|Shopping|Entertainment|Bills & Utilities|Health|Education|Other\"}. Use the total/grand-total amount. If date missing use today.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract data from this receipt." },
            { type: "image_url", image_url: { url: data.imageBase64 } },
          ],
        },
      ],
    });
    const raw: string = result?.choices?.[0]?.message?.content || "{}";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    let parsed: { description?: string; amount?: string; date?: string; category?: string } = {};
    try {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end > start) parsed = JSON.parse(cleaned.slice(start, end + 1));
    } catch (e) {
      console.error("Receipt JSON parse failed", e, raw);
    }
    return {
      description: parsed.description || "Unknown merchant",
      amount: String(parsed.amount || "0"),
      date: parsed.date || new Date().toISOString().split("T")[0],
      category: parsed.category || "Other",
    };
  });
