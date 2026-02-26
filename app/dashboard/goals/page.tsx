"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { Modal } from "@/components/ui/Modal";

type Goal = { id: string; name: string; target_amount: number; current_amount: number; deadline?: string };
type Advice = { achievable: boolean; advice: string; monthly_needed: number };

export default function GoalsPage() {
  const [list, setList] = useState<Goal[]>([]);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [advice, setAdvice] = useState<Record<string, Advice>>({});
  const [adviceLoading, setAdviceLoading] = useState<Record<string, boolean>>({});

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/v1/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/v1/goals").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([me, goals]) => {
        if (me?.preferred_currency) setCurrency(me.preferred_currency);
        setList(goals);
      })
      .catch(() => toast.error("Failed to load goals"))
      .finally(() => setPageLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalTarget = list.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalCurrent = list.reduce((s, g) => s + Number(g.current_amount), 0);
  const overallPct = totalTarget > 0 ? Math.min(100, (totalCurrent / totalTarget) * 100) : 0;

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setTargetAmount("");
    setCurrentAmount("");
    setDeadline("");
  };

  const openEdit = (g: Goal) => {
    setEditingId(g.id);
    setName(g.name);
    setTargetAmount(String(g.target_amount));
    setCurrentAmount(String(g.current_amount));
    setDeadline(g.deadline ?? "");
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    try {
      const res = await fetch(`/api/v1/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Goal deleted");
      setAdvice((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      load();
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  const fetchAdvice = async (id: string) => {
    setAdviceLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/v1/goals/${id}/advice`);
      if (!res.ok) throw new Error("Failed");
      const data: Advice = await res.json();
      setAdvice((prev) => ({ ...prev, [id]: data }));
    } catch {
      toast.error("Failed to get AI advice");
    } finally {
      setAdviceLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const current = currentAmount ? parseFloat(currentAmount) : 0;
    if (!name.trim() || isNaN(target) || target <= 0) {
      toast.error("Please fill in goal name and target");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        target_amount: target,
        current_amount: current,
        deadline: deadline.trim() || undefined,
      };

      if (editingId) {
        const res = await fetch(`/api/v1/goals/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Goal updated");
      } else {
        const res = await fetch("/api/v1/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Goal created");
      }

      resetForm();
      setModalOpen(false);
      load();
    } catch {
      toast.error(editingId ? "Failed to update goal" : "Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#e8e8e8]">Goals</h1>
          <p className="text-[#737373] text-sm mt-0.5">Set targets and track your progress</p>
        </div>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn-primary">
          + Create goal
        </button>
      </div>

      {/* Overall progress */}
      <div className="card">
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Overall Progress</p>
              <p className="text-xl font-semibold text-[#e8e8e8] mt-1">
                {formatCurrency(totalCurrent, currency)}{" "}
                <span className="text-[#525252] text-sm font-normal">of {formatCurrency(totalTarget, currency)}</span>
              </p>
            </div>
            <span className="text-2xl font-bold text-[#FF4000]">{Math.round(overallPct)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#1e1e1e] overflow-hidden">
            <div className="h-full rounded-full bg-[#FF4000] transition-all duration-700" style={{ width: `${overallPct}%` }} />
          </div>
        </div>
      </div>

      {/* Goal cards */}
      <div className="space-y-4">
        {list.length === 0 ? (
          <div className="card">
            <div className="p-8 text-center">
              <p className="text-[#525252] text-sm">No goals yet. Create one to start tracking.</p>
            </div>
          </div>
        ) : (
          list.map((g) => {
            const pct = Number(g.target_amount) > 0 ? Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100) : 0;
            const isComplete = pct >= 100;
            return (
              <div key={g.id} className="card">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-[#e8e8e8] font-medium">
                        {isComplete && <span className="text-[#10b981] mr-1">✓</span>}
                        {g.name}
                      </p>
                      <p className="text-xs text-[#525252] mt-0.5">
                        {formatCurrency(Number(g.current_amount), currency)} of {formatCurrency(Number(g.target_amount), currency)}
                        {g.deadline ? ` · Due ${g.deadline}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(g)} className="w-7 h-7 rounded-md text-[#525252] hover:text-[#e8e8e8] hover:bg-[#191919] transition-all flex items-center justify-center" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(g.id)} className="w-7 h-7 rounded-md text-[#525252] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all flex items-center justify-center" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                      <span className={`text-lg font-bold ${isComplete ? "text-[#10b981]" : "text-[#FF4000]"}`}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[#1e1e1e] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-[#10b981]" : "bg-[#FF4000]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => fetchAdvice(g.id)} className="text-xs text-[#FF4000] hover:underline">
                      {adviceLoading[g.id] ? "Thinking…" : "Get AI advice"}
                    </button>
                  </div>
                  {advice[g.id] && (
                    <div className={`mt-3 p-3 rounded-lg border text-xs ${advice[g.id].achievable ? "border-[#10b981]/30 bg-[#10b981]/5" : "border-[#f59e0b]/30 bg-[#f59e0b]/5"}`}>
                      <p className="text-[#e8e8e8]">{advice[g.id].advice}</p>
                      <p className="mt-1 font-medium text-[#FF4000]">Save {formatCurrency(advice[g.id].monthly_needed, currency)}/month</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit goal" : "Create goal"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Goal name</span>
              <input type="text" className="input-field" placeholder="e.g. Emergency fund" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Target amount ({currency})</span>
              <input type="number" step="0.01" min="0" className="input-field" placeholder="0.00" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Current amount</span>
              <input type="number" step="0.01" min="0" className="input-field" placeholder="0.00" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Deadline (optional)</span>
              <input type="date" className="input-field" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (editingId ? "Saving…" : "Creating…") : (editingId ? "Save changes" : "Create goal")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
