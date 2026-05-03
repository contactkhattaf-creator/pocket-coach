import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { Shield, Award, Star, TrendingUp, Brain, Zap, Heart, Gem, Crown, Target } from "lucide-react";
import { AnimateIn, AnimatedCounter } from "@/hooks/use-animate-on-scroll";

export const Route = createFileRoute("/dashboard/profile")({
  component: FinancialProfilePage,
});

const PROFILES = {
  emotional_spender: { label: "Emotional Spender", icon: Heart, color: "text-magenta", bg: "bg-pink-500/10", desc: "You tend to spend based on emotions. Monique will help you build awareness around impulse purchases." },
  anxious_saver: { label: "Anxious Saver", icon: Shield, color: "text-mint", bg: "bg-emerald-500/10", desc: "You save well but sometimes from anxiety rather than strategy. Let's build confidence in your financial decisions." },
  prudent_investor: { label: "Prudent Investor", icon: TrendingUp, color: "text-violet-bright", bg: "bg-violet-500/10", desc: "You balance saving and investing wisely. Keep optimizing your portfolio and growing your wealth." },
  social_spender: { label: "Social Spender", icon: Zap, color: "text-warning", bg: "bg-amber-500/10", desc: "Social situations drive your spending. Monique will help you enjoy life while keeping budgets in check." },
};

const BADGE_COLORS = [
  { ring: "#FF2D55", glow: "rgba(255,45,85,0.35)", bg: "rgba(255,45,85,0.12)" },
  { ring: "#FF9500", glow: "rgba(255,149,0,0.35)", bg: "rgba(255,149,0,0.12)" },
  { ring: "#30D158", glow: "rgba(48,209,88,0.35)", bg: "rgba(48,209,88,0.12)" },
  { ring: "#5E5CE6", glow: "rgba(94,92,230,0.35)", bg: "rgba(94,92,230,0.12)" },
  { ring: "#BF5AF2", glow: "rgba(191,90,242,0.35)", bg: "rgba(191,90,242,0.12)" },
  { ring: "#FFD60A", glow: "rgba(255,214,10,0.35)", bg: "rgba(255,214,10,0.12)" },
  { ring: "#64D2FF", glow: "rgba(100,210,255,0.35)", bg: "rgba(100,210,255,0.12)" },
  { ring: "#FF375F", glow: "rgba(255,55,95,0.35)", bg: "rgba(255,55,95,0.12)" },
  { ring: "#30D158", glow: "rgba(48,209,88,0.35)", bg: "rgba(48,209,88,0.12)" },
  { ring: "#AC8E68", glow: "rgba(172,142,104,0.35)", bg: "rgba(172,142,104,0.12)" },
  { ring: "#FFD700", glow: "rgba(255,215,0,0.40)", bg: "rgba(255,215,0,0.15)" },
];

const BADGES = [
  { key: "first_transaction", label: "First Step", icon: Star, desc: "Added your first transaction" },
  { key: "streak_7", label: "Week Warrior", icon: Zap, desc: "7-day activity streak" },
  { key: "streak_30", label: "Monthly Master", icon: Crown, desc: "30-day activity streak" },
  { key: "goal_reached", label: "Goal Getter", icon: Target, desc: "Completed a savings goal" },
  { key: "budget_keeper", label: "Budget Keeper", icon: Shield, desc: "Stayed under budget for a month" },
  { key: "frugal_warrior", label: "Frugal Warrior", icon: Award, desc: "Completed no-spending challenge" },
  { key: "quick_saver", label: "Quick Saver", icon: Gem, desc: "Saved 500 MAD in 2 weeks" },
  { key: "cash_conscious", label: "Cash Conscious", icon: Brain, desc: "Completed cash-only challenge" },
  { key: "home_chef", label: "Home Chef", icon: Heart, desc: "No eating out for 21 days" },
  { key: "fds_50", label: "Rising Star", icon: Star, desc: "FDS score above 50" },
  { key: "fds_80", label: "Finance Pro", icon: Crown, desc: "FDS score above 80" },
];

