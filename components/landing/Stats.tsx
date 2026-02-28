"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useInViewOnce } from "@/lib/useInViewOnce";
import { AnimatedCounter } from "./AnimatedCounter";

const STATS: Array<{ value: number; suffix?: string; label: string; decimals?: number }> = [
  { value: 256, suffix: "-bit", label: "AES Encryption" },
  { value: 99.9, suffix: "%", label: "Uptime SLA", decimals: 1 },
  { value: 50, suffix: "+", label: "Currencies" },
  { value: 0, label: "Data Sold" },
];

function StatCard({
  value,
  suffix,
  label,
  decimals = 0,
  inView,
}: {
  value: number;
  suffix?: string;
  label: string;
  decimals?: number;
  inView: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-bg-card/80 p-6 shadow-card backdrop-blur-sm transition-all duration-short hover:border-accent/20 hover:shadow-card-hover sm:p-8">
      <p className="text-3xl font-semibold sm:text-4xl">
        <AnimatedCounter
          value={value}
          suffix={suffix ?? ""}
          decimals={decimals}
          enabled={inView}
          duration={1000}
          className="bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent"
        />
      </p>
      <p className="mt-2 text-body-sm text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

export function Stats() {
  const reducedMotion = useReducedMotion();
  const [ref, inView] = useInViewOnce();

  return (
    <section className="relative py-section" aria-labelledby="stats-heading">
      <div ref={ref as React.RefObject<HTMLDivElement>} className="mx-auto max-w-content px-4 sm:px-6">
        <motion.h2
          id="stats-heading"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="sr-only"
        >
          Trust and security
        </motion.h2>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <StatCard
                value={s.value}
                suffix={s.suffix}
                label={s.label}
                decimals={(s as { decimals?: number }).decimals ?? 0}
                inView={inView}
              />
            </motion.div>
          ))}
        </div>
        <p className="mt-8 text-center text-body-sm text-[var(--text-dim)]">
          Your data is encrypted with 256-bit AES. We never sell your information.
        </p>
      </div>
    </section>
  );
}
