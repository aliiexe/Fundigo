"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

export function Header() {
  const { isSignedIn } = useAuth();

  return (
    <header className="relative z-20 w-full">
      <nav
        className="mx-auto flex max-w-content items-center justify-between px-4 py-5 sm:px-6 sm:py-6"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-sm font-semibold">
            F
          </span>
          <span className="text-lg font-semibold tracking-tight text-[var(--text)]">Fundigo</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="btn-primary rounded-lg px-5 py-2.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button
                  type="button"
                  className="btn-ghost rounded-lg px-4 py-2.5 text-sm font-medium"
                  aria-label="Sign in"
                >
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                <button
                  type="button"
                  className="btn-primary rounded-lg px-5 py-2.5 text-sm font-medium"
                  aria-label="Get started"
                >
                  Get started
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
