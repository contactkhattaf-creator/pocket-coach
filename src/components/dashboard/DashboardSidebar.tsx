import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { MoniqLogo } from "@/components/MoniqLogo";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" as const },
  { label: "Transactions", icon: ArrowLeftRight, to: "/dashboard/transactions" as const },
  { label: "Budget", icon: Wallet, to: "/dashboard/budget" as const },
  { label: "Goals", icon: Target, to: "/dashboard/goals" as const },
  { label: "Investments", icon: TrendingUp, to: "/dashboard/investments" as const },
  { label: "Subscriptions", icon: CreditCard, to: "/dashboard/subscriptions" as const },
  { label: "Bills", icon: FileText, to: "/dashboard/bills" as const },
  { label: "AI Assistant", icon: MessageSquare, to: "/dashboard/assistant" as const },
  { label: "Settings", icon: Settings, to: "/dashboard/settings" as const },
];

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (to: string) => {
    if (to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(to);
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <MoniqLogo size={28} className="text-violet-bright shrink-0" />
        {!collapsed && <span className="font-display text-lg font-bold tracking-tight text-foreground">moniq</span>}
      </div>

      {/* Nav */}
      <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-2">
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

      {/* Bottom */}
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
      {/* Desktop sidebar */}
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

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <MoniqLogo size={24} className="text-violet-bright" />
          <span className="font-display text-base font-bold text-foreground">moniq</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 text-foreground hover:bg-surface">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
