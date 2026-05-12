import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ArrowLeftRight, Wallet, ScanLine, FileText, CreditCard, Download,
  MessageSquare, Settings, Trophy, Brain, Crosshair, TrendingUp, LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DeviceFrame } from "./DeviceFrame";
import { BottomNav } from "./BottomNav";
import { StickyHeader } from "./StickyHeader";
import { BottomSheet } from "./BottomSheet";

const moreItems = [
  { label: "Transactions", icon: ArrowLeftRight, to: "/dashboard/transactions" as const },
  { label: "Budget", icon: Wallet, to: "/dashboard/budget" as const },
  { label: "Micro-Objectives", icon: Crosshair, to: "/dashboard/micro-objectives" as const },
  { label: "Challenges", icon: Trophy, to: "/dashboard/challenges" as const },
  { label: "Investments", icon: TrendingUp, to: "/dashboard/investments" as const },
  { label: "Subscriptions", icon: CreditCard, to: "/dashboard/subscriptions" as const },
  { label: "Bills", icon: FileText, to: "/dashboard/bills" as const },
  { label: "Receipt Scanner", icon: ScanLine, to: "/dashboard/scanner" as const },
  { label: "Export", icon: Download, to: "/dashboard/export" as const },
  { label: "AI Assistant", icon: MessageSquare, to: "/dashboard/assistant" as const },
  { label: "Settings", icon: Settings, to: "/dashboard/settings" as const },
];

const titleByPath: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Welcome back" },
  "/dashboard/analytics": { title: "Analytics", subtitle: "Your insights" },
  "/dashboard/social": { title: "Community", subtitle: "Stay connected" },
  "/dashboard/goals": { title: "Goals", subtitle: "Keep going" },
  "/dashboard/profile": { title: "Profile", subtitle: "Your journey" },
};

export function MobileShell({ children }: { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const meta = titleByPath[location.pathname] ||
    Object.entries(titleByPath).find(([k]) => k !== "/dashboard" && location.pathname.startsWith(k))?.[1] ||
    { title: "Monique", subtitle: "Welcome back" };

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <DeviceFrame>
      <div className="relative flex h-full min-h-screen flex-col">
        <StickyHeader title={meta.title} subtitle={meta.subtitle} onMenuClick={() => setMoreOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-32 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div key={location.pathname} className="animate-[fade-in_0.3s_ease-out]">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>

      <BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="Quick actions" description="All your tools in one place">
        <div className="grid grid-cols-3 gap-3">
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className="group flex flex-col items-center gap-2 rounded-2xl bg-surface/60 p-4 text-center transition-all hover:bg-violet-bright/10 active:scale-95"
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-bright/15 text-violet-bright transition-all group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold leading-tight text-foreground">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <button
          onClick={handleLogout}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive transition-all hover:bg-destructive/20 active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </BottomSheet>
    </DeviceFrame>
  );
}
