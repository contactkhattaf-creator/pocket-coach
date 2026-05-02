import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { Save } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useDashboard();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", age: "", phone: "", salary: "", salary_frequency: "monthly", currency: "MAD" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data);
      setForm({
        full_name: data.full_name || "",
        age: data.age ? String(data.age) : "",
        phone: data.phone || "",
        salary: data.salary ? String(data.salary) : "",
        salary_frequency: data.salary_frequency || "monthly",
        currency: data.currency || "MAD",
      });
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccess("");
    await supabase.from("profiles").update({
      full_name: form.full_name,
      age: form.age ? parseInt(form.age) : null,
      phone: form.phone,
      salary: form.salary ? parseFloat(form.salary) : null,
      salary_frequency: form.salary_frequency,
      currency: form.currency,
    }).eq("id", user.id);
    setSaving(false);
    setSuccess("Settings saved!");
    setTimeout(() => setSuccess(""), 3000);
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-foreground">Settings</h1>
      <p className="mb-8 text-sm text-muted-foreground">Manage your profile and preferences</p>

      <div className="max-w-xl">
        <form onSubmit={handleSave} className="space-y-6">
          {success && (
            <div className="rounded-xl bg-success/15 px-4 py-3 text-sm text-success">{success}</div>
          )}

          {/* Personal Info */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name</label>
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Age</label>
                  <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" placeholder="+212 6..." />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                <input value={user?.email || ""} disabled className="w-full rounded-xl border border-border bg-surface/50 px-4 py-2.5 text-sm text-muted-foreground outline-none cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Salary (MAD)</label>
                  <input type="number" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none" placeholder="5000" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Pay Frequency</label>
                  <select value={form.salary_frequency} onChange={(e) => setForm({ ...form, salary_frequency: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none">
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Currency</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none">
                  <option value="MAD">MAD (Moroccan Dirham)</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="pill-btn gap-2 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
