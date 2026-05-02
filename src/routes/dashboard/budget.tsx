import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/dashboard/budget")({
  component: BudgetPage,
});

function BudgetPage() {
  const { user } = useDashboard();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const loadData = useCallback(async () => {
    if (!user) return;
    const [bRes, cRes, tRes] = await Promise.all([
      supabase.from("budgets").select("*").eq("user_id", user.id).eq("month", month).eq("year", year),
      supabase.from("categories").select("*"),
      supabase.from("transactions").select("*").eq("user_id", user.id).eq("type", "expense").gte("date", `${year}-${String(month).padStart(2, "0")}-01`).lte("date", `${year}-${String(month).padStart(2, "0")}-31`),
    ]);
    if (bRes.data) setBudgets(bRes.data);
    if (cRes.data) setCategories(cRes.data);
    if (tRes.data) setTransactions(tRes.data);
  }, [user, month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  const spentByCategory = transactions.reduce<Record<string, number>>((acc, tx) => {
    const key = tx.category_id || "uncategorized";
    acc[key] = (acc[key] || 0) + Number(tx.amount);
    return acc;
  }, {});

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent = Object.values(spentByCategory).reduce((s, v) => s + v, 0);

  const donutData = budgets.map((b) => {
    const cat = categories.find((c) => c.id === b.category_id);
    return { name: cat?.name || "Other", value: Number(b.amount), color: cat?.color || "#7C3AED" };
  });

  async function handleSaveBudget(categoryId: string) {
    if (!user) return;
    const existing = budgets.find((b) => b.category_id === categoryId);
    if (existing) {
      await supabase.from("budgets").update({ amount: parseFloat(editAmount) }).eq("id", existing.id);
    } else {
      await supabase.from("budgets").insert({ user_id: user.id, category_id: categoryId, amount: parseFloat(editAmount), month, year });
    }
    setEditingId(null);
    loadData();
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-foreground">Budget</h1>
      <p className="mb-8 text-sm text-muted-foreground">Monthly spending limits · {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Donut */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border lg:col-span-1">
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">Overview</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData.length ? donutData : [{ name: "No budget", value: 1, color: "oklch(0.25 0.02 280)" }]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {(donutData.length ? donutData : [{ color: "oklch(0.25 0.02 280)" }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.18 0.025 280)", border: "1px solid oklch(0.28 0.03 280)", borderRadius: "12px", color: "oklch(0.95 0.01 280)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs text-muted-foreground">Spent / Budget</p>
            <p className="font-display text-xl font-bold text-foreground">{totalSpent.toLocaleString("fr-MA")} / {totalBudget.toLocaleString("fr-MA")} MAD</p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3 lg:col-span-2">
          {categories.filter(c => !c.user_id || c.user_id === user?.id).map((cat) => {
            const budget = budgets.find((b) => b.category_id === cat.id);
            const budgetAmount = budget ? Number(budget.amount) : 0;
            const spent = spentByCategory[cat.id] || 0;
            const pct = budgetAmount > 0 ? Math.min(100, (spent / budgetAmount) * 100) : 0;
            const isEditing = editingId === cat.id;

            return (
              <div key={cat.id} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium text-foreground">{cat.name}</span>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-24 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-foreground outline-none" placeholder="0" autoFocus />
                      <button onClick={() => handleSaveBudget(cat.id)} className="rounded-lg bg-violet-bright px-3 py-1 text-xs font-semibold text-white">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingId(cat.id); setEditAmount(String(budgetAmount || "")); }} className="text-xs text-violet-bright hover:underline">
                      {budgetAmount > 0 ? "Edit" : "Set budget"}
                    </button>
                  )}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct > 90 ? "oklch(0.60 0.24 25)" : (cat.color || "#7C3AED") }} />
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>{spent.toLocaleString("fr-MA")} MAD spent</span>
                  <span>{budgetAmount > 0 ? `${(budgetAmount - spent).toLocaleString("fr-MA")} MAD remaining` : "No limit set"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
