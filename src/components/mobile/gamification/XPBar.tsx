import { useEffect, useState } from "react";
import { Trophy, Flame, Star } from "lucide-react";

interface Props {
  level?: number;
  current: number;
  next: number;
  label?: string;
}

/** Animated XP bar with level chip and streak. */
export function XPBar({ level = 1, current, next, label = "XP" }: Props) {
  const [width, setWidth] = useState(0);
  const target = next > 0 ? Math.min(100, Math.round((current / next) * 100)) : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(target), 120);
    return () => clearTimeout(t);
  }, [target]);

  return (
    <div className="rounded-3xl bg-gradient-to-br from-violet-bright/20 via-card to-magenta/15 p-4 ring-1 ring-violet-bright/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-bright to-magenta text-white shadow-[0_8px_20px_-6px_var(--violet-bright)]">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Level {level}</p>
            <p className="font-display text-base font-bold text-foreground">{current} {label}</p>
          </div>
        </div>
        <span className="rounded-full bg-violet-bright/20 px-2.5 py-1 text-[10px] font-semibold text-violet-bright">
          {next - current} to next
        </span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-bright to-magenta transition-all duration-1000 ease-out"
          style={{ width: `${width}%`, boxShadow: "0 0 12px rgba(167,139,250,0.5)" }}
        />
      </div>
    </div>
  );
}

export function StreakIndicator({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-orange-500/10 px-3 py-2 ring-1 ring-orange-500/20">
      <Flame className="h-5 w-5 text-orange-400 animate-streak" />
      <div>
        <p className="text-sm font-bold leading-tight text-foreground">{days} day{days === 1 ? "" : "s"}</p>
        <p className="text-[9px] text-muted-foreground">Active streak</p>
      </div>
    </div>
  );
}

export function StatChip({
  icon: Icon = Star, label, value, color = "var(--violet-bright)",
}: {
  icon?: React.ElementType; label: string; value: string | number; color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-card p-3 ring-1 ring-border">
      <div className="grid h-8 w-8 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
