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
  X,
  Sparkles,
  Bell,
  Shield,
  Lightbulb,
  AlertTriangle,
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

const CARD_STYLES = [
  { bg: "bg-[#C8F7C5]", text: "text-[#1a3a1a]", icon: "text-[#2d6a2d]" },
  { bg: "bg-[#FFF3B0]", text: "text-[#4a3f0a]", icon: "text-[#7a6a12]" },
  { bg: "bg-[#D4B8FF]", text: "text-[#2a1a4a]", icon: "text-[#5a3a8a]" },
];

/* ─── Score breakdown helper ─── */
function getScoreBreakdown(profile: Record<string, unknown> | null, transactions: Record<string, unknown>[], goals: Record<string, unknown>[], streaks: Record<string, unknown>[]) {
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  const goalProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + (Number(g.target_amount) > 0 ? (Number(g.current_amount) / Number(g.target_amount)) * 100 : 0), 0) / goals.length) : 0;
  const streak = calculateStreak(streaks);

  return [
    { label: "Savings Rate", value: Math.min(savingsRate, 100), max: 100, color: "#C8F7C5", description: `${savingsRate}% of income saved` },
    { label: "Goal Progress", value: Math.min(goalProgress, 100), max: 100, color: "#D4B8FF", description: `${goalProgress}% of goals reached` },
    { label: "Activity Streak", value: Math.min(streak, 30), max: 30, color: "#FFF3B0", description: `${streak} consecutive days` },
    { label: "Budget Discipline", value: expense > 0 ? Math.min(Math.round((1 - expense / (income || 1)) * 100), 100) : 100, max: 100, color: "#06B6D4", description: "Spending vs earning ratio" },
  ];
}

/* ─── AI notification generator (deterministic daily tips) ─── */
function getDailyNotifications(transactions: Record<string, unknown>[], goals: Record<string, unknown>[], bills: Record<string, unknown>[]) {
  const notifications: { icon: typeof Sparkles; title: string; message: string; color: string; time: string }[] = [];
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

  if (totalExpense > totalIncome * 0.8) {
    notifications.push({ icon: AlertTriangle, title: "Spending Alert", message: `You've spent ${Math.round((totalExpense / (totalIncome || 1)) * 100)}% of your income. Consider reviewing non-essential expenses.`, color: "#FFA07A", time: "Just now" });
  }

  if (bills.length > 0) {
    notifications.push({ icon: Bell, title: "Bills Reminder", message: `You have ${bills.length} upcoming bill${bills.length > 1 ? "s" : ""}. Stay ahead of your payments.`, color: "#FFF3B0", time: "Today" });
  }

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  if (savingsRate > 20) {
    notifications.push({ icon: Sparkles, title: "Great Savings", message: `You're saving ${Math.round(savingsRate)}% of your income. Keep up the great work!`, color: "#C8F7C5", time: "Today" });
  } else if (totalIncome > 0) {
    notifications.push({ icon: Lightbulb, title: "Savings Tip", message: "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.", color: "#D4B8FF", time: "Today" });
  }

  const nearGoals = goals.filter((g) => Number(g.target_amount) > 0 && Number(g.current_amount) / Number(g.target_amount) >= 0.8);
  if (nearGoals.length > 0) {
    notifications.push({ icon: Target, title: "Almost There", message: `${nearGoals.length} goal${nearGoals.length > 1 ? "s are" : " is"} over 80% complete. A little more push!`, color: "#06B6D4", time: "Today" });
  }

  notifications.push({ icon: Shield, title: "Daily Insight", message: "Track every expense today to maintain your streak and improve your financial score.", color: "#D4B8FF", time: "Morning" });

  return notifications.slice(0, 4);
}

