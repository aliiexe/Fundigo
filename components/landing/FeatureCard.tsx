"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  index: number;
}

export function FeatureCard({ title, description, icon, index }: FeatureCardProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: reducedMotion ? 0 : 0.4,
        delay: reducedMotion ? 0 : index * 0.12,
        ease: [0.2, 0.9, 0.3, 1],
      }}
      whileHover={reducedMotion ? undefined : { y: -6 }}
      className="group relative rounded-xl border border-white/10 bg-bg-card/80 p-6 shadow-card backdrop-blur-sm transition-shadow duration-short hover:shadow-card-hover hover:ring-[3px] hover:ring-accent/30 sm:p-7 focus-within:ring-[3px] focus-within:ring-accent/30"
      style={{ willChange: reducedMotion ? "auto" : "transform" }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors duration-short group-hover:bg-accent/20"
        aria-hidden
      >
        {icon}
      </div>
      <h3 className="mt-4 text-heading text-[var(--text)]">{title}</h3>
      <p className="mt-2 text-body-sm text-[var(--text-muted)] leading-relaxed">{description}</p>
    </motion.article>
  );
}
