"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";
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
import { SearchInput } from "@/components/ui/SearchInput";

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState("USD");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [startingBalance, setStartingBalance] = useState("");
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingCountry, setSavingCountry] = useState(false);
  const [savingBalance, setSavingBalance] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>(() => getStoredExportOptions()?.format ?? DEFAULT_EXPORT_OPTIONS.format);
  const [exportInclude, setExportInclude] = useState<ExportSection[]>(() => getStoredExportOptions()?.include ?? DEFAULT_EXPORT_OPTIONS.include);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const filteredCurrencies = currencySearch.trim()
    ? SUPPORTED_CURRENCIES.filter(
        (c) =>
          c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
          c.name.toLowerCase().includes(currencySearch.toLowerCase())
      )
    : SUPPORTED_CURRENCIES;
  const filteredCountries = countrySearch.trim()
    ? SUPPORTED_COUNTRIES.filter(
        (c) =>
          c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.name.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : SUPPORTED_COUNTRIES;

  useEffect(() => {
    setStoredExportOptions({ format: exportFormat, include: exportInclude });
  }, [exportFormat, exportInclude]);

  useEffect(() => {
    fetch("/api/v1/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.preferred_currency) setPreferredCurrency(data.preferred_currency);
        setCountryCode(data?.country_code ?? null);
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

  const handleCountryChange = (value: string) => {
    if (value === countryCode) return;
    setSavingCountry(true);
    fetch("/api/v1/auth/ensure-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country_code: value }),
    })
      .then((r) => {
        if (r.ok) {
          setCountryCode(value);
          toast.success("Country updated. Subscription catalog will show plans for your region.");
        } else toast.error("Failed to update country");
      })
      .catch(() => toast.error("Failed to update country"))
      .finally(() => setSavingCountry(false));
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

      {/* Country (subscription catalog region) */}
      <div className="card">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-medium text-[#e8e8e8] mb-1">Your country</h2>
              <p className="text-[#525252] text-xs">Subscription catalog shows plans and prices for your region. Set in onboarding or here.</p>
            </div>
            {savingCountry && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-[#FF4000] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#737373]">Saving…</span>
              </div>
            )}
          </div>
          {countryCode && (
            <div className="flex items-center gap-2 text-sm text-[#a3a3a3]">
              <span>Selected:</span>
              <span className="text-[#e8e8e8] font-medium">
                {SUPPORTED_COUNTRIES.find((c) => c.code === countryCode)?.flag}{" "}
                {SUPPORTED_COUNTRIES.find((c) => c.code === countryCode)?.name ?? countryCode}
              </span>
            </div>
          )}
          <SearchInput
            value={countrySearch}
            onChange={setCountrySearch}
            placeholder="Search countries…"
            className="mb-2"
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto overscroll-contain pr-1">
            {filteredCountries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCountryChange(c.code)}
                disabled={savingCountry}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border-2 transition-all duration-200 disabled:opacity-60 ${
                  countryCode === c.code
                    ? "border-[#FF4000] bg-[#FF4000]/10 shadow-md shadow-[#FF4000]/10"
                    : "border-[#1e1e1e] bg-[#111111] hover:border-[#2a2a2a] hover:bg-[#1a1a1b]"
                }`}
              >
                <span className="text-xl sm:text-2xl mb-1" aria-hidden>{c.flag}</span>
                <span className="text-[10px] font-medium text-[#e8e8e8] truncate w-full text-center leading-tight">{c.name}</span>
                <span className="text-[9px] text-[#525252]">{c.code}</span>
              </button>
            ))}
          </div>
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
          <SearchInput
            value={currencySearch}
            onChange={setCurrencySearch}
            placeholder="Search currencies…"
            className="mb-2"
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto overscroll-contain pr-1">
            {filteredCurrencies.map((c) => (
              <button
                key={c.code}
                onClick={() => handleCurrencyChange(c.code)}
                disabled={savingCurrency}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border-2 text-center transition-all disabled:opacity-60 ${
                  preferredCurrency === c.code
                    ? "border-[#FF4000] bg-[#FF4000]/10"
                    : "border-[#1e1e1e] bg-[#111111] hover:border-[#2a2a2a] hover:bg-[#1a1a1b]"
                }`}
              >
                <span className="text-xl mb-1">{c.flag}</span>
                <span className="text-xs font-medium text-[#e8e8e8]">{c.code}</span>
                <span className="text-[9px] text-[#525252] truncate w-full">{c.name}</span>
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
