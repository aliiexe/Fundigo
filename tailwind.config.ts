import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./design-system/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy (dashboard)
        bg: "#0B0B0D",
        "bg-card": "#141415",
        "bg-elevated": "#1A1A1B",
        border: "#252527",
        "border-hover": "#2e2e30",
        accent: "#FF4000",
        "accent-hover": "#FF9A4D",
        "text-primary": "#FFFFFF",
        "text-muted": "#BDBDBD",
        "text-dim": "#8a8a8c",
        success: "#10b981",
        danger: "#ef4444",
        warn: "#f59e0b",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["clamp(3rem, 5vw + 1rem, 4rem)", { lineHeight: "1.18", fontWeight: "600" }],
        "display-sm": ["clamp(2.125rem, 3vw + 0.5rem, 2.5rem)", { lineHeight: "1.15", fontWeight: "600" }],
        "heading": ["clamp(1.375rem, 2vw + 0.5rem, 1.75rem)", { lineHeight: "1.3", fontWeight: "600" }],
        "body": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
      },
      spacing: {
        "section": "clamp(4rem, 8vw, 6rem)",
        "container": "min(1200px, 100% - 2rem)",
      },
      maxWidth: {
        "content": "1200px",
      },
      transitionDuration: {
        "micro": "120ms",
        "short": "240ms",
        "medium": "400ms",
        "long": "600ms",
      },
      transitionTimingFunction: {
        "entrance": "cubic-bezier(0.2, 0.9, 0.3, 1)",
        "subtle": "cubic-bezier(0.25, 0.8, 0.25, 1)",
      },
      boxShadow: {
        "card": "0 4px 24px -4px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
        "card-hover": "0 12px 40px -8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 3px rgba(255,106,0,0.2)",
        "cta": "0 4px 14px -2px rgba(255,106,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
