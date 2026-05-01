import { createFileRoute, Link, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import moniqLogo from "@/assets/moniq-logo.jpg";
import { LayoutDashboard, Plus, List, Brain, LogOut, Menu, X } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

type Transaction = Tables<"transactions">;
type Category = Tables<"categories">;
type AiInsight = Tables<"ai_insights">;

function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"overview" | "add" | "transactions" | "insights">("overview");
  const [mobileMenu, setMobileMenu] = useState(false);

  // Add transaction form state
  const [txForm, setTxForm] = useState({ amount: "", type: "expense" as "income" | "expense", category_id: "", description: "", date: new Date().toISOString().split("T")[0] });
  const [txLoading, setTxLoading] = useState(false);
  const [txSuccess, setTxSuccess] = useState("");

  // Edit state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const loadData = useCallback(async (userId: string) => {
    const [txRes, catRes, insRes, profRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(100),
      supabase.from("categories").select("*"),
      supabase.from("ai_insights").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("*").eq("id", userId).single(),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (insRes.data) setInsights(insRes.data);
    if (profRes.data) setProfile(profRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate({ to: "/login" });
        return;
      }
      setUser(data.user);
      loadData(data.user.id);
    });
  }, [navigate, loadData]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("transactions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => {
        loadData(user.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadData]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setTxLoading(true);
    setTxSuccess("");
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      amount: parseFloat(txForm.amount),
      type: txForm.type,
      category_id: txForm.category_id || null,
      description: txForm.description,
      date: txForm.date,
    });
    setTxLoading(false);
    if (error) {
      setTxSuccess("Error: " + error.message);
    } else {
      setTxSuccess("Transaction added!");
      setTxForm({ amount: "", type: "expense", category_id: "", description: "", date: new Date().toISOString().split("T")[0] });
      loadData(user.id);
    }
  }

  async function handleUpdateTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTx) return;
    setTxLoading(true);
    const { error } = await supabase.from("transactions").update({
      amount: parseFloat(txForm.amount),
      type: txForm.type,
      category_id: txForm.category_id || null,
      description: txForm.description,
      date: txForm.date,
    }).eq("id", editingTx.id);
    setTxLoading(false);
    if (error) {
      setTxSuccess("Error: " + error.message);
    } else {
      setTxSuccess("Transaction updated!");
      setEditingTx(null);
      setTxForm({ amount: "", type: "expense", category_id: "", description: "", date: new Date().toISOString().split("T")[0] });
      if (user) loadData(user.id);
      setView("transactions");
    }
  }

  async function handleDeleteTransaction(id: string) {
    await supabase.from("transactions").delete().eq("id", id);
    if (user) loadData(user.id);
  }

  function startEdit(tx: Transaction) {
    setEditingTx(tx);
    setTxForm({
      amount: String(tx.amount),
      type: tx.type as "income" | "expense",
      category_id: tx.category_id || "",
      description: tx.description,
      date: tx.date,
    });
    setView("add");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <img src={moniqLogo} alt="Moniq" className="mx-auto h-16 w-16 rounded-full object-cover animate-pulse" />
          <p className="mt-4 text-ink/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Compute summary
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  // Category breakdown for expenses
  const categoryBreakdown = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, { name: string; total: number; color: string; icon: string }>>((acc, tx) => {
      const cat = categories.find((c) => c.id === tx.category_id);
      const key = cat?.id || "uncategorized";
      if (!acc[key]) acc[key] = { name: cat?.name || "Uncategorized", total: 0, color: cat?.color || "#64748B", icon: cat?.icon || "📦" };
      acc[key].total += Number(tx.amount);
      return acc;
    }, {});

  const navItems = [
    { key: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { key: "add" as const, label: editingTx ? "Edit" : "Add", icon: Plus },
    { key: "transactions" as const, label: "Transactions", icon: List },
    { key: "insights" as const, label: "AI Insights", icon: Brain },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden w-64 flex-col border-r border-ink/10 bg-lavender-soft p-6 lg:flex">
        <div className="flex items-center gap-2">
          <img src={moniqLogo} alt="Moniq" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-display text-2xl font-bold text-ink">moniq</span>
        </div>
        <p className="mt-2 text-xs text-ink/50">Welcome, {profile?.full_name || user?.email}</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { setView(item.key); if (item.key !== "add") setEditingTx(null); }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${view === item.key ? "bg-ink text-primary-foreground" : "text-ink/70 hover:bg-lavender"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ink/50 hover:text-ink">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-ink/10 bg-lavender-soft/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <img src={moniqLogo} alt="Moniq" className="h-8 w-8 rounded-full object-cover" />
          <span className="font-display text-xl font-bold text-ink">moniq</span>
        </div>
        <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-lg p-2 text-ink hover:bg-lavender">
          {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileMenu && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileMenu(false)}>
          <div className="absolute right-0 top-14 w-64 rounded-bl-2xl bg-lavender-soft p-4 shadow-card" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setView(item.key); setMobileMenu(false); if (item.key !== "add") setEditingTx(null); }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${view === item.key ? "bg-ink text-primary-foreground" : "text-ink/70"}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
            <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ink/50">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 pt-20 lg:p-10 lg:pt-10">
        {view === "overview" && (
          <div className="mx-auto max-w-5xl">
            <h1 className="font-display text-3xl font-bold text-ink">Dashboard</h1>
            <p className="mt-1 text-sm text-ink/60">Your financial overview</p>

            {/* Summary cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <SummaryCard label="Balance" value={`${balance.toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD`} color="text-ink" />
              <SummaryCard label="Total Income" value={`${totalIncome.toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD`} color="text-mint" />
              <SummaryCard label="Total Expenses" value={`${totalExpense.toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD`} color="text-magenta" />
            </div>

            {/* Category breakdown */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-ink">Expense Breakdown</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.values(categoryBreakdown).sort((a, b) => b.total - a.total).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink/5">
                    <span className="text-2xl">{cat.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">{cat.name}</p>
                      <p className="text-xs text-ink/50">{cat.total.toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD</p>
                    </div>
                    <div className="h-2 w-16 rounded-full bg-ink/10">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (cat.total / totalExpense) * 100)}%`, background: cat.color }} />
                    </div>
                  </div>
                ))}
                {Object.keys(categoryBreakdown).length === 0 && (
                  <p className="col-span-full text-sm text-ink/40">No expenses yet. Add your first transaction!</p>
                )}
              </div>
            </div>

            {/* Recent transactions */}
            <div className="mt-8">
              <h2 className="font-display text-xl font-bold text-ink">Recent Transactions</h2>
              <div className="mt-4 space-y-2">
                {transactions.slice(0, 5).map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  return (
                    <div key={tx.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink/5">
                      <span className="text-xl">{cat?.icon || "📦"}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink">{tx.description || cat?.name || "Transaction"}</p>
                        <p className="text-xs text-ink/50">{tx.date}</p>
                      </div>
                      <p className={`font-display text-lg font-bold ${tx.type === "income" ? "text-mint" : "text-magenta"}`}>
                        {tx.type === "income" ? "+" : "-"}{Number(tx.amount).toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD
                      </p>
                    </div>
                  );
                })}
                {transactions.length === 0 && (
                  <p className="text-sm text-ink/40">No transactions yet. Click "Add" to start tracking!</p>
                )}
              </div>
            </div>

            {/* AI insights preview */}
            {insights.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-bold text-ink">Latest AI Insight</h2>
                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-violet-bright/10 p-5 ring-1 ring-violet-bright/20">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-bright text-xs font-bold text-white">AI</span>
                  <p className="text-sm text-ink/80">{insights[0].insight}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {view === "add" && (
          <div className="mx-auto max-w-lg">
            <h1 className="font-display text-3xl font-bold text-ink">{editingTx ? "Edit Transaction" : "Add Transaction"}</h1>
            <form onSubmit={editingTx ? handleUpdateTransaction : handleAddTransaction} className="mt-8 space-y-5">
              {txSuccess && (
                <div className={`rounded-xl px-4 py-3 text-sm ${txSuccess.startsWith("Error") ? "bg-destructive/10 text-destructive" : "bg-mint/20 text-ink"}`}>{txSuccess}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setTxForm({ ...txForm, type: "expense" })}
                  className={`rounded-xl py-3 text-sm font-semibold transition ${txForm.type === "expense" ? "bg-magenta text-white" : "bg-white text-ink/60 ring-1 ring-ink/10"}`}>
                  Expense
                </button>
                <button type="button" onClick={() => setTxForm({ ...txForm, type: "income" })}
                  className={`rounded-xl py-3 text-sm font-semibold transition ${txForm.type === "income" ? "bg-mint text-ink" : "bg-white text-ink/60 ring-1 ring-ink/10"}`}>
                  Income
                </button>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Amount (MAD)</label>
                <input type="number" step="0.01" required value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-bright" placeholder="0.00" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
                <select value={txForm.category_id} onChange={(e) => setTxForm({ ...txForm, category_id: e.target.value })}
                  className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-bright">
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
                <input type="text" value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-bright" placeholder="Coffee at Café Clock" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Date</label>
                <input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                  className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-bright" />
              </div>
              <button type="submit" disabled={txLoading} className="pill-btn w-full justify-center disabled:opacity-50">
                {txLoading ? "Saving..." : editingTx ? "Update Transaction" : "Add Transaction"}
              </button>
              {editingTx && (
                <button type="button" onClick={() => { setEditingTx(null); setTxForm({ amount: "", type: "expense", category_id: "", description: "", date: new Date().toISOString().split("T")[0] }); setView("transactions"); }}
                  className="pill-btn-ghost w-full justify-center">Cancel</button>
              )}
            </form>
          </div>
        )}

        {view === "transactions" && (
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-3xl font-bold text-ink">All Transactions</h1>
              <button onClick={() => setView("add")} className="pill-btn text-xs">
                <Plus className="mr-1 h-4 w-4" /> Add
              </button>
            </div>
            <div className="mt-6 space-y-2">
              {transactions.map((tx) => {
                const cat = categories.find((c) => c.id === tx.category_id);
                return (
                  <div key={tx.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink/5">
                    <span className="text-xl">{cat?.icon || "📦"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">{tx.description || cat?.name || "Transaction"}</p>
                      <p className="text-xs text-ink/50">{tx.date} · {cat?.name || "Uncategorized"}</p>
                    </div>
                    <p className={`font-display text-lg font-bold ${tx.type === "income" ? "text-mint" : "text-magenta"}`}>
                      {tx.type === "income" ? "+" : "-"}{Number(tx.amount).toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD
                    </p>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(tx)} className="rounded-lg p-2 text-ink/40 hover:bg-lavender hover:text-ink" title="Edit">✏️</button>
                      <button onClick={() => handleDeleteTransaction(tx.id)} className="rounded-lg p-2 text-ink/40 hover:bg-destructive/10 hover:text-destructive" title="Delete">🗑️</button>
                    </div>
                  </div>
                );
              })}
              {transactions.length === 0 && (
                <p className="py-12 text-center text-sm text-ink/40">No transactions yet.</p>
              )}
            </div>
          </div>
        )}

        {view === "insights" && (
          <div className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl font-bold text-ink">AI Insights</h1>
            <p className="mt-1 text-sm text-ink/60">Smart observations powered by AI</p>
            <div className="mt-6 space-y-3">
              {insights.map((ins) => (
                <div key={ins.id} className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-ink/5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-bright text-xs font-bold text-white">AI</span>
                  <div className="flex-1">
                    <p className="text-sm text-ink/80">{ins.insight}</p>
                    <p className="mt-1 text-xs text-ink/40">{new Date(ins.created_at).toLocaleDateString()}</p>
                  </div>
                  {!ins.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-violet-bright" />}
                </div>
              ))}
              {insights.length === 0 && (
                <div className="py-12 text-center">
                  <span className="grid mx-auto h-16 w-16 place-items-center rounded-full bg-violet-bright/10 text-2xl">🧠</span>
                  <p className="mt-4 text-sm text-ink/40">AI insights will appear here as you add transactions.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-ink/5">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
