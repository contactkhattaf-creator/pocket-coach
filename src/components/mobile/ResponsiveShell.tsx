import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, BarChart3, Users, Target, User as UserIcon,
  ArrowLeftRight, Wallet, ScanLine, FileText, CreditCard, Download,
  MessageSquare, Settings, Trophy, Crosshair, TrendingUp, LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "./MobileShell";

const primaryNav = [
  { to: "/dashboard" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/analytics" as const, label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/transactions" as const, label: "Transactions", icon: ArrowLeftRight },
  { to: "/dashboard/budget" as const, label: "Budget", icon: Wallet },
  { to: "/dashboard/goals" as const, label: "Goals", icon: Target },
  { to: "/dashboard/micro-objectives" as const, label: "Micro-Objectives", icon: Crosshair },
  { to: "/dashboard/challenges" as const, label: "Challenges", icon: Trophy },
  { to: "/dashboard/investments" as const, label: "Investments", icon: TrendingUp },
  { to: "/dashboard/subscriptions" as const, label: "Subscriptions", icon: CreditCard },
  { to: "/dashboard/bills" as const, label: "Bills", icon: FileText },
  { to: "/dashboard/scanner" as const, label: "Scanner", icon: ScanLine },
  { to: "/dashboard/social" as const, label: "Community", icon: Users },
  { to: "/dashboard/assistant" as const, label: "AI Assistant", icon: MessageSquare },
  { to: "/dashboard/export" as const, label: "Export", icon: Download },
  { to: "/dashboard/profile" as const, label: "Profile", icon: UserIcon },
  { to: "/dashboard/settings" as const, label: "Settings", icon: Settings },
];

export function ResponsiveShell({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!isDesktop) {
    return <MobileShell>{children}</MobileShell>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card p-4 lg:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-bright to-magenta text-white font-display font-bold">M</div>
          <span className="font-display text-xl font-bold text-foreground">Monique</span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {primaryNav.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-violet-bright/15 text-violet-bright"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      <main className="ml-64 flex-1 px-8 py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
