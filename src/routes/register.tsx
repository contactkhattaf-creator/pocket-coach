import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MoniqLogo } from "@/components/MoniqLogo";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", age: "", phone: "", salary: "", salary_frequency: "monthly" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.full_name } },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    // Update profile with extra fields
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        age: form.age ? parseInt(form.age) : null,
        phone: form.phone || null,
        salary: form.salary ? parseFloat(form.salary) : null,
        salary_frequency: form.salary_frequency,
      }).eq("id", user.id);
    }
    setLoading(false);
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <MoniqLogo size={40} className="text-violet-bright" />
            <span className="font-display text-2xl font-bold text-foreground">monique</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Step {step} of 2</p>
        </div>

        {/* Progress */}
        <div className="mt-4 flex gap-2">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-violet-bright" : "bg-surface"}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-violet-bright" : "bg-surface"}`} />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

          {step === 1 && (
            <>
              <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name</label>
                    <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright placeholder:text-muted-foreground" placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                    <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright placeholder:text-muted-foreground" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Password</label>
                    <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright placeholder:text-muted-foreground" placeholder="••••••••" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Age</label>
                      <input type="number" min="13" max="100" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="22" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label>
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="+212 6..." />
                    </div>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => { if (form.full_name && form.email && form.password) setStep(2); }} className="pill-btn w-full justify-center">Continue</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Income Details</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Monthly Salary (MAD)</label>
                    <input type="number" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright placeholder:text-muted-foreground" placeholder="5000" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Pay Frequency</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["weekly", "bi-weekly", "monthly"] as const).map((freq) => (
                        <button key={freq} type="button" onClick={() => setForm({ ...form, salary_frequency: freq })} className={`rounded-xl py-2.5 text-xs font-semibold capitalize transition ${form.salary_frequency === freq ? "bg-violet-bright text-white" : "bg-surface text-muted-foreground hover:bg-surface-hover"}`}>
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="pill-btn-ghost flex-1 justify-center">Back</button>
                <button type="submit" disabled={loading} className="pill-btn flex-1 justify-center disabled:opacity-50">{loading ? "Creating..." : "Create Account"}</button>
              </div>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-violet-bright hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
