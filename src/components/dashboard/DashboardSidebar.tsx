import { Link, useLocation } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { MoniqLogo } from "@/components/MoniqLogo";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  TrendingUp,
  CreditCard,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ScanLine,
  Download,
  Bell,
  Search,
  Trophy,
  Crosshair,
  Brain,
  AlertTriangle,
  Lightbulb,
  PiggyBank,
  Sparkles,
  Receipt,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ── AI Notification helpers ── */
interface SmartNotification {
  id: string;
  icon: React.ElementType;
  color: string;
  title: string;
  body: string;
  time: string;
}

function generateSmartNotifications(
  transactions: { amount: number; type: string; description: string; date: string }[],
  bills: { name: string; amount: number; due_date: string | null; is_paid: boolean }[],
  goals: { name: string; current_amount: number; target_amount: number }[],
): SmartNotification[] {
  const notes: SmartNotification[] = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // 1 — Spending alert (top category today/yesterday)
  const recent = transactions.filter((t) => {
    const d = new Date(t.date);
    const diff = (today.getTime() - d.getTime()) / 86400000;
    return t.type === "expense" && diff <= 2;
  });
  const totalRecent = recent.reduce((s, t) => s + t.amount, 0);
  if (totalRecent > 0) {
    notes.push({
      id: "spend",
      icon: AlertTriangle,
      color: "text-amber-500 bg-amber-500/15",
      title: "Spending Alert",
      body: `You've spent ${totalRecent.toFixed(0)} MAD in the last 48 h. Review your expenses to stay on track.`,
      time: "Today",
    });
  }

  // 2 — Bill reminders (due within 3 days)
  const upcoming = bills.filter((b) => {
    if (!b.due_date || b.is_paid) return false;
    const diff = (new Date(b.due_date).getTime() - today.getTime()) / 86400000;
    return diff >= 0 && diff <= 3;
  });
  upcoming.forEach((b) => {
    notes.push({
      id: `bill-${b.name}`,
      icon: Receipt,
      color: "text-red-500 bg-red-500/15",
      title: "Bill Due Soon",
      body: `${b.name} (${Number(b.amount).toFixed(0)} MAD) is due on ${b.due_date}.`,
      time: b.due_date === todayStr ? "Today" : "Upcoming",
    });
  });

  // 3 — Goal progress
  goals.forEach((g) => {
    const pct = Number(g.target_amount) > 0 ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100) : 0;
    if (pct >= 75 && pct < 100) {
      notes.push({
        id: `goal-${g.name}`,
        icon: Target,
        color: "text-emerald-500 bg-emerald-500/15",
        title: "Goal Almost There!",
        body: `"${g.name}" is at ${pct}% — you're so close!`,
        time: "Progress",
      });
    }
  });

  // 4 — Savings tip (always show one)
  const tips = [
    "Try a no-spend day today to boost your savings rate.",
    "Review subscriptions you haven't used this month.",
    "Set up an automatic transfer to your savings goal.",
    "Round up your purchases mentally — small savings add up.",
    "Compare prices before your next big purchase.",
  ];
  const tipIndex = today.getDate() % tips.length;
  notes.push({
    id: "tip",
    icon: Lightbulb,
    color: "text-violet-500 bg-violet-500/15",
    title: "Daily Savings Tip",
    body: tips[tipIndex],
    time: "Insight",
  });

  // 5 — AI summary
  if (transactions.length > 5) {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const rate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
    notes.push({
      id: "ai-summary",
      icon: Sparkles,
      color: "text-blue-500 bg-blue-500/15",
      title: "AI Financial Summary",
      body: rate > 0
        ? `Your savings rate is ${rate}%. Keep it up!`
        : `You're spending more than you earn. Let's work on a budget.`,
      time: "Daily",
    });
  }

  return notes;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" as const },
  { label: "Transactions", icon: ArrowLeftRight, to: "/dashboard/transactions" as const },
  { label: "Budget", icon: Wallet, to: "/dashboard/budget" as const },
  { label: "Goals", icon: Target, to: "/dashboard/goals" as const },
  { label: "Micro-Objectives", icon: Crosshair, to: "/dashboard/micro-objectives" as const },
  { label: "Challenges", icon: Trophy, to: "/dashboard/challenges" as const },
  { label: "Financial Profile", icon: Brain, to: "/dashboard/profile" as const },
  { label: "Investments", icon: TrendingUp, to: "/dashboard/investments" as const },
  { label: "Subscriptions", icon: CreditCard, to: "/dashboard/subscriptions" as const },
  { label: "Bills", icon: FileText, to: "/dashboard/bills" as const },
  { label: "Receipt Scanner", icon: ScanLine, to: "/dashboard/scanner" as const },
  { label: "Export Reports", icon: Download, to: "/dashboard/export" as const },
  { label: "AI Assistant", icon: MessageSquare, to: "/dashboard/assistant" as const },
  { label: "Settings", icon: Settings, to: "/dashboard/settings" as const },
];

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [notifData, setNotifData] = useState<{
    transactions: { amount: number; type: string; description: string; date: string }[];
    bills: { name: string; amount: number; due_date: string | null; is_paid: boolean }[];
    goals: { name: string; current_amount: number; target_amount: number }[];
  }>({ transactions: [], bills: [], goals: [] });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserEmail(data.user.email || "");
      supabase.from("profiles").select("full_name, avatar_url").eq("id", data.user.id).single().then(({ data: p }) => {
        if (p) setProfile(p as { full_name?: string; avatar_url?: string });
      });
      // Fetch notification data
      Promise.all([
        supabase.from("transactions").select("amount, type, description, date").eq("user_id", data.user.id).order("date", { ascending: false }).limit(100),
        supabase.from("bills").select("name, amount, due_date, is_paid").eq("user_id", data.user.id),
        supabase.from("goals").select("name, current_amount, target_amount").eq("user_id", data.user.id),
      ]).then(([txRes, billRes, goalRes]) => {
        setNotifData({
          transactions: (txRes.data || []) as { amount: number; type: string; description: string; date: string }[],
          bills: (billRes.data || []) as { name: string; amount: number; due_date: string | null; is_paid: boolean }[],
          goals: (goalRes.data || []) as { name: string; current_amount: number; target_amount: number }[],
        });
      });
    });
  }, []);

  const notifications = useMemo(
    () => generateSmartNotifications(notifData.transactions, notifData.bills, notifData.goals),
    [notifData],
  );

  const isActive = (to: string) => {
    if (to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(to);
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : userEmail ? userEmail[0].toUpperCase() : "?";

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-5">
        <MoniqLogo size={28} className="text-violet-bright shrink-0" />
        {!collapsed && <span className="font-display text-lg font-bold tracking-tight text-foreground">monique</span>}
      </div>
      <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-violet-bright/15 text-violet-bright"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-violet-bright" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border px-2 py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-surface-hover hover:text-foreground"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`hidden flex-col border-r border-border bg-card transition-all duration-300 lg:flex ${
          collapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-auto top-6 z-10 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground"
          style={{ marginLeft: collapsed ? "56px" : "228px" }}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <MoniqLogo size={24} className="text-violet-bright" />
          <span className="font-display text-base font-bold text-foreground">monique</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile profile */}
          <Link to="/dashboard/settings" className="flex items-center">
            <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-violet-bright/15 ring-1 ring-violet-bright/30">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-violet-bright">{initials}</span>
              )}
            </div>
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 text-foreground hover:bg-surface">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 flex h-full w-[260px] flex-col border-r border-border bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Desktop top header with profile */}
        <header className="hidden lg:flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-lg px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-64 rounded-xl border border-border bg-surface pl-9 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright/50 placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative grid h-9 w-9 place-items-center rounded-xl bg-surface text-muted-foreground transition hover:bg-surface-hover hover:text-foreground">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-violet-bright ring-2 ring-card" />
            </button>
            <Link to="/dashboard/settings" className="flex items-center gap-3 rounded-xl px-3 py-1.5 transition hover:bg-surface">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
                <p className="text-[11px] text-muted-foreground">{userEmail}</p>
              </div>
              <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-bright/15 ring-2 ring-violet-bright/30">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-violet-bright">{initials}</span>
                )}
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <div className="mx-auto max-w-7xl p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
