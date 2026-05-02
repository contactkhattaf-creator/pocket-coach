import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { Plus, X, Trash2, Target, Plane, Laptop, Home, Car, BookOpen, Gem, Palmtree, GraduationCap, Banknote, PartyPopper } from "lucide-react";

const goalIcons = [
  { key: "target", icon: Target, label: "Target" },
  { key: "travel", icon: Plane, label: "Travel" },
  { key: "tech", icon: Laptop, label: "Tech" },
  { key: "home", icon: Home, label: "Home" },
  { key: "car", icon: Car, label: "Car" },
  { key: "education", icon: BookOpen, label: "Education" },
  { key: "luxury", icon: Gem, label: "Luxury" },
  { key: "vacation", icon: Palmtree, label: "Vacation" },
  { key: "graduation", icon: GraduationCap, label: "Graduation" },
  { key: "savings", icon: Banknote, label: "Savings" },
];

function getGoalIcon(iconKey: string) {
  const found = goalIcons.find((g) => g.key === iconKey);
  const Icon = found?.icon || Target;
  return <Icon className="h-6 w-6 text-violet-bright" />;
}

export const Route = createFileRoute("/dashboard/goals")({
  component: GoalsPage,
});

function GoalsPage() {
  const { user } = useDashboard();
  const [goals, setGoals] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", target_amount: "", current_amount: "0", deadline: "", icon: "target" });
  const [saving, setSaving] = useState(false);
  const [celebrated, setCelebrated] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setGoals(data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase.from("goals").insert({
      user_id: user.id, name: form.name, target_amount: parseFloat(form.target_amount), current_amount: parseFloat(form.current_amount || "0"), deadline: form.deadline || null, icon: form.icon,
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ name: "", target_amount: "", current_amount: "0", deadline: "", icon: "target" });
    loadData();
  }

  async function handleUpdateAmount(id: string, newAmount: number) {
    const goal = goals.find(g => g.id === id);
    await supabase.from("goals").update({ current_amount: newAmount }).eq("id", id);
    if (goal && newAmount >= Number(goal.target_amount)) {
      setCelebrated(id);
      setTimeout(() => setCelebrated(null), 3000);
    }
    loadData();
  }

  async function handleDelete(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    loadData();
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your savings goals</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="pill-btn gap-2 text-sm"><Plus className="h-4 w-4" /> Add Goal</button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const pct = Number(goal.target_amount) > 0 ? Math.min(100, (Number(goal.current_amount) / Number(goal.target_amount)) * 100) : 0;
          const isComplete = pct >= 100;
          return (
            <div key={goal.id} className={`relative rounded-2xl bg-card p-5 ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:ring-violet-bright/30 ${celebrated === goal.id ? "glow-pulse" : ""}`}>
              {celebrated === goal.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-violet-bright/20 backdrop-blur-sm">
                  <PartyPopper className="h-10 w-10 text-violet-bright" />
                </div>
              )}
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-bright/10">
                  {getGoalIcon(goal.icon || "target")}
                </div>
                <button onClick={() => handleDelete(goal.id)} className="rounded-lg p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              {/* SVG circular progress */}
              <div className="mx-auto mb-4 relative h-28 w-28">
                <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="oklch(0.22 0.025 280)" strokeWidth="8" fill="none" />
                  <circle cx="50" cy="50" r="42" stroke={isComplete ? "oklch(0.72 0.19 155)" : (goal.color || "oklch(0.58 0.22 295)")} strokeWidth="8" fill="none" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-foreground">{Math.round(pct)}%</span>
                </div>
              </div>
              <h3 className="text-center text-sm font-bold text-foreground">{goal.name}</h3>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                {Number(goal.current_amount).toLocaleString("fr-MA")} / {Number(goal.target_amount).toLocaleString("fr-MA")} MAD
              </p>
              {goal.deadline && <p className="mt-1 text-center text-xs text-muted-foreground">Due: {goal.deadline}</p>}
              {!isComplete && (
                <div className="mt-3 flex gap-2">
                  <input type="number" placeholder="Add amount" className="flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none" id={`add-${goal.id}`} />
                  <button onClick={() => {
                    const input = document.getElementById(`add-${goal.id}`) as HTMLInputElement;
                    const val = parseFloat(input.value || "0");
                    if (val > 0) handleUpdateAmount(goal.id, Number(goal.current_amount) + val);
                  }} className="rounded-lg bg-violet-bright px-3 py-1.5 text-xs font-semibold text-white">Add</button>
                </div>
              )}
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <Target className="mx-auto h-12 w-12 text-violet-bright/40" />
            <p className="mt-4 text-sm text-muted-foreground">No goals yet. Create your first savings goal!</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">New Goal</h2>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {goalIcons.map((gi) => (
                    <button key={gi.key} type="button" onClick={() => setForm({ ...form, icon: gi.key })} className={`rounded-lg p-2 transition ${form.icon === gi.key ? "bg-violet-bright/20 ring-2 ring-violet-bright" : "bg-surface hover:bg-surface-hover"}`}>
                      <gi.icon className="h-5 w-5 text-violet-bright" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Goal Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" placeholder="Trip to Marrakech" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Target Amount (MAD)</label>
                <input type="number" required value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" placeholder="5000" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Deadline (optional)</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" />
              </div>
              <button type="submit" disabled={saving} className="pill-btn w-full justify-center disabled:opacity-50">{saving ? "Creating..." : "Create Goal"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
