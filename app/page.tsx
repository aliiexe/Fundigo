"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

const features = [
  {
    title: "Smart Allocation",
    description:
      "AI-suggested splits across spending, saving, and investing — tailored to your income and goals.",
  },
  {
    title: "Subscription Tracker",
    description:
      "Never lose track of recurring charges. Every subscription in one place with renewal alerts.",
  },
  {
    title: "Bank-Grade Security",
    description:
      "256-bit AES encryption at rest. Your financial data never leaves our secure infrastructure.",
  },
  {
    title: "Multi-Currency",
    description:
      "Track finances in MAD, USD, EUR, and 50+ currencies with real-time conversion rates.",
  },
  {
    title: "Visual Insights",
    description:
      "Clear charts and breakdowns that make understanding your cash flow effortless.",
  },
  {
    title: "Goal Planning",
    description:
      "Set savings goals, track milestones, and stay on course toward financial freedom.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Sign up in seconds. No credit card required, no hidden fees.",
  },
  {
    number: "02",
    title: "Set your profile",
    description:
      "Tell us your currency, income, and goals. We personalize everything.",
  },
  {
    number: "03",
    title: "Take control",
    description:
      "Add transactions, track subscriptions, and watch your wealth grow.",
  },
];

const stats = [
  { value: "256-bit", label: "AES Encryption" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "50+", label: "Currencies" },
  { value: "0", label: "Data Sold" },
];

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-[var(--bg)]">
      {/* Nav */}
      <nav className="relative z-20 max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between animate-fade-in">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center">
            <span className="text-white text-xs font-bold leading-none">F</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--text)]">
            Fundigo
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link href="/dashboard" className="btn-primary text-sm">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button type="button" className="btn-ghost text-sm">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                <button type="button" className="btn-primary text-sm">
                  Get started
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 sm:pt-28 sm:pb-40">
        <div
          className="absolute top-[-10%] left-[15%] w-[420px] h-[420px] rounded-full bg-[#FF4000]/15 blur-[120px] animate-float animate-glow-pulse"
          aria-hidden
        />
        <div
          className="absolute bottom-[0%] right-[10%] w-[350px] h-[350px] rounded-full bg-[#FF4000]/10 blur-[100px] animate-float delay-300 animate-glow-pulse"
          aria-hidden
        />
        <div
          className="absolute top-[30%] right-[35%] w-[200px] h-[200px] rounded-full bg-[#FF4000]/8 blur-[80px] animate-float delay-500"
          aria-hidden
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--accent)] mb-5 animate-fade-in">
            Personal Finance
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 animate-fade-in delay-75">
            <span className="bg-gradient-to-r from-[#e8e8e8] via-[#e8e8e8] to-[#FF4000] bg-clip-text text-transparent">
              Your money,
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#FF4000] to-[#e8e8e8] bg-clip-text text-transparent">
              your rules.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-muted)] max-w-xl mx-auto mb-10 animate-fade-in-slow delay-150">
            Track every dirham, optimize every dollar. A crystal-clear view of
            your finances — private, beautiful, and effortless.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-slow delay-200">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="btn-primary text-base px-8 py-3.5"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                  <button
                    type="button"
                    className="btn-primary text-base px-8 py-3.5"
                  >
                    Start for free
                  </button>
                </SignUpButton>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button
                    type="button"
                    className="btn-outline text-base px-8 py-3.5"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text)] mb-3 animate-fade-in">
          Everything you need
        </h2>
        <p className="text-[var(--text-muted)] text-center max-w-md mx-auto mb-14 animate-fade-in delay-75">
          Powerful features wrapped in simplicity. No spreadsheets, no clutter.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`card animate-fade-in-slow delay-${(i + 1) * 75}`}
            >
              <h3 className="text-[15px] font-semibold text-[var(--text)] mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text)] mb-3 animate-fade-in">
          How it works
        </h2>
        <p className="text-[var(--text-muted)] text-center max-w-md mx-auto mb-16 animate-fade-in delay-75">
          Three steps to financial clarity.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((s, i) => (
            <div
              key={s.number}
              className={`text-center animate-fade-in-slow delay-${(i + 1) * 100}`}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-muted)] text-[var(--accent)] text-lg font-bold mb-5">
                {s.number}
              </div>
              <h3 className="text-[15px] font-semibold text-[var(--text)] mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs mx-auto">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="glass rounded-2xl p-10 sm:p-14 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-[var(--accent)] mb-1">
                  {s.value}
                </p>
                <p className="text-sm text-[var(--text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#FF4000]/10 blur-[140px] animate-glow-pulse"
          aria-hidden
        />
        <h2 className="relative text-3xl sm:text-5xl font-bold text-[var(--text)] mb-6 animate-fade-in">
          Ready to take control?
        </h2>
        <p className="relative text-[var(--text-muted)] text-lg mb-10 animate-fade-in delay-75">
          Join thousands building better financial habits with Fundigo.
        </p>
        <div className="relative flex flex-wrap items-center justify-center gap-4 animate-fade-in delay-150">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="btn-primary text-base px-10 py-3.5"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                <button
                  type="button"
                  className="btn-primary text-base px-10 py-3.5"
                >
                  Create free account
                </button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button
                  type="button"
                  className="btn-outline text-base px-8 py-3.5"
                >
                  Sign in
                </button>
              </SignInButton>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-[var(--text-dim)]">
            &copy; {new Date().getFullYear()} Fundigo
          </span>
          <nav className="flex items-center gap-6 text-xs">
            <Link
              href="/privacy"
              className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/about"
              className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
