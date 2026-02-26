import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050505",
        "bg-card": "#111111",
        "bg-elevated": "#191919",
        border: "#1e1e1e",
        "border-hover": "#2a2a2a",
        accent: "#FF4000",
        "accent-hover": "#FF5C26",
        "text-primary": "#e8e8e8",
        "text-muted": "#737373",
        "text-dim": "#525252",
        success: "#10b981",
        danger: "#ef4444",
        warn: "#f59e0b",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", '"SF Pro Text"', '"Segoe UI"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
