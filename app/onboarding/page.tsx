"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currency";
import { Dropdown } from "@/components/ui/Dropdown";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [consentStorage, setConsentStorage] = useState(false);
  const [consentAnalytics, setConsentAnalytics] = useState(false);
  const [consentPersonalization, setConsentPersonalization] = useState(false);
  const [profession, setProfession] = useState("");
  const [showCustomProfession, setShowCustomProfession] = useState(false);
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [showCustomGoal, setShowCustomGoal] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState(DEFAULT_CURRENCY);
  const [startingBalance, setStartingBalance] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/");
      return;
    }
    fetch("/api/v1/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.onboarding_completed_at) router.replace("/dashboard");
      })
      .catch(() => {});
  }, [isLoaded, isSignedIn, router]);

  const allConsented = consentStorage && consentAnalytics && consentPersonalization;

  const saveAndNext = async () => {
    if (step === 0) {
      if (!allConsented) {
        toast.error("Please accept all consent options to continue");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/v1/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            purposes: ["data_storage", "analytics", "personalization"],
            version: "1.0",
          }),
        });
        if (!res.ok) throw new Error("Failed to save consent");
        setStep((s) => s + 1);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save consent");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 3) {
      setStep((s) => s + 1);
      return;
    }

    if (step === 4) {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/auth/ensure-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ complete_onboarding: true }),
        });
        if (!res.ok) throw new Error("Failed to complete onboarding");
        router.replace("/dashboard");
        return;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save");
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const bal = parseFloat(startingBalance);
      const res = await fetch("/api/v1/auth/ensure-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profession: profession.trim() || undefined,
          primary_goal: primaryGoal.trim() || undefined,
          preferred_currency: preferredCurrency,
          starting_balance: isNaN(bal) ? 0 : bal,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      setStep((s) => s + 1);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to save. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="animate-fade-in text-center">
          <div className="w-7 h-7 border-2 border-[#FF4000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-dim)] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)]">
      <div className="max-w-lg mx-auto py-14 px-5 sm:px-6">
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-[var(--accent)] mb-1 animate-fade-in">
          Setup
        </p>
        <h1 className="text-xl font-semibold text-[var(--text)] mb-1 animate-fade-in">
          Welcome to Fundigo
        </h1>
        <p className="text-[var(--text-muted)] text-sm mb-8 animate-fade-in">
          A few quick steps to personalize your experience.
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-10">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 flex-1 ${
                i <= step ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            />
          ))}
        </div>

        {/* Step 0: Privacy & Consent */}
        {step === 0 && (
          <div className="card p-6 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-base font-medium text-[var(--text)] mb-0.5">
                Privacy &amp; Consent
              </h2>
              <p className="text-[var(--text-dim)] text-xs">
                We respect your data. Please review and accept our privacy practices.
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-[#1e1e1e] hover:border-[#2a2a2a] cursor-pointer transition-colors">
                <input type="checkbox" className="mt-0.5 accent-[#FF4000]" checked={consentStorage} onChange={(e) => setConsentStorage(e.target.checked)} />
                <div>
                  <p className="text-sm text-[#e8e8e8]">Data storage</p>
                  <p className="text-xs text-[#525252]">We store your financial data securely with AES-256 encryption</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-[#1e1e1e] hover:border-[#2a2a2a] cursor-pointer transition-colors">
                <input type="checkbox" className="mt-0.5 accent-[#FF4000]" checked={consentAnalytics} onChange={(e) => setConsentAnalytics(e.target.checked)} />
                <div>
                  <p className="text-sm text-[#e8e8e8]">Analytics</p>
                  <p className="text-xs text-[#525252]">We use anonymized usage data to improve the app</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-[#1e1e1e] hover:border-[#2a2a2a] cursor-pointer transition-colors">
                <input type="checkbox" className="mt-0.5 accent-[#FF4000]" checked={consentPersonalization} onChange={(e) => setConsentPersonalization(e.target.checked)} />
                <div>
                  <p className="text-sm text-[#e8e8e8]">Personalization</p>
                  <p className="text-xs text-[#525252]">We use your profile to personalize suggestions</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Step 1: About you */}
        {step === 1 && (
          <div className="card p-6 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-base font-medium text-[var(--text)] mb-0.5">
                About you
              </h2>
              <p className="text-[var(--text-dim)] text-xs">
                This helps us personalize your experience.
              </p>
            </div>
            <div className="block">
              <span className="text-xs font-medium text-[var(--text-muted)] mb-2 block">
                What best describes you?
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "Student", icon: "🎓" },
                  { value: "Employee (full-time)", icon: "💼" },
                  { value: "Employee (part-time)", icon: "⏰" },
                  { value: "Freelancer", icon: "💻" },
                  { value: "Self-employed", icon: "🏪" },
                  { value: "Unemployed / Job seeking", icon: "🔍" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setProfession(opt.value); setShowCustomProfession(false); }}
                    className={`px-3 py-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                      profession === opt.value && !showCustomProfession
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--text-dim)]"
                    }`}
                  >
                    <span className="mr-1.5">{opt.icon}</span>{opt.value}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setShowCustomProfession(true); setProfession(""); }}
                  className={`px-3 py-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                    showCustomProfession
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--text-dim)]"
                  }`}
                >
                  <span className="mr-1.5">✏️</span>Other
                </button>
              </div>
              {showCustomProfession && (
                <input
                  type="text"
                  className="input-field mt-2"
                  placeholder="e.g. Retired, Stay-at-home parent..."
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  autoFocus
                />
              )}
            </div>
            <div className="block">
              <span className="text-xs font-medium text-[var(--text-muted)] mb-2 block">
                What&apos;s your main financial focus?
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "Save for an emergency fund", icon: "🛟" },
                  { value: "Pay off debt", icon: "💳" },
                  { value: "Save for a big purchase", icon: "🏠" },
                  { value: "Track spending better", icon: "📊" },
                  { value: "Build investments", icon: "📈" },
                  { value: "Live within my budget", icon: "💰" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setPrimaryGoal(opt.value); setShowCustomGoal(false); }}
                    className={`px-3 py-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                      primaryGoal === opt.value && !showCustomGoal
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--text-dim)]"
                    }`}
                  >
                    <span className="mr-1.5">{opt.icon}</span>{opt.value}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setShowCustomGoal(true); setPrimaryGoal(""); }}
                  className={`px-3 py-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                    showCustomGoal
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--text-dim)]"
                  }`}
                >
                  <span className="mr-1.5">✏️</span>Other
                </button>
              </div>
              {showCustomGoal && (
                <input
                  type="text"
                  className="input-field mt-2"
                  placeholder="e.g. Save for a trip, fund my startup..."
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  autoFocus
                />
              )}
            </div>
          </div>
        )}

        {/* Step 2: Your finances */}
        {step === 2 && (
          <div className="card p-6 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-base font-medium text-[var(--text)] mb-0.5">
                Your finances
              </h2>
              <p className="text-[var(--text-dim)] text-xs">
                Set your currency and starting balance.
              </p>
            </div>
            <Dropdown
              options={SUPPORTED_CURRENCIES.map((c) => ({
                value: c.code,
                label: `${c.code} — ${c.name}`,
              }))}
              value={preferredCurrency}
              onChange={setPreferredCurrency}
              label="Preferred currency"
            />
            <label className="block">
              <span className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                Current balance
              </span>
              <p className="text-[var(--text-dim)] text-xs mb-1.5">
                Total across all your accounts.
              </p>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                placeholder="e.g. 5000"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
              />
            </label>
          </div>
        )}

        {/* Step 3: Info */}
        {step === 3 && (
          <div className="card p-6 animate-fade-in">
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-muted)] mb-5">
                <svg
                  className="w-5 h-5 text-[var(--accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-medium text-[var(--text)] mb-2">
                Track everything
              </h2>
              <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto leading-relaxed">
                Add your{" "}
                <span className="text-[var(--text)]">income sources</span>,
                track{" "}
                <span className="text-[var(--text)]">subscriptions</span>, and
                log <span className="text-[var(--text)]">expenses</span>.
                We&apos;ll show you exactly where your money goes.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Completion */}
        {step === 4 && (
          <div className="card p-6 animate-fade-in">
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--success)]/10 mb-5">
                <svg
                  className="w-5 h-5 text-[var(--success)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h2 className="text-base font-medium text-[var(--text)] mb-2">
                You&apos;re all set
              </h2>
              <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto leading-relaxed">
                Your dashboard will show your{" "}
                <span className="text-[var(--text)]">balance</span>, monthly
                spending, and smart allocation suggestions.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-ghost text-sm"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={saveAndNext}
            disabled={loading || (step === 0 && !allConsented)}
            className="btn-primary"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : step >= TOTAL_STEPS - 1 ? (
              "Go to Dashboard"
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