function DashboardOverview() {
  const { user } = useDashboard();
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [bills, setBills] = useState<Record<string, unknown>[]>([]);
  const [goals, setGoals] = useState<Record<string, unknown>[]>([]);
  const [streaks, setStreaks] = useState<Record<string, unknown>[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [detailModal, setDetailModal] = useState<string | null>(null);
  const [scoreModal, setScoreModal] = useState(false);

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
    { title: "Savings", key: "savings", count: goals.length, label: "Coverage", value: `${savedTotal.toLocaleString("fr-MA")} MAD`, icon: PiggyBank },
    { title: "Expenses", key: "expenses", count: transactions.filter((t) => t.type === "expense").length, label: "Coverage", value: `${totalExpense.toLocaleString("fr-MA")} MAD`, icon: Wallet },
    { title: "Income", key: "income", count: transactions.filter((t) => t.type === "income").length, label: "Coverage", value: `${totalIncome.toLocaleString("fr-MA")} MAD`, icon: TrendingUp },
  ];

  const notifications = getDailyNotifications(transactions, goals, bills);
  const scoreBreakdown = getScoreBreakdown(profile, transactions, goals, streaks);

  /* detail transactions for modals */
  const detailTxForCard = (key: string) => {
    if (key === "savings") return goals;
    if (key === "expenses") return transactions.filter((t) => t.type === "expense").slice(0, 15);
    if (key === "income") return transactions.filter((t) => t.type === "income").slice(0, 15);
    return [];
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* ─── Main Column ─── */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Hello, {profile?.full_name ? String(profile.full_name) : "there"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Check & manage your financial status.</p>
        </div>

        {/* ─── Summary Cards (clickable) ─── */}
        <div className="grid gap-4 sm:grid-cols-3">
          {summaryCards.map((card, i) => {
            const style = CARD_STYLES[i % CARD_STYLES.length];
            return (
              <button
                key={card.title}
                onClick={() => setDetailModal(card.key)}
                className={`group relative overflow-hidden rounded-2xl ${style.bg} p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${style.text}`}>{card.title} ({card.count})</p>
                  <span className={`grid h-8 w-8 place-items-center rounded-full bg-black/10 transition hover:bg-black/20 ${style.icon}`}>
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-6">
                  <p className={`text-xs ${style.text} opacity-60`}>{card.label}</p>
                  <p className={`mt-1 text-xl font-bold ${style.text}`}>{card.value}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── Portfolio Stats Chart ─── */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Financial Portfolio Stats</h2>
              <p className="text-xs text-muted-foreground">{getDateRange()}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#D4B8FF]" /><span className="text-xs text-muted-foreground">Earning</span></div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#FFF3B0]" /><span className="text-xs text-muted-foreground">Expense</span></div>
              <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
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
                <XAxis dataKey="month" tick={{ fill: "oklch(0.60 0.03 280)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.60 0.03 280)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.025 280)", border: "1px solid oklch(0.28 0.03 280)", borderRadius: "12px", color: "oklch(0.95 0.01 280)" }} formatter={(value: unknown) => [`${Number(value).toLocaleString("fr-MA")} MAD`]} />
                <Area type="monotone" dataKey="income" stroke="#D4B8FF" strokeWidth={2.5} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 5, fill: "#D4B8FF", stroke: "#1a1a2e", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="expense" stroke="#FFF3B0" strokeWidth={2.5} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 5, fill: "#FFF3B0", stroke: "#1a1a2e", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── Bottom Row ─── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <p className="text-xs font-medium text-muted-foreground">Net Balance</p>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">{balance.toLocaleString("fr-MA")} MAD</p>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {balance >= 0 ? (
                <span className="flex items-center gap-1 rounded-full bg-[#C8F7C5]/15 px-2.5 py-0.5 text-xs font-medium text-[#C8F7C5]"><TrendingUp className="h-3 w-3" /> Positive</span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive"><TrendingDown className="h-3 w-3" /> Negative</span>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Goals Progress</p>
              <Link to="/dashboard/goals" className="text-xs text-violet-bright hover:underline">View all</Link>
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">{goals.length} <span className="text-base font-normal text-muted-foreground">active</span></p>
            {goalTarget > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Total saved</span><span>{Math.round((savedTotal / goalTarget) * 100)}%</span></div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-[#D4B8FF] transition-all duration-700" style={{ width: `${Math.min((savedTotal / goalTarget) * 100, 100)}%` }} /></div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Streak Heatmap ─── */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Activity Streak</h2>
            <div className="flex items-center gap-2 text-sm"><Flame className="h-4 w-4 text-[#FFF3B0]" /><span className="font-bold text-foreground">{currentStreak} day streak</span></div>
          </div>
          <StreakHeatmap streaks={streaks} />
        </div>
      </div>

      {/* ─── Right Sidebar ─── */}
      <div className="w-full space-y-4 lg:w-[300px] shrink-0">
        {/* FDS Score Card (clickable for details) */}
        {profile?.fds_score != null && (
          <button
            onClick={() => setScoreModal(true)}
            className="block w-full rounded-2xl bg-card p-5 ring-1 ring-border text-left transition-all hover:ring-violet-bright/30 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#D4B8FF]/15"><Brain className="h-6 w-6 text-[#D4B8FF]" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Financial Score</p>
                <p className="font-display text-2xl font-bold text-foreground">{String(profile.fds_score)}<span className="text-sm text-muted-foreground">/100</span></p>
              </div>
            </div>
            {typeof profile.financial_profile_type === "string" && profile.financial_profile_type && (
              <p className="mt-3 rounded-lg bg-[#D4B8FF]/10 px-3 py-1.5 text-center text-xs font-semibold capitalize text-[#D4B8FF]">{profile.financial_profile_type.replace(/_/g, " ")}</p>
            )}
          </button>
        )}

        {/* AI-Powered Daily Notifications */}
        <div className="rounded-2xl bg-gradient-to-br from-[#D4B8FF]/10 via-card to-[#C8F7C5]/5 p-5 ring-1 ring-border">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#D4B8FF]/20"><Sparkles className="h-4 w-4 text-[#D4B8FF]" /></div>
            <div>
              <h2 className="text-sm font-bold text-foreground">AI Insights</h2>
              <p className="text-[10px] text-muted-foreground">Powered by AI</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {notifications.map((n, i) => {
              const Icon = n.icon;
              return (
                <div key={i} className="flex gap-3 rounded-xl bg-surface/50 p-3 transition hover:bg-surface">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${n.color}20` }}>
                    <Icon className="h-4 w-4" style={{ color: n.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      <span className="text-[10px] text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{n.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Recent Transactions</h2>
            <Link to="/dashboard/transactions" className="text-xs text-violet-bright hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 6).map((tx) => {
              const cat = categories.find((c) => c.id === tx.category_id);
              return (
                <div key={tx.id as string} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface">
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tx.type === "income" ? "bg-[#C8F7C5]/15" : "bg-[#FFF3B0]/15"}`}>
                    {tx.type === "income" ? <TrendingUp className="h-4 w-4 text-[#C8F7C5]" /> : <TrendingDown className="h-4 w-4 text-[#FFF3B0]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{(tx.description as string) || (cat?.name as string) || "Transaction"}</p>
                    <p className="text-[11px] text-muted-foreground">{tx.date as string}</p>
                  </div>
                  <p className={`text-xs font-bold ${tx.type === "income" ? "text-[#C8F7C5]" : "text-[#FFF3B0]"}`}>
                    {tx.type === "income" ? "+" : "-"}{Number(tx.amount).toLocaleString("fr-MA")}
                  </p>
                </div>
              );
            })}
            {transactions.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No transactions yet</p>}
          </div>
        </div>

        {/* Upcoming Bills */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Upcoming Bills</h2>
            <Link to="/dashboard/bills" className="text-xs text-violet-bright hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {bills.length > 0 ? bills.map((bill) => (
              <div key={bill.id as string} className="flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-surface">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#D4B8FF]/15"><CreditCard className="h-4 w-4 text-[#D4B8FF]" /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{bill.name as string}</p>
                    <p className="text-[11px] text-muted-foreground">Due {bill.due_date as string}</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#FFF3B0] px-3 py-1 text-xs font-semibold text-[#4a3f0a]">Pay Now</span>
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
            <Link to="/dashboard/scanner" className="flex flex-col items-center gap-1.5 rounded-xl bg-surface p-3 text-center transition hover:bg-surface-hover">
              <CreditCard className="h-5 w-5 text-[#C8F7C5]" /><span className="text-[11px] font-medium text-foreground">Scan Receipt</span>
            </Link>
            <Link to="/dashboard/goals" className="flex flex-col items-center gap-1.5 rounded-xl bg-surface p-3 text-center transition hover:bg-surface-hover">
              <Target className="h-5 w-5 text-[#FFF3B0]" /><span className="text-[11px] font-medium text-foreground">New Goal</span>
            </Link>
            <Link to="/dashboard/export" className="flex flex-col items-center gap-1.5 rounded-xl bg-surface p-3 text-center transition hover:bg-surface-hover">
              <ArrowRight className="h-5 w-5 text-[#D4B8FF]" /><span className="text-[11px] font-medium text-foreground">Export</span>
            </Link>
            <Link to="/dashboard/assistant" className="flex flex-col items-center gap-1.5 rounded-xl bg-surface p-3 text-center transition hover:bg-surface-hover">
              <Brain className="h-5 w-5 text-violet-bright" /><span className="text-[11px] font-medium text-foreground">AI Help</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Detail Modal (Card Click) ─── */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDetailModal(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 ring-1 ring-border max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground capitalize">{detailModal} Details</h2>
              <button onClick={() => setDetailModal(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            {detailModal === "savings" ? (
              <div className="space-y-3">
                {goals.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No savings goals yet</p>}
                {goals.map((g) => {
                  const pct = Number(g.target_amount) > 0 ? Math.min((Number(g.current_amount) / Number(g.target_amount)) * 100, 100) : 0;
                  return (
                    <div key={g.id as string} className="rounded-xl bg-surface p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground">{g.name as string}</p>
                        <span className="text-xs text-muted-foreground">{Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-card"><div className="h-full rounded-full bg-[#C8F7C5] transition-all" style={{ width: `${pct}%` }} /></div>
                      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>{Number(g.current_amount).toLocaleString("fr-MA")} MAD</span>
                        <span>{Number(g.target_amount).toLocaleString("fr-MA")} MAD</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {detailTxForCard(detailModal).length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No transactions found</p>}
                {detailTxForCard(detailModal).map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  return (
                    <div key={tx.id as string} className="flex items-center justify-between rounded-xl bg-surface p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{(tx.description as string) || "Transaction"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {cat && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: (cat.color as string) || "#7C3AED" }} />{cat.name as string}</span>}
                          <span className="text-[11px] text-muted-foreground">{tx.date as string}</span>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${tx.type === "income" ? "text-[#C8F7C5]" : "text-[#FFF3B0]"}`}>
                        {tx.type === "income" ? "+" : "-"}{Number(tx.amount).toLocaleString("fr-MA")} MAD
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Score Breakdown Modal ─── */}
      {scoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setScoreModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Financial Score Breakdown</h2>
              <button onClick={() => setScoreModal(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="mb-6 text-center">
              <div className="relative mx-auto h-28 w-28">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.25 0.02 280)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#D4B8FF" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(Number(profile?.fds_score || 0) / 100) * 264} 264`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-2xl font-bold text-foreground">{String(profile?.fds_score || 0)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {scoreBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.value / item.max) * 100}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
            {profile?.badges && Array.isArray(profile.badges) && (profile.badges as string[]).length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium text-muted-foreground mb-2">Earned Badges</p>
                <div className="flex flex-wrap gap-2">
                  {(profile.badges as string[]).map((badge, i) => (
                    <span key={i} className="rounded-full bg-[#D4B8FF]/15 px-3 py-1 text-xs font-semibold text-[#D4B8FF]">{badge}</span>
                  ))}
                </div>
              </div>
            )}
            <Link to="/dashboard/profile" onClick={() => setScoreModal(false)} className="mt-4 block w-full rounded-xl bg-[#D4B8FF] py-2.5 text-center text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#c4a0ff]">
              View Full Profile
            </Link>
          </div>
        </div>
      )}
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
    days.push({ date: dateStr, count: streak ? Number((streak as Record<string, unknown>).action_count) : 0, dayOfWeek: d.getDay() });
  }
  const weekColumns: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weekColumns.push(days.slice(i, i + 7));
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
          {dayLabels.map((label, i) => (<div key={i} className="flex h-[14px] w-6 items-center text-[9px] text-muted-foreground">{label}</div>))}
        </div>
        {weekColumns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day) => (<div key={day.date} className={`h-[14px] w-[14px] rounded-[3px] transition-all duration-300 hover:scale-150 hover:ring-1 hover:ring-[#D4B8FF]/50 ${getColor(day.count)}`} title={`${day.date}: ${day.count} action${day.count !== 1 ? "s" : ""}`} />))}
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
