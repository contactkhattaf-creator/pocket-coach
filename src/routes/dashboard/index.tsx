import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import {
  TrendingUp, TrendingDown, Sparkles, ArrowUpRight, ArrowDownRight,
  Wallet, Receipt, Target, Award, Flame, Star, ScanLine, ChevronRight, Eye, EyeOff,
} from "lucide-react";
import { XPBar, StreakIndicator, StatChip } from "@/components/mobile/gamification/XPBar";
import { BadgeUnlockModal } from "@/components/mobile/gamification/BadgeUnlockModal";
import { FAB } from "@/components/mobile/FAB";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function calcStreak(streaks: { date: string }[]) {
  if (!streaks?.length) return 0;
  const dates = new Set(streaks.map(s => s.date));
  let count = 0;
  const d = new Date();
  while (dates.has(d.toISOString().slice(0, 10))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function DashboardOverview() {
  const { user } = useDashboard();
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [bills, setBills] = useState<Record<string, unknown>[]>([]);
  const [goals, setGoals] = useState<Record<string, unknown>[]>([]);
  const [streaks, setStreaks] = useState<{ date: string }[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [tx, b, g, s, p] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(50),
      supabase.from("bills").select("*").eq("user_id", user.id).eq("is_paid", false).limit(5),
      supabase.from("goals").select("*").eq("user_id", user.id).limit(10),
      supabase.from("streaks").select("date").eq("user_id", user.id).order("date", { ascending: false }).limit(60),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    if (tx.data) setTransactions(tx.data);
    if (b.data) setBills(b.data);
    if (g.data) setGoals(g.data);
    if (s.data) setStreaks(s.data as { date: string }[]);
    if (p.data) setProfile(p.data);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;
  const streak = calcStreak(streaks);
  const fdsScore = Number(profile?.fds_score || 0);
  const badges = (profile?.badges as string[])?.length || 0;
  const level = Math.max(1, Math.floor(fdsScore / 20) + 1);
  const xpInLevel = fdsScore % 20;

  const recent = transactions.slice(0, 4);
  const topGoal = goals[0];
  const topGoalPct = topGoal ? Math.min(100, (Number(topGoal.current_amount) / Math.max(Number(topGoal.target_amount), 1)) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-bright via-violet to-magenta p-5 text-white shadow-[0_20px_40px_-15px_var(--violet-bright)]">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-magenta/30 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Total balance</p>
            <button
              onClick={() => setHideBalance(v => !v)}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white/80 active:scale-95"
            >
              {hideBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="mt-2 font-display text-4xl font-bold tracking-tight">
            {hideBalance ? "•••••" : `${balance.toLocaleString("fr-MA")}`} <span className="text-base font-medium opacity-70">MAD</span>
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
              <ArrowUpRight className="h-3 w-3" /> {income.toLocaleString("fr-MA")}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
              <ArrowDownRight className="h-3 w-3" /> {expense.toLocaleString("fr-MA")}
            </span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {[
          { to: "/dashboard/scanner", icon: ScanLine, label: "Scan", color: "var(--violet-bright)" },
          { to: "/dashboard/transactions", icon: Wallet, label: "Add", color: "#34d399" },
          { to: "/dashboard/bills", icon: Receipt, label: "Bills", color: "#fbbf24" },
          { to: "/dashboard/goals", icon: Target, label: "Goals", color: "#f472b6" },
        ].map((a) => (
          <Link key={a.label} to={a.to} className="group flex shrink-0 flex-col items-center gap-1.5 active:scale-95 transition-transform">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-card ring-1 ring-border transition-all group-hover:ring-violet-bright/40" style={{ color: a.color }}>
              <a.icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Gamification row */}
      <XPBar level={level} current={xpInLevel} next={20} label="XP" />

      <div className="grid grid-cols-3 gap-2.5">
        <StatChip icon={Star} label="Score" value={fdsScore} color="#a78bfa" />
        <StatChip icon={Award} label="Badges" value={badges} color="#f472b6" />
        <StatChip icon={Flame} label="Streak" value={streak} color="#fb923c" />
      </div>

      {/* Streak chip horizontal */}
      {streak > 0 && (
        <button
          onClick={() => setShowBadge(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-card p-3 ring-1 ring-border active:scale-[0.98] transition-transform"
        >
          <StreakIndicator days={streak} />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* AI Insight */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-bright/15 via-card to-card p-4 ring-1 ring-violet-bright/20">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-violet-bright/20">
            <Sparkles className="h-4 w-4 text-violet-bright" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-bright">AI Insight</p>
            <p className="text-xs text-muted-foreground">Personalized for you</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          {expense > income * 0.8
            ? `You've spent ${Math.round((expense / Math.max(income, 1)) * 100)}% of your income. Consider tightening on dining or subscriptions this week.`
            : balance > 0
            ? `You're saving ${Math.round(((income - expense) / Math.max(income, 1)) * 100)}% — fantastic. Want to set a new goal to channel it?`
            : `Add a few transactions to unlock personalized insights powered by AI.`}
        </p>
      </div>

      {/* Top goal progress */}
      {topGoal && (
        <Link to="/dashboard/goals" className="block rounded-3xl bg-card p-4 ring-1 ring-border active:scale-[0.99] transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Top goal</p>
              <p className="font-display text-base font-bold text-foreground">{String(topGoal.name)}</p>
            </div>
            <span className="text-lg font-bold text-violet-bright">{Math.round(topGoalPct)}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-bright to-magenta transition-all duration-700" style={{ width: `${topGoalPct}%` }} />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {Number(topGoal.current_amount).toLocaleString("fr-MA")} / {Number(topGoal.target_amount).toLocaleString("fr-MA")} MAD
          </p>
        </Link>
      )}

      {/* Recent activity */}
      <div className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm font-bold text-foreground">Recent activity</p>
          <Link to="/dashboard/transactions" className="text-[11px] font-semibold text-violet-bright">See all</Link>
        </div>
        <div className="space-y-2">
          {recent.map((t, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl bg-surface/60 p-2.5">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${t.type === "income" ? "bg-mint/15 text-mint" : "bg-magenta/15 text-magenta"}`}>
                {t.type === "income" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{String(t.description || "Transaction")}</p>
                <p className="text-[10px] text-muted-foreground">{String(t.date).slice(0, 10)}</p>
              </div>
              <span className={`shrink-0 text-sm font-bold ${t.type === "income" ? "text-mint" : "text-magenta"}`}>
                {t.type === "income" ? "+" : "−"}{Number(t.amount).toFixed(0)}
              </span>
            </div>
          ))}
          {recent.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">No transactions yet — tap + to add one</p>
          )}
        </div>
      </div>

      {/* Bills heads-up */}
      {bills.length > 0 && (
        <div className="rounded-3xl bg-amber-500/10 p-4 ring-1 ring-amber-500/20">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-semibold text-foreground">{bills.length} upcoming bill{bills.length > 1 ? "s" : ""}</p>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Total {bills.reduce((s, b) => s + Number(b.amount), 0).toLocaleString("fr-MA")} MAD</p>
        </div>
      )}

      <FAB />
      <BadgeUnlockModal
        open={showBadge}
        onClose={() => setShowBadge(false)}
        badgeName={`${streak}-Day Streak!`}
        badgeDesc="You're building rock-solid habits."
        icon={Flame}
      />
    </div>
  );
}
