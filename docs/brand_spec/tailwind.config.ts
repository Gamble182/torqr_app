// ============================================================
// torqr – tailwind.config.ts
// Erweitert die Tailwind-Basis mit dem Torqr Brand System
// ============================================================
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {

      // ------------------------------------------------------
      // Farben
      // ------------------------------------------------------
      colors: {
        brand: {
          50:      "#E6F2E6",
          100:     "#CCDFCC",
          200:     "#99CC99",
          400:     "#4DA64D",
          DEFAULT: "#008000",
          600:     "#006600",
          700:     "#004D00",
        },
        accent: {
          light:   "#FAC775",
          DEFAULT: "#EF9F27",
          dark:    "#BA7517",
          surface: "#FAEEDA",
        },
        status: {
          "ok-bg":       "#E6F2E6",
          "ok-border":   "#99CC99",
          "ok-text":     "#006600",
          "due-bg":      "#FAEEDA",
          "due-border":  "#FAC775",
          "due-text":    "#633806",
          "overdue-bg":  "#FAECE7",
          "overdue-border":"#F5C4B3",
          "overdue-text":"#712B13",
          "info-bg":     "#E6F1FB",
          "info-border": "#B5D4F4",
          "info-text":   "#0C447C",
        },
      },

      // ------------------------------------------------------
      // Typografie
      // ------------------------------------------------------
      fontFamily: {
        sans: ["'Segoe UI'", "system-ui", "-apple-system", "sans-serif"],
      },

      fontSize: {
        xs:   ["11px", { lineHeight: "1.4" }],
        sm:   ["13px", { lineHeight: "1.5" }],
        base: ["14px", { lineHeight: "1.6" }],
        md:   ["16px", { lineHeight: "1.6" }],
        lg:   ["18px", { lineHeight: "1.4" }],
        xl:   ["22px", { lineHeight: "1.3" }],
        "2xl":["28px", { lineHeight: "1.2" }],
        "3xl":["36px", { lineHeight: "1.1" }],
      },

      // ------------------------------------------------------
      // Border Radius
      // ------------------------------------------------------
      borderRadius: {
        sm:     "6px",
        DEFAULT:"8px",
        md:     "8px",
        lg:     "12px",
        xl:     "16px",
        "2xl":  "22px",
      },

      // ------------------------------------------------------
      // Box Shadow
      // ------------------------------------------------------
      boxShadow: {
        sm:  "0 1px 3px rgba(0,0,0,0.08)",
        DEFAULT:"0 4px 12px rgba(0,0,0,0.10)",
        lg:  "0 8px 24px rgba(0,0,0,0.12)",
      },

      // ------------------------------------------------------
      // Spacing (ergänzend)
      // ------------------------------------------------------
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },

    },
  },
  plugins: [],
};

export default config;
