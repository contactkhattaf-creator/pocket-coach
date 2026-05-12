import { useEffect } from "react";
import { Award, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  badgeName?: string;
  badgeDesc?: string;
  icon?: React.ElementType;
}

/** Full-screen badge unlock celebration with confetti dots. */
export function BadgeUnlockModal({ open, onClose, badgeName = "New Badge!", badgeDesc = "Keep it up", icon: Icon = Award }: Props) {
  useEffect(() => {
    if (!open) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([60, 30, 120, 30, 200]);
    }
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  const dots = Array.from({ length: 14 });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]" onClick={onClose}>
      {/* Confetti */}
      {dots.map((_, i) => (
        <span
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{
            background: ["#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#22d3ee"][i % 5],
            left: `${20 + (i * 47) % 60}%`,
            top: `${30 + (i * 31) % 40}%`,
            animation: `confetti-pop 1.8s ${i * 0.07}s ease-out forwards`,
          }}
        />
      ))}
      <div className="relative mx-4 max-w-xs rounded-3xl bg-gradient-to-br from-violet-bright/30 via-card to-magenta/30 p-8 text-center ring-1 ring-violet-bright/40 animate-scale-in">
        <button onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface/80 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div
          className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-violet-bright to-magenta text-white"
          style={{ boxShadow: "0 0 60px rgba(167,139,250,0.7)" }}
        >
          <Icon className="h-12 w-12" />
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-violet-bright">Achievement unlocked</p>
        <h3 className="mt-1 font-display text-2xl font-bold text-foreground">{badgeName}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{badgeDesc}</p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-gradient-to-r from-violet-bright to-magenta px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
