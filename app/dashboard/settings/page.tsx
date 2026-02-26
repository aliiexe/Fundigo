"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  const [startingBalance, setStartingBalance] = useState("");
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingBalance, setSavingBalance] = useState(false);

  useEffect(() => {
    fetch("/api/v1/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.preferred_currency) setPreferredCurrency(data.preferred_currency);
        if (data?.starting_balance != null) setStartingBalance(String(data.starting_balance));
      })
      .catch(() => {});
  }, []);

  const handleCurrencyChange = (value: string) => {
    if (value === preferredCurrency) return;
    setSavingCurrency(true);
    fetch("/api/v1/auth/ensure-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferred_currency: value }),
    })
      .then((r) => {
        if (r.ok) { setPreferredCurrency(value); toast.success("Currency updated"); }
        else toast.error("Failed to update currency");
      })
      .catch(() => toast.error("Failed to update currency"))
      .finally(() => setSavingCurrency(false));
  };

  const handleBalanceSave = () => {
    const num = parseFloat(startingBalance);
    if (isNaN(num) || num < 0) { toast.error("Enter a valid balance"); return; }
    setSavingBalance(true);
    fetch("/api/v1/auth/ensure-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starting_balance: num }),
    })
      .then((r) => {
        if (r.ok) toast.success("Balance updated");
        else toast.error("Failed to update balance");
      })
      .catch(() => toast.error("Failed to update balance"))
      .finally(() => setSavingBalance(false));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/v1/data/export", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) toast.success("Export queued. You'll receive your data when ready.");
      else toast.error(data.error || "Export failed.");
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = () => {
    if (!confirm("Permanently delete your account and all data? This cannot be undone.")) return;
    setDeleting(true);
    fetch("/api/v1/me/delete", { method: "DELETE" })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (data.message) toast.success("Account deletion scheduled. Sign out to complete.");
        else toast.error(data.error || "Delete failed.");
      })
      .catch(() => toast.error("Delete failed."))
      .finally(() => setDeleting(false));
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#e8e8e8]">Settings</h1>
        <p className="text-[#737373] text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <div className="card">
        <div className="p-5">
          <h2 className="text-base font-medium text-[#e8e8e8] mb-1">Account</h2>
          <p className="text-[#525252] text-sm">
            Manage your account (email, password) via Clerk. Use the profile button in the top right.
          </p>
        </div>
      </div>

      {/* Currency picker */}
      <div className="card">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-[#e8e8e8] mb-1">Preferred currency</h2>
              <p className="text-[#525252] text-xs">Used for dashboard totals, income, and goals.</p>
            </div>
            {savingCurrency && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-[#FF4000] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#737373]">Saving…</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => handleCurrencyChange(c.code)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  preferredCurrency === c.code
                    ? "border-[#FF4000] bg-[#FF4000]/5"
                    : "border-[#1e1e1e] hover:border-[#2a2a2a] bg-[#111111]"
                }`}
              >
                <span className="text-xl">{c.flag}</span>
                <p className="text-sm font-medium text-[#e8e8e8] mt-1">{c.code}</p>
                <p className="text-[10px] text-[#525252]">{c.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Starting balance */}
      <div className="card">
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-base font-medium text-[#e8e8e8] mb-1">Starting balance</h2>
            <p className="text-[#525252] text-xs">Your initial balance used to calculate your current balance on the dashboard.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              className="input-field w-48"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
            />
            <button onClick={handleBalanceSave} disabled={savingBalance} className="btn-primary text-sm">
              {savingBalance ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Export & Delete */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <div className="p-5 space-y-3">
            <div>
              <h2 className="text-base font-medium text-[#e8e8e8] mb-1">Data export</h2>
              <p className="text-[#525252] text-xs">Download all your data as a ZIP file.</p>
            </div>
            <button type="button" onClick={handleExport} disabled={exporting} className="btn-secondary text-sm w-full">
              {exporting ? "Requesting…" : "Export my data"}
            </button>
          </div>
        </div>

        <div className="card border border-[#ef4444]/20">
          <div className="p-5 space-y-3">
            <div>
              <h2 className="text-base font-medium text-[#ef4444] mb-1">Delete account</h2>
              <p className="text-[#525252] text-xs">Permanently delete your account and all data.</p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full px-5 py-2.5 rounded-xl text-sm font-medium bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
