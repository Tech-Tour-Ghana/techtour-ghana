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
