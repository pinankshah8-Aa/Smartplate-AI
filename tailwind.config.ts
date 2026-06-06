import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        muted: "var(--muted)",
        border: "var(--border)",
        primary: {
          DEFAULT: "#22c55e",
          dark: "#16a34a",
          light: "#dcfce7",
        },
        danger: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6"
      },
    },
  },
  plugins: [],
};
export default config;
