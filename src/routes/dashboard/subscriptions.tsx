import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { Plus, X, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/dashboard/subscriptions")({
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const { user } = useDashboard();
  const [subs, setSubs] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", billing_cycle: "monthly", next_date: "" });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).order("name");
    if (data) setSubs(data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalMonthly = subs.filter(s => s.is_active).reduce((sum, s) => {
    const amt = Number(s.amount);
    if (s.billing_cycle === "yearly") return sum + amt / 12;
    if (s.billing_cycle === "weekly") return sum + amt * 4;
    return sum + amt;
  }, 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase.from("subscriptions").insert({
      user_id: user.id, name: form.name, amount: parseFloat(form.amount), billing_cycle: form.billing_cycle, next_date: form.next_date || null, is_active: true,
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ name: "", amount: "", billing_cycle: "monthly", next_date: "" });
    loadData();
  }

  async function handleToggle(id: string, active: boolean) {
    await supabase.from("subscriptions").update({ is_active: !active }).eq("id", id);
    loadData();
  }

  async function handleDelete(id: string) {
    await supabase.from("subscriptions").delete().eq("id", id);
    loadData();
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage recurring payments</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="pill-btn gap-2 text-sm"><Plus className="h-4 w-4" /> Add Subscription</button>
      </div>

      {/* Total monthly */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-violet-bright/15 to-card p-5 ring-1 ring-border">
        <p className="text-xs text-muted-foreground">Total Monthly Cost</p>
        <p className="mt-1 font-display text-3xl font-bold text-foreground">{totalMonthly.toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD</p>
      </div>

      <div className="space-y-3">
        {subs.map((sub) => (
          <div key={sub.id} className={`flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-border transition ${!sub.is_active ? "opacity-50" : ""}`}>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-bright/15 text-lg font-bold text-violet-bright">
              {sub.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{sub.name}</p>
                {/* Simulated "cancel risk" for subs over 100 MAD */}
                {sub.is_active && Number(sub.amount) > 100 && (
                  <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                    <AlertTriangle className="h-3 w-3" /> Review
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{sub.billing_cycle} · Next: {sub.next_date || "—"}</p>
            </div>
            <p className="text-sm font-bold text-foreground">{Number(sub.amount).toLocaleString("fr-MA")} MAD</p>
            <div className="flex items-center gap-2">
              <button onClick={() => handleToggle(sub.id, sub.is_active)} className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-surface-hover">
                {sub.is_active ? "Pause" : "Resume"}
              </button>
              <button onClick={() => handleDelete(sub.id)} className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-destructive">Delete</button>
            </div>
          </div>
        ))}
        {subs.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">No subscriptions tracked yet</p>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Add Subscription</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="mb-1 block text-xs text-muted-foreground">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" placeholder="Netflix" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-muted-foreground">Amount (MAD)</label><input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" /></div>
                <div><label className="mb-1 block text-xs text-muted-foreground">Cycle</label>
                  <select value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none">
                    <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div><label className="mb-1 block text-xs text-muted-foreground">Next Billing Date</label><input type="date" value={form.next_date} onChange={(e) => setForm({ ...form, next_date: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" /></div>
              <button type="submit" disabled={saving} className="pill-btn w-full justify-center disabled:opacity-50">{saving ? "Adding..." : "Add Subscription"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
