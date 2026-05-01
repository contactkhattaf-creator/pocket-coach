import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import moniqLogo from "@/assets/moniq-logo.jpg";

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
    if (err) {
      setError(err.message);
    } else {
      navigate({ to: "/dashboard" });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={moniqLogo} alt="Moniq" className="h-12 w-12 rounded-full object-cover" />
            <span className="font-display text-3xl font-bold text-ink">moniq</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-ink/60">Sign in to your Moniq account</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
          )}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-bright"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-bright"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="pill-btn w-full justify-center disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-violet-bright hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
