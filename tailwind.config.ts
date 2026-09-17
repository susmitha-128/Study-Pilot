import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // StudyGoal AI dark, futuristic palette
        ink: "#070B14",        // near-black navy background
        panel: "#0D1420",      // card / panel surface
        panel2: "#121A2B",     // raised surface
        line: "#1D2740",       // hairline borders
        cyan: {
          DEFAULT: "#3FD8E0",
          dim: "#1F5A5F",
        },
        signal: "#7C9CFF",     // secondary glow accent (indigo-blue)
        mint: "#5FE0A6",       // success / mastery
        amber: "#E0A93F",      // caution / needs practice
        coral: "#E05F5F",      // weak / error
        mist: "#8DA0C4",       // muted text
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(63,216,224,0.35)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(63,216,224,0.15), transparent)",
      },
    },
  },
  plugins: [],
};
export default config;
