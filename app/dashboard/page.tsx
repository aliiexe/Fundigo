"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import {
  EXPORT_SECTIONS,
  EXPORT_SECTION_LABELS,
  getStoredExportOptions,
  setStoredExportOptions,
  DEFAULT_EXPORT_OPTIONS,
  type ExportFormat,
  type ExportSection,
} from "@/lib/exportData";
import { Modal } from "@/components/ui/Modal";

type Income = { id: string; name: string; amount: number; convertedAmount?: number; frequency: string; note?: string };
type Expense = { id: string; merchant: string; amount: number; originalAmount?: number; originalCurrency?: string; date: string };
type Subscription = { id: string; service_name: string; plan?: string; amount: number; currency: string; period: string; convertedAmount?: number; convertedMonthly?: number };
type Goal = { id: string; name: string; target_amount: number; current_amount: number; deadline?: string };

type Recommendation = { type: string; subscription_id: string; service_name: string; message: string; potential_savings?: number };

type Reminder = { merchant: string; typicalDay: number; message: string };

type DashboardData = {
  month: string;
  currency?: string;
  startingBalance: number;
  currentBalance: number;
  monthlyIncome: number;
  totalExpenses: number;
  monthlySubscriptions: number;
  netFlow: number;
  incomes: Income[];
  expenses: Expense[];
  subscriptions: Subscription[];
  goals: Goal[];
  spendingByMerchant: Record<string, number>;
  rates?: Record<string, number>;
  reminders?: Reminder[];
};

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const shift = (delta: number) => {
    const [y, m] = value.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  const label = new Date(Number(value.split("-")[0]), Number(value.split("-")[1]) - 1).toLocaleString("default", { month: "long", year: "numeric" });
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => shift(-1)} className="w-8 h-8 rounded-lg bg-[#111111] border border-[#1e1e1e] text-[#737373] hover:text-[#e8e8e8] hover:border-[#2a2a2a] transition-all flex items-center justify-center text-sm">&larr;</button>
      <span className="text-sm font-medium text-[#e8e8e8] min-w-[140px] text-center">{label}</span>
      <button onClick={() => shift(1)} className="w-8 h-8 rounded-lg bg-[#111111] border border-[#1e1e1e] text-[#737373] hover:text-[#e8e8e8] hover:border-[#2a2a2a] transition-all flex items-center justify-center text-sm">&rarr;</button>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(() => getStoredExportOptions()?.format ?? DEFAULT_EXPORT_OPTIONS.format);
  const [exportInclude, setExportInclude] = useState<ExportSection[]>(() => getStoredExportOptions()?.include ?? DEFAULT_EXPORT_OPTIONS.include);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setStoredExportOptions({ format: exportFormat, include: exportInclude });
  }, [exportFormat, exportInclude]);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [me, dashboard] = await Promise.all([
        fetch("/api/v1/me").then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/v1/dashboard?month=${month}`).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (!me) { toast.error("Could not load your account"); return; }
      if (dashboard?.currency) setCurrency(dashboard.currency);
      else if (me.preferred_currency) setCurrency(me.preferred_currency);
      setData(dashboard);
      fetch("/api/v1/recommendations").then((r) => (r.ok ? r.json() : null)).then((d) => {
        if (d?.recommendations) setRecs(d.recommendations);
      }).catch(() => {});
    } catch {
      toast.error("Could not load dashboard");
    } finally {
      setRefreshing(false);
      setPageLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const toggleExportSection = (section: ExportSection) => {
    setExportInclude((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };
  const selectAllExportSections = (on: boolean) => {
    setExportInclude(on ? [...EXPORT_SECTIONS] : []);
  };
  const handleExport = async () => {
    if (exportInclude.length === 0) {
      toast.error("Select at least one data type to export.");
      return;
    }
    setExporting(true);
    try {
      const res = await fetch("/api/v1/data/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: exportFormat, include: exportInclude }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Export failed.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? (exportFormat === "json" ? "fundigo-export.json" : "fundigo-export.zip");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started.");
      setExportModalOpen(false);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  if (pageLoading || !data) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#FF4000] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#737373]">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const f = (n: number) => formatCurrency(n, currency);
  const isPositive = data.netFlow >= 0;
  const topMerchants = Object.entries(data.spendingByMerchant)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxSpend = topMerchants.length > 0 ? topMerchants[0][1] : 1;

  return (
    <div className={`max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 transition-opacity duration-200 ${refreshing ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#e8e8e8]">Dashboard</h1>
            <p className="text-[#737373] text-sm mt-0.5">Your financial overview</p>
          </div>
          {refreshing && <div className="w-4 h-4 border-2 border-[#FF4000] border-t-transparent rounded-full animate-spin" />}
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} />
          <button
            type="button"
            className="btn-secondary flex items-center gap-1.5"
            onClick={() => setExportModalOpen(true)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Balance hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF4000] to-[#CC3300] p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium mb-1">Current Balance</p>
          <p className="text-4xl sm:text-5xl font-bold text-white tracking-tight">{f(data.currentBalance)}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isPositive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
              {isPositive ? "↑" : "↓"} {f(Math.abs(data.netFlow))}
            </span>
            <span className="text-white/60 text-xs">net this month</span>
          </div>
        </div>
      </div>

      {/* Gentle reminders */}
      {data.reminders && data.reminders.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <h2 className="text-base font-medium text-[#e8e8e8]">Gentle reminders</h2>
          </div>
          <ul className="divide-y divide-[#1e1e1e]">
            {data.reminders.map((r, i) => (
              <li key={`${r.merchant}-${i}`} className="px-5 py-4 flex items-start gap-3">
                <span className="text-[#f59e0b] mt-0.5">•</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#e8e8e8]">{r.message}</p>
                  <Link
                    href="/dashboard/expenses"
                    className="inline-block text-xs text-[#FF4000] hover:underline mt-1"
                  >
                    Add expense →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="p-5">
            <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Income</p>
            <p className="text-2xl font-semibold text-[#10b981] mt-2">{f(data.monthlyIncome)}</p>
            <p className="text-[#525252] text-xs mt-1">Monthly recurring</p>
          </div>
        </div>
        <div className="card">
          <div className="p-5">
            <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Total Spending</p>
            <p className="text-2xl font-semibold text-[#ef4444] mt-2">{f(data.totalExpenses + data.monthlySubscriptions)}</p>
            <p className="text-[#525252] text-xs mt-1">
              {f(data.totalExpenses)} expenses + {f(data.monthlySubscriptions)} subs
            </p>
          </div>
        </div>
        <div className="card">
          <div className="p-5">
            <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Subscriptions</p>
            <p className="text-2xl font-semibold text-[#f59e0b] mt-2">{f(data.monthlySubscriptions)}</p>
            <p className="text-[#525252] text-xs mt-1">{data.subscriptions.length} active · included in spending</p>
          </div>
        </div>
        <div className="card">
          <div className="p-5">
            <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Goals</p>
            <p className="text-2xl font-semibold text-[#e8e8e8] mt-2">{data.goals.length}</p>
            <p className="text-[#525252] text-xs mt-1">Active goals</p>
          </div>
        </div>
      </div>

      {/* AI Financial Advisor */}
      {recs.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FF4000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <h2 className="text-base font-medium text-[#e8e8e8]">AI Financial Advisor</h2>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#FF4000]/10 text-[#FF4000]">AI</span>
          </div>
          <ul className="divide-y divide-[#1e1e1e]">
            {recs.map((r, i) => (
              <li key={i} className="px-5 py-4 flex items-start gap-3">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  r.type === "cancel" ? "bg-[#ef4444]/10 text-[#ef4444]"
                    : r.type === "ai" ? "bg-[#FF4000]/10 text-[#FF4000]"
                    : "bg-[#f59e0b]/10 text-[#f59e0b]"
                }`}>
                  <span className="text-xs">{r.type === "cancel" ? "✕" : r.type === "ai" ? "★" : "↓"}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#e8e8e8]">{r.message}</p>
                  {r.potential_savings != null && r.potential_savings > 0 && (
                    <p className="text-xs text-[#10b981] mt-1">Potential savings: {f(r.potential_savings)}/mo</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent transactions */}
        <div className="lg:col-span-3 card">
          <div className="px-5 py-4 border-b border-[#1e1e1e]">
            <h2 className="text-base font-medium text-[#e8e8e8]">Recent Transactions</h2>
          </div>
          {data.expenses.length === 0 && data.incomes.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[#525252] text-sm">No transactions this month yet.</p>
              <p className="text-[#525252] text-xs mt-1">Add income or expenses to see them here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#1e1e1e] max-h-[400px] overflow-y-auto">
              {data.incomes.map((i) => (
                <li key={`inc-${i.id}`} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#0a0a0a] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-xs text-[#10b981]">↑</div>
                    <div>
                      <p className="text-sm text-[#e8e8e8] font-medium">{i.name}</p>
                      <p className="text-xs text-[#525252]">{i.frequency} income</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[#10b981]">+{f(i.convertedAmount ?? Number(i.amount))}</span>
                </li>
              ))}
              {data.expenses.map((e) => (
                <li key={`exp-${e.id}`} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#0a0a0a] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 flex items-center justify-center text-xs text-[#ef4444]">↓</div>
                    <div>
                      <p className="text-sm text-[#e8e8e8] font-medium">{e.merchant}</p>
                      <p className="text-xs text-[#525252]">{e.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[#ef4444]">-{f(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top spending */}
        <div className="lg:col-span-2 card">
          <div className="px-5 py-4 border-b border-[#1e1e1e]">
            <h2 className="text-base font-medium text-[#e8e8e8]">Top Spending</h2>
          </div>
          {topMerchants.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[#525252] text-sm">No expenses yet.</p>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {topMerchants.map(([name, amount]) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#e8e8e8] truncate mr-2">{name}</span>
                    <span className="text-xs text-[#737373] font-medium whitespace-nowrap">{f(amount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1e1e1e] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#ef4444] transition-all duration-500"
                      style={{ width: `${(amount / maxSpend) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goals + Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals progress */}
        <div className="card">
          <div className="px-5 py-4 border-b border-[#1e1e1e]">
            <h2 className="text-base font-medium text-[#e8e8e8]">Goals Progress</h2>
          </div>
          {data.goals.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[#525252] text-sm">No goals yet. Create one in the Goals page.</p>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {data.goals.map((g) => {
                const pct = g.target_amount > 0 ? Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100) : 0;
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-[#e8e8e8]">{g.name}</span>
                      <span className="text-xs text-[#737373]">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1e1e1e] overflow-hidden">
                      <div className="h-full rounded-full bg-[#FF4000] transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-[#525252] mt-1">
                      {f(Number(g.current_amount))} of {f(Number(g.target_amount))}
                      {g.deadline ? ` · Due ${g.deadline}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subscriptions */}
        <div className="card">
          <div className="px-5 py-4 border-b border-[#1e1e1e]">
            <h2 className="text-base font-medium text-[#e8e8e8]">Subscriptions</h2>
          </div>
          {data.subscriptions.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[#525252] text-sm">No subscriptions tracked yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#1e1e1e]">
              {data.subscriptions.map((s) => (
                <li key={s.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#e8e8e8] font-medium">{s.service_name}</p>
                    {s.plan && <p className="text-xs text-[#525252]">{s.plan}</p>}
                  </div>
                  <span className="text-sm text-[#f59e0b] font-medium">
                    {f(s.convertedMonthly ?? Number(s.amount))}/mo
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal open={exportModalOpen} onClose={() => setExportModalOpen(false)} title="Export data" wide>
        <div className="space-y-4">
          <p className="text-sm text-[#737373]">Choose format and which data to include in the download.</p>
          <div className="space-y-2">
            <span className="text-xs text-[#737373] block">Format</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  checked={exportFormat === "json"}
                  onChange={() => setExportFormat("json")}
                  className="rounded-full border-[#404040] bg-[#111111]"
                />
                <span className="text-sm text-[#e8e8e8]">JSON</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  checked={exportFormat === "csv"}
                  onChange={() => setExportFormat("csv")}
                  className="rounded-full border-[#404040] bg-[#111111]"
                />
                <span className="text-sm text-[#e8e8e8]">CSV</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#737373]">Include</span>
              <button
                type="button"
                onClick={() => selectAllExportSections(exportInclude.length < EXPORT_SECTIONS.length)}
                className="text-xs text-[#FF4000] hover:underline"
              >
                {exportInclude.length === EXPORT_SECTIONS.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {EXPORT_SECTIONS.map((section) => (
                <label key={section} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportInclude.includes(section)}
                    onChange={() => toggleExportSection(section)}
                    className="rounded border-[#404040] bg-[#111111]"
                  />
                  <span className="text-sm text-[#e8e8e8]">{EXPORT_SECTION_LABELS[section]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setExportModalOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || exportInclude.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              {exporting ? "Preparing…" : "Export"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
