"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

function HeroSparkline() {
  const points = [40, 55, 45, 70, 60, 85, 75, 90, 82, 95];
  const width = 200;
  const height = 56;
  const step = width / (points.length - 1);
  const max = Math.max(...points);
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${height - (p / max) * (height - 8)}`)
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id="hero-spark" x1="0" y1="1" x2="0" y2="0">
          <stop stopColor="var(--accent)" stopOpacity="0.4" />
          <stop stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#hero-spark)"
      />
      <path
        d={pathD}
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Hero() {
  const { isSignedIn } = useAuth();
  const reducedMotion = useReducedMotion();
  const stagger = reducedMotion ? 0 : 0.08;

  return (
    <section
      className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 pt-8 pb-20 sm:px-6 md:flex-row md:items-center md:gap-16 md:pt-12 md:pb-24 lg:gap-20"
      aria-labelledby="hero-heading"
    >
      {/* Subtle extra glow only in hero (main glow is page-level so it’s not cut) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute bottom-[5%] right-[10%] h-[280px] w-[280px] rounded-full bg-accent/6 blur-[90px]"
          style={{ transform: "translateZ(0)" }}
        />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-content grid-cols-1 items-center gap-12 md:grid-cols-2">
        {/* Left column: copy + CTA */}
        <div className="max-w-xl">
          <motion.span
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.4 }}
            className="inline-block rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-accent"
          >
            Personal Finance
          </motion.span>
          <h1
            id="hero-heading"
            className="mt-6 text-display-lg text-[var(--text)] overflow-visible"
            style={{ lineHeight: 1.22, paddingBottom: "0.12em" }}
          >
            <motion.span
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: stagger }}
              className="block"
            >
              Your money,
            </motion.span>
            <motion.span
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: stagger * 2 }}
              className="block pb-[0.06em] text-accent"
              style={{ WebkitBoxDecorationBreak: "clone" }}
            >
              your rules.
            </motion.span>
          </h1>
          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: stagger * 3 }}
            className="mt-6 text-body text-[var(--text-muted)] leading-relaxed"
          >
            Track every dirham, optimize every dollar. A crystal-clear view of your finances. Private, beautiful, effortless.
          </motion.p>
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: stagger * 4 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="btn-primary inline-flex items-center rounded-lg px-8 py-3.5 text-base font-medium shadow-cta transition-transform duration-micro hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                  <button
                    type="button"
                    className="btn-primary inline-flex items-center rounded-lg px-8 py-3.5 text-base font-medium shadow-cta transition-transform duration-micro hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  >
                    Start for free
                  </button>
                </SignUpButton>
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button
                    type="button"
                    className="btn-outline rounded-lg px-6 py-3.5 text-base font-medium"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </>
            )}
          </motion.div>
          <motion.p
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: stagger * 5 }}
            className="mt-6 text-body-sm text-[var(--text-dim)]"
          >
            No credit card required · 2-minute setup
          </motion.p>
        </div>

        {/* Right column: glass card + stats + sparkline */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: stagger * 3 }}
          className="relative flex justify-center md:justify-end"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-bg-card/80 p-6 shadow-card backdrop-blur-sm sm:p-8"
            style={{ boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)" }}
          >
            <p className="text-body-sm font-medium text-[var(--text-muted)]">Last 30 days</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-[var(--text)]">+12%</span>
              <span className="text-body-sm text-[var(--text-dim)]">savings rate</span>
            </div>
            <div className="mt-4 flex justify-center">
              <HeroSparkline />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-body-sm text-[var(--text-dim)]">Goals on track</p>
                <p className="text-lg font-semibold text-[var(--text)]">3</p>
              </div>
              <div>
                <p className="text-body-sm text-[var(--text-dim)]">Subscriptions</p>
                <p className="text-lg font-semibold text-[var(--text)]">7</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
