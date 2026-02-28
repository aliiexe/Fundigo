"use client";

import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 py-10 sm:py-12" role="contentinfo">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <span className="text-body-sm text-[var(--text-dim)]">
              &copy; {year} Fundigo. All rights reserved.
            </span>
            <p className="text-body-sm text-[var(--text-dim)]">
              Your data is secured with 256-bit AES encryption.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/privacy"
              className="text-body-sm text-[var(--text-dim)] transition-colors hover:text-accent focus-visible:rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Privacy
            </Link>
            <Link
              href="/about"
              className="text-body-sm text-[var(--text-dim)] transition-colors hover:text-accent focus-visible:rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-body-sm text-[var(--text-dim)] transition-colors hover:text-accent focus-visible:rounded focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
