import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";

interface Props {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  rightAction?: React.ReactNode;
}

export function StickyHeader({ title, subtitle, onMenuClick, rightAction }: Props) {
  const [profile, setProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email || "");
      supabase.from("profiles").select("full_name, avatar_url").eq("id", data.user.id).single().then(({ data: p }) => {
        if (p) setProfile(p as { full_name?: string; avatar_url?: string });
      });
    });
  }, []);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : email ? email[0].toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-30 -mx-1 px-4 pb-3 pt-12 backdrop-blur-xl">
      <div className="absolute inset-0 bg-background/80" />
      <div className="relative flex items-center justify-between gap-3">
        <Link to="/dashboard/profile" className="flex items-center gap-3 active:scale-95 transition-transform">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-violet-bright/15 ring-2 ring-violet-bright/30">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-violet-bright">{initials}</span>
            )}
          </div>
          <div className="text-left">
            <p className="text-[11px] font-medium text-muted-foreground">{subtitle || "Welcome back"}</p>
            <p className="text-sm font-bold text-foreground leading-tight">
              {title || profile?.full_name || "User"}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-1.5">
          {rightAction}
          <ThemeToggle />
          <button
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-2xl bg-surface/70 text-foreground transition-all hover:bg-surface-hover active:scale-95"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-magenta ring-2 ring-background" />
          </button>
          {onMenuClick && (
            <button
              aria-label="Menu"
              onClick={onMenuClick}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-surface/70 text-foreground transition-all hover:bg-surface-hover active:scale-95"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
