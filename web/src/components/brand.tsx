import { type CSSProperties } from "react";

type BrandVariant = "forest" | "cream" | "white";

// ─── Ostrich mascot ──────────────────────────────────────
// Uses the SVGs under /public/assets.
// `kind="full"` uses the full-body mascot, `kind="s"` uses the S monogram variant.
// `variant` selects the ink color: cream for dark backgrounds, forest for light.

export function Ostrich({
  size = 64,
  variant = "cream",
  kind = "full",
  style,
}: {
  size?: number;
  variant?: "cream" | "forest";
  kind?: "full" | "s" | "S";
  style?: CSSProperties;
}) {
  const k = kind === "S" || kind === "s" ? "s" : "full";
  const v = variant === "forest" ? "forest" : "cream";
  const src = `/assets/mascot-${k}-${v}.svg`;
  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: "auto", display: "block", ...style }}
    />
  );
}

// ─── Wordmark ("SANDBOX") ────────────────────────────────
// variant: 'forest' for cream/paper bg, 'cream' for forest bg, 'white' for photo/dark bg

export function Wordmark({
  size = 140,
  variant = "forest",
  style,
}: {
  size?: number;
  variant?: BrandVariant;
  style?: CSSProperties;
}) {
  const src = `/assets/wordmark-${variant}.svg`;
  return (
    <img
      src={src}
      alt="SANDBOX"
      style={{ width: size, height: "auto", display: "block", ...style }}
    />
  );
}

// ─── Full lockup (SANDBOX + Pitch & Putt) ────────────────

export function Lockup({
  size = 200,
  variant = "forest",
  style,
}: {
  size?: number;
  variant?: BrandVariant;
  style?: CSSProperties;
}) {
  const src = `/assets/lockup-${variant}.svg`;
  return (
    <img
      src={src}
      alt="Sandbox Pitch & Putt"
      style={{ width: size, height: "auto", display: "block", ...style }}
    />
  );
}

// ─── SPP monogram (inline SVG, no asset file) ────────────

export function SppMark({ size = 28, color = "var(--cream)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" fill="none" aria-hidden="true">
      <path
        d="M50 8c22 0 38 12 38 30 0 11-8 18-22 18h-8c-8 0-12 3-12 8s4 7 11 7h14c18 0 30 10 30 24 0 14-14 24-34 24-19 0-36-7-36-22 0-5 3-10 8-12 3-1 6 0 6 4 0 8 10 14 22 14 11 0 20-5 20-12 0-6-5-9-15-9H56c-19 0-29-9-29-22 0-10 7-18 20-20 4-1 6-3 6-7s-4-7-11-7c-9 0-15 3-16 9-1 5-5 7-8 7-5 0-8-4-8-10 0-14 16-24 40-24z"
        fill={color}
      />
    </svg>
  );
}
