import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { autoCategorize } from "@/server/ai.functions";
import { Plus, Search, Pencil, Trash2, X, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const { user } = useDashboard();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [form, setForm] = useState({ amount: "", type: "expense", category_id: "", description: "", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const autoCategorizeFn = useServerFn(autoCategorize);

  async function suggestCategoryWithAI() {
    if (!form.description.trim()) {
      toast.error("Entrez d'abord une description");
      return;
    }
    setAiSuggesting(true);
    try {
      const { categoryId, category } = await autoCategorizeFn({
        data: { description: form.description, amount: parseFloat(form.amount) || 0 },
      });
      if (categoryId) {
        setForm((f) => ({ ...f, category_id: categoryId }));
        toast.success(`Catégorie suggérée: ${category}`);
      } else {
        toast.info(`Catégorie "${category}" non trouvée — créez-la d'abord`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Échec de la suggestion IA");
    } finally {
      setAiSuggesting(false);
    }
  }

  const loadData = useCallback(async () => {
    if (!user) return;
    const [txRes, catRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(500),
      supabase.from("categories").select("*"),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (catRes.data) setCategories(catRes.data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = transactions.filter((tx) => {
    if (search && !tx.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && tx.category_id !== filterCat) return false;
    if (filterType && tx.type !== filterType) return false;
    return true;
  });

  function openAdd() {
    setEditingTx(null);
    setForm({ amount: "", type: "expense", category_id: "", description: "", date: new Date().toISOString().split("T")[0] });
    setModalOpen(true);
  }

  function openEdit(tx: any) {
    setEditingTx(tx);
    setForm({ amount: String(tx.amount), type: tx.type, category_id: tx.category_id || "", description: tx.description, date: tx.date });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    if (editingTx) {
      await supabase.from("transactions").update({
        amount: parseFloat(form.amount), type: form.type, category_id: form.category_id || null, description: form.description, date: form.date,
      }).eq("id", editingTx.id);
    } else {
      await supabase.from("transactions").insert({
        user_id: user.id, amount: parseFloat(form.amount), type: form.type, category_id: form.category_id || null, description: form.description, date: form.date,
      });
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    await supabase.from("transactions").delete().eq("id", id);
    loadData();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">{transactions.length} total transactions</p>
        </div>
        <button onClick={openAdd} className="pill-btn gap-2 text-sm"><Plus className="h-4 w-4" /> Add Transaction</button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..." className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright placeholder:text-muted-foreground" />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none">
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl bg-card ring-1 ring-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => {
              const cat = categories.find((c) => c.id === tx.category_id);
              return (
                <tr key={tx.id} className="border-b border-border/50 transition hover:bg-surface">
                  <td className="px-5 py-3 text-muted-foreground">{tx.date}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{tx.description || "—"}</td>
                  <td className="px-5 py-3">
                    {cat ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium" style={{ borderLeft: `3px solid ${cat.color || "#7C3AED"}` }}>
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: cat.color || "#7C3AED" }} /> {cat.name}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className={`px-5 py-3 text-right font-bold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}{Number(tx.amount).toLocaleString("fr-MA")} MAD
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(tx)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(tx.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No transactions found</p>}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">{editingTx ? "Edit Transaction" : "Add Transaction"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setForm({ ...form, type: "expense" })} className={`rounded-xl py-2.5 text-sm font-semibold transition ${form.type === "expense" ? "bg-destructive text-white" : "bg-surface text-muted-foreground"}`}>Expense</button>
                <button type="button" onClick={() => setForm({ ...form, type: "income" })} className={`rounded-xl py-2.5 text-sm font-semibold transition ${form.type === "income" ? "bg-success text-white" : "bg-surface text-muted-foreground"}`}>Income</button>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount (MAD)</label>
                <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" placeholder="0.00" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" placeholder="Coffee at Café" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-medium text-muted-foreground">Category</label>
                  <button type="button" onClick={suggestCategoryWithAI} disabled={aiSuggesting} className="inline-flex items-center gap-1 rounded-full bg-violet-bright/15 px-2.5 py-1 text-[11px] font-semibold text-violet-bright transition hover:bg-violet-bright/25 disabled:opacity-50">
                    <Sparkles className="h-3 w-3" /> {aiSuggesting ? "..." : "Suggérer avec IA"}
                  </button>
                </div>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" />
              </div>
              <button type="submit" disabled={saving} className="pill-btn w-full justify-center disabled:opacity-50">{saving ? "Saving..." : editingTx ? "Update" : "Add Transaction"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
