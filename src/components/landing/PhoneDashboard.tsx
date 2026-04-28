import { useEffect, useRef } from "react";

/** Live, animated dark-mode dashboard mock built in SVG/HTML — the visual anchor. */
export function PhoneDashboard({ className = "" }: { className?: string }) {
  const balanceRef = useRef<HTMLSpanElement>(null);
  const target = 2847.5;

  useEffect(() => {
    const el = balanceRef.current;
    if (!el) return;
    let start: number | null = null;
    const dur = 1600;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = (target * eased).toFixed(2);
      el.textContent = `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  return (
    <div className={`relative mx-auto w-[300px] sm:w-[340px] ${className}`}>
      {/* phone shell */}
      <div className="relative rounded-[44px] bg-dark-card p-3 shadow-card ring-1 ring-white/5"
           style={{ boxShadow: "0 40px 80px -30px rgba(80,40,180,0.55), 0 0 60px -10px rgba(124,58,237,0.35)" }}>
        <div className="relative overflow-hidden rounded-[34px] bg-gradient-to-b from-[#1a0f3a] via-[#150b2e] to-[#0d0822] p-5">
          {/* notch */}
          <div className="mx-auto mb-4 h-5 w-24 rounded-b-2xl bg-black/70" />

          {/* balance */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Balance</p>
              <p className="mt-1 font-display text-3xl font-bold text-white">
                <span ref={balanceRef}>$0.00</span>
              </p>
              <p className="mt-1 text-xs text-mint">▲ 12.4% this month</p>
            </div>
            <div className="rounded-full bg-violet-bright/20 px-2.5 py-1 text-[10px] font-semibold text-violet-bright ring-1 ring-violet-bright/40">
              FDS 78
            </div>
          </div>

          {/* chart */}
          <div className="mt-5 rounded-2xl bg-white/5 p-3 ring-1 ring-white/5">
            <svg viewBox="0 0 280 110" className="h-28 w-full">
              <defs>
                <linearGradient id="grad-stroke" x1="0" x2="1">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
                <linearGradient id="grad-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[20, 45, 70, 95].map((y) => (
                <line key={y} x1="0" x2="280" y1={y} y2={y} stroke="white" strokeOpacity="0.06" />
              ))}
              <path d="M0,80 C30,70 50,40 80,55 S130,90 160,50 S220,10 280,28 L280,110 L0,110 Z"
                    fill="url(#grad-fill)" />
              <path className="draw-line glow-stroke"
                    d="M0,80 C30,70 50,40 80,55 S130,90 160,50 S220,10 280,28"
                    fill="none" stroke="url(#grad-stroke)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="280" cy="28" r="4" fill="#22d3ee" className="pulse-dot" />
            </svg>
            <div className="mt-1 flex justify-between text-[9px] text-white/40">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>

          {/* category cards */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/5">
              <p className="text-[10px] uppercase tracking-wider text-white/50">Top category</p>
              <p className="mt-1 text-sm font-semibold text-white">Coffee · $84</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-bright" />
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/5">
              <p className="text-[10px] uppercase tracking-wider text-white/50">Saved</p>
              <p className="mt-1 text-sm font-semibold text-mint">+$214</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/10">
                <div className="h-full w-1/2 rounded-full bg-mint" />
              </div>
            </div>
          </div>

          {/* AI tip */}
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-violet-bright/15 p-3 ring-1 ring-violet-bright/30">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-bright text-[10px] font-bold text-white">AI</span>
            <p className="text-[11px] leading-snug text-white/85">
              You spent <b className="text-white">32% more</b> on takeout this week. Skip 2 orders to hit your save goal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
