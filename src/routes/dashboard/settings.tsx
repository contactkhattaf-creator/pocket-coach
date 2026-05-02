import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { Save, Camera, User } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useDashboard();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    full_name: "", age: "", phone: "", salary: "", salary_frequency: "monthly", currency: "MAD",
    bio: "", pronouns: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data);
      setForm({
        full_name: (data.full_name as string) || "",
        age: data.age ? String(data.age) : "",
        phone: (data.phone as string) || "",
        salary: data.salary ? String(data.salary) : "",
        salary_frequency: (data.salary_frequency as string) || "monthly",
        currency: (data.currency as string) || "MAD",
        bio: (data.bio as string) || "",
        pronouns: (data.pronouns as string) || "",
      });
      if (data.avatar_url) setAvatarPreview(data.avatar_url as string);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccess("");

    let avatarUrl = (profile as Record<string, unknown>)?.avatar_url as string | null;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }
    }

    await supabase.from("profiles").update({
      full_name: form.full_name,
      age: form.age ? parseInt(form.age) : null,
      phone: form.phone,
      salary: form.salary ? parseFloat(form.salary) : null,
      salary_frequency: form.salary_frequency,
      currency: form.currency,
      bio: form.bio,
      pronouns: form.pronouns,
      avatar_url: avatarUrl,
    }).eq("id", user.id);

    setSaving(false);
    setSuccess("Settings saved!");
    setTimeout(() => setSuccess(""), 3000);
  }

  const initials = form.full_name ? form.full_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-foreground">Settings</h1>
      <p className="mb-8 text-sm text-muted-foreground">Manage your profile and preferences</p>

      <div className="max-w-xl">
        <form onSubmit={handleSave} className="space-y-6">
          {success && (
            <div className="rounded-xl bg-success/15 px-4 py-3 text-sm text-success">{success}</div>
          )}

          {/* Profile Card — Social Media Style */}
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <label className="group relative cursor-pointer">
                <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-bright/15 ring-2 ring-violet-bright/30">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-2xl font-bold text-violet-bright">{initials}</span>
                  )}
                </div>
                <div className="absolute inset-0 grid place-items-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>

              <div className="flex-1 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Display Name</label>
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Pronouns</label>
                  <select value={form.pronouns} onChange={(e) => setForm({ ...form, pronouns: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none">
                    <option value="">Select pronouns</option>
                    <option value="he/him">he/him</option>
                    <option value="she/her">she/her</option>
                    <option value="they/them">they/them</option>
                    <option value="other">other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 160) })}
                maxLength={160}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright placeholder:text-muted-foreground"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{form.bio.length}/160</p>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
              <input value={user?.email || ""} disabled className="w-full rounded-xl border border-border bg-surface/50 px-4 py-2.5 text-sm text-muted-foreground outline-none cursor-not-allowed" />
            </div>
          </div>

          {/* Personal Info */}
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h2>
            <div className="space-y-4">
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
