"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function CTA() {
  const { isSignedIn } = useAuth();
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative py-section" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-bg-card/80 p-8 shadow-card backdrop-blur-sm sm:p-12 md:p-16"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent" aria-hidden />
          <div className="absolute top-0 left-1/2 w-4/5 -translate-x-1/2 border-t border-accent/30" aria-hidden />
          <div className="relative text-center">
            <h2 id="cta-heading" className="text-display-sm text-[var(--text)]">
              Ready to take control?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-body text-[var(--text-muted)]">
              Join thousands building better financial habits with Fundigo.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="btn-primary rounded-lg px-10 py-3.5 text-base font-medium shadow-cta transition-transform duration-micro hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
                    <button
                      type="button"
                      className="btn-primary rounded-lg px-10 py-3.5 text-base font-medium shadow-cta transition-transform duration-micro hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    >
                      Create free account
                    </button>
                  </SignUpButton>
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                    <button
                      type="button"
                      className="btn-outline rounded-lg px-8 py-3.5 text-base font-medium"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
