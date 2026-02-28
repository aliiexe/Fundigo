"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import { useScrollProgress } from "@/lib/useScrollProgress";

export function StickyMicroCTA() {
  const { isSignedIn } = useAuth();
  const { pastThreshold } = useScrollProgress(0.3);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const show = mounted && pastThreshold && !dismissed && !isSignedIn;

  if (!show) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-white/10 bg-bg-card/95 px-4 py-3 shadow-card backdrop-blur-sm sm:left-auto sm:right-6"
      aria-label="Get started"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-body-sm font-medium text-[var(--text)]">
          Ready to take control of your finances?
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
            <button
              type="button"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Start free
            </button>
          </SignUpButton>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg p-2 text-[var(--text-dim)] hover:bg-white/5 hover:text-[var(--text-muted)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
