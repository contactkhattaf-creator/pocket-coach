import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MoniqLogo } from "@/components/MoniqLogo";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); } else { navigate({ to: "/dashboard" }); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <MoniqLogo size={40} className="text-violet-bright" />
            <span className="font-display text-2xl font-bold text-foreground">moniq</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your Moniq account</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright placeholder:text-muted-foreground" placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright placeholder:text-muted-foreground" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="pill-btn w-full justify-center disabled:opacity-50">{loading ? "Signing in..." : "Sign in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-violet-bright hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
