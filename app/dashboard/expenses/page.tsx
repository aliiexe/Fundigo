"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatCurrency, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currency";
import { convertSync } from "@/lib/exchange";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dropdown } from "@/components/ui/Dropdown";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  EXPENSE_CATEGORY_OTHER,
  categoryFormFromStored,
  categoryForAddSubmit,
  categoryForEditSubmit,
  expenseCategoryDropdownOptions,
} from "@/lib/expenseCategories";

type Expense = { id: string; merchant: string; amount: number; currency: string; category?: string; date: string };

function CategoryPickFields({
  mode,
  preset,
  custom,
  onPreset,
  onCustom,
}: {
  mode: "add" | "edit";
  preset: string;
  custom: string;
  onPreset: (v: string) => void;
  onCustom: (v: string) => void;
}) {
  return (
    <>
      <Dropdown
        label="Category"
        options={expenseCategoryDropdownOptions(mode)}
        value={preset}
        onChange={onPreset}
        placeholder="Select…"
      />
      {preset === EXPENSE_CATEGORY_OTHER && (
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-[#737373]">Custom category</span>
          <input
            type="text"
            className="input-field mt-1.5"
            placeholder="e.g. Pet care, Subscriptions"
            value={custom}
            onChange={(e) => onCustom(e.target.value)}
            autoComplete="off"
          />
        </label>
      )}
    </>
  );
}

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
  const [categoryPreset, setCategoryPreset] = useState("");
  const [categoryCustom, setCategoryCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; itemName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCurrency, setEditCurrency] = useState(DEFAULT_CURRENCY);
  const [editDate, setEditDate] = useState("");
  const [editCategoryPreset, setEditCategoryPreset] = useState("");
  const [editCategoryCustom, setEditCategoryCustom] = useState("");

  const [rates, setRates] = useState<Record<string, number>>({});
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanParsed, setScanParsed] = useState<{
    merchant: string;
    amount: number;
    date: string;
    currency: string;
    items: string[];
  } | null>(null);
  const [scanMerchant, setScanMerchant] = useState("");
  const [scanAmount, setScanAmount] = useState("");
  const [scanDate, setScanDate] = useState("");
  const [scanCurrency, setScanCurrency] = useState(DEFAULT_CURRENCY);
  const [scanCategoryPreset, setScanCategoryPreset] = useState("");
  const [scanCategoryCustom, setScanCategoryCustom] = useState("");

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

  const q = search.toLowerCase();
  const filtered = list.filter(
    (e) =>
      e.merchant.toLowerCase().includes(q) ||
      (e.category?.toLowerCase().includes(q) ?? false)
  );

  const groupedByDate = filtered.reduce<Record<string, Expense[]>>((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  const resetForm = () => {
    setMerchant("");
    setAmount("");
    setCategoryPreset("");
    setCategoryCustom("");
    setDate(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!merchant.trim() || isNaN(num) || num <= 0) { toast.error("Please fill in merchant and amount"); return; }
    if (categoryPreset === EXPENSE_CATEGORY_OTHER && !categoryCustom.trim()) {
      toast.error("Enter a custom category or choose another option.");
      return;
    }
    setLoading(true);
    try {
      const cat = categoryForAddSubmit(categoryPreset, categoryCustom);
      const res = await fetch("/api/v1/expenses/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: merchant.trim(),
          amount: num,
          currency,
          ...(cat !== undefined ? { category: cat } : {}),
          date: date || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || data.details?.formErrors?.[0] || "Failed to add expense");
        return;
      }
      toast.success("Expense added");
      resetForm();
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error(err);
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
    const cf = categoryFormFromStored(item.category);
    setEditCategoryPreset(cf.preset);
    setEditCategoryCustom(cf.custom);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const num = parseFloat(editAmount);
    if (!editMerchant.trim() || isNaN(num) || num <= 0) { toast.error("Please fill in merchant and amount"); return; }
    if (editCategoryPreset === EXPENSE_CATEGORY_OTHER && !editCategoryCustom.trim()) {
      toast.error("Enter a custom category, or choose “No category” or a preset.");
      return;
    }
    setLoading(true);
    try {
      const category = categoryForEditSubmit(editCategoryPreset, editCategoryCustom);
      const res = await fetch(`/api/v1/expenses/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: editMerchant.trim(),
          amount: num,
          currency: editCurrency,
          category,
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

  const handleScanFile = async (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please use a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    setScanError(null);
    setScanParsed(null);
    setScanLoading(true);
    try {
      const formData = new FormData();
      formData.set("image", file);
      const res = await fetch("/api/v1/expenses/receipt/parse", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setScanError(data.error || "Upload failed. Try again.");
        return;
      }
      if (data.parsed) {
        setScanParsed(data.parsed);
        setScanMerchant(data.parsed.merchant);
        setScanAmount(String(data.parsed.amount));
        setScanDate(data.parsed.date);
        setScanCurrency(data.parsed.currency || currency);
        setScanCategoryPreset("");
        setScanCategoryCustom("");
      } else {
        setScanError(data.error || "Something went wrong. You can still add the expense manually below.");
      }
    } catch {
      setScanError("Upload failed. Try again.");
    } finally {
      setScanLoading(false);
    }
  };

  const toYYYYMMDD = (s: string): string | undefined => {
    if (!s?.trim()) return undefined;
    const trimmed = s.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) {
      const [, mm, dd, yy] = m;
      const year = yy!.length === 2 ? `20${yy}` : yy!;
      return `${year}-${mm!.padStart(2, "0")}-${dd!.padStart(2, "0")}`;
    }
    return undefined;
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(scanAmount);
    if (!scanMerchant.trim()) {
      toast.error("Please enter a merchant name.");
      return;
    }
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter an amount greater than 0.");
      return;
    }
    if (scanCategoryPreset === EXPENSE_CATEGORY_OTHER && !scanCategoryCustom.trim()) {
      toast.error("Enter a custom category or choose another option.");
      return;
    }
    const dateVal = toYYYYMMDD(scanDate);
    setLoading(true);
    try {
      const cat = categoryForAddSubmit(scanCategoryPreset, scanCategoryCustom);
      const body: Record<string, unknown> = {
        merchant: scanMerchant.trim(),
        amount: num,
        currency: scanCurrency,
        date: dateVal ?? new Date().toISOString().slice(0, 10),
      };
      if (cat !== undefined) body.category = cat;
      if (scanParsed?.items?.length) {
        body.raw_text = JSON.stringify({ source: "scan", items: scanParsed.items });
      }
      const res = await fetch("/api/v1/expenses/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || data.details?.formErrors?.[0] || "Failed to add expense";
        toast.error(msg);
        return;
      }
      toast.success("Expense added from receipt.");
      setScanModalOpen(false);
      setScanParsed(null);
      setScanMerchant("");
      setScanAmount("");
      setScanDate("");
      setScanCategoryPreset("");
      setScanCategoryCustom("");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add expense. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const closeScanModal = () => {
    setScanModalOpen(false);
    setScanError(null);
    setScanParsed(null);
    setScanLoading(false);
  };

  const handleDeleteClick = (id: string, itemName: string) => {
    setDeleteConfirm({ id, itemName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/expenses/${deleteConfirm.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");
      toast.success("Expense deleted");
      setDeleteConfirm(null);
      load();
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setDeleting(false);
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
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#e8e8e8]">Expenses</h1>
          <p className="text-[#737373] text-sm mt-0.5">Track where your money goes</p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-center sm:justify-start order-first sm:order-none">
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          <button
            type="button"
            onClick={() => setScanModalOpen(true)}
            className="btn-secondary flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-4 py-2.5"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
            </svg>
            Scan receipt
          </button>
          <button
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="btn-primary flex items-center justify-center min-h-[44px] sm:min-h-0 px-4 py-2.5"
          >
            + Add expense
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <div className="p-4 sm:p-5">
          <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Total Spent</p>
          <p className="text-2xl font-semibold text-[#ef4444] mt-2">{formatCurrency(totalMonth, currency)}</p>
          <p className="text-[#525252] text-xs mt-1">{list.length} transactions in {monthLabel}</p>
        </div>
      </div>

      {/* Search */}
      <SearchInput value={search} onChange={setSearch} placeholder="Search expenses…" />

      {/* Grouped list */}
      <div className="card">
        <div className="px-4 sm:px-5 py-4 border-b border-[#1e1e1e]">
          <h2 className="text-base font-medium text-[#e8e8e8]">Transactions</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 sm:px-5 py-8 text-center">
            <p className="text-[#525252] text-sm">{search ? "No matches found." : "No expenses this month."}</p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([dateKey, items]) => (
                <div key={dateKey}>
                  <div className="px-4 sm:px-5 py-2 bg-[#0a0a0a] flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[#525252]">
                      {new Date(dateKey + "T00:00:00").toLocaleDateString("default", { weekday: "long", month: "short", day: "numeric" })}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-[#525252] font-semibold whitespace-nowrap">
                        Day total
                      </span>
                      <span className="text-xs font-medium tabular-nums text-[#a3a3a3] rounded-md bg-[#141414] border border-[#262626] px-2 py-1">
                        -{formatCurrency(items.reduce((s, e) => s + cx(e.amount, e.currency), 0), currency)}
                      </span>
                    </div>
                  </div>
                  <ul className="divide-y divide-[#1e1e1e]">
                    {items.map((exp) => (
                      <li key={exp.id} className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 group hover:bg-[#0a0a0a] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 shrink-0 rounded-lg bg-[#ef4444]/10 flex items-center justify-center">
                            <span className="text-[#ef4444] text-xs">↓</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-[#e8e8e8] font-medium truncate">{exp.merchant}</p>
                            {exp.category ? (
                              <p className="text-xs text-[#525252] truncate mt-0.5">{exp.category}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => openEdit(exp)} className="w-9 h-9 sm:w-7 sm:h-7 rounded-md text-[#525252] hover:text-[#e8e8e8] hover:bg-[#191919] transition-all flex items-center justify-center touch-manipulation" title="Edit">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDeleteClick(exp.id, exp.merchant)} className="w-9 h-9 sm:w-7 sm:h-7 rounded-md text-[#525252] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all flex items-center justify-center touch-manipulation" title="Delete">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                          <span className="text-sm font-medium text-[#ef4444] shrink-0">-{formatCurrency(cx(exp.amount, exp.currency), currency)}</span>
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
            <CategoryPickFields
              mode="add"
              preset={categoryPreset}
              custom={categoryCustom}
              onPreset={setCategoryPreset}
              onCustom={setCategoryCustom}
            />
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
            <CategoryPickFields
              mode="edit"
              preset={editCategoryPreset}
              custom={editCategoryCustom}
              onPreset={setEditCategoryPreset}
              onCustom={setEditCategoryCustom}
            />
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

      {/* Scan receipt / document modal */}
      <Modal open={scanModalOpen} onClose={closeScanModal} title="Scan receipt or document" wide>
        {!scanParsed ? (
          <div className="space-y-4">
            <p className="text-sm text-[#737373]">
              Take a picture or upload a photo of a receipt, invoice, or bill. We'll extract whatever we can (merchant, amount, date) for you to review and edit.
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              id="scan-file-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleScanFile(f);
                e.target.value = "";
              }}
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              capture="environment"
              className="hidden"
              id="scan-camera-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleScanFile(f);
                e.target.value = "";
              }}
            />
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${scanLoading ? "pointer-events-none opacity-60" : ""}`}>
              <label
                htmlFor="scan-camera-input"
                className="flex items-center justify-center gap-3 border-2 border-[#404040] rounded-xl p-5 sm:p-6 min-h-[120px] sm:min-h-0 cursor-pointer hover:border-[#FF4000]/50 hover:bg-[#0a0a0a] transition-colors touch-manipulation active:bg-[#0a0a0a]"
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-[#FF4000]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#FF4000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#e8e8e8]">Take a picture</span>
              </label>
              <label
                htmlFor="scan-file-input"
                className="flex items-center justify-center gap-3 border-2 border-dashed border-[#404040] rounded-xl p-5 sm:p-6 min-h-[120px] sm:min-h-0 cursor-pointer hover:border-[#FF4000]/50 hover:bg-[#0a0a0a] transition-colors touch-manipulation active:bg-[#0a0a0a]"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-[#FF4000]/50", "bg-[#0a0a0a]"); }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-[#FF4000]/50", "bg-[#0a0a0a]"); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("border-[#FF4000]/50", "bg-[#0a0a0a]");
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleScanFile(f);
                }}
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-[#FF4000]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#FF4000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v12a2 2 0 002 2h12a2 2 0 002-2V16m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#e8e8e8]">Upload document</span>
              </label>
            </div>
            {scanLoading && (
              <div className="flex items-center justify-center gap-2 text-sm text-[#737373]">
                <div className="w-4 h-4 border-2 border-[#FF4000] border-t-transparent rounded-full animate-spin" />
                Reading document…
              </div>
            )}
            {scanError && (
              <p className="text-sm text-[#ef4444]">{scanError}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleScanSubmit} className="space-y-4">
            <p className="text-sm text-[#10b981]">Data extracted. Review and edit if needed, then add the expense.</p>
            {scanParsed.items.length > 0 && (
              <div className="rounded-lg bg-[#0a0a0a] p-3">
                <p className="text-xs font-medium text-[#737373] mb-1">Line items</p>
                <ul className="text-xs text-[#a3a3a3] list-disc list-inside space-y-0.5">
                  {scanParsed.items.slice(0, 8).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                  {scanParsed.items.length > 8 && <li>…and {scanParsed.items.length - 8} more</li>}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-medium text-[#737373]">Merchant</span>
                <input type="text" className="input-field" value={scanMerchant} onChange={(e) => setScanMerchant(e.target.value)} required />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[#737373]">Amount</span>
                <input type="number" step="0.01" min="0" className="input-field" value={scanAmount} onChange={(e) => setScanAmount(e.target.value)} required />
              </label>
              <Dropdown label="Currency" options={currencyOptions} value={scanCurrency} onChange={setScanCurrency} />
              <CategoryPickFields
                mode="add"
                preset={scanCategoryPreset}
                custom={scanCategoryCustom}
                onPreset={setScanCategoryPreset}
                onCustom={setScanCategoryCustom}
              />
              <label className="block">
                <span className="text-xs font-medium text-[#737373]">Date</span>
                <input type="date" className="input-field" value={scanDate} onChange={(e) => setScanDate(e.target.value)} />
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setScanParsed(null); setScanError(null); }} className="btn-ghost">
                Scan another
              </button>
              <button type="button" onClick={closeScanModal} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Adding…" : "Add expense"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete expense"
        message={deleteConfirm ? `Delete "${deleteConfirm.itemName}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
