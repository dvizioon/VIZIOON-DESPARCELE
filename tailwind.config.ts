import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1a1612",
        paper: "#f4efe6",
        card: "#fffcf7",
        line: "#e4d8c8",
        pine: {
          DEFAULT: "#0c6b5c",
          dark: "#08483e",
          soft: "#d7efe8",
        },
        clay: "#c05621",
        moss: "#2d6a4f",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        sheet: "0 18px 40px -24px rgba(26, 22, 18, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
