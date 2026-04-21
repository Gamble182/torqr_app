// ============================================================
// TorqrIcon.tsx – App-Icon Komponente
// Puls/Diagnose-Icon · Grün + Bernstein-Akzent
// ============================================================
import React from "react";

type IconSize = "sm" | "md" | "lg" | "xl" | "2xl";
type IconVariant = "default" | "dark" | "ghost";

interface TorqrIconProps {
  /** Vordefinierte Größen: sm=20, md=32, lg=48, xl=72, 2xl=96 */
  size?: IconSize | number;
  /** default = grün, dark = dunkelgrün, ghost = halbtransparent (für grüne Hintergründe) */
  variant?: IconVariant;
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
}

const SIZE_MAP: Record<IconSize, number> = {
  sm:  20,
  md:  32,
  lg:  48,
  xl:  72,
  "2xl": 96,
};

const BG_MAP: Record<IconVariant, string> = {
  default: "#008000",
  dark:    "#004D00",
  ghost:   "rgba(255,255,255,0.15)",
};

export const TorqrIcon: React.FC<TorqrIconProps> = ({
  size = "md",
  variant = "default",
  className,
  style,
  "aria-label": ariaLabel = "Torqr App Icon",
}) => {
  const px = typeof size === "number" ? size : SIZE_MAP[size];
  const bg = BG_MAP[variant];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Hintergrund */}
      <rect width="96" height="96" rx="22" fill={bg} />

      {/* Puls-Linie */}
      <polyline
        points="12,48 26,48 32,22 40,74 48,36 54,58 60,48 84,48"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bernstein-Akzent Punkt am Peak */}
      <circle cx="54" cy="58" r="6" fill="#EF9F27" />
    </svg>
  );
};

// ============================================================
// TorqrWordmark.tsx – Logo mit Schriftzug
// ============================================================
interface TorqrWordmarkProps {
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark" | "green";
  showTagline?: boolean;
  className?: string;
}

const WORDMARK_SIZES = {
  sm: { icon: 28, wordmark: 24, tagline: 10 },
  md: { icon: 36, wordmark: 32, tagline: 11 },
  lg: { icon: 48, wordmark: 40, tagline: 12 },
};

const WORDMARK_THEMES = {
  light: { text: "#1A1A1A", tagline: "#008000",  iconVariant: "default" as IconVariant },
  dark:  { text: "#FFFFFF", tagline: "rgba(255,255,255,0.6)", iconVariant: "dark" as IconVariant },
  green: { text: "#FFFFFF", tagline: "rgba(255,255,255,0.65)", iconVariant: "ghost" as IconVariant },
};

export const TorqrWordmark: React.FC<TorqrWordmarkProps> = ({
  size = "md",
  theme = "light",
  showTagline = true,
  className,
}) => {
  const s = WORDMARK_SIZES[size];
  const t = WORDMARK_THEMES[theme];

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: `${s.icon * 0.3}px`,
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      <TorqrIcon size={s.icon} variant={t.iconVariant} />
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        <span
          style={{
            fontSize: `${s.wordmark}px`,
            fontWeight: 600,
            color: t.text,
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          torqr
        </span>
        {showTagline && (
          <span
            style={{
              fontSize: `${s.tagline}px`,
              fontWeight: 400,
              color: t.tagline,
              letterSpacing: "1.5px",
              textTransform: "uppercase" as const,
              lineHeight: 1,
            }}
          >
            Wartungsmanagement
          </span>
        )}
      </div>
    </div>
  );
};

export default TorqrIcon;
