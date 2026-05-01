import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Get recent transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*, categories(name)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(50);

    if (!transactions || transactions.length < 3) {
      return { insight: "Keep adding transactions so Moniq can generate personalized insights for you!" };
    }

    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

    // Category spending
    const catSpend: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      const name = (t as Record<string, unknown>).categories
        ? ((t as Record<string, unknown>).categories as { name: string })?.name || "Other"
        : "Other";
      catSpend[name] = (catSpend[name] || 0) + Number(t.amount);
    });

    const topCat = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0];

    // Generate simple insight based on data
    const insights: string[] = [];

    if (topCat) {
      const pct = Math.round((topCat[1] / totalExpense) * 100);
      insights.push(`Your top spending category is ${topCat[0]} at ${pct}% of total expenses (${topCat[1].toFixed(2)} MAD).`);
    }

    if (totalIncome > 0 && totalExpense > 0) {
      const saveRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
      if (saveRate > 0) {
        insights.push(`You're saving ${saveRate}% of your income. Great discipline!`);
      } else {
        insights.push(`You're spending more than you earn. Consider cutting back on ${topCat?.[0] || "non-essentials"}.`);
      }
    }

    const insight = insights.join(" ");

    // Store the insight
    await supabase.from("ai_insights").insert({
      user_id: userId,
      insight,
      type: "spending_analysis",
    });

    return { insight };
  });

export const autoCategorize = createServerFn({ method: "POST" })
  .inputValidator((data: { description: string; amount: number }) => data)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Simple keyword-based categorization
    const desc = data.description.toLowerCase();
    const categoryMap: Record<string, string[]> = {
      "Food & Dining": ["cafe", "restaurant", "coffee", "lunch", "dinner", "breakfast", "food", "eat", "snack", "pizza", "burger", "tagine", "couscous"],
      "Transport": ["taxi", "bus", "train", "tram", "uber", "careem", "gas", "fuel", "parking"],
      "Shopping": ["shop", "store", "clothes", "shoes", "bag", "amazon", "jumia", "market", "souk"],
      "Entertainment": ["cinema", "movie", "netflix", "spotify", "game", "concert", "fun"],
      "Bills & Utilities": ["bill", "electric", "water", "internet", "phone", "rent", "insurance"],
      "Health": ["pharmacy", "doctor", "hospital", "gym", "clinic", "medicine"],
      "Education": ["book", "course", "school", "university", "tuition", "library"],
      "Salary": ["salary", "paycheck", "wage"],
      "Freelance": ["freelance", "gig", "project", "client"],
    };

    let matchedCategory = "Other";
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((kw) => desc.includes(kw))) {
        matchedCategory = category;
        break;
      }
    }

    // Find the category ID
    const { data: cats } = await supabase.from("categories").select("id, name").eq("name", matchedCategory).limit(1);
    const categoryId = cats?.[0]?.id || null;

    return { category: matchedCategory, categoryId };
  });
