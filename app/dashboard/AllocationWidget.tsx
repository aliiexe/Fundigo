"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

type Allocation = { spend: number; save: number; invest: number; keep?: number };
type Goal = { id: string; name: string; target_amount: number; current_amount: number };

const SLICES: { key: keyof Allocation; label: string; color: string; bg: string }[] = [
  { key: "spend", label: "Spend", color: "#ef4444", bg: "bg-[#ef4444]" },
  { key: "save", label: "Save", color: "#10b981", bg: "bg-[#10b981]" },
  { key: "invest", label: "Invest", color: "#3b82f6", bg: "bg-[#3b82f6]" },
  { key: "keep", label: "Keep", color: "#f59e0b", bg: "bg-[#f59e0b]" },
];

export function AllocationWidget({
  amount,
  currency = "USD",
  onDone,
}: {
  amount: number;
  currency?: string;
  onDone?: () => void;
}) {
  const [allocation, setAllocation] = useState<Allocation>({ spend: 50, save: 30, invest: 20, keep: 0 });
  const [suggestedId, setSuggestedId] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [preset, setPreset] = useState("standard");
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [emaWeight, setEmaWeight] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [saveTarget, setSaveTarget] = useState<"savings" | "goal">("savings");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const fetchSuggestion = useCallback(async () => {
    if (amount <= 0) return;
    setLoading(true);
    try {
      const [suggestRes, goalsRes] = await Promise.all([
        fetch("/api/v1/allocations/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        }),
        fetch("/api/v1/goals").then((r) => (r.ok ? r.json() : [])),
      ]);
      const data = await suggestRes.json();
      if (suggestRes.ok && data.suggested) {
        setAllocation(data.suggested);
        setSuggestedId(data.id ?? null);
        setReasoning(data.reasoning ?? "");
        setPreset(data.preset ?? "standard");
        setIsAdaptive(data.isAdaptive ?? false);
        setHistoryCount(data.historyCount ?? 0);
        setEmaWeight(data.emaWeight ?? 0);
      }
      const activeGoals = (goalsRes as Goal[]).filter(
        (g) => Number(g.current_amount) < Number(g.target_amount)
      );
      setGoals(activeGoals);
      if (activeGoals.length > 0) setSelectedGoalId(activeGoals[0].id);
    } catch {
      toast.error("Could not load allocation suggestion");
    } finally {
      setLoading(false);
    }
  }, [amount]);

  useEffect(() => { fetchSuggestion(); }, [fetchSuggestion]);

  const updateSlice = (key: keyof Allocation, value: number) => {
    setAllocation((prev) => ({ ...prev, [key]: value }));
    setSuggestedId(null);
  };

  const total = allocation.spend + allocation.save + allocation.invest + (allocation.keep ?? 0);
  const pcts = total === 0
    ? { spend: 50, save: 30, invest: 20, keep: 0 }
    : {
        spend: Math.round((allocation.spend / total) * 100),
        save: Math.round((allocation.save / total) * 100),
        invest: Math.round((allocation.invest / total) * 100),
        keep: Math.round(((allocation.keep ?? 0) / total) * 100),
      };

  const saveAmount = Math.round(amount * pcts.save / 100);

  const acceptAllocation = async () => {
    setAccepting(true);
    try {
      let allocId = suggestedId;
      if (!allocId) {
        const res = await fetch("/api/v1/allocations/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
        const data = await res.json();
        allocId = data.id ?? null;
      }
      if (allocId) {
        await fetch("/api/v1/allocations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            allocation_id: allocId,
            spend_pct: pcts.spend,
            save_pct: pcts.save,
            invest_pct: pcts.invest,
            keep_pct: pcts.keep,
            save_target: saveTarget,
            goal_id: saveTarget === "goal" ? selectedGoalId : undefined,
          }),
        });
      }

      if (saveTarget === "goal" && selectedGoalId && saveAmount > 0) {
        const goal = goals.find((g) => g.id === selectedGoalId);
        if (goal) {
          await fetch(`/api/v1/goals/${selectedGoalId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              current_amount: Number(goal.current_amount) + saveAmount,
            }),
          });
        }
      }

      toast.success(
        saveTarget === "goal"
          ? `Allocation saved — ${fmt(saveAmount)} added to your goal`
          : "Allocation saved — your preferences will improve future suggestions"
      );
      onDone?.();
    } catch {
      toast.error("Failed to save allocation");
    } finally {
      setAccepting(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-[#FF4000] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#737373] text-sm ml-3">Calculating suggestion…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-[#e8e8e8]">{fmt(amount)} received</p>
          <p className="text-xs text-[#525252] mt-0.5">
            {isAdaptive
              ? `Adaptive — learned from ${historyCount} past decisions (${emaWeight}% confidence)`
              : `${preset.charAt(0).toUpperCase() + preset.slice(1)} preset${historyCount > 0 ? ` · ${3 - historyCount} more needed for adaptive` : ""}`}
          </p>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isAdaptive ? "bg-[#FF4000]/10 text-[#FF4000]" : "bg-[#3b82f6]/10 text-[#3b82f6]"}`}>
          {isAdaptive ? "Adaptive" : "Rule-based"}
        </span>
      </div>

      {/* Visual bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-[#1e1e1e]">
        {SLICES.map((s) => {
          const pct = pcts[s.key] ?? 0;
          if (pct === 0) return null;
          return (
            <div
              key={s.key}
              className={`${s.bg} transition-all duration-300`}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${pct}%`}
            />
          );
        })}
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-5">
        {SLICES.map((s) => {
          const pct = pcts[s.key] ?? 0;
          const amountVal = Math.round(amount * pct / 100);
          return (
            <div key={s.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.bg}`} />
                  <span className="text-xs font-medium text-[#e8e8e8]">{s.label}</span>
                </div>
                <span className="text-xs font-medium text-[#737373]">{pct}% · {fmt(amountVal)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={allocation[s.key] ?? 0}
                onChange={(e) => updateSlice(s.key, Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${s.color} 0%, ${s.color} ${pct}%, #1e1e1e ${pct}%, #1e1e1e 100%)`,
                  accentColor: s.color,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Save target selection */}
      {pcts.save > 0 && (
        <div className="rounded-xl bg-[#0d0d0d] border border-[#1e1e1e] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            <span className="text-xs font-medium text-[#e8e8e8]">Where should your {fmt(saveAmount)} savings go?</span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSaveTarget("savings")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                saveTarget === "savings"
                  ? "border-[#10b981] bg-[#10b981]/10 text-[#10b981]"
                  : "border-[#1e1e1e] text-[#737373] hover:border-[#2a2a2a] hover:text-[#e8e8e8]"
              }`}
            >
              <span className="block text-sm mb-0.5">General Savings</span>
              <span className="block text-[10px] opacity-70">Build your safety net</span>
            </button>
            <button
              type="button"
              onClick={() => setSaveTarget("goal")}
              disabled={goals.length === 0}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                saveTarget === "goal"
                  ? "border-[#FF4000] bg-[#FF4000]/10 text-[#FF4000]"
                  : goals.length === 0
                    ? "border-[#1e1e1e] text-[#525252] opacity-50 cursor-not-allowed"
                    : "border-[#1e1e1e] text-[#737373] hover:border-[#2a2a2a] hover:text-[#e8e8e8]"
              }`}
            >
              <span className="block text-sm mb-0.5">Put Toward a Goal</span>
              <span className="block text-[10px] opacity-70">
                {goals.length === 0 ? "No active goals" : `${goals.length} goal${goals.length > 1 ? "s" : ""} available`}
              </span>
            </button>
          </div>

          {saveTarget === "goal" && goals.length > 0 && (
            <div className="space-y-3">
              {goals.map((g) => {
                const pctDone = Number(g.target_amount) > 0
                  ? Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100)
                  : 0;
                const remaining = Math.max(0, Number(g.target_amount) - Number(g.current_amount));
                const isSelected = selectedGoalId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGoalId(g.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? "border-[#FF4000] bg-[#FF4000]/5"
                        : "border-[#1e1e1e] hover:border-[#2a2a2a]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-[#e8e8e8]">{g.name}</span>
                      <span className="text-[10px] text-[#525252]">{Math.round(pctDone)}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-[#1e1e1e] overflow-hidden mb-1.5">
                      <div className="h-full rounded-full bg-[#FF4000] transition-all" style={{ width: `${pctDone}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#525252]">{fmt(remaining)} remaining</span>
                      {isSelected && saveAmount > 0 && (
                        <span className="text-[10px] font-medium text-[#10b981]">+{fmt(saveAmount)} today</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AI reasoning */}
      {reasoning && (
        <div className="rounded-xl bg-[#0d0d0d] border border-[#1e1e1e] p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg className="w-3.5 h-3.5 text-[#FF4000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-[10px] font-medium text-[#FF4000]">AI Insight</span>
          </div>
          <p className="text-xs text-[#a3a3a3] leading-relaxed">{reasoning}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={acceptAllocation}
          disabled={accepting}
          className="btn-primary flex-1"
        >
          {accepting ? "Saving…" : "Accept allocation"}
        </button>
        <button
          type="button"
          onClick={() => onDone?.()}
          className="btn-ghost"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
