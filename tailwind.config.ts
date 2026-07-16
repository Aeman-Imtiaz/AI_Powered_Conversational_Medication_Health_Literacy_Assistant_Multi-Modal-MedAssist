import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f9fb",
          100: "#e4f1f5",
          200: "#c7e0e8",
          300: "#9bc8d2",
          400: "#6faab3",
          500: "#4e8791",
          600: "#3d6d76",
          700: "#35585f",
          800: "#29454c",
          900: "#21363d",
        },
        accent: {
          50: "#f2fbf8",
          100: "#dff6ee",
          200: "#bfe9db",
          300: "#92d8c1",
          400: "#5ec0a1",
          500: "#3ca47f",
          600: "#2e8366",
          700: "#286d55",
          800: "#215645",
          900: "#1d473a",
        },
        medical: {
          bg: "#f7fbfc",
          surface: "#ffffff",
          surfaceAlt: "#eef6f8",
          border: "#d9e7eb",
          text: "#15353d",
          muted: "#5c7077",
          success: "#2d7a5d",
          warning: "#b06000",
          danger: "#b42318",
        },
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.6rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.375rem" }],
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "Segoe UI", "sans-serif"],
        urdu: ["Noto Naskh Arabic", "Segoe UI", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 32px rgba(21, 53, 61, 0.08)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
