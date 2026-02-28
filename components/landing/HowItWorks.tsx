"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

const STEPS = [
  {
    number: "01",
    title: "Create your account",
    description: "Sign up in seconds. No credit card required, no hidden fees.",
    micro: "No credit card",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Set your profile",
    description: "Tell us your currency, income, and goals. We personalize everything.",
    micro: "2-minute setup",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Take control",
    description: "Add transactions, track subscriptions, and watch your wealth grow.",
    micro: "Ongoing",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative py-section" aria-labelledby="how-heading">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <motion.h2
          id="how-heading"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-display-sm text-[var(--text)]"
        >
          How it works
        </motion.h2>
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mt-4 max-w-lg text-body text-[var(--text-muted)]"
        >
          Three steps to financial clarity.
        </motion.p>

        {/* Desktop: horizontal flow with connector line */}
        <div className="relative mt-16">
          <div
            className="absolute top-8 left-[16.666%] right-[16.666%] hidden h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent md:block"
            aria-hidden
          />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={reducedMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: reducedMotion ? 0 : i * 0.1, duration: 0.4 }}
                className="relative flex flex-col items-center text-center"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-bg-card text-accent shadow-card"
                  aria-hidden
                >
                  {step.icon}
                </div>
                <span className="mt-3 text-xs font-semibold uppercase tracking-wider text-accent">
                  Step {step.number}
                </span>
                <h3 className="mt-4 text-heading text-[var(--text)]">{step.title}</h3>
                <p className="mt-2 text-body-sm text-[var(--text-muted)]">{step.description}</p>
                <p className="mt-2 text-body-sm text-[var(--text-dim)]">{step.micro}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
