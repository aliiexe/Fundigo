"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatCurrency, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currency";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { SearchInput } from "@/components/ui/SearchInput";
import { AllocationWidget } from "../AllocationWidget";

type Income = { id: string; name: string; amount: number; frequency: string; currency?: string; note?: string; created_at?: string };

const FREQ_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "irregular", label: "Irregular" },
];

const FREQ_LABELS: Record<string, string> = Object.fromEntries(FREQ_OPTIONS.map((o) => [o.value, o.label]));

const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.code} — ${c.name}` }));

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

export default function IncomePage() {
  const [list, setList] = useState<Income[]>([]);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [allocationOpen, setAllocationOpen] = useState(false);
  const [allocationAmount, setAllocationAmount] = useState(0);

  const [editItem, setEditItem] = useState<Income | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editFrequency, setEditFrequency] = useState("monthly");
  const [editNote, setEditNote] = useState("");

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/v1/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/v1/income").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([me, incomes]) => {
        if (me?.preferred_currency) setCurrency(me.preferred_currency);
        setList(incomes);
      })
      .catch(() => toast.error("Failed to load income data"))
      .finally(() => setPageLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const [mY, mM] = month.split("-").map(Number);

  const visibleForMonth = list.filter((i) => {
    if (i.frequency !== "irregular") return true;
    if (!i.created_at) return false;
    const d = new Date(i.created_at);
    return d.getFullYear() === mY && d.getMonth() + 1 === mM;
  });

  const recurringMonthly = visibleForMonth.reduce((sum, i) => {
    if (i.frequency === "irregular") return sum;
    if (i.frequency === "monthly") return sum + Number(i.amount);
    if (i.frequency === "yearly") return sum + Number(i.amount) / 12;
    if (i.frequency === "weekly") return sum + Number(i.amount) * 4.33;
    if (i.frequency === "biweekly") return sum + Number(i.amount) * 2.17;
    return sum;
  }, 0);
  const irregularTotal = visibleForMonth.reduce((sum, i) => i.frequency === "irregular" ? sum + Number(i.amount) : sum, 0);
  const totalMonthly = recurringMonthly + irregularTotal;

  const filtered = visibleForMonth.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.note && i.note.toLowerCase().includes(search.toLowerCase()))
  );

  const resetForm = () => { setName(""); setAmount(""); setNote(""); setFrequency("monthly"); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!name.trim() || isNaN(num) || num <= 0) { toast.error("Please fill in name and amount"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), amount: num, frequency, note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed to add income");
      toast.success("Income source added");
      const addedAmount = num;
      resetForm();
      setModalOpen(false);
      load();
      setAllocationAmount(addedAmount);
      setAllocationOpen(true);
    } catch {
      toast.error("Failed to add income");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item: Income) => {
    setEditItem(item);
    setEditName(item.name);
    setEditAmount(String(item.amount));
    setEditFrequency(item.frequency);
    setEditNote(item.note || "");
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const num = parseFloat(editAmount);
    if (!editName.trim() || isNaN(num) || num <= 0) { toast.error("Please fill in name and amount"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/income/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), amount: num, frequency: editFrequency, note: editNote.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed to update income");
      toast.success("Income source updated");
      setEditModalOpen(false);
      setEditItem(null);
      load();
    } catch {
      toast.error("Failed to update income");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (!confirm(`Delete "${itemName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/v1/income/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete income");
      toast.success("Income source deleted");
      load();
    } catch {
      toast.error("Failed to delete income");
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
          <h1 className="text-2xl font-semibold text-[#e8e8e8]">Income</h1>
          <p className="text-[#737373] text-sm mt-0.5">Manage your income sources</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} />
          <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn-primary">
            + Add income
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <div className="p-5">
            <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Total Income</p>
            <p className="text-2xl font-semibold text-[#10b981] mt-2">{formatCurrency(totalMonthly, currency)}</p>
            <p className="text-[#525252] text-xs mt-1">
              {recurringMonthly > 0 && `${formatCurrency(recurringMonthly, currency)} recurring`}
              {recurringMonthly > 0 && irregularTotal > 0 && " + "}
              {irregularTotal > 0 && `${formatCurrency(irregularTotal, currency)} irregular`}
              {recurringMonthly === 0 && irregularTotal === 0 && "No income yet"}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="p-5">
            <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Sources This Month</p>
            <p className="text-2xl font-semibold text-[#e8e8e8] mt-2">{visibleForMonth.length}</p>
            <p className="text-[#525252] text-xs mt-1">
              {visibleForMonth.filter((i) => i.frequency === "irregular").length} irregular · {visibleForMonth.filter((i) => i.frequency !== "irregular").length} recurring
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <SearchInput value={search} onChange={setSearch} placeholder="Search income sources…" />

      {/* List */}
      <div className="card">
        <div className="px-5 py-4 border-b border-[#1e1e1e]">
          <h2 className="text-base font-medium text-[#e8e8e8]">Your income sources</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[#525252] text-sm">{search ? "No matches found." : "No income sources for this month."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#1e1e1e]">
            {filtered.map((i) => (
              <li key={i.id} className="px-5 py-4 flex items-center justify-between group hover:bg-[#0a0a0a] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                    <span className="text-[#10b981] text-xs">↑</span>
                  </div>
                  <div>
                    <p className="text-sm text-[#e8e8e8] font-medium">{i.name}</p>
                    <p className="text-xs text-[#525252]">
                      {FREQ_LABELS[i.frequency] || i.frequency}
                      {i.frequency === "irregular" && i.created_at
                        ? ` · ${new Date(i.created_at).toLocaleDateString("default", { month: "short", day: "numeric" })}`
                        : ""}
                      {i.note ? ` · ${i.note}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(i)} className="w-7 h-7 rounded-md text-[#525252] hover:text-[#e8e8e8] hover:bg-[#191919] transition-all flex items-center justify-center" title="Edit">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(i.id, i.name)} className="w-7 h-7 rounded-md text-[#525252] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all flex items-center justify-center" title="Delete">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <span className="text-sm font-medium text-[#10b981]">
                    +{formatCurrency(Number(i.amount), currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add income source">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Name</span>
              <input type="text" className="input-field" placeholder="e.g. Salary" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Amount ({currency})</span>
              <input type="number" step="0.01" min="0" className="input-field" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </label>
            <Dropdown
              label="Frequency"
              options={FREQ_OPTIONS}
              value={frequency}
              onChange={setFrequency}
            />
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Note (optional)</span>
              <input type="text" className="input-field" placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Adding…" : "Add income"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit income source">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Name</span>
              <input type="text" className="input-field" placeholder="e.g. Salary" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Amount ({currency})</span>
              <input type="number" step="0.01" min="0" className="input-field" placeholder="0.00" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required />
            </label>
            <Dropdown
              label="Frequency"
              options={FREQ_OPTIONS}
              value={editFrequency}
              onChange={setEditFrequency}
            />
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Note (optional)</span>
              <input type="text" className="input-field" placeholder="Optional" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Smart Allocation Modal */}
      <Modal open={allocationOpen} onClose={() => setAllocationOpen(false)} title="Smart Allocation" wide>
        <AllocationWidget
          amount={allocationAmount}
          currency={currency}
          onDone={() => { setAllocationOpen(false); load(); }}
        />
      </Modal>
    </div>
  );
}
