import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { Plus, X, CheckCircle2, Circle, Target } from "lucide-react";
import { AnimateIn } from "@/hooks/use-animate-on-scroll";

export const Route = createFileRoute("/dashboard/micro-objectives")({
  component: MicroObjectivesPage,
});

const SUGGESTED = [
  { title: "Reduce coffee spending by 50%", category: "food", target_value: 150 },
  { title: "Save 200 MAD this week", category: "savings", target_value: 200 },
  { title: "No online shopping for 7 days", category: "shopping", target_value: 0 },
  { title: "Limit transport to 100 MAD", category: "transport", target_value: 100 },
];

function MicroObjectivesPage() {
  const { user } = useDashboard();
  const [objectives, setObjectives] = useState<Record<string, unknown>[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", target_value: "", category: "general", due_date: "" });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("micro_objectives").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setObjectives(data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase.from("micro_objectives").insert({
      user_id: user.id, title: form.title, description: form.description,
      target_value: parseFloat(form.target_value || "0"), category: form.category,
      due_date: form.due_date || null,
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ title: "", description: "", target_value: "", category: "general", due_date: "" });
    loadData();
  }

  async function quickAdd(s: typeof SUGGESTED[0]) {
    if (!user) return;
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    await supabase.from("micro_objectives").insert({
      user_id: user.id, title: s.title, category: s.category,
      target_value: s.target_value, due_date: nextWeek.toISOString().split("T")[0],
    });
    loadData();
  }

  async function toggleComplete(id: string, current: boolean) {
    await supabase.from("micro_objectives").update({ is_completed: !current }).eq("id", id);
    loadData();
  }

  async function updateProgress(id: string, value: number) {
    await supabase.from("micro_objectives").update({ current_value: value }).eq("id", id);
    loadData();
  }

  async function handleDelete(id: string) {
    await supabase.from("micro_objectives").delete().eq("id", id);
    loadData();
  }

  const active = objectives.filter(o => !o.is_completed);
  const completed = objectives.filter(o => o.is_completed);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Micro-Objectives</h1>
          <p className="mt-1 text-sm text-muted-foreground">Small steps, big financial progress</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="pill-btn gap-2 text-sm"><Plus className="h-4 w-4" /> New Objective</button>
      </div>

      {/* Suggested */}
      <AnimateIn delay={100}>
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested for you</h2>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button key={s.title} onClick={() => quickAdd(s)} className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition hover:border-violet-bright/40 hover:bg-violet-bright/10">
                + {s.title}
              </button>
            ))}
          </div>
        </div>
      </AnimateIn>

      {/* Active objectives */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active ({active.length})</h2>
      <div className="space-y-3 mb-8">
        {active.map((obj, i) => {
          const target = Number(obj.target_value);
          const current = Number(obj.current_value);
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
          return (
            <AnimateIn key={obj.id as string} delay={i * 60}>
              <div className="rounded-2xl bg-card p-4 ring-1 ring-border transition-all hover:ring-violet-bright/20">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleComplete(obj.id as string, false)} className="shrink-0">
                    <Circle className="h-5 w-5 text-muted-foreground hover:text-violet-bright transition" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{obj.title as string}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground capitalize">{obj.category as string}</span>
                      {obj.due_date ? <span className="text-xs text-muted-foreground">Due: {String(obj.due_date)}</span> : null}
                    </div>
                    {target > 0 && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 rounded-full bg-surface overflow-hidden">
                          <div className="h-full rounded-full bg-violet-bright transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-violet-bright">{pct}%</span>
                      </div>
                    )}
                  </div>
                  {target > 0 && (
                    <div className="flex items-center gap-1">
                      <input type="number" placeholder="+" className="w-16 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none" id={`mo-${obj.id}`} />
                      <button onClick={() => {
                        const input = document.getElementById(`mo-${obj.id}`) as HTMLInputElement;
                        const val = parseFloat(input.value || "0");
                        if (val > 0) updateProgress(obj.id as string, current + val);
                      }} className="rounded-lg bg-violet-bright px-2 py-1 text-xs text-white">Add</button>
                    </div>
                  )}
                  <button onClick={() => handleDelete(obj.id as string)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                </div>
              </div>
            </AnimateIn>
          );
        })}
        {active.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No active objectives. Add one above!</p>}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed ({completed.length})</h2>
          <div className="space-y-2">
            {completed.map((obj) => (
              <div key={obj.id as string} className="flex items-center gap-3 rounded-xl bg-card/50 p-3 ring-1 ring-border/50">
                <button onClick={() => toggleComplete(obj.id as string, true)}>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </button>
                <p className="text-sm text-muted-foreground line-through">{obj.title as string}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">New Micro-Objective</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="mb-1 block text-xs text-muted-foreground">Title</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" /></div>
              <div><label className="mb-1 block text-xs text-muted-foreground">Target Amount (MAD, 0 for non-monetary)</label><input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-muted-foreground">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none">
                    <option value="general">General</option><option value="food">Food</option><option value="shopping">Shopping</option><option value="transport">Transport</option><option value="savings">Savings</option><option value="entertainment">Entertainment</option>
                  </select>
                </div>
                <div><label className="mb-1 block text-xs text-muted-foreground">Due Date</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" /></div>
              </div>
              <button type="submit" disabled={saving} className="pill-btn w-full justify-center disabled:opacity-50">{saving ? "Creating..." : "Create Objective"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
