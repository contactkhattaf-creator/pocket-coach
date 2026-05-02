import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboard } from "@/routes/dashboard";
import { TrendingUp, TrendingDown, Target, Flame, ArrowRight, CreditCard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { user } = useDashboard();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [txRes, catRes, billRes, goalRes, streakRes, profRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(100),
      supabase.from("categories").select("*"),
      supabase.from("bills").select("*").eq("user_id", user.id).eq("is_paid", false).order("due_date", { ascending: true }).limit(5),
      supabase.from("goals").select("*").eq("user_id", user.id).limit(10),
      supabase.from("streaks").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (billRes.data) setBills(billRes.data);
    if (goalRes.data) setGoals(goalRes.data);
    if (streakRes.data) setStreaks(streakRes.data);
    if (profRes.data) setProfile(profRes.data);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadData]);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  // Monthly chart data
  const monthlyData = getMonthlyData(transactions);

  // Streak count
  const currentStreak = calculateStreak(streaks);

  const savedTotal = goals.reduce((s, g) => s + Number(g.current_amount), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}</p>
      </div>

      {/* Net Worth Hero */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-violet-bright/20 via-card to-card p-6 ring-1 ring-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Worth</p>
        <p className="mt-2 font-display text-4xl font-bold text-foreground counter-up">
          {balance.toLocaleString("fr-MA", { minimumFractionDigits: 2 })} <span className="text-lg text-muted-foreground">MAD</span>
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          {balance >= 0 ? (
            <span className="flex items-center gap-1 text-success"><TrendingUp className="h-4 w-4" /> Positive balance</span>
          ) : (
            <span className="flex items-center gap-1 text-destructive"><TrendingDown className="h-4 w-4" /> Negative balance</span>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Total Saved" value={`${savedTotal.toLocaleString("fr-MA")} MAD`} color="text-success" />
        <StatCard icon={Target} label="Active Goals" value={String(goals.length)} color="text-violet-bright" />
        <StatCard icon={Flame} label="Streak" value={`${currentStreak} days`} color="text-warning" />
        <StatCard icon={CreditCard} label="Upcoming Bills" value={String(bills.length)} color="text-magenta" />
      </div>

      {/* Chart + Recent */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Spending vs Income Chart */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border lg:col-span-3">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Income vs Expenses</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 280)" />
                <XAxis dataKey="month" tick={{ fill: "oklch(0.60 0.03 280)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.60 0.03 280)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.18 0.025 280)", border: "1px solid oklch(0.28 0.03 280)", borderRadius: "12px", color: "oklch(0.95 0.01 280)" }}
                  formatter={(value: unknown) => [`${Number(value).toLocaleString("fr-MA")} MAD`]}
                />
                <Bar dataKey="income" fill="oklch(0.72 0.19 155)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="oklch(0.58 0.22 295)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Recent</h2>
            <a href="/dashboard/transactions" className="flex items-center gap-1 text-xs text-violet-bright hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => {
              const cat = categories.find((c) => c.id === tx.category_id);
              return (
                <div key={tx.id} className="flex items-center gap-3 rounded-xl bg-surface p-3 transition hover:bg-surface-hover">
                  <span className="text-lg">{cat?.icon || "📦"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{tx.description || cat?.name || "Transaction"}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <p className={`text-sm font-bold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}{Number(tx.amount).toLocaleString("fr-MA")} MAD
                  </p>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Bills */}
      {bills.length > 0 && (
        <div className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Upcoming Bills</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bills.map((bill) => (
              <div key={bill.id} className="flex items-center gap-3 rounded-xl bg-surface p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-bright/15">
                  <CreditCard className="h-5 w-5 text-violet-bright" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">Due {bill.due_date}</p>
                </div>
                <p className="text-sm font-bold text-foreground">{Number(bill.amount).toLocaleString("fr-MA")} MAD</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-surface`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function getMonthlyData(transactions: any[]) {
  const months: Record<string, { income: number; expense: number }> = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Initialize last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = { income: 0, expense: 0 };
  }

  transactions.forEach((tx) => {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (months[key]) {
      if (tx.type === "income") months[key].income += Number(tx.amount);
      else months[key].expense += Number(tx.amount);
    }
  });

  return Object.entries(months).map(([key, val]) => {
    const [y, m] = key.split("-");
    return { month: monthNames[parseInt(m) - 1], ...val };
  });
}

function calculateStreak(streaks: any[]) {
  if (!streaks.length) return 0;
  let count = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < streaks.length; i++) {
    const d = new Date(streaks[i].date);
    d.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (d.getTime() === expected.getTime()) {
      count++;
    } else {
      break;
    }
  }
  return count;
}
