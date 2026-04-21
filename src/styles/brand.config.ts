export const brand = {
  colors: {
    primary: "#008000",
    primaryDark: "#006600",
    primaryDeep: "#004D00",
    primaryLight: "#4DA64D",
    surface: "#E6F2E6",

    accent: "#EF9F27",
    accentLight: "#FAC775",
    accentSurface: "#FAEEDA",

    textPrimary: "#1A1A1A",
    textSecondary: "#5C5C5C",
    textTertiary: "#9A9A9A",
    background: "#FFFFFF",
    backgroundAlt: "#F7F7F7",
    border: "#E0E0E0",

    status: {
      ok: { bg: "#E6F2E6", border: "#99CC99", text: "#006600" },
      due: { bg: "#FAEEDA", border: "#FAC775", text: "#633806" },
      overdue: { bg: "#FAECE7", border: "#F5C4B3", text: "#712B13" },
      info: { bg: "#E6F1FB", border: "#B5D4F4", text: "#0C447C" },
    },
  },

  typography: {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  borderRadius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "22px",
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 3px rgba(0,0,0,0.08)",
    md: "0 4px 12px rgba(0,0,0,0.10)",
    lg: "0 8px 24px rgba(0,0,0,0.12)",
  },

  copy: {
    appName: "torqr",
    tagline: "Wartungsmanagement",
    taglineFull: "Heizungswartung · einfach · automatisch",
  },
} as const;

export type BrandConfig = typeof brand;
export default brand;
