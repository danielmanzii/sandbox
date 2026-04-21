// Icon set — ported 1:1 from root components/primitives.jsx Icon object.

type IconProps = { size?: number; color?: string };
type FilledIconProps = IconProps & { filled?: boolean };

export const Flag = ({ size = 20, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 3v18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M5 4c3-1 6 2 9 1s4-1 5-1v8c-1 0-2 1-5 1s-6-2-9-1V4z" fill={color} />
    <circle cx="5" cy="21" r="1.6" fill={color} />
  </svg>
);

export const Home = ({ size = 22, color = "currentColor", filled = false }: FilledIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={filled ? color : "none"} />
  </svg>
);

export const Tee = ({ size = 22, color = "currentColor", filled = false }: FilledIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="6.5" r="3.5" stroke={color} strokeWidth="2" fill={filled ? color : "none"} />
    <path d="M8 10c1 2 2 3 4 3s3-1 4-3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M12 13v7M8 20h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Chart = ({ size = 22, color = "currentColor", filled = false }: FilledIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="12" width="4" height="9" rx="1" stroke={color} strokeWidth="2" fill={filled ? color : "none"} />
    <rect x="10" y="7" width="4" height="14" rx="1" stroke={color} strokeWidth="2" fill={filled ? color : "none"} />
    <rect x="17" y="3" width="4" height="18" rx="1" stroke={color} strokeWidth="2" fill={filled ? color : "none"} />
  </svg>
);

export const Users = ({ size = 22, color = "currentColor", filled = false }: FilledIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="8" r="3.5" stroke={color} strokeWidth="2" fill={filled ? color : "none"} />
    <path d="M2 21c0-4 3-6 7-6s7 2 7 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="17" cy="7" r="2.5" stroke={color} strokeWidth="2" fill={filled ? color : "none"} />
    <path d="M17 13c3 0 5 2 5 5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const User = ({ size = 22, color = "currentColor", filled = false }: FilledIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill={filled ? color : "none"} />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ArrowRight = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ArrowLeft = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M11 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Chevron = ({
  size = 14,
  color = "currentColor",
  dir = "right",
}: IconProps & { dir?: "right" | "left" | "up" | "down" }) => {
  const rot = { right: 0, left: 180, up: -90, down: 90 }[dir];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const Plus = ({ size = 18, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const Close = ({ size = 18, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const Check = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Lock = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="11" width="16" height="10" rx="2" stroke={color} strokeWidth="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Share = ({ size = 18, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3v13M12 3l-4 4M12 3l4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Bolt = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill={color} />
  </svg>
);

export const Fire = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2s4 4 4 8c0 2-1 3-2 3s-2-1-2-3c0-1 0-2 1-3-3 2-5 5-5 8a6 6 0 0 0 12 0c0-6-8-9-8-13z" fill={color} />
  </svg>
);

export const Pin = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 22s-7-7-7-13a7 7 0 0 1 14 0c0 6-7 13-7 13z" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="12" cy="9" r="2.5" fill={color} />
  </svg>
);

export const Clock = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Calendar = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
    <path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Trophy = ({ size = 18, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill="none" />
    <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M9 20h6M12 14v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Ball = ({ size = 14, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" fill="#FFF8E8" />
    <circle cx="9" cy="10" r="0.7" fill={color} />
    <circle cx="13" cy="9" r="0.7" fill={color} />
    <circle cx="11" cy="13" r="0.7" fill={color} />
    <circle cx="15" cy="13" r="0.7" fill={color} />
    <circle cx="9" cy="15" r="0.7" fill={color} />
    <circle cx="13" cy="16" r="0.7" fill={color} />
  </svg>
);

export const Dot = ({ size = 6, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill={color} /></svg>
);

export const Streak = ({ size = 16, color = "currentColor" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12c3-2 5-6 5-10 4 4 4 8 6 10s4 4 4 8a8 8 0 0 1-16 0c0-3 1-5 1-8z" fill={color} />
  </svg>
);
