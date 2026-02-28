"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";

type Allocation = {
  id: string;
  amount: number;
  spend_pct: number;
  save_pct: number;
  invest_pct: number;
  keep_pct: number;
  accepted: boolean;
  save_target?: string;
  goal_id?: string;
  currency?: string;
  reasoning?: string;
  created_at: string;
};

const SEGMENT_COLORS: Record<string, string> = {
  spend: "#ef4444",
  save: "#10b981",
  invest: "#8b5cf6",
  keep: "#f59e0b",
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

function BreakdownBar({ spend, save, invest, keep }: { spend: number; save: number; invest: number; keep: number }) {
  const segments = [
    { key: "spend", pct: spend, color: SEGMENT_COLORS.spend },
    { key: "save", pct: save, color: SEGMENT_COLORS.save },
    { key: "invest", pct: invest, color: SEGMENT_COLORS.invest },
    { key: "keep", pct: keep, color: SEGMENT_COLORS.keep },
  ].filter((s) => s.pct > 0);

  return (
    <div className="h-2.5 rounded-full bg-[#1e1e1e] overflow-hidden flex">
      {segments.map((s) => (
        <div
          key={s.key}
          className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
          style={{ width: `${s.pct}%`, backgroundColor: s.color }}
        />
      ))}
    </div>
  );
}

export default function AllocationsPage() {
  const [list, setList] = useState<Allocation[]>([]);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetch("/api/v1/me").then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/v1/allocations?month=${month}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([me, allocations]) => {
        if (me?.preferred_currency) setCurrency(me.preferred_currency);
        setList(allocations);
      })
      .catch(() => toast.error("Failed to load allocations"))
      .finally(() => {
        setRefreshing(false);
        setPageLoading(false);
      });
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const toggleReasoning = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const f = (n: number, c?: string) => formatCurrency(n, c || currency);

  const acceptedList = list.filter((a) => a.accepted);
  const totalAllocated = acceptedList.reduce((s, a) => s + Number(a.amount), 0);
  const totalToSavings = acceptedList.reduce((s, a) => s + Number(a.amount) * (Number(a.save_pct) / 100), 0);
  const totalToInvest = acceptedList.reduce((s, a) => s + Number(a.amount) * (Number(a.invest_pct) / 100), 0);

  const monthLabel = new Date(
    Number(month.split("-")[0]),
    Number(month.split("-")[1]) - 1
  ).toLocaleString("default", { month: "long", year: "numeric" });

  if (pageLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#FF4000] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#737373]">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 transition-opacity duration-200 ${refreshing ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#e8e8e8]">Allocations</h1>
            <p className="text-[#737373] text-sm mt-0.5">How your income was distributed</p>
          </div>
          {refreshing && <div className="w-4 h-4 border-2 border-[#FF4000] border-t-transparent rounded-full animate-spin" />}
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="p-5">
            <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Total Allocated</p>
            <p className="text-2xl font-semibold text-[#e8e8e8] mt-2">{f(totalAllocated)}</p>
            <p className="text-[#525252] text-xs mt-1">{acceptedList.length} allocation{acceptedList.length !== 1 ? "s" : ""} in {monthLabel}</p>
          </div>
        </div>
        <div className="card">
          <div className="p-5">
            <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">To Savings</p>
            <p className="text-2xl font-semibold text-[#10b981] mt-2">{f(totalToSavings)}</p>
            <p className="text-[#525252] text-xs mt-1">From accepted allocations</p>
          </div>
        </div>
        <div className="card">
          <div className="p-5">
            <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">To Investments</p>
            <p className="text-2xl font-semibold text-[#8b5cf6] mt-2">{f(totalToInvest)}</p>
            <p className="text-[#525252] text-xs mt-1">From accepted allocations</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {Object.entries(SEGMENT_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-[#737373] capitalize">{key}</span>
          </div>
        ))}
      </div>

      {/* Allocation cards — only accepted */}
      <div className="space-y-4">
        {acceptedList.length === 0 ? (
          <div className="card">
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#111111] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#525252]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
              </div>
              <p className="text-[#525252] text-sm">No accepted allocations this month.</p>
              <p className="text-[#525252] text-xs mt-1">When you receive income and accept a distribution, it will appear here.</p>
            </div>
          </div>
        ) : (
          acceptedList.map((a) => {
            const allCurrency = a.currency || currency;
            const amt = Number(a.amount);
            const spendAmt = amt * (Number(a.spend_pct) / 100);
            const saveAmt = amt * (Number(a.save_pct) / 100);
            const investAmt = amt * (Number(a.invest_pct) / 100);
            const keepAmt = amt * (Number(a.keep_pct) / 100);
            const dateStr = new Date(a.created_at).toLocaleDateString("default", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={a.id} className="card">
                <div className="p-5 space-y-4">
                  {/* Top row: amount + date */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold text-[#e8e8e8]">{f(amt, allCurrency)}</p>
                      <p className="text-xs text-[#525252] mt-0.5">{dateStr}</p>
                    </div>
                  </div>

                  {/* Breakdown bar */}
                  <BreakdownBar
                    spend={Number(a.spend_pct)}
                    save={Number(a.save_pct)}
                    invest={Number(a.invest_pct)}
                    keep={Number(a.keep_pct)}
                  />

                  {/* Percentage labels */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS.spend }} />
                      <span className="text-xs text-[#737373]">Spend {Number(a.spend_pct)}%</span>
                      <span className="text-xs text-[#525252]">({f(spendAmt, allCurrency)})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS.save }} />
                      <span className="text-xs text-[#737373]">Save {Number(a.save_pct)}%</span>
                      <span className="text-xs text-[#525252]">({f(saveAmt, allCurrency)})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS.invest }} />
                      <span className="text-xs text-[#737373]">Invest {Number(a.invest_pct)}%</span>
                      <span className="text-xs text-[#525252]">({f(investAmt, allCurrency)})</span>
                    </div>
                    {Number(a.keep_pct) > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS.keep }} />
                        <span className="text-xs text-[#737373]">Keep {Number(a.keep_pct)}%</span>
                        <span className="text-xs text-[#525252]">({f(keepAmt, allCurrency)})</span>
                      </div>
                    )}
                  </div>

                  {/* Save target info */}
                  {a.save_target && a.save_target !== "savings" && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <svg className="w-3.5 h-3.5 text-[#FF4000]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span className="text-[#737373]">Savings directed to <span className="text-[#e8e8e8] font-medium">goal</span></span>
                    </div>
                  )}

                  {/* Reasoning (collapsible) */}
                  {a.reasoning && (
                    <div>
                      <button
                        onClick={() => toggleReasoning(a.id)}
                        className="text-xs text-[#FF4000] hover:underline flex items-center gap-1"
                      >
                        <svg className={`w-3 h-3 transition-transform ${expanded[a.id] ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        {expanded[a.id] ? "Hide reasoning" : "View reasoning"}
                      </button>
                      {expanded[a.id] && (
                        <div className="mt-2 p-3 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a]">
                          <p className="text-xs text-[#737373] leading-relaxed">{a.reasoning}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
