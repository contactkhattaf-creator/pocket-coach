import { MoniqLogo } from "@/components/MoniqLogo";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Logo with pulse */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-violet-bright/20" style={{ animationDuration: "2s" }} />
          <MoniqLogo size={64} className="relative z-10" />
        </div>

        {/* Animated chart bars */}
        <div className="flex items-end gap-1.5 h-10">
          {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3].map((h, i) => (
            <div
              key={i}
              className="w-2 rounded-full bg-violet-bright/60"
              style={{
                height: `${h * 100}%`,
                animation: `bar-bounce 1.2s ease-in-out ${i * 0.1}s infinite alternate`,
              }}
            />
          ))}
        </div>

        {/* Animated line chart */}
        <svg width="120" height="32" viewBox="0 0 120 32" fill="none" className="opacity-60">
          <path
            d="M0 28 L17 20 L34 24 L51 12 L68 16 L85 6 L102 10 L120 2"
            stroke="oklch(0.58 0.22 295)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="draw-line"
          />
          <path
            d="M0 28 L17 20 L34 24 L51 12 L68 16 L85 6 L102 10 L120 2 L120 32 L0 32Z"
            fill="url(#loadGrad)"
            className="draw-line"
            style={{ animationDelay: "0.3s" }}
          />
          <defs>
            <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.58 0.22 295)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="oklch(0.58 0.22 295)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading your finances...</p>
      </div>

      <style>{`
        @keyframes bar-bounce {
          0% { transform: scaleY(0.3); opacity: 0.4; }
          100% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
