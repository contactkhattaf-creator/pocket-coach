import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { Plus, X, TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/dashboard/investments")({
  component: InvestmentsPage,
});

function InvestmentsPage() {
  const { user } = useDashboard();
  const [investments, setInvestments] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ asset_name: "", ticker: "", shares: "", avg_price: "", current_price: "", asset_class: "stocks" });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("investments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setInvestments(data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalValue = investments.reduce((s, i) => s + Number(i.shares) * Number(i.current_price), 0);
  const totalCost = investments.reduce((s, i) => s + Number(i.shares) * Number(i.avg_price), 0);
  const totalGain = totalValue - totalCost;
  const gainPct = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(2) : "0";

  const classBucket = investments.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.asset_class] = (acc[inv.asset_class] || 0) + Number(inv.shares) * Number(inv.current_price);
    return acc;
  }, {});

  const COLORS = ["#7C3AED", "#06B6D4", "#F59E0B", "#EC4899", "#10B981", "#6366F1", "#F97316", "#14B8A6", "#8B5CF6", "#EF4444"];
  const donutData = Object.entries(classBucket).map(([name, value]) => ({ name, value }));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase.from("investments").insert({
      user_id: user.id, asset_name: form.asset_name, ticker: form.ticker, shares: parseFloat(form.shares), avg_price: parseFloat(form.avg_price), current_price: parseFloat(form.current_price), asset_class: form.asset_class,
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ asset_name: "", ticker: "", shares: "", avg_price: "", current_price: "", asset_class: "stocks" });
    loadData();
  }

  async function handleDelete(id: string) {
    await supabase.from("investments").delete().eq("id", id);
    loadData();
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Investments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Portfolio overview</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="pill-btn gap-2 text-sm"><Plus className="h-4 w-4" /> Add Holding</button>
      </div>

      {/* Portfolio summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <p className="text-xs text-muted-foreground">Total Value</p>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{totalValue.toLocaleString("fr-MA")} MAD</p>
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <p className="text-xs text-muted-foreground">Total Gain/Loss</p>
          <p className={`mt-1 font-display text-2xl font-bold ${totalGain >= 0 ? "text-success" : "text-destructive"}`}>
            {totalGain >= 0 ? "+" : ""}{totalGain.toLocaleString("fr-MA")} MAD
          </p>
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <p className="text-xs text-muted-foreground">Change %</p>
          <p className={`mt-1 flex items-center gap-1 font-display text-2xl font-bold ${totalGain >= 0 ? "text-success" : "text-destructive"}`}>
            {totalGain >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {gainPct}%
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Allocation chart */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="mb-2 font-display text-lg font-bold text-foreground">Allocation</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData.length ? donutData : [{ name: "None", value: 1 }]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {(donutData.length ? donutData : [{}]).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.18 0.025 280)", border: "1px solid oklch(0.28 0.03 280)", borderRadius: "12px", color: "oklch(0.95 0.01 280)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {donutData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /> {d.name}
              </span>
            ))}
          </div>
        </div>

        {/* Holdings table */}
        <div className="overflow-x-auto rounded-2xl bg-card ring-1 ring-border lg:col-span-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Asset</th>
                <th className="px-5 py-3">Shares</th>
                <th className="px-5 py-3">Avg Price</th>
                <th className="px-5 py-3">Current</th>
                <th className="px-5 py-3 text-right">Gain %</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => {
                const gain = ((Number(inv.current_price) - Number(inv.avg_price)) / Number(inv.avg_price) * 100);
                return (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-surface">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{inv.asset_name}</p>
                      {inv.ticker && <p className="text-xs text-muted-foreground">{inv.ticker}</p>}
                    </td>
                    <td className="px-5 py-3 text-foreground">{Number(inv.shares)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{Number(inv.avg_price).toLocaleString("fr-MA")} MAD</td>
                    <td className="px-5 py-3 text-foreground">{Number(inv.current_price).toLocaleString("fr-MA")} MAD</td>
                    <td className={`px-5 py-3 text-right font-bold ${gain >= 0 ? "text-success" : "text-destructive"}`}>
                      {gain >= 0 ? "+" : ""}{gain.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(inv.id)} className="text-muted-foreground hover:text-destructive text-xs">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {investments.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No investments tracked yet</p>}
        </div>
      </div>

      {/* Add modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Add Holding</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="mb-1 block text-xs text-muted-foreground">Asset Name</label><input required value={form.asset_name} onChange={(e) => setForm({ ...form, asset_name: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" placeholder="Apple Inc." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-muted-foreground">Ticker</label><input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" placeholder="AAPL" /></div>
                <div><label className="mb-1 block text-xs text-muted-foreground">Asset Class</label>
                  <select value={form.asset_class} onChange={(e) => setForm({ ...form, asset_class: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none">
                    <option value="stocks">Stocks</option><option value="crypto">Crypto</option><option value="bonds">Bonds</option><option value="real_estate">Real Estate</option><option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1 block text-xs text-muted-foreground">Shares</label><input type="number" step="0.01" required value={form.shares} onChange={(e) => setForm({ ...form, shares: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" /></div>
                <div><label className="mb-1 block text-xs text-muted-foreground">Avg Price</label><input type="number" step="0.01" required value={form.avg_price} onChange={(e) => setForm({ ...form, avg_price: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" /></div>
                <div><label className="mb-1 block text-xs text-muted-foreground">Current</label><input type="number" step="0.01" required value={form.current_price} onChange={(e) => setForm({ ...form, current_price: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" /></div>
              </div>
              <button type="submit" disabled={saving} className="pill-btn w-full justify-center disabled:opacity-50">{saving ? "Adding..." : "Add Holding"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
