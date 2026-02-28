"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import {
  EXPORT_SECTIONS,
  EXPORT_SECTION_LABELS,
  getStoredExportOptions,
  setStoredExportOptions,
  DEFAULT_EXPORT_OPTIONS,
  type ExportFormat,
  type ExportSection,
} from "@/lib/exportData";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  const [startingBalance, setStartingBalance] = useState("");
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingBalance, setSavingBalance] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(() => getStoredExportOptions()?.format ?? DEFAULT_EXPORT_OPTIONS.format);
  const [exportInclude, setExportInclude] = useState<ExportSection[]>(() => getStoredExportOptions()?.include ?? DEFAULT_EXPORT_OPTIONS.include);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  useEffect(() => {
    setStoredExportOptions({ format: exportFormat, include: exportInclude });
  }, [exportFormat, exportInclude]);

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

  const toggleExportSection = (section: ExportSection) => {
    setExportInclude((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
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
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteConfirm = () => {
    setDeleting(true);
    fetch("/api/v1/me/delete", { method: "DELETE" })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (data.message) {
          toast.success("Account deletion scheduled. Sign out to complete.");
          setDeleteAccountOpen(false);
        } else toast.error(data.error || "Delete failed.");
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
            Manage your account (email, password) via Clerk. Use the profile button in the bottom left.
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
          <div className="p-5 space-y-4">
            <div>
              <h2 className="text-base font-medium text-[#e8e8e8] mb-1">Data export</h2>
              <p className="text-[#525252] text-xs">Choose format and which data to download.</p>
            </div>
            <div className="space-y-2">
              <span className="text-xs text-[#737373] block">Format</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={exportFormat === "json"}
                    onChange={() => setExportFormat("json")}
                    className="rounded-full border-[#404040] bg-[#111111] text-[#FF4000] focus:ring-[#FF4000]"
                  />
                  <span className="text-sm text-[#e8e8e8]">JSON</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={exportFormat === "csv"}
                    onChange={() => setExportFormat("csv")}
                    className="rounded-full border-[#404040] bg-[#111111] text-[#FF4000] focus:ring-[#FF4000]"
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
                      className="rounded border-[#404040] bg-[#111111] text-[#FF4000] focus:ring-[#FF4000]"
                    />
                    <span className="text-sm text-[#e8e8e8]">{EXPORT_SECTION_LABELS[section]}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || exportInclude.length === 0}
              className="btn-secondary text-sm w-full disabled:opacity-50"
            >
              {exporting ? "Preparing…" : "Export my data"}
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
              onClick={() => setDeleteAccountOpen(true)}
              disabled={deleting}
              className="w-full px-5 py-2.5 rounded-xl text-sm font-medium bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete account"
        message="Permanently delete your account and all data? This cannot be undone."
        confirmLabel="Delete account"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
