"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatCurrency, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currency";
import { convertSync } from "@/lib/exchange";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { SearchInput } from "@/components/ui/SearchInput";

type Expense = { id: string; merchant: string; amount: number; currency: string; category?: string; date: string };

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

export default function ExpensesPage() {
  const [list, setList] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCurrency, setEditCurrency] = useState(DEFAULT_CURRENCY);
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const [rates, setRates] = useState<Record<string, number>>({});

  const load = useCallback(() => {
    setPageLoading(true);
    Promise.all([
      fetch("/api/v1/me").then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/v1/expenses/list?month=${month}`).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v1/rates").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([me, expenses, ratesData]) => {
        if (me?.preferred_currency) setCurrency(me.preferred_currency);
        if (ratesData?.rates) setRates(ratesData.rates);
        setList(expenses);
      })
      .catch(() => toast.error("Failed to load expenses"))
      .finally(() => setPageLoading(false));
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const cx = (amt: number, from: string) =>
    Object.keys(rates).length > 0 ? convertSync(amt, from, currency, rates) : amt;

  const totalMonth = list.reduce((s, e) => s + cx(e.amount, e.currency), 0);
  const monthLabel = new Date(Number(month.split("-")[0]), Number(month.split("-")[1]) - 1).toLocaleString("default", { month: "long", year: "numeric" });

  const filtered = list.filter((e) =>
    e.merchant.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByDate = filtered.reduce<Record<string, Expense[]>>((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  const resetForm = () => { setMerchant(""); setAmount(""); setCategory(""); setDate(new Date().toISOString().slice(0, 10)); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!merchant.trim() || isNaN(num) || num <= 0) { toast.error("Please fill in merchant and amount"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/expenses/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: merchant.trim(),
          amount: num,
          currency,
          category: category.trim() || undefined,
          date: date || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to add expense");
      toast.success("Expense added");
      resetForm();
      setModalOpen(false);
      load();
    } catch {
      toast.error("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item: Expense) => {
    setEditItem(item);
    setEditMerchant(item.merchant);
    setEditAmount(String(item.amount));
    setEditCurrency(item.currency);
    setEditDate(item.date);
    setEditCategory(item.category || "");
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const num = parseFloat(editAmount);
    if (!editMerchant.trim() || isNaN(num) || num <= 0) { toast.error("Please fill in merchant and amount"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/expenses/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: editMerchant.trim(),
          amount: num,
          currency: editCurrency,
          category: editCategory.trim() || undefined,
          date: editDate || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update expense");
      toast.success("Expense updated");
      setEditModalOpen(false);
      setEditItem(null);
      load();
    } catch {
      toast.error("Failed to update expense");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (!confirm(`Delete "${itemName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/v1/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");
      toast.success("Expense deleted");
      load();
    } catch {
      toast.error("Failed to delete expense");
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
          <h1 className="text-2xl font-semibold text-[#e8e8e8]">Expenses</h1>
          <p className="text-[#737373] text-sm mt-0.5">Track where your money goes</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} />
          <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn-primary">
            + Add expense
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <div className="p-5">
          <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Total Spent</p>
          <p className="text-2xl font-semibold text-[#ef4444] mt-2">{formatCurrency(totalMonth, currency)}</p>
          <p className="text-[#525252] text-xs mt-1">{list.length} transactions in {monthLabel}</p>
        </div>
      </div>

      {/* Search */}
      <SearchInput value={search} onChange={setSearch} placeholder="Search expenses…" />

      {/* Grouped list */}
      <div className="card">
        <div className="px-5 py-4 border-b border-[#1e1e1e]">
          <h2 className="text-base font-medium text-[#e8e8e8]">Transactions</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[#525252] text-sm">{search ? "No matches found." : "No expenses this month."}</p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([dateKey, items]) => (
                <div key={dateKey}>
                  <div className="px-5 py-2 bg-[#0a0a0a]">
                    <span className="text-xs font-medium text-[#525252]">
                      {new Date(dateKey + "T00:00:00").toLocaleDateString("default", { weekday: "long", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <ul className="divide-y divide-[#1e1e1e]">
                    {items.map((exp) => (
                      <li key={exp.id} className="px-5 py-3.5 flex items-center justify-between group hover:bg-[#0a0a0a] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 flex items-center justify-center">
                            <span className="text-[#ef4444] text-xs">↓</span>
                          </div>
                          <p className="text-sm text-[#e8e8e8] font-medium">{exp.merchant}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(exp)} className="w-7 h-7 rounded-md text-[#525252] hover:text-[#e8e8e8] hover:bg-[#191919] transition-all flex items-center justify-center" title="Edit">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(exp.id, exp.merchant)} className="w-7 h-7 rounded-md text-[#525252] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all flex items-center justify-center" title="Delete">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                          <span className="text-sm font-medium text-[#ef4444]">-{formatCurrency(cx(exp.amount, exp.currency), currency)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Merchant</span>
              <input type="text" className="input-field" placeholder="e.g. Grocery store" value={merchant} onChange={(e) => setMerchant(e.target.value)} required />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Amount</span>
              <input type="number" step="0.01" min="0" className="input-field" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </label>
            <Dropdown
              label="Currency"
              options={currencyOptions}
              value={currency}
              onChange={setCurrency}
            />
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Category (optional)</span>
              <input type="text" className="input-field" placeholder="e.g. Food, Transport" value={category} onChange={(e) => setCategory(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Date</span>
              <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Adding…" : "Add expense"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit expense">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Merchant</span>
              <input type="text" className="input-field" placeholder="e.g. Grocery store" value={editMerchant} onChange={(e) => setEditMerchant(e.target.value)} required />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Amount</span>
              <input type="number" step="0.01" min="0" className="input-field" placeholder="0.00" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required />
            </label>
            <Dropdown
              label="Currency"
              options={currencyOptions}
              value={editCurrency}
              onChange={setEditCurrency}
            />
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Category (optional)</span>
              <input type="text" className="input-field" placeholder="e.g. Food, Transport" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Date</span>
              <input type="date" className="input-field" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
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
    </div>
  );
}
