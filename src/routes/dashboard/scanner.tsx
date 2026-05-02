import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useDashboard } from "@/routes/dashboard";
import { supabase } from "@/integrations/supabase/client";
import { ScanLine, Upload, Camera, X, Check, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/scanner")({
  component: ScannerPage,
});

function ScannerPage() {
  const { user } = useDashboard();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ description: string; amount: string; date: string; category: string } | null>(null);
  const [saved, setSaved] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setSaved(false);
    simulateScan();
  }

  function simulateScan() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setResult({
        description: "Marjane Supermarket",
        amount: "347.50",
        date: new Date().toISOString().split("T")[0],
        category: "Shopping",
      });
    }, 2000);
  }

  async function saveTransaction() {
    if (!user || !result) return;
    const { data: cats } = await supabase.from("categories").select("id, name").eq("name", result.category).limit(1);
    await supabase.from("transactions").insert({
      user_id: user.id,
      description: result.description,
      amount: parseFloat(result.amount),
      date: result.date,
      type: "expense",
      category_id: cats?.[0]?.id || null,
    });
    setSaved(true);
  }

  function reset() {
    setPreview(null);
    setResult(null);
    setSaved(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-foreground">Receipt Scanner</h1>
      <p className="mb-8 text-sm text-muted-foreground">Snap a receipt to auto-create a transaction</p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload area */}
        <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
          {!preview ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border py-20 transition hover:border-violet-bright hover:bg-surface/50">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-bright/15">
                <ScanLine className="h-8 w-8 text-violet-bright" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Upload a receipt image</p>
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-xs font-medium text-foreground">
                  <Upload className="h-3.5 w-3.5" /> Choose file
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-xs font-medium text-foreground">
                  <Camera className="h-3.5 w-3.5" /> Camera
                </span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
            </label>
          ) : (
            <div className="relative">
              <img src={preview} alt="Receipt" className="w-full rounded-xl object-contain" style={{ maxHeight: 400 }} />
              <button onClick={reset} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80">
                <X className="h-4 w-4" />
              </button>
              {scanning && (
                <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/40 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-bright" />
                    <p className="text-sm font-medium text-white">Scanning receipt...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Result */}
        <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Extracted Data</h2>
          {!result && !scanning && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ScanLine className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">Upload a receipt to see extracted data here</p>
            </div>
          )}
          {scanning && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-violet-bright" />
              <p className="mt-4 text-sm text-muted-foreground">Analyzing receipt...</p>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <Field label="Merchant / Description" value={result.description} onChange={(v) => setResult({ ...result, description: v })} />
              <Field label="Amount (MAD)" value={result.amount} onChange={(v) => setResult({ ...result, amount: v })} type="number" />
              <Field label="Date" value={result.date} onChange={(v) => setResult({ ...result, date: v })} type="date" />
              <Field label="Category" value={result.category} onChange={(v) => setResult({ ...result, category: v })} />

              {saved ? (
                <div className="flex items-center gap-2 rounded-xl bg-success/15 px-4 py-3 text-sm text-success">
                  <Check className="h-4 w-4" /> Transaction saved successfully
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={saveTransaction} className="pill-btn flex-1 justify-center gap-2">
                    <Check className="h-4 w-4" /> Save Transaction
                  </button>
                  <button onClick={reset} className="pill-btn-ghost flex-1 justify-center">Discard</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-bright"
      />
    </div>
  );
}
