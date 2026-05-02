import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { Plus, X, CheckCircle2, DollarSign } from "lucide-react";

export const Route = createFileRoute("/dashboard/bills")({
  component: BillsPage,
});

function BillsPage() {
  const { user } = useDashboard();
  const [bills, setBills] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [negotiateModal, setNegotiateModal] = useState<any>(null);
  const [form, setForm] = useState({ name: "", amount: "", due_date: "", category: "", is_negotiable: false });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("bills").select("*").eq("user_id", user.id).order("due_date");
    if (data) setBills(data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase.from("bills").insert({
      user_id: user.id, name: form.name, amount: parseFloat(form.amount), due_date: form.due_date || null, category: form.category, is_negotiable: form.is_negotiable,
      estimated_savings: form.is_negotiable ? parseFloat(form.amount) * 0.15 : null,
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ name: "", amount: "", due_date: "", category: "", is_negotiable: false });
    loadData();
  }

  async function handleMarkPaid(id: string) {
    await supabase.from("bills").update({ is_paid: true }).eq("id", id);
    loadData();
  }

  async function handleDelete(id: string) {
    await supabase.from("bills").delete().eq("id", id);
    loadData();
  }

  const unpaid = bills.filter(b => !b.is_paid);
  const paid = bills.filter(b => b.is_paid);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Bills</h1>
          <p className="mt-1 text-sm text-muted-foreground">{unpaid.length} unpaid bills</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="pill-btn gap-2 text-sm"><Plus className="h-4 w-4" /> Add Bill</button>
      </div>

      {/* Unpaid */}
      <div className="mb-6 space-y-3">
        {unpaid.map((bill) => (
          <div key={bill.id} className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-destructive/15">
              <DollarSign className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{bill.name}</p>
              <p className="text-xs text-muted-foreground">{bill.category || "Uncategorized"} · Due {bill.due_date || "—"}</p>
            </div>
            <p className="text-sm font-bold text-foreground">{Number(bill.amount).toLocaleString("fr-MA")} MAD</p>
            <div className="flex items-center gap-2">
              {bill.is_negotiable && (
                <button onClick={() => setNegotiateModal(bill)} className="rounded-lg bg-success/15 px-3 py-1.5 text-xs font-semibold text-success">
                  Negotiate
                </button>
              )}
              <button onClick={() => handleMarkPaid(bill.id)} className="rounded-lg bg-violet-bright/15 px-3 py-1.5 text-xs font-semibold text-violet-bright">
                Mark Paid
              </button>
              <button onClick={() => handleDelete(bill.id)} className="text-xs text-muted-foreground hover:text-destructive">Delete</button>
            </div>
          </div>
        ))}
        {unpaid.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">All bills paid!</p>}
      </div>

      {/* Paid history */}
      {paid.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid</h2>
          <div className="space-y-2">
            {paid.slice(0, 10).map((bill) => (
              <div key={bill.id} className="flex items-center gap-3 rounded-xl bg-surface p-3 opacity-60">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="flex-1 text-sm text-foreground">{bill.name}</span>
                <span className="text-sm text-muted-foreground">{Number(bill.amount).toLocaleString("fr-MA")} MAD</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Add Bill</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="mb-1 block text-xs text-muted-foreground">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" placeholder="Internet bill" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-muted-foreground">Amount (MAD)</label><input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" /></div>
                <div><label className="mb-1 block text-xs text-muted-foreground">Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" placeholder="Internet" /></div>
              </div>
              <div><label className="mb-1 block text-xs text-muted-foreground">Due Date</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" /></div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.is_negotiable} onChange={(e) => setForm({ ...form, is_negotiable: e.target.checked })} className="rounded" />
                This bill is negotiable
              </label>
              <button type="submit" disabled={saving} className="pill-btn w-full justify-center disabled:opacity-50">{saving ? "Adding..." : "Add Bill"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Negotiate modal */}
      {negotiateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setNegotiateModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl font-bold text-foreground">Negotiate: {negotiateModal.name}</h2>
            <div className="mt-4 rounded-xl bg-success/10 p-4">
              <p className="text-sm text-foreground">Estimated savings: <strong className="text-success">{Number(negotiateModal.estimated_savings || 0).toLocaleString("fr-MA")} MAD</strong></p>
              <p className="mt-2 text-xs text-muted-foreground">Contact your provider and ask for a loyalty discount or competitive matching. Most providers in Morocco offer 10-20% reductions when asked.</p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Tips:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                <li>Mention competitor prices</li>
                <li>Ask about loyalty programs</li>
                <li>Request a bundle discount</li>
                <li>Threaten to cancel politely</li>
              </ul>
            </div>
            <button onClick={() => setNegotiateModal(null)} className="pill-btn-ghost mt-4 w-full justify-center">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
