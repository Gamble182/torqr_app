// ============================================================
// torqr – Brand Configuration
// Farbkonzept C: Grün & Bernstein · Puls-Icon · Segoe UI
// ============================================================

export const brand = {

  // ----------------------------------------------------------
  // Farben
  // ----------------------------------------------------------
  colors: {
    // Primär – Grün
    primary:      "#008000",
    primaryDark:  "#006600",
    primaryDeep:  "#004D00",
    primaryLight: "#4DA64D",
    surface:      "#E6F2E6",

    // Akzent – Bernstein
    accent:       "#EF9F27",
    accentLight:  "#FAC775",
    accentSurface:"#FAEEDA",

    // Neutral
    textPrimary:  "#1A1A1A",
    textSecondary:"#5C5C5C",
    textTertiary: "#9A9A9A",
    background:   "#FFFFFF",
    backgroundAlt:"#F7F7F7",
    border:       "#E0E0E0",

    // Status-Semantik
    status: {
      ok:          { bg: "#E6F2E6", border: "#99CC99", text: "#006600" },
      due:         { bg: "#FAEEDA", border: "#FAC775", text: "#633806" },
      overdue:     { bg: "#FAECE7", border: "#F5C4B3", text: "#712B13" },
      info:        { bg: "#E6F1FB", border: "#B5D4F4", text: "#0C447C" },
    },
  },

  // ----------------------------------------------------------
  // Typografie
  // ----------------------------------------------------------
  typography: {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    fontWeights: {
      regular:  400,
      medium:   500,
      semibold: 600,
      bold:     700,
    },
    sizes: {
      xs:   "11px",
      sm:   "13px",
      base: "14px",
      md:   "16px",
      lg:   "18px",
      xl:   "22px",
      "2xl":"28px",
      "3xl":"36px",
    },
    lineHeight: {
      tight:  1.3,
      normal: 1.6,
      relaxed:1.8,
    },
  },

  // ----------------------------------------------------------
  // Spacing & Layout
  // ----------------------------------------------------------
  spacing: {
    xs:  "4px",
    sm:  "8px",
    md:  "12px",
    lg:  "16px",
    xl:  "24px",
    "2xl":"32px",
    "3xl":"48px",
  },

  borderRadius: {
    sm:   "6px",
    md:   "8px",
    lg:   "12px",
    xl:   "16px",
    "2xl":"22px",   // App-Icon
    full: "9999px", // Pills
  },

  // ----------------------------------------------------------
  // Schatten
  // ----------------------------------------------------------
  shadows: {
    sm:  "0 1px 3px rgba(0,0,0,0.08)",
    md:  "0 4px 12px rgba(0,0,0,0.10)",
    lg:  "0 8px 24px rgba(0,0,0,0.12)",
  },

  // ----------------------------------------------------------
  // Brand-Texte
  // ----------------------------------------------------------
  copy: {
    appName:  "torqr",
    tagline:  "Wartungsmanagement",
    taglineFull: "Heizungswartung · einfach · automatisch",
  },

} as const;

export type BrandConfig = typeof brand;
export default brand;
