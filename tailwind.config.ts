import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Paleta principal: morado, blanco, negro
        primary: {
          DEFAULT: "#7C3AED", // violet-600
          light: "#A78BFA",   // violet-400
          dark: "#5B21B6",    // violet-800
          950: "#2E1065",     // violet-950
        },
        accent: {
          DEFAULT: "#9333EA", // purple-600
          light: "#C084FC",   // purple-400
          dark: "#6B21A8",    // purple-800
        },
        // Estados: verde y rojo
        success: {
          DEFAULT: "#22C55E", // green-500
          light: "#4ADE80",   // green-400
          dark: "#16A34A",    // green-600
        },
        error: {
          DEFAULT: "#EF4444", // red-500
          light: "#F87171",   // red-400
          dark: "#DC2626",    // red-600
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
