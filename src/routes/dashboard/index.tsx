import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { TrendingUp, TrendingDown, Target, Flame, ArrowRight, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { user } = useDashboard();
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [bills, setBills] = useState<Record<string, unknown>[]>([]);
  const [goals, setGoals] = useState<Record<string, unknown>[]>([]);
  const [streaks, setStreaks] = useState<Record<string, unknown>[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [txRes, catRes, billRes, goalRes, streakRes, profRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(100),
      supabase.from("categories").select("*"),
      supabase.from("bills").select("*").eq("user_id", user.id).eq("is_paid", false).order("due_date", { ascending: true }).limit(5),
      supabase.from("goals").select("*").eq("user_id", user.id).limit(10),
      supabase.from("streaks").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(365),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (billRes.data) setBills(billRes.data);
    if (goalRes.data) setGoals(goalRes.data);
    if (streakRes.data) setStreaks(streakRes.data);
    if (profRes.data) setProfile(profRes.data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadData]);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const monthlyData = getMonthlyData(transactions);
  const currentStreak = calculateStreak(streaks);
  const savedTotal = goals.reduce((s, g) => s + Number(g.current_amount), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}</p>
      </div>

      {/* Net Worth Hero */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-violet-bright/20 via-card to-card p-6 ring-1 ring-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Worth</p>
        <p className="mt-2 font-display text-4xl font-bold text-foreground counter-up">
          {balance.toLocaleString("fr-MA", { minimumFractionDigits: 2 })} <span className="text-lg text-muted-foreground">MAD</span>
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          {balance >= 0 ? (
            <span className="flex items-center gap-1 text-success"><TrendingUp className="h-4 w-4" /> Positive balance</span>
          ) : (
            <span className="flex items-center gap-1 text-destructive"><TrendingDown className="h-4 w-4" /> Negative balance</span>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Total Saved" value={`${savedTotal.toLocaleString("fr-MA")} MAD`} color="text-success" />
        <StatCard icon={Target} label="Active Goals" value={String(goals.length)} color="text-violet-bright" />
        <StatCard icon={Flame} label="Streak" value={`${currentStreak} days`} color="text-warning" />
        <StatCard icon={CreditCard} label="Upcoming Bills" value={String(bills.length)} color="text-magenta" />
      </div>

      {/* Chart + Recent */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border lg:col-span-3">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Income vs Expenses</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 280)" />
                <XAxis dataKey="month" tick={{ fill: "oklch(0.60 0.03 280)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.60 0.03 280)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.18 0.025 280)", border: "1px solid oklch(0.28 0.03 280)", borderRadius: "12px", color: "oklch(0.95 0.01 280)" }}
                  formatter={(value: unknown) => [`${Number(value).toLocaleString("fr-MA")} MAD`]}
                />
                <Bar dataKey="income" fill="oklch(0.72 0.19 155)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="oklch(0.58 0.22 295)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-5 ring-1 ring-border lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Recent</h2>
            <a href="/dashboard/transactions" className="flex items-center gap-1 text-xs text-violet-bright hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => {
              const cat = categories.find((c) => c.id === tx.category_id);
              return (
                <div key={tx.id as string} className="flex items-center gap-3 rounded-xl bg-surface p-3 transition hover:bg-surface-hover">
                  <span className="text-lg">{(cat?.icon as string) || "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{(tx.description as string) || (cat?.name as string) || "Transaction"}</p>
                    <p className="text-xs text-muted-foreground">{tx.date as string}</p>
                  </div>
                  <p className={`text-sm font-bold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}{Number(tx.amount).toLocaleString("fr-MA")} MAD
                  </p>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Streak Heatmap */}
      <div className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Activity Streak</h2>
          <div className="flex items-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-warning" />
            <span className="font-bold text-foreground">{currentStreak} day streak</span>
          </div>
        </div>
        <StreakHeatmap streaks={streaks} />
      </div>

      {/* Upcoming Bills */}
      {bills.length > 0 && (
        <div className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Upcoming Bills</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bills.map((bill) => (
              <div key={bill.id as string} className="flex items-center gap-3 rounded-xl bg-surface p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-bright/15">
                  <CreditCard className="h-5 w-5 text-violet-bright" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{bill.name as string}</p>
                  <p className="text-xs text-muted-foreground">Due {bill.due_date as string}</p>
                </div>
                <p className="text-sm font-bold text-foreground">{Number(bill.amount).toLocaleString("fr-MA")} MAD</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Streak Heatmap ── */
function StreakHeatmap({ streaks }: { streaks: Record<string, unknown>[] }) {
  const today = new Date();
  const weeks = 20;
  const days: { date: string; count: number; dayOfWeek: number }[] = [];

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const streak = streaks.find((s) => s.date === dateStr);
    days.push({
      date: dateStr,
      count: streak ? Number((streak as Record<string, unknown>).action_count) : 0,
      dayOfWeek: d.getDay(),
    });
  }

  const weekColumns: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weekColumns.push(days.slice(i, i + 7));
  }

  function getColor(count: number) {
    if (count === 0) return "bg-surface";
    if (count <= 1) return "bg-violet-bright/25";
    if (count <= 3) return "bg-violet-bright/50";
    if (count <= 5) return "bg-violet-bright/75";
    return "bg-violet-bright";
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 pr-2">
          {dayLabels.map((label, i) => (
            <div key={i} className="flex h-[14px] w-6 items-center text-[9px] text-muted-foreground">{label}</div>
          ))}
        </div>
        {/* Week columns */}
        {weekColumns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day) => (
              <div
                key={day.date}
                className={`h-[14px] w-[14px] rounded-[3px] transition-colors ${getColor(day.count)}`}
                title={`${day.date}: ${day.count} action${day.count !== 1 ? "s" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="h-[10px] w-[10px] rounded-[2px] bg-surface" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-violet-bright/25" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-violet-bright/50" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-violet-bright/75" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-violet-bright" />
        <span>More</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof TrendingUp; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function getMonthlyData(transactions: Record<string, unknown>[]) {
  const months: Record<string, { income: number; expense: number }> = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = { income: 0, expense: 0 };
  }
  transactions.forEach((tx) => {
    const d = new Date(tx.date as string);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (months[key]) {
      if (tx.type === "income") months[key].income += Number(tx.amount);
      else months[key].expense += Number(tx.amount);
    }
  });
  return Object.entries(months).map(([key, val]) => {
    const [, m] = key.split("-");
    return { month: monthNames[parseInt(m) - 1], ...val };
  });
}

function calculateStreak(streaks: Record<string, unknown>[]) {
  if (!streaks.length) return 0;
  let count = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < streaks.length; i++) {
    const d = new Date(streaks[i].date as string);
    d.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (d.getTime() === expected.getTime()) { count++; } else { break; }
  }
  return count;
}
