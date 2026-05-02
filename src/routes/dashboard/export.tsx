import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { useDashboard } from "@/routes/dashboard";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, FileSpreadsheet, Loader2, Check } from "lucide-react";

export const Route = createFileRoute("/dashboard/export")({
  component: ExportPage,
});

function ExportPage() {
  const { user } = useDashboard();
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [y, m] = monthFilter.split("-").map(Number);
    const startDate = new Date(y, m - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(y, m, 0).toISOString().split("T")[0];
    
    const [txRes, catRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).gte("date", startDate).lte("date", endDate).order("date", { ascending: false }),
      supabase.from("categories").select("*"),
    ]);
    if (txRes.data) setTransactions(txRes.data);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  }, [user, monthFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  function getCategoryName(catId: string) {
    const cat = categories.find((c) => (c.id as string) === catId);
    return cat ? (cat.name as string) : "Other";
  }

  function exportCSV() {
    setExporting("csv");
    const header = "Date,Description,Category,Type,Amount (MAD)\n";
    const rows = transactions.map((tx) => {
      const cat = getCategoryName(tx.category_id as string);
      return `${tx.date},"${(tx.description as string || "").replace(/"/g, '""')}",${cat},${tx.type},${tx.amount}`;
    }).join("\n");
    
    const summary = `\n\nSummary\nTotal Income,${totalIncome.toFixed(2)}\nTotal Expenses,${totalExpense.toFixed(2)}\nNet Balance,${(totalIncome - totalExpense).toFixed(2)}`;
    
    const blob = new Blob([header + rows + summary], { type: "text/csv" });
    downloadBlob(blob, `monique-report-${monthFilter}.csv`);
    setTimeout(() => setExporting(null), 1000);
  }

  function exportJSON() {
    setExporting("json");
    const data = {
      period: monthFilter,
      summary: { totalIncome, totalExpense, netBalance: totalIncome - totalExpense },
      transactions: transactions.map((tx) => ({
        date: tx.date,
        description: tx.description,
        category: getCategoryName(tx.category_id as string),
        type: tx.type,
        amount: Number(tx.amount),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(blob, `monique-report-${monthFilter}.json`);
    setTimeout(() => setExporting(null), 1000);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const [y, m] = monthFilter.split("-").map(Number);
  const monthName = new Date(y, m - 1).toLocaleString("en", { month: "long", year: "numeric" });

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-foreground">Export Reports</h1>
      <p className="mb-8 text-sm text-muted-foreground">Download your financial data as CSV or JSON</p>

      {/* Month selector */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-xs font-medium text-muted-foreground">Period</label>
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright"
        />
      </div>

      {/* Summary card */}
      <div className="mb-6 rounded-2xl bg-card p-6 ring-1 ring-border">
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">{monthName} Summary</h2>
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-4">
            <SumCard label="Transactions" value={String(transactions.length)} />
            <SumCard label="Income" value={`${totalIncome.toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD`} color="text-success" />
            <SumCard label="Expenses" value={`${totalExpense.toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD`} color="text-destructive" />
            <SumCard label="Net" value={`${(totalIncome - totalExpense).toLocaleString("fr-MA", { minimumFractionDigits: 2 })} MAD`} color={totalIncome - totalExpense >= 0 ? "text-success" : "text-destructive"} />
          </div>
        )}
      </div>

      {/* Export buttons */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ExportCard
          icon={FileSpreadsheet}
          title="CSV Export"
          desc="Compatible with Excel, Google Sheets, and other spreadsheet apps."
          onClick={exportCSV}
          loading={exporting === "csv"}
          disabled={transactions.length === 0}
        />
        <ExportCard
          icon={FileText}
          title="JSON Export"
          desc="Structured data format for developers and integrations."
          onClick={exportJSON}
          loading={exporting === "json"}
          disabled={transactions.length === 0}
        />
      </div>
    </div>
  );
}

function SumCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-bold ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}

function ExportCard({ icon: Icon, title, desc, onClick, loading, disabled }: {
  icon: typeof Download; title: string; desc: string; onClick: () => void; loading: boolean; disabled: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-violet-bright/15">
        <Icon className="h-6 w-6 text-violet-bright" />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      <button onClick={onClick} disabled={disabled || loading} className="pill-btn mt-4 gap-2 text-xs disabled:opacity-50">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {loading ? "Exporting..." : "Download"}
      </button>
    </div>
  );
}
