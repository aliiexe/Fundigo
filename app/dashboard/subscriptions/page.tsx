"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatCurrency, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currency";
import { convertSync } from "@/lib/exchange";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { SearchInput } from "@/components/ui/SearchInput";

type Sub = { id: string; service_name: string; plan?: string; amount: number; currency: string; period: string; paused_until?: string | null };
type CatalogItem = { id: string; service: string; plan: string; period: string; price_mad: number; currency: string };

const PERIOD_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.flag} ${c.code} — ${c.name}`,
}));

export default function SubscriptionsPage() {
  const [list, setList] = useState<Sub[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");

  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Record<string, number>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [plan, setPlan] = useState("");
  const [amount, setAmount] = useState("");
  const [formCurrency, setFormCurrency] = useState(DEFAULT_CURRENCY);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [pauseTarget, setPauseTarget] = useState<Sub | null>(null);
  const [pauseUntil, setPauseUntil] = useState("");

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/v1/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/v1/subscriptions").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v1/catalog").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/v1/rates").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([me, subs, cat, ratesData]) => {
        if (me?.preferred_currency) {
          setCurrency(me.preferred_currency);
          setFormCurrency(me.preferred_currency);
        }
        if (ratesData?.rates) setRates(ratesData.rates);
        setList(subs);
        setCatalog(cat);
      })
      .catch(() => toast.error("Failed to load subscriptions"))
      .finally(() => setPageLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const cx = (amt: number, from: string) =>
    Object.keys(rates).length > 0 ? convertSync(amt, from, currency, rates) : amt;

  const isPaused = (s: Sub) => {
    if (!s.paused_until) return false;
    const pausedUntil = new Date(s.paused_until + "T23:59:59");
    const now = new Date();
    return pausedUntil >= new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const activeSubs = list.filter((s) => !isPaused(s));
  const pausedSubs = list.filter((s) => isPaused(s));

  const totalMonthly = activeSubs.reduce((sum, s) => {
    const converted = cx(Number(s.amount), s.currency);
    if (s.period === "monthly") return sum + converted;
    if (s.period === "yearly") return sum + converted / 12;
    return sum;
  }, 0);

  const filtered = list.filter((s) =>
    s.service_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.plan && s.plan.toLowerCase().includes(search.toLowerCase()))
  );

  const resetForm = () => {
    setEditingId(null);
    setServiceName("");
    setPlan("");
    setAmount("");
    setFormCurrency(currency);
    setPeriod("monthly");
  };

  const openEdit = (s: Sub) => {
    setEditingId(s.id);
    setServiceName(s.service_name);
    setPlan(s.plan ?? "");
    setAmount(String(s.amount));
    setFormCurrency(s.currency);
    setPeriod(s.period);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;
    try {
      const res = await fetch(`/api/v1/subscriptions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Subscription deleted");
      load();
    } catch {
      toast.error("Failed to delete subscription");
    }
  };

  const openPause = (s: Sub) => {
    setPauseTarget(s);
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setPauseUntil(endOfMonth.toISOString().slice(0, 10));
    setPauseModalOpen(true);
  };

  const handlePause = async () => {
    if (!pauseTarget || !pauseUntil) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/subscriptions/${pauseTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused_until: pauseUntil }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`${pauseTarget.service_name} paused until ${new Date(pauseUntil).toLocaleDateString("default", { month: "long", year: "numeric" })}`);
      setPauseModalOpen(false);
      setPauseTarget(null);
      load();
    } catch {
      toast.error("Failed to pause subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (s: Sub) => {
    try {
      const res = await fetch(`/api/v1/subscriptions/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused_until: null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`${s.service_name} resumed`);
      load();
    } catch {
      toast.error("Failed to resume subscription");
    }
  };

  const pickFromCatalog = (c: CatalogItem) => {
    resetForm();
    setServiceName(c.service);
    setPlan(c.plan);
    setAmount(String(c.price_mad));
    setFormCurrency(c.currency || currency);
    setPeriod(c.period as "monthly" | "yearly");
    setModalOpen(true);
    toast.info(`${c.service} filled — review and submit`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!serviceName.trim() || isNaN(num) || num < 0) {
      toast.error("Please fill in service name and amount");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        service_name: serviceName.trim(),
        plan: plan.trim() || undefined,
        amount: num,
        currency: formCurrency,
        period,
      };

      if (editingId) {
        const res = await fetch(`/api/v1/subscriptions/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Subscription updated");
      } else {
        const res = await fetch("/api/v1/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Subscription added");
      }

      resetForm();
      setModalOpen(false);
      load();
    } catch {
      toast.error(editingId ? "Failed to update subscription" : "Failed to add subscription");
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
          <h1 className="text-2xl font-semibold text-[#e8e8e8]">Subscriptions</h1>
          <p className="text-[#737373] text-sm mt-0.5">Track your recurring services</p>
        </div>
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="btn-primary">
          + Add subscription
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <div className="p-5">
            <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Monthly Cost</p>
            <p className="text-2xl font-semibold text-[#f59e0b] mt-2">{formatCurrency(totalMonthly, currency)}</p>
            <p className="text-[#525252] text-xs mt-1">
              {activeSubs.length} active{pausedSubs.length > 0 ? ` · ${pausedSubs.length} paused` : ""}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="p-5">
            <p className="text-[#737373] text-xs font-medium uppercase tracking-wider">Yearly Projected</p>
            <p className="text-2xl font-semibold text-[#e8e8e8] mt-2">{formatCurrency(totalMonthly * 12, currency)}</p>
            <p className="text-[#525252] text-xs mt-1">Projected annual</p>
          </div>
        </div>
      </div>

      {/* Catalog quick-add */}
      {catalog.length > 0 && (
        <div className="card">
          <div className="p-5">
            <h2 className="text-base font-medium text-[#e8e8e8] mb-3">Quick add from catalog</h2>
            <input
              type="text"
              className="input-field mb-3"
              placeholder="Search catalog…"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {catalog
                .filter((c) => c.service.toLowerCase().includes(catalogSearch.toLowerCase()))
                .slice(0, 12)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickFromCatalog(c)}
                    className="px-3 py-1.5 rounded-lg border border-[#1e1e1e] text-[#737373] text-xs hover:border-[#FF4000] hover:text-[#FF4000] transition-all"
                  >
                    {c.service} {c.plan}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <SearchInput value={search} onChange={setSearch} placeholder="Search subscriptions…" />

      {/* List */}
      <div className="card">
        <div className="px-5 py-4 border-b border-[#1e1e1e]">
          <h2 className="text-base font-medium text-[#e8e8e8]">Your subscriptions</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[#525252] text-sm">{search ? "No matches found." : "No subscriptions yet."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#1e1e1e]">
            {filtered.map((s) => {
              const paused = isPaused(s);
              return (
                <li key={s.id} className={`px-5 py-4 flex items-center justify-between hover:bg-[#0a0a0a] transition-colors ${paused ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${paused ? "bg-[#525252]/10" : "bg-[#f59e0b]/10"}`}>
                      <span className={`text-xs ${paused ? "text-[#525252]" : "text-[#f59e0b]"}`}>{paused ? "⏸" : "⟳"}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${paused ? "text-[#525252]" : "text-[#e8e8e8]"}`}>{s.service_name}</p>
                        {paused && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#525252]/10 text-[#737373]">
                            Paused until {new Date(s.paused_until! + "T00:00:00").toLocaleDateString("default", { month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      {s.plan && <p className="text-xs text-[#525252]">{s.plan}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${paused ? "text-[#525252] line-through" : "text-[#f59e0b]"}`}>
                      {formatCurrency(cx(Number(s.amount), s.currency), currency)}/{s.period === "yearly" ? "yr" : "mo"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {paused ? (
                        <button onClick={() => handleResume(s)} className="w-7 h-7 rounded-md text-[#10b981] hover:bg-[#10b981]/10 transition-all flex items-center justify-center" title="Resume">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                      ) : (
                        <button onClick={() => openPause(s)} className="w-7 h-7 rounded-md text-[#525252] hover:text-[#f59e0b] hover:bg-[#f59e0b]/10 transition-all flex items-center justify-center" title="Pause">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                      )}
                      <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-md text-[#525252] hover:text-[#e8e8e8] hover:bg-[#191919] transition-all flex items-center justify-center" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="w-7 h-7 rounded-md text-[#525252] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all flex items-center justify-center" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit subscription" : "Add subscription"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Service name</span>
              <input type="text" className="input-field" placeholder="e.g. Netflix" value={serviceName} onChange={(e) => setServiceName(e.target.value)} required />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Plan (optional)</span>
              <input type="text" className="input-field" placeholder="e.g. Standard" value={plan} onChange={(e) => setPlan(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Amount</span>
              <input type="number" step="0.01" min="0" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </label>
            <Dropdown
              label="Currency"
              options={CURRENCY_OPTIONS}
              value={formCurrency}
              onChange={setFormCurrency}
            />
            <Dropdown
              label="Billing period"
              options={PERIOD_OPTIONS}
              value={period}
              onChange={setPeriod}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (editingId ? "Saving…" : "Adding…") : (editingId ? "Save changes" : "Add subscription")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Pause Modal */}
      <Modal open={pauseModalOpen} onClose={() => setPauseModalOpen(false)} title="Pause subscription">
        <div className="space-y-5">
          <p className="text-sm text-[#a0a0a0]">
            Pausing <span className="text-[#e8e8e8] font-medium">{pauseTarget?.service_name}</span> will
            exclude it from your monthly spending calculation until it resumes.
          </p>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-[#737373]">Pause until</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "End of this month", value: (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10); })() },
                { label: "End of next month", value: (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 2, 0).toISOString().slice(0, 10); })() },
                { label: "3 months", value: (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 3, 0).toISOString().slice(0, 10); })() },
                { label: "6 months", value: (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 6, 0).toISOString().slice(0, 10); })() },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setPauseUntil(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pauseUntil === opt.value
                      ? "bg-[#FF4000]/10 text-[#FF4000] border border-[#FF4000]/30"
                      : "border border-[#1e1e1e] text-[#737373] hover:border-[#333] hover:text-[#a0a0a0]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-xs text-[#525252]">Or pick a custom date</span>
              <input
                type="date"
                className="input-field mt-1"
                value={pauseUntil}
                onChange={(e) => setPauseUntil(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </label>
            {pauseUntil && (
              <p className="text-xs text-[#737373]">
                Will resume on{" "}
                <span className="text-[#e8e8e8]">
                  {new Date(pauseUntil + "T00:00:00").toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPauseModalOpen(false)} className="btn-ghost">Cancel</button>
            <button type="button" onClick={handlePause} disabled={loading || !pauseUntil} className="btn-primary">
              {loading ? "Pausing…" : "Pause subscription"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
