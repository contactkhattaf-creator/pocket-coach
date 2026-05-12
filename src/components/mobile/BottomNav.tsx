import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, BarChart3, Users, Target, User } from "lucide-react";

const items = [
  { label: "Home", icon: LayoutDashboard, to: "/dashboard" as const },
  { label: "Stats", icon: BarChart3, to: "/dashboard/analytics" as const },
  { label: "Social", icon: Users, to: "/dashboard/social" as const },
  { label: "Goals", icon: Target, to: "/dashboard/goals" as const },
  { label: "Profile", icon: User, to: "/dashboard/profile" as const },
];

export function BottomNav() {
  const location = useLocation();
  const isActive = (to: string) =>
    to === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(to);

  return (
    <nav className="absolute inset-x-0 bottom-0 z-40 px-3 pb-3 pt-1">
      <div className="glass-card mx-auto flex items-center justify-around rounded-[28px] px-2 py-2 shadow-card">
        {items.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group relative flex min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 transition-all duration-300 active:scale-95"
            >
              <div
                className={`grid h-10 w-10 place-items-center rounded-2xl transition-all duration-300 ${
                  active
                    ? "bg-violet-bright text-white shadow-[0_8px_20px_-6px_var(--violet-bright)]"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              </div>
              <span
                className={`text-[10px] font-semibold tracking-tight transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
