import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { TrendingUp, TrendingDown, Sparkles, Heart, Activity, Calendar } from "lucide-react";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

const COLORS = ["#a78bfa", "#f472b6", "#22d3ee", "#fbbf24", "#34d399", "#fb7185"];

function AnalyticsPage() {
  const { user } = useDashboard();
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [tx, cat, prof] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(200),
      supabase.from("categories").select("*"),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    if (tx.data) setTransactions(tx.data);
    if (cat.data) setCategories(cat.data);
    if (prof.data) setProfile(prof.data);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const expenses = transactions.filter(t => t.type === "expense");
  const income = transactions.filter(t => t.type === "income");
  const totalIn = income.reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const savingsRate = totalIn > 0 ? Math.round(((totalIn - totalOut) / totalIn) * 100) : 0;
  const fdsScore = Number(profile?.fds_score || 0);

  // Spending by category
  const catMap = new Map<string, number>();
  expenses.forEach(e => {
    const cat = categories.find(c => c.id === e.category_id);
    const name = (cat?.name as string) || "Other";
    catMap.set(name, (catMap.get(name) || 0) + Number(e.amount));
  });
  const pieData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).slice(0, 6);

  // Last 7 days comparison
  const today = new Date();
  const dayMap = new Map<string, { date: string; spent: number; earned: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(5, 10);
    dayMap.set(key, { date: key, spent: 0, earned: 0 });
  }
  transactions.forEach(t => {
    const key = String(t.date).slice(5, 10);
    const e = dayMap.get(key);
    if (e) {
      if (t.type === "expense") e.spent += Number(t.amount);
      else e.earned += Number(t.amount);
    }
  });
  const weekData = Array.from(dayMap.values());

  // Health score gauge
  const healthScore = Math.min(100, Math.round((savingsRate * 0.5) + (fdsScore * 0.5)));
  const gaugeColor = healthScore >= 70 ? "#34d399" : healthScore >= 40 ? "#fbbf24" : "#fb7185";
  const c = 2 * Math.PI * 52;

  return (
    <div className="space-y-5">
      {/* Health score hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-bright/30 via-card to-magenta/20 p-6 ring-1 ring-white/10">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-bright/20 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial Health</p>
        <div className="mt-4 flex items-center gap-5">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
              <circle cx="60" cy="60" r="52" stroke="oklch(0.22 0.025 280)" strokeWidth="10" fill="none" />
              <circle cx="60" cy="60" r="52" stroke={gaugeColor} strokeWidth="10" fill="none" strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={c * (1 - healthScore / 100)}
                className="transition-all duration-1000" style={{ filter: `drop-shadow(0 0 8px ${gaugeColor}66)` }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-bold text-foreground">{healthScore}</span>
              <span className="text-[10px] text-muted-foreground">out of 100</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-magenta" />
              <span className="text-sm font-bold text-foreground">
                {healthScore >= 70 ? "Excellent" : healthScore >= 40 ? "Good" : "Needs care"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Combines your savings rate ({savingsRate}%) and discipline score for a snapshot of your money wellness.
            </p>
          </div>
        </div>
      </div>

      {/* Quick comparison cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-mint" /> Income
          </div>
          <p className="mt-2 font-display text-xl font-bold text-foreground">{totalIn.toLocaleString("fr-MA")}</p>
          <p className="text-[10px] text-muted-foreground">MAD this period</p>
        </div>
        <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5 text-magenta" /> Expense
          </div>
          <p className="mt-2 font-display text-xl font-bold text-foreground">{totalOut.toLocaleString("fr-MA")}</p>
          <p className="text-[10px] text-muted-foreground">MAD this period</p>
        </div>
      </div>

      {/* Last 7 days bar chart */}
      <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last 7 days</p>
            <p className="font-display text-base font-bold text-foreground">Spending vs earning</p>
          </div>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} barGap={2}>
              <XAxis dataKey="date" tick={{ fill: "oklch(0.60 0.03 280)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.025 280)", border: "1px solid oklch(0.28 0.03 280)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="earned" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              <Bar dataKey="spent" fill="#f472b6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Categories donut */}
      {pieData.length > 0 && (
        <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top categories</p>
          <p className="mb-3 font-display text-base font-bold text-foreground">Where your money goes</p>
          <div className="flex items-center gap-3">
            <div className="h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.025 280)", border: "1px solid oklch(0.28 0.03 280)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {pieData.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground">{p.name}</span>
                  </div>
                  <span className="text-muted-foreground">{p.value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI prediction card */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-bright/15 to-card p-5 ring-1 ring-violet-bright/20">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-violet-bright/20">
            <Sparkles className="h-4 w-4 text-violet-bright" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-bright">AI Prediction</p>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          {savingsRate > 20
            ? `At your current pace, you'll save approximately ${Math.round((totalIn - totalOut) * 12 / Math.max(transactions.length / 30, 1)).toLocaleString("fr-MA")} MAD this year. Keep it up!`
            : `Try cutting your top spending category by 20% to boost your savings rate above 25%.`}
        </p>
      </div>

      {/* Activity ticker */}
      <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet-bright" />
          <p className="font-display text-sm font-bold text-foreground">Recent activity</p>
        </div>
        <div className="space-y-2">
          {transactions.slice(0, 5).map((t, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl bg-surface/60 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">{String(t.description || "Transaction")}</p>
                <p className="text-[10px] text-muted-foreground">{String(t.date).slice(0, 10)}</p>
              </div>
              <span className={`shrink-0 text-sm font-bold ${t.type === "income" ? "text-mint" : "text-magenta"}`}>
                {t.type === "income" ? "+" : "−"}{Number(t.amount).toFixed(0)}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
