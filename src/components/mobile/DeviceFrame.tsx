import { useEffect, useState } from "react";

/**
 * On large screens, render children inside a centered phone-sized frame
 * (iPhone-style notch + rounded shell). On mobile, render full-screen.
 */
export function DeviceFrame({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  if (!isDesktop) {
    return <div className="relative min-h-screen w-full bg-background">{children}</div>;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-violet-bright/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-magenta/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-violet/10 blur-3xl" />
      </div>

      {/* Phone frame */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div
          className="relative h-[844px] max-h-[calc(100vh-4rem)] w-[390px] overflow-hidden rounded-[48px] border border-white/10 bg-dark-card p-2 shadow-2xl"
          style={{
            boxShadow:
              "0 50px 100px -20px rgba(80,40,180,0.55), 0 0 80px -10px rgba(124,58,237,0.35), inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[40px] bg-background">
            {/* Dynamic island / notch */}
            <div className="pointer-events-none absolute left-1/2 top-2 z-50 h-7 w-28 -translate-x-1/2 rounded-full bg-black/90" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
