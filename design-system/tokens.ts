/**
 * Design system tokens — single source of truth for spacing, typography, motion.
 * Used by Tailwind config and components.
 */
export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
  24: "96px",
} as const;

export const motion = {
  micro: 120,
  short: 240,
  medium: 400,
  long: 600,
} as const;

export const easing = {
  entrance: "cubic-bezier(0.2, 0.9, 0.3, 1)",
  subtle: "cubic-bezier(0.25, 0.8, 0.25, 1)",
} as const;

export const fontWeights = {
  body: 400,
  heading: 600,
} as const;
