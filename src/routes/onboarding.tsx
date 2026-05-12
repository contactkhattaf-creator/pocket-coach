import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Target, TrendingUp, Users, ChevronRight, Check } from "lucide-react";
import { DeviceFrame } from "@/components/mobile/DeviceFrame";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

const slides = [
  {
    icon: Sparkles,
    title: "Welcome to Monique",
    description: "Your AI money coach for the next generation. Let's set you up in less than a minute.",
    color: "from-violet-bright to-magenta",
  },
  {
    icon: TrendingUp,
    title: "Smart insights, daily",
    description: "AI analyzes your spending and suggests where to save — automatically.",
    color: "from-violet-bright to-cyan-400",
  },
  {
    icon: Target,
    title: "Reach your goals",
    description: "Set savings goals, track progress, and celebrate every milestone.",
    color: "from-magenta to-orange-400",
  },
  {
    icon: Users,
    title: "Grow with friends",
    description: "Compete on leaderboards, unlock badges, and share wins with your community.",
    color: "from-mint to-violet-bright",
  },
];

const goalOptions = [
  { id: "save", label: "Save more", icon: "💰" },
  { id: "budget", label: "Budget better", icon: "📊" },
  { id: "invest", label: "Start investing", icon: "📈" },
  { id: "debt", label: "Pay off debt", icon: "✂️" },
  { id: "travel", label: "Travel fund", icon: "✈️" },
  { id: "fun", label: "Have fun", icon: "🎉" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const totalSteps = slides.length + 2; // intros + setup + goals

  function next() { setStep(s => Math.min(totalSteps - 1, s + 1)); }
  function back() { setStep(s => Math.max(0, s - 1)); }

  function toggleGoal(id: string) {
    setSelectedGoals(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id]);
  }

  async function finish() {
    setSaving(true);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("profiles").update({
        full_name: name || null,
        monthly_income: income ? parseFloat(income) : null,
      }).eq("id", data.user.id);
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <DeviceFrame>
      <div className="relative flex h-full min-h-screen flex-col px-6 pb-8 pt-14">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step ? "w-8 bg-violet-bright" : i < step ? "w-1.5 bg-violet-bright/60" : "w-1.5 bg-surface"
              }`}
            />
          ))}
        </div>

        <div key={step} className="flex flex-1 flex-col items-center justify-center text-center animate-slide-up">
          {step < slides.length && (() => {
            const s = slides[step];
            const Icon = s.icon;
            return (
              <>
                <div className={`mb-8 grid h-32 w-32 place-items-center rounded-[36px] bg-gradient-to-br ${s.color} text-white shadow-[0_30px_60px_-20px_rgba(167,139,250,0.6)]`}>
                  <Icon className="h-16 w-16" strokeWidth={1.6} />
                </div>
                <h1 className="font-display text-3xl font-bold text-foreground">{s.title}</h1>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              </>
            );
          })()}

          {step === slides.length && (
            <div className="w-full max-w-xs space-y-4 text-left">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Tell us about you</h1>
                <p className="mt-1 text-sm text-muted-foreground">We'll personalize your experience.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Your name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Aya Khattaf"
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Monthly income (MAD)</label>
                <input
                  type="number"
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright"
                />
              </div>
            </div>
          )}

          {step === slides.length + 1 && (
            <div className="w-full max-w-xs">
              <h1 className="font-display text-2xl font-bold text-foreground">What matters most?</h1>
              <p className="mt-1 text-sm text-muted-foreground">Pick a few — we'll tailor your experience.</p>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {goalOptions.map(g => {
                  const active = selectedGoals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className={`relative flex items-center gap-2 rounded-2xl p-3 text-left transition-all active:scale-95 ${
                        active
                          ? "bg-violet-bright/15 ring-2 ring-violet-bright"
                          : "bg-surface ring-1 ring-border"
                      }`}
                    >
                      <span className="text-xl">{g.icon}</span>
                      <span className="text-xs font-semibold text-foreground">{g.label}</span>
                      {active && (
                        <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-violet-bright text-white">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <button onClick={back} className="text-sm font-semibold text-muted-foreground active:scale-95 transition-transform">
              Back
            </button>
          ) : (
            <button onClick={() => navigate({ to: "/dashboard" })} className="text-sm font-semibold text-muted-foreground">
              Skip
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-bright to-magenta px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-8px_var(--violet-bright)] active:scale-95 transition-transform"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-bright to-magenta px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-8px_var(--violet-bright)] active:scale-95 transition-transform disabled:opacity-60"
            >
              {saving ? "Saving..." : "Get started"} <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </DeviceFrame>
  );
}