/* ── Apple-style badge component ── */
function BadgeMedal({ badge, earned, colorIdx, justUnlocked }: {
  badge: typeof BADGES[number]; earned: boolean; colorIdx: number; justUnlocked: boolean;
}) {
  const c = BADGE_COLORS[colorIdx % BADGE_COLORS.length];
  const Icon = badge.icon;
  const size = 88;
  const r = 38;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative transition-all duration-700 ${justUnlocked ? "animate-scale-in" : ""}`}
        style={{ width: size, height: size }}
      >
        {/* Glow */}
        {earned && (
          <div
            className="absolute inset-0 rounded-full blur-xl"
            style={{ background: c.glow, opacity: justUnlocked ? 0.9 : 0.5 }}
          />
        )}
        <svg width={size} height={size} className="relative z-10">
          {/* Track ring */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={earned ? "transparent" : "oklch(0.22 0.025 280)"} strokeWidth={6} />
          {/* Colored ring */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={earned ? c.ring : "oklch(0.18 0.02 280)"}
            strokeWidth={earned ? 6 : 4}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={earned ? 0 : circ * 0.7}
            className="transition-all duration-1000 -rotate-90 origin-center"
            style={{ transformOrigin: "center" }}
          />
        </svg>
        {/* Icon in center */}
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-full"
          style={{ background: earned ? c.bg : "oklch(0.14 0.015 280)" }}
        >
          <div
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full"
            style={{
              background: earned
                ? `radial-gradient(circle at 35% 35%, ${c.ring}44, ${c.ring}22)`
                : "oklch(0.16 0.015 280)",
            }}
          >
            <Icon
              className="transition-all duration-500"
              style={{
                width: 24, height: 24,
                color: earned ? c.ring : "oklch(0.35 0.02 280)",
                filter: earned ? `drop-shadow(0 0 6px ${c.glow})` : "none",
              }}
            />
          </div>
        </div>
      </div>
      <div className="text-center max-w-[100px]">
        <p className={`text-[11px] font-bold leading-tight ${earned ? "text-foreground" : "text-muted-foreground/50"}`}>
          {badge.label}
        </p>
        <p className="text-[9px] leading-tight text-muted-foreground/60 mt-0.5">{badge.desc}</p>
      </div>
    </div>
  );
}

/* ── Vibration helper ── */
function vibrateDevice(pattern: number[] = [50, 30, 100]) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function FinancialProfilePage() {
  const { user } = useDashboard();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [goals, setGoals] = useState<Record<string, unknown>[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const prevBadgesRef = useRef<string[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [pRes, tRes, gRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(200),
      supabase.from("goals").select("*").eq("user_id", user.id),
    ]);
    if (pRes.data) {
      const currentBadges = (pRes.data.badges as string[]) || [];
      const prev = prevBadgesRef.current;
      if (prev.length > 0) {
        const fresh = currentBadges.filter(b => !prev.includes(b));
        if (fresh.length > 0) {
          setNewlyUnlocked(fresh);
          vibrateDevice([50, 30, 100, 30, 150]);
          setTimeout(() => setNewlyUnlocked([]), 3000);
        }
      }
      prevBadgesRef.current = currentBadges;
      setProfile(pRes.data);
    }
    if (tRes.data) setTransactions(tRes.data);
    if (gRes.data) setGoals(gRes.data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  async function analyzeProfile() {
    if (!user || !profile) return;
    setAnalyzing(true);

    const expenses = transactions.filter(t => t.type === "expense");
    const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0);
    const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

    const savingsRatio = totalIncome > 0 ? Math.min(1, (totalIncome - totalExpense) / totalIncome) : 0;
    const goalsCompleted = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;
    const goalScore = goals.length > 0 ? goalsCompleted / goals.length : 0;

    const categorySpending: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = (e.category_id as string) || "other";
      categorySpending[cat] = (categorySpending[cat] || 0) + Number(e.amount);
    });

    let profileType = "prudent_investor";
    if (savingsRatio < 0.1 && expenses.length > 20) profileType = "emotional_spender";
    else if (savingsRatio > 0.4) profileType = "anxious_saver";
    else if (savingsRatio < 0.2) profileType = "social_spender";

    const fdsScore = Math.round(
      (savingsRatio * 40) +
      (goalScore * 30) +
      (Math.min(transactions.length / 50, 1) * 20) +
      (Math.min(goals.length / 3, 1) * 10)
    );

    const earnedBadges: string[] = [];
    if (transactions.length > 0) earnedBadges.push("first_transaction");
    if (goalsCompleted > 0) earnedBadges.push("goal_reached");
    if (fdsScore >= 50) earnedBadges.push("fds_50");
    if (fdsScore >= 80) earnedBadges.push("fds_80");
    if (savingsRatio > 0.3) earnedBadges.push("budget_keeper");

    await supabase.from("profiles").update({
      financial_profile_type: profileType,
      fds_score: fdsScore,
      badges: earnedBadges,
    }).eq("id", user.id);

    setAnalyzing(false);
    loadData();
  }

  const profileType = profile?.financial_profile_type as string | null;
  const fdsScore = Number(profile?.fds_score || 0);
  const badges = (profile?.badges as string[]) || [];
  const profileInfo = profileType ? PROFILES[profileType as keyof typeof PROFILES] : null;

  const scoreColor = fdsScore >= 80 ? "oklch(0.72 0.19 155)" : fdsScore >= 50 ? "oklch(0.58 0.22 295)" : fdsScore >= 30 ? "oklch(0.78 0.16 75)" : "oklch(0.60 0.24 25)";
  const circumference = 2 * Math.PI * 54;

  const earnedCount = BADGES.filter(b => badges.includes(b.key)).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Financial Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your money personality and discipline score</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* FDS Score */}
        <AnimateIn delay={100}>
          <div className="rounded-2xl bg-gradient-to-br from-violet-bright/15 via-card to-card p-6 ring-1 ring-border">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial Discipline Score</h2>
            <div className="flex items-center gap-8">
              <div className="relative h-36 w-36 shrink-0">
                <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" stroke="oklch(0.22 0.025 280)" strokeWidth="10" fill="none" />
                  <circle cx="60" cy="60" r="54" stroke={scoreColor} strokeWidth="10" fill="none" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - fdsScore / 100)}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl font-bold text-foreground"><AnimatedCounter value={fdsScore} /></span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your FDS measures financial discipline — not wealth. It rewards consistency, goal completion, and smart habits.</p>
                <button onClick={analyzeProfile} disabled={analyzing} className="mt-4 pill-btn text-xs disabled:opacity-50">
                  <Brain className="mr-2 h-4 w-4" />
                  {analyzing ? "Analyzing..." : profileType ? "Re-analyze" : "Analyze My Profile"}
                </button>
              </div>
            </div>
          </div>
        </AnimateIn>

        {/* Profile Type */}
        <AnimateIn delay={200}>
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Money Personality</h2>
            {profileInfo ? (
              <div className="flex items-start gap-4">
                <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${profileInfo.bg}`}>
                  <profileInfo.icon className={`h-7 w-7 ${profileInfo.color}`} />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">{profileInfo.label}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{profileInfo.desc}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <Brain className="h-10 w-10 text-violet-bright/40 mb-3" />
                <p className="text-sm text-muted-foreground">Click "Analyze My Profile" to discover your financial personality</p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-2">
              {Object.entries(PROFILES).map(([key, p]) => (
                <div key={key} className={`flex items-center gap-2 rounded-xl p-2.5 text-xs ${profileType === key ? "bg-violet-bright/15 ring-1 ring-violet-bright/30" : "bg-surface/50"}`}>
                  <p.icon className={`h-4 w-4 ${p.color}`} />
                  <span className={profileType === key ? "font-bold text-foreground" : "text-muted-foreground"}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>
      </div>

      {/* Badges — Apple Fitness style */}
      <AnimateIn delay={300}>
        <div className="mt-6 rounded-2xl bg-gradient-to-b from-card via-card to-[oklch(0.13_0.02_280)] p-6 ring-1 ring-border">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Achievements</h2>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {earnedCount}<span className="text-base font-normal text-muted-foreground"> / {BADGES.length}</span>
              </p>
            </div>
            {earnedCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-[#30D158]/15 px-3 py-1">
                <div className="h-2 w-2 rounded-full bg-[#30D158]" />
                <span className="text-[11px] font-semibold text-[#30D158]">{earnedCount} Unlocked</span>
              </div>
            )}
          </div>

          {/* Earned badges showcase */}
          {earnedCount > 0 && (
            <div className="mb-6">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Earned</p>
              <div className="flex flex-wrap gap-6">
                {BADGES.map((badge, i) => {
                  if (!badges.includes(badge.key)) return null;
                  return (
                    <BadgeMedal
                      key={badge.key}
                      badge={badge}
                      earned
                      colorIdx={i}
                      justUnlocked={newlyUnlocked.includes(badge.key)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Locked badges */}
          {earnedCount < BADGES.length && (
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Locked</p>
              <div className="flex flex-wrap gap-6">
                {BADGES.map((badge, i) => {
                  if (badges.includes(badge.key)) return null;
                  return (
                    <BadgeMedal
                      key={badge.key}
                      badge={badge}
                      earned={false}
                      colorIdx={i}
                      justUnlocked={false}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </AnimateIn>

      {/* Score Breakdown */}
      <AnimateIn delay={400}>
        <div className="mt-6 rounded-2xl bg-card p-6 ring-1 ring-border">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Savings Ratio", weight: "40%", desc: "How much you save vs spend" },
              { label: "Goal Completion", weight: "30%", desc: "Percentage of goals reached" },
              { label: "Activity Level", weight: "20%", desc: "Consistent tracking habits" },
              { label: "Goal Setting", weight: "10%", desc: "Having active financial goals" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-surface p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <span className="text-sm font-bold text-violet-bright">{item.weight}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimateIn>
    </div>
  );
}
