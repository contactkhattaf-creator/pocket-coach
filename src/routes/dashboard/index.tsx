import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  ArrowRight,
  CreditCard,
  Wallet,
  PiggyBank,
  MoreHorizontal,
  ChevronRight,
  Brain,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

/* ─── color palette for category cards ─── */
const CARD_STYLES = [
  { bg: "bg-[#C8F7C5]", text: "text-[#1a3a1a]", icon: "text-[#2d6a2d]" },
  { bg: "bg-[#FFF3B0]", text: "text-[#4a3f0a]", icon: "text-[#7a6a12]" },
  { bg: "bg-[#D4B8FF]", text: "text-[#2a1a4a]", icon: "text-[#5a3a8a]" },
];

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
  const goalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);

  const summaryCards = [
    {
      title: "Savings",
      count: goals.length,
      label: "Coverage",
      value: `${savedTotal.toLocaleString("fr-MA")} MAD`,
      icon: PiggyBank,
    },
    {
      title: "Expenses",
      count: transactions.filter((t) => t.type === "expense").length,
      label: "Coverage",
      value: `${totalExpense.toLocaleString("fr-MA")} MAD`,
      icon: Wallet,
    },
    {
      title: "Income",
      count: transactions.filter((t) => t.type === "income").length,
      label: "Coverage",
      value: `${totalIncome.toLocaleString("fr-MA")} MAD`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* ─── Main Column ─── */}
      <div className="flex-1 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Hello, {profile?.full_name ? String(profile.full_name) : "there"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Check & manage your financial status.
          </p>
        </div>

        {/* ─── Summary Cards ─── */}
        <div className="grid gap-4 sm:grid-cols-3">
          {summaryCards.map((card, i) => {
            const style = CARD_STYLES[i % CARD_STYLES.length];
            return (
              <div
                key={card.title}
                className={`group relative overflow-hidden rounded-2xl ${style.bg} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-semibold ${style.text}`}>
                      {card.title} ({card.count})
                    </p>
                  </div>
                  <button className={`grid h-8 w-8 place-items-center rounded-full bg-black/10 transition hover:bg-black/20 ${style.icon}`}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-6">
                  <p className={`text-xs ${style.text} opacity-60`}>{card.label}</p>
                  <p className={`mt-1 text-xl font-bold ${style.text}`}>{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Portfolio Stats Chart ─── */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Financial Portfolio Stats
              </h2>
              <p className="text-xs text-muted-foreground">
                {getDateRange()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#D4B8FF]" />
                <span className="text-xs text-muted-foreground">Earning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FFF3B0]" />
                <span className="text-xs text-muted-foreground">Expense</span>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="h-[260px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4B8FF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#D4B8FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFF3B0" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FFF3B0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fill: "oklch(0.60 0.03 280)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "oklch(0.60 0.03 280)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.025 280)",
                    border: "1px solid oklch(0.28 0.03 280)",
                    borderRadius: "12px",
                    color: "oklch(0.95 0.01 280)",
                  }}
                  formatter={(value: unknown) => [`${Number(value).toLocaleString("fr-MA")} MAD`]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#D4B8FF"
                  strokeWidth={2.5}
                  fill="url(#incomeGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#D4B8FF", stroke: "#1a1a2e", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#FFF3B0"
                  strokeWidth={2.5}
                  fill="url(#expenseGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#FFF3B0", stroke: "#1a1a2e", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── Bottom Row: Balance + Goals ─── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Net Balance Card */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <p className="text-xs font-medium text-muted-foreground">Net Balance</p>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">
              {balance.toLocaleString("fr-MA")} MAD
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {balance >= 0 ? (
                <span className="flex items-center gap-1 rounded-full bg-[#C8F7C5]/15 px-2.5 py-0.5 text-xs font-medium text-[#C8F7C5]">
                  <TrendingUp className="h-3 w-3" /> Positive
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
                  <TrendingDown className="h-3 w-3" /> Negative
                </span>
              )}
            </div>
          </div>

          {/* Goals Summary */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Goals Progress</p>
              <Link to="/dashboard/goals" className="text-xs text-violet-bright hover:underline">
                View all
              </Link>
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">
              {goals.length} <span className="text-base font-normal text-muted-foreground">active</span>
            </p>
            {goalTarget > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Total saved</span>
                  <span>{Math.round((savedTotal / goalTarget) * 100)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-[#D4B8FF] transition-all duration-700"
                    style={{ width: `${Math.min((savedTotal / goalTarget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Streak Heatmap ─── */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Activity Streak</h2>
            <div className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-[#FFF3B0]" />
              <span className="font-bold text-foreground">{currentStreak} day streak</span>
            </div>
          </div>
          <StreakHeatmap streaks={streaks} />
        </div>
      </div>

      {/* ─── Right Sidebar ─── */}
      <div className="w-full space-y-4 lg:w-[300px] shrink-0">
        {/* FDS Score Card */}
        {profile?.fds_score != null && (
          <Link
            to="/dashboard/profile"
            className="block rounded-2xl bg-card p-5 ring-1 ring-border transition-all hover:ring-violet-bright/30 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#D4B8FF]/15">
                <Brain className="h-6 w-6 text-[#D4B8FF]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Financial Score</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  {String(profile.fds_score)}<span className="text-sm text-muted-foreground">/100</span>
                </p>
              </div>
            </div>
            {typeof profile.financial_profile_type === "string" && profile.financial_profile_type && (
              <p className="mt-3 rounded-lg bg-[#D4B8FF]/10 px-3 py-1.5 text-center text-xs font-semibold capitalize text-[#D4B8FF]">
                {profile.financial_profile_type.replace(/_/g, " ")}
              </p>
            )}
          </Link>
        )}

        {/* Recent Transactions */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Recent Transactions</h2>
            <Link to="/dashboard/transactions" className="text-xs text-violet-bright hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 6).map((tx) => {
              const cat = categories.find((c) => c.id === tx.category_id);
              return (
                <div
                  key={tx.id as string}
                  className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface"
                >
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    tx.type === "income" ? "bg-[#C8F7C5]/15" : "bg-[#FFF3B0]/15"
                  }`}>
                    {tx.type === "income" ? (
                      <TrendingUp className="h-4 w-4 text-[#C8F7C5]" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-[#FFF3B0]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {(tx.description as string) || (cat?.name as string) || "Transaction"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{tx.date as string}</p>
                  </div>
                  <p className={`text-xs font-bold ${tx.type === "income" ? "text-[#C8F7C5]" : "text-[#FFF3B0]"}`}>
                    {tx.type === "income" ? "+" : "-"}{Number(tx.amount).toLocaleString("fr-MA")}
                  </p>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">No transactions yet</p>
            )}
          </div>
        </div>

        {/* Upcoming Bills */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Upcoming Bills</h2>
            <Link to="/dashboard/bills" className="text-xs text-violet-bright hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {bills.length > 0 ? bills.map((bill) => (
              <div
                key={bill.id as string}
                className="flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#D4B8FF]/15">
                    <CreditCard className="h-4 w-4 text-[#D4B8FF]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{bill.name as string}</p>
                    <p className="text-[11px] text-muted-foreground">Due {bill.due_date as string}</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#FFF3B0] px-3 py-1 text-xs font-semibold text-[#4a3f0a]">
                  Pay Now
                </span>
              </div>
            )) : (
              <p className="py-4 text-center text-xs text-muted-foreground">No upcoming bills</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-gradient-to-br from-[#D4B8FF]/20 to-card p-5 ring-1 ring-border">
          <p className="text-xs font-medium text-muted-foreground mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/dashboard/scanner"
              className="flex flex-col items-center gap-1.5 rounded-xl bg-surface p-3 text-center transition hover:bg-surface-hover"
            >
              <CreditCard className="h-5 w-5 text-[#C8F7C5]" />
              <span className="text-[11px] font-medium text-foreground">Scan Receipt</span>
            </Link>
            <Link
              to="/dashboard/goals"
              className="flex flex-col items-center gap-1.5 rounded-xl bg-surface p-3 text-center transition hover:bg-surface-hover"
            >
              <Target className="h-5 w-5 text-[#FFF3B0]" />
              <span className="text-[11px] font-medium text-foreground">New Goal</span>
            </Link>
            <Link
              to="/dashboard/export"
              className="flex flex-col items-center gap-1.5 rounded-xl bg-surface p-3 text-center transition hover:bg-surface-hover"
            >
              <ArrowRight className="h-5 w-5 text-[#D4B8FF]" />
              <span className="text-[11px] font-medium text-foreground">Export</span>
            </Link>
            <Link
              to="/dashboard/assistant"
              className="flex flex-col items-center gap-1.5 rounded-xl bg-surface p-3 text-center transition hover:bg-surface-hover"
            >
              <Brain className="h-5 w-5 text-violet-bright" />
              <span className="text-[11px] font-medium text-foreground">AI Help</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Streak Heatmap ─── */
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
    if (count <= 1) return "bg-[#D4B8FF]/25";
    if (count <= 3) return "bg-[#D4B8FF]/50";
    if (count <= 5) return "bg-[#D4B8FF]/75";
    return "bg-[#D4B8FF]";
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5">
        <div className="flex flex-col gap-0.5 pr-2">
          {dayLabels.map((label, i) => (
            <div key={i} className="flex h-[14px] w-6 items-center text-[9px] text-muted-foreground">{label}</div>
          ))}
        </div>
        {weekColumns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day) => (
              <div
                key={day.date}
                className={`h-[14px] w-[14px] rounded-[3px] transition-all duration-300 hover:scale-150 hover:ring-1 hover:ring-[#D4B8FF]/50 ${getColor(day.count)}`}
                title={`${day.date}: ${day.count} action${day.count !== 1 ? "s" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="h-[10px] w-[10px] rounded-[2px] bg-surface" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-[#D4B8FF]/25" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-[#D4B8FF]/50" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-[#D4B8FF]/75" />
        <div className="h-[10px] w-[10px] rounded-[2px] bg-[#D4B8FF]" />
        <span>More</span>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function getDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} - ${now.toLocaleDateString("en-US", opts)}`;
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
