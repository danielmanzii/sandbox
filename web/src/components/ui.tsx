"use client";

import { type CSSProperties, type ReactNode } from "react";

// ─── Button ──────────────────────────────────────────────

type ButtonVariant = "primary" | "forest" | "clay" | "ghost" | "outline" | "outlineCream";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  style?: CSSProperties;
  disabled?: boolean;
  icon?: ReactNode;
};

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  full,
  style,
  disabled,
  icon,
}: ButtonProps) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "var(--font-body)",
    fontWeight: 700,
    borderRadius: 999,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "transform .12s, opacity .15s, background .15s",
    opacity: disabled ? 0.5 : 1,
    letterSpacing: "0.01em",
    width: full ? "100%" : "auto",
    border: "none",
    whiteSpace: "nowrap",
  };
  const sizes: Record<ButtonSize, CSSProperties> = {
    sm: { padding: "8px 14px", fontSize: 13 },
    md: { padding: "13px 20px", fontSize: 15 },
    lg: { padding: "17px 24px", fontSize: 16 },
  };
  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: { background: "var(--cream)", color: "var(--forest)" },
    forest: { background: "var(--forest)", color: "var(--cream)" },
    clay: { background: "var(--clay)", color: "var(--forest-deep)" },
    ghost: { background: "rgba(234,226,206,0.12)", color: "var(--cream)", border: "1px solid rgba(234,226,206,0.3)" },
    outline: { background: "transparent", color: "var(--forest)", border: "1.5px solid var(--forest)" },
    outlineCream: { background: "transparent", color: "var(--cream)", border: "1.5px solid var(--cream)" },
  };
  return (
    <button
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {icon}
      {children}
    </button>
  );
}

// ─── Eyebrow / uppercase micro-label ─────────────────────

export function Eyebrow({
  children,
  color = "currentColor",
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color,
        opacity: 0.7,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Chip / Pill ─────────────────────────────────────────

type ChipVariant = "default" | "cream" | "forest" | "clay" | "ghost" | "ghostDark";

export function Chip({
  children,
  variant = "default",
  icon,
  style,
}: {
  children: ReactNode;
  variant?: ChipVariant;
  icon?: ReactNode;
  style?: CSSProperties;
}) {
  const variants: Record<ChipVariant, CSSProperties> = {
    default: { background: "rgba(14,28,19,0.08)", color: "var(--forest)" },
    cream: { background: "var(--cream)", color: "var(--forest)" },
    forest: { background: "var(--forest)", color: "var(--cream)" },
    clay: { background: "var(--clay)", color: "var(--forest-deep)" },
    ghost: { background: "rgba(234,226,206,0.14)", color: "var(--cream)", border: "1px solid rgba(234,226,206,0.25)" },
    ghostDark: { background: "rgba(14,28,19,0.08)", color: "var(--forest)", border: "1px solid rgba(14,28,19,0.12)" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        lineHeight: 1.1,
        ...variants[variant],
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  );
}

// ─── Dashed divider ──────────────────────────────────────

export function Dashed({ color = "currentColor", style }: { color?: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        height: 1,
        width: "100%",
        backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 12px)`,
        opacity: 0.25,
        ...style,
      }}
    />
  );
}

// ─── Animated live dot ───────────────────────────────────
// Keyframes live in globals.css (@keyframes live-pulse).

export function LiveDot({ color = "var(--clay)" }: { color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 0 0 ${color}`,
          animation: "live-pulse 1.6s ease-out infinite",
        }}
      />
    </span>
  );
}

// ─── Sparkline ───────────────────────────────────────────

export function Spark({
  data,
  width = 60,
  height = 20,
  color = "currentColor",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data || !data.length) return null;
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const rng = mx - mn || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - 2) + 1;
      const y = height - 1 - ((v - mn) / rng) * (height - 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Score dial ──────────────────────────────────────────

export function ScoreDial({
  value,
  max = 54,
  min = 27,
  label,
  color = "var(--forest)",
  size = 120,
}: {
  value: number;
  max?: number;
  min?: number;
  label?: string;
  color?: string;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(1, (max - value) / (max - min)));
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(14,28,19,0.1)" strokeWidth="6" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontSize: size * 0.35, color, lineHeight: 1 }}>{value}</div>
        {label && (
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontWeight: 700,
              opacity: 0.6,
              marginTop: 2,
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
