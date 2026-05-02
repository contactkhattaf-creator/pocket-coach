import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { Plus, X, Trophy, Flame, CheckCircle2, Circle } from "lucide-react";
import { AnimateIn } from "@/hooks/use-animate-on-scroll";

export const Route = createFileRoute("/dashboard/challenges")({
  component: ChallengesPage,
});

const PRESET_CHALLENGES = [
  { name: "30 Days No Unnecessary Spending", description: "Limit non-essential purchases for 30 days. Track daily.", duration_days: 30, reward_badge: "frugal_warrior" },
  { name: "Save 500 MAD in 2 Weeks", description: "Put aside at least 500 MAD in 14 days.", duration_days: 14, reward_badge: "quick_saver" },
  { name: "7-Day Cash Only", description: "Use only cash for a week to build spending awareness.", duration_days: 7, reward_badge: "cash_conscious" },
  { name: "No Eating Out for 21 Days", description: "Cook all meals at home for 3 weeks.", duration_days: 21, reward_badge: "home_chef" },
];

function ChallengesPage() {
  const { user } = useDashboard();
  const [challenges, setChallenges] = useState<Record<string, unknown>[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", duration_days: "30" });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("challenges").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setChallenges(data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  async function startPreset(preset: typeof PRESET_CHALLENGES[0]) {
    if (!user) return;
    await supabase.from("challenges").insert({
      user_id: user.id, name: preset.name, description: preset.description,
      duration_days: preset.duration_days, reward_badge: preset.reward_badge,
      progress: JSON.stringify([]),
    });
    loadData();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase.from("challenges").insert({
      user_id: user.id, name: form.name, description: form.description,
      duration_days: parseInt(form.duration_days), progress: JSON.stringify([]),
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ name: "", description: "", duration_days: "30" });
    loadData();
  }

  async function toggleDay(challengeId: string, dayIndex: number, currentProgress: unknown[]) {
    const prog = [...(currentProgress || [])];
    if (prog.includes(dayIndex)) {
      prog.splice(prog.indexOf(dayIndex), 1);
    } else {
      prog.push(dayIndex);
    }
    await supabase.from("challenges").update({ progress: JSON.stringify(prog) }).eq("id", challengeId);
    loadData();
  }

  async function endChallenge(id: string) {
    await supabase.from("challenges").update({ is_active: false }).eq("id", id);
    loadData();
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Challenges</h1>
          <p className="mt-1 text-sm text-muted-foreground">Build discipline with financial challenges</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="pill-btn gap-2 text-sm"><Plus className="h-4 w-4" /> Custom Challenge</button>
      </div>

      {/* Preset challenges */}
      <AnimateIn delay={100}>
        <div className="mb-8">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Start</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PRESET_CHALLENGES.map((p) => (
              <div key={p.name} className="group rounded-2xl bg-card p-5 ring-1 ring-border transition-all hover:ring-violet-bright/30 hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-bright/10">
                    <Trophy className="h-5 w-5 text-violet-bright" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                    <p className="mt-1 text-xs text-violet-bright">{p.duration_days} days</p>
                  </div>
                </div>
                <button onClick={() => startPreset(p)} className="mt-3 w-full rounded-xl bg-violet-bright/10 py-2 text-xs font-semibold text-violet-bright transition hover:bg-violet-bright/20">
                  Start Challenge
                </button>
              </div>
            ))}
          </div>
        </div>
      </AnimateIn>

      {/* Active challenges */}
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Challenges</h2>
      <div className="space-y-4">
        {challenges.map((ch, idx) => {
          const progress = Array.isArray(ch.progress) ? ch.progress as number[] : JSON.parse((ch.progress as string) || "[]") as number[];
          const duration = Number(ch.duration_days);
          const completedDays = progress.length;
          const pct = Math.round((completedDays / duration) * 100);
          const isActive = ch.is_active as boolean;

          return (
            <AnimateIn key={ch.id as string} delay={idx * 80}>
              <div className={`rounded-2xl bg-card p-5 ring-1 ring-border ${!isActive ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Flame className={`h-5 w-5 ${isActive ? "text-warning" : "text-muted-foreground"}`} />
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{ch.name as string}</h3>
                      {ch.description && <p className="text-xs text-muted-foreground">{ch.description as string}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-violet-bright">{pct}%</span>
                    {isActive && (
                      <button onClick={() => endChallenge(ch.id as string)} className="text-xs text-muted-foreground hover:text-destructive">End</button>
                    )}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mb-3 h-2 rounded-full bg-surface overflow-hidden">
                  <div className="h-full rounded-full bg-violet-bright transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                {/* Day grid */}
                {isActive && (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: duration }).map((_, i) => {
                      const done = progress.includes(i);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleDay(ch.id as string, i, progress)}
                          className={`grid h-7 w-7 place-items-center rounded-lg text-xs transition ${done ? "bg-violet-bright text-white" : "bg-surface text-muted-foreground hover:bg-surface-hover"}`}
                          title={`Day ${i + 1}`}
                        >
                          {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                {!isActive && pct >= 100 && ch.reward_badge && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-success">
                    <Trophy className="h-4 w-4" /> Badge earned: {(ch.reward_badge as string).replace(/_/g, " ")}
                  </div>
                )}
              </div>
            </AnimateIn>
          );
        })}
        {challenges.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No challenges yet. Pick a preset or create your own!</p>
        )}
      </div>

      {/* Custom challenge modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Custom Challenge</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="mb-1 block text-xs text-muted-foreground">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" /></div>
              <div><label className="mb-1 block text-xs text-muted-foreground">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none resize-none" rows={2} /></div>
              <div><label className="mb-1 block text-xs text-muted-foreground">Duration (days)</label><input type="number" required value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" /></div>
              <button type="submit" disabled={saving} className="pill-btn w-full justify-center disabled:opacity-50">{saving ? "Creating..." : "Start Challenge"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
