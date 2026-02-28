"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type StoredAdvice = {
  achievable: boolean;
  advice: string;
  monthly_needed: number;
  created_at: string;
};

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
  latest_advice?: StoredAdvice | null;
};

function sortGoals(goals: Goal[]): Goal[] {
  const now = new Date();
  return [...goals].sort((a, b) => {
    const pctA = Number(a.target_amount) > 0 ? (Number(a.current_amount) / Number(a.target_amount)) * 100 : 0;
    const pctB = Number(b.target_amount) > 0 ? (Number(b.current_amount) / Number(b.target_amount)) * 100 : 0;
    if (pctA >= 100 && pctB < 100) return 1;
    if (pctA < 100 && pctB >= 100) return -1;
    if (pctA >= 100 && pctB >= 100) return 0;
    const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    if (deadlineA !== deadlineB) return deadlineA - deadlineB;
    return 0;
  });
}

function monthsLeft(deadline: string | null | undefined): number | null {
  if (!deadline) return null;
  const end = new Date(deadline);
  const now = new Date();
  if (end <= now) return 0;
  return (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
}

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

  const [adviceLoading, setAdviceLoading] = useState<Record<string, boolean>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributing, setContributing] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/v1/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/v1/goals").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([me, goals]) => {
        if (me?.preferred_currency) setCurrency(me.preferred_currency);
        setList(Array.isArray(goals) ? goals : []);
      })
      .catch(() => toast.error("Failed to load goals"))
      .finally(() => setPageLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const sortedList = sortGoals(list);
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

  const handleDeleteClick = (id: string) => setDeleteConfirmId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/goals/${deleteConfirmId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Goal deleted");
      setDeleteConfirmId(null);
      load();
    } catch {
      toast.error("Failed to delete goal");
    } finally {
      setDeleting(false);
    }
  };

  const fetchAdvice = async (id: string) => {
    setAdviceLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/v1/goals/${id}/advice`);
      if (!res.ok) throw new Error("Failed");
      toast.success("Advice updated");
      load();
    } catch {
      toast.error("Could not get advice. Try again later.");
    } finally {
      setAdviceLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleContribute = async (e: React.FormEvent, goal: Goal) => {
    e.preventDefault();
    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    setContributing(true);
    try {
      const newCurrent = Number(goal.current_amount) + amount;
      const res = await fetch(`/api/v1/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_amount: newCurrent }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Added ${formatCurrency(amount, currency)} to ${goal.name}`);
      setContributingId(null);
      setContributeAmount("");
      load();
    } catch {
      toast.error("Failed to add to goal");
    } finally {
      setContributing(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#e8e8e8]">Goals</h1>
          <p className="text-[#737373] text-sm mt-0.5">Save for what matters — track progress and get tailored advice</p>
        </div>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn-primary">
          + Create goal
        </button>
      </div>

      {list.length > 0 && (
        <div className="card">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Overall progress</p>
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
      )}

      <div className="space-y-4">
        {sortedList.length === 0 ? (
          <div className="card text-center">
            <div className="p-10">
              <div className="w-12 h-12 rounded-full bg-[#FF4000]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#FF4000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-[#e8e8e8] mb-1">No goals yet</h2>
              <p className="text-sm text-[#737373] mb-6 max-w-sm mx-auto">
                Create a savings goal (emergency fund, vacation, down payment) and get AI advice on how to reach it.
              </p>
              <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn-primary">
                Create your first goal
              </button>
            </div>
          </div>
        ) : (
          sortedList.map((g) => {
            const target = Number(g.target_amount);
            const current = Number(g.current_amount);
            const remaining = Math.max(0, target - current);
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
            const isComplete = pct >= 100;
            const ml = monthsLeft(g.deadline ?? null);
            const computedMonthly = ml !== null && ml > 0 ? remaining / ml : null;
            const stored = g.latest_advice;
            const monthlyNeeded = stored?.monthly_needed ?? computedMonthly;

            return (
              <div key={g.id} className="card">
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-base text-[#e8e8e8] font-medium">
                        {isComplete && <span className="text-[#10b981] mr-1">✓</span>}
                        {g.name}
                      </p>
                      <p className="text-sm text-[#525252] mt-0.5">
                        {formatCurrency(current, currency)} of {formatCurrency(target, currency)}
                        {g.deadline ? ` · Due ${g.deadline}` : ""}
                        {ml !== null && ml > 0 && !isComplete && (
                          <span className="text-[#737373]"> · {ml} months left</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(g)} className="w-8 h-8 rounded-md text-[#525252] hover:text-[#e8e8e8] hover:bg-[#191919] flex items-center justify-center" title="Edit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDeleteClick(g.id)} className="w-8 h-8 rounded-md text-[#525252] hover:text-[#ef4444] hover:bg-[#ef4444]/10 flex items-center justify-center" title="Delete">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                      <span className={`text-xl font-bold ${isComplete ? "text-[#10b981]" : "text-[#FF4000]"}`}>
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

                  {!isComplete && (
                    <>
                      {monthlyNeeded != null && monthlyNeeded > 0 && (
                        <p className="mt-3 text-sm text-[#e8e8e8]">
                          <span className="text-[#737373]">To reach on time: </span>
                          <span className="font-medium text-[#FF4000]">{formatCurrency(monthlyNeeded, currency)}/month</span>
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {contributingId === g.id ? (
                          <form onSubmit={(e) => handleContribute(e, g)} className="flex flex-wrap items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="Amount"
                              className="input-field w-28 text-sm"
                              value={contributeAmount}
                              onChange={(e) => setContributeAmount(e.target.value)}
                              autoFocus
                            />
                            <button type="submit" disabled={contributing} className="btn-primary text-sm py-1.5">
                              {contributing ? "Adding…" : "Add"}
                            </button>
                            <button type="button" onClick={() => { setContributingId(null); setContributeAmount(""); }} className="btn-ghost text-sm py-1.5">
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <button onClick={() => { setContributingId(g.id); setContributeAmount(""); }} className="btn-secondary text-sm py-1.5">
                            + Add to goal
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {stored ? (
                    <div className={`mt-4 p-4 rounded-lg border text-sm ${stored.achievable ? "border-[#10b981]/30 bg-[#10b981]/5" : "border-[#f59e0b]/30 bg-[#f59e0b]/5"}`}>
                      <p className="text-[#e8e8e8] leading-relaxed">{stored.advice}</p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        {stored.monthly_needed > 0 && (
                          <span className="font-medium text-[#FF4000]">Save {formatCurrency(stored.monthly_needed, currency)}/month</span>
                        )}
                        <span className="text-xs text-[#525252]">
                          Advice from {new Date(stored.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => fetchAdvice(g.id)}
                          disabled={adviceLoading[g.id]}
                          className="text-xs text-[#FF4000] hover:underline disabled:opacity-50"
                        >
                          {adviceLoading[g.id] ? "Refreshing…" : "Refresh advice"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <button
                        onClick={() => fetchAdvice(g.id)}
                        disabled={adviceLoading[g.id]}
                        className="text-sm text-[#FF4000] hover:underline disabled:opacity-50"
                      >
                        {adviceLoading[g.id] ? "Getting advice…" : "Get AI advice for this goal"}
                      </button>
                      <p className="text-xs text-[#525252] mt-1">Personalized tips based on your income, expenses, and deadlines. Stored so you can revisit anytime.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

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

      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete goal"
        message="Delete this goal? Progress will be lost. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
