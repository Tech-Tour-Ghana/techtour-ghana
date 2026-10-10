import type { Config } from "tailwindcss";

// Colours are read from the CSS custom properties in app/globals.css rather
// than declared here, so there is one source of truth and the three themes
// switch without a parallel set of Tailwind classes. design.md part A2 has the
// values and where they came from.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Fluid type: lg and up scale smoothly between a phone and a wide desktop
      // (about 360px to 1440px) instead of jumping at breakpoints.
      fontSize: {
        lg: ["clamp(1.0625rem, 1.02rem + 0.2vw, 1.125rem)", { lineHeight: "1.6" }],
        xl: ["clamp(1.125rem, 1.05rem + 0.4vw, 1.25rem)", { lineHeight: "1.5" }],
        "2xl": ["clamp(1.25rem, 1.1rem + 0.7vw, 1.5rem)", { lineHeight: "1.3" }],
        "3xl": ["clamp(1.5rem, 1.25rem + 1.2vw, 1.875rem)", { lineHeight: "1.2" }],
        "4xl": ["clamp(1.75rem, 1.4rem + 1.8vw, 2.25rem)", { lineHeight: "1.15" }],
        "5xl": ["clamp(2rem, 1.5rem + 2.6vw, 3rem)", { lineHeight: "1.1" }],
        "6xl": ["clamp(2.25rem, 1.6rem + 3.4vw, 3.75rem)", { lineHeight: "1.05" }],
        "7xl": ["clamp(2.5rem, 1.7rem + 4.2vw, 4.5rem)", { lineHeight: "1.05" }],
      },
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
        },
        ink: {
          DEFAULT: "var(--color-ink)",
          raised: "var(--color-ink-raised)",
        },
        surface: "var(--surface)",
        canvas: "var(--bg)",
        "canvas-subtle": "var(--bg-subtle)",
        body: "var(--text)",
        muted: "var(--text-muted)",
        subtle: "var(--text-subtle)",
        line: "var(--border)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
      },
    },
  },
  plugins: [],
};

export default config;
