/* global React */
// Shared primitive components for Sandbox Pitch & Putt app

// ─── Display helpers ─────────────────────────────────────
// Always renders a handle with a leading @, regardless of how it's
// stored ("rob" or "@rob" both → "@rob"). Returns '' for falsy input.
function formatHandle(h) {
  if (!h) return '';
  const s = String(h).trim();
  return s.startsWith('@') ? s : `@${s}`;
}

// ─── Icons ──────────────────────────────────────────────
const Icon = {
  Flag: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 3v18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M5 4c3-1 6 2 9 1s4-1 5-1v8c-1 0-2 1-5 1s-6-2-9-1V4z" fill={color}/>
      <circle cx="5" cy="21" r="1.6" fill={color}/>
    </svg>
  ),
  Home: ({ size = 22, color = 'currentColor', filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={filled ? color : 'none'}/>
    </svg>
  ),
  Tee: ({ size = 22, color = 'currentColor', filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="6.5" r="3.5" stroke={color} strokeWidth="2" fill={filled ? color : 'none'}/>
      <path d="M8 10c1 2 2 3 4 3s3-1 4-3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 13v7M8 20h8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Chart: ({ size = 22, color = 'currentColor', filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1" stroke={color} strokeWidth="2" fill={filled ? color : 'none'}/>
      <rect x="10" y="7" width="4" height="14" rx="1" stroke={color} strokeWidth="2" fill={filled ? color : 'none'}/>
      <rect x="17" y="3" width="4" height="18" rx="1" stroke={color} strokeWidth="2" fill={filled ? color : 'none'}/>
    </svg>
  ),
  Users: ({ size = 22, color = 'currentColor', filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.5" stroke={color} strokeWidth="2" fill={filled ? color : 'none'}/>
      <path d="M2 21c0-4 3-6 7-6s7 2 7 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="17" cy="7" r="2.5" stroke={color} strokeWidth="2" fill={filled ? color : 'none'}/>
      <path d="M17 13c3 0 5 2 5 5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  User: ({ size = 22, color = 'currentColor', filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill={filled ? color : 'none'}/>
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  ArrowRight: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ArrowLeft: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M11 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Chevron: ({ size = 14, color = 'currentColor', dir = 'right' }) => {
    const rot = { right: 0, left: 180, up: -90, down: 90 }[dir];
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${rot}deg)` }}>
        <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  },
  Plus: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ),
  Close: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  ),
  Check: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Lock: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="11" width="16" height="10" rx="2" stroke={color} strokeWidth="2"/>
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Share: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v13M12 3l-4 4M12 3l4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Bolt: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill={color}/>
    </svg>
  ),
  Fire: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2s4 4 4 8c0 2-1 3-2 3s-2-1-2-3c0-1 0-2 1-3-3 2-5 5-5 8a6 6 0 0 0 12 0c0-6-8-9-8-13z" fill={color}/>
    </svg>
  ),
  Pin: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s-7-7-7-13a7 7 0 0 1 14 0c0 6-7 13-7 13z" stroke={color} strokeWidth="2" fill="none"/>
      <circle cx="12" cy="9" r="2.5" fill={color}/>
    </svg>
  ),
  Clock: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
      <path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Calendar: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="2"/>
      <path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Trophy: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill="none"/>
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 20h6M12 14v6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  Ball: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" fill="#FFF8E8"/>
      <circle cx="9" cy="10" r="0.7" fill={color}/>
      <circle cx="13" cy="9" r="0.7" fill={color}/>
      <circle cx="11" cy="13" r="0.7" fill={color}/>
      <circle cx="15" cy="13" r="0.7" fill={color}/>
      <circle cx="9" cy="15" r="0.7" fill={color}/>
      <circle cx="13" cy="16" r="0.7" fill={color}/>
    </svg>
  ),
  Dot: ({ size = 6, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill={color}/></svg>
  ),
  Streak: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12c3-2 5-6 5-10 4 4 4 8 6 10s4 4 4 8a8 8 0 0 1-16 0c0-3 1-5 1-8z" fill={color}/>
    </svg>
  ),
  Search: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/>
      <path d="m20 20-3.5-3.5"/>
    </svg>
  ),
};

// ─── Live dot ────────────────────────────────────────────
function LiveDot({ color = 'var(--clay)' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: color,
        boxShadow: `0 0 0 0 ${color}`,
        animation: 'live-pulse 1.6s ease-out infinite',
      }}/>
      <style>{`
        @keyframes live-pulse {
          0% { box-shadow: 0 0 0 0 rgba(200,100,40,0.55); }
          70% { box-shadow: 0 0 0 8px rgba(200,100,40,0); }
          100% { box-shadow: 0 0 0 0 rgba(200,100,40,0); }
        }
      `}</style>
    </span>
  );
}

// ─── SPP monogram (small) ────────────────────────────────
function SppMark({ size = 28, color = 'var(--cream)' }) {
  // blob S monogram, approximated from deck
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" fill="none" aria-hidden="true">
      <path d="M50 8c22 0 38 12 38 30 0 11-8 18-22 18h-8c-8 0-12 3-12 8s4 7 11 7h14c18 0 30 10 30 24 0 14-14 24-34 24-19 0-36-7-36-22 0-5 3-10 8-12 3-1 6 0 6 4 0 8 10 14 22 14 11 0 20-5 20-12 0-6-5-9-15-9H56c-19 0-29-9-29-22 0-10 7-18 20-20 4-1 6-3 6-7s-4-7-11-7c-9 0-15 3-16 9-1 5-5 7-8 7-5 0-8-4-8-10 0-14 16-24 40-24z"
            fill={color}/>
    </svg>
  );
}

// ─── Button ──────────────────────────────────────────────
function Button({ children, onClick, variant = 'primary', size = 'md', full, style, disabled, icon }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'var(--font-body)', fontWeight: 700,
    borderRadius: 999, cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform .12s, opacity .15s, background .15s',
    opacity: disabled ? 0.5 : 1,
    letterSpacing: '0.01em',
    width: full ? '100%' : 'auto',
    border: 'none',
    whiteSpace: 'nowrap',
  };
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13 },
    md: { padding: '13px 20px', fontSize: 15 },
    lg: { padding: '17px 24px', fontSize: 16 },
  };
  const variants = {
    primary: { background: 'var(--cream)', color: 'var(--forest)' },
    paper:   { background: 'var(--paper)', color: 'var(--forest)' },
    forest: { background: 'var(--forest)', color: 'var(--cream)' },
    clay: { background: 'var(--clay)', color: 'var(--forest-deep)' },
    ghost: { background: 'rgba(234,226,206,0.12)', color: 'var(--cream)', border: '1px solid rgba(234,226,206,0.3)' },
    outline: { background: 'transparent', color: 'var(--forest)', border: '1.5px solid var(--forest)' },
    outlineCream: { background: 'transparent', color: 'var(--cream)', border: '1.5px solid var(--cream)' },
    outlineWhite: { background: 'transparent', color: 'var(--paper)', border: '1.5px solid var(--paper)' },
  };
  return (
    <button
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={e => (e.currentTarget.style.transform = '')}
      onMouseLeave={e => (e.currentTarget.style.transform = '')}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {icon}
      {children}
    </button>
  );
}

// ─── Eyebrow / Label ─────────────────────────────────────
function Eyebrow({ children, color = 'currentColor', style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
      letterSpacing: '0.22em', textTransform: 'uppercase', color, opacity: 0.7,
      ...style,
    }}>{children}</div>
  );
}

// ─── Chip / Pill ─────────────────────────────────────────
function Chip({ children, variant = 'default', icon, style }) {
  const variants = {
    default: { background: 'rgba(14,28,19,0.08)', color: 'var(--forest)' },
    cream: { background: 'var(--cream)', color: 'var(--forest)' },
    forest: { background: 'var(--forest)', color: 'var(--cream)' },
    clay: { background: 'var(--clay)', color: 'var(--forest-deep)' },
    ghost: { background: 'rgba(234,226,206,0.14)', color: 'var(--cream)', border: '1px solid rgba(234,226,206,0.25)' },
    ghostDark: { background: 'rgba(14,28,19,0.08)', color: 'var(--forest)', border: '1px solid rgba(14,28,19,0.12)' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.04em', lineHeight: 1.1,
      ...variants[variant], ...style,
    }}>
      {icon}{children}
    </span>
  );
}

// ─── Divider with dashes ─────────────────────────────────
function Dashed({ color = 'currentColor', style }) {
  return (
    <div style={{
      height: 1, width: '100%',
      backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 12px)`,
      opacity: 0.25,
      ...style,
    }}/>
  );
}

// ─── Ostrich mark (uses image asset) ─────────────────────
function Ostrich({ size = 64, variant = 'cream', kind = 'full', style }) {
  const src = `assets/mascot-${kind === 'S' ? 's' : 'full'}-${variant === 'forest' ? 'forest' : 'cream'}.svg`;
  return <img src={src} alt="" style={{ width: size, height: 'auto', display: 'block', ...style }}/>;
}

// ─── Wordmark (brand SVG: "SANDBOX") ─────────────────────
// variant: 'forest' for cream/paper bg, 'cream' for forest bg, 'white' for photo/dark bg
function Wordmark({ size = 140, variant = 'forest', style }) {
  const src = `assets/wordmark-${variant}.svg`;
  return <img src={src} alt="SANDBOX" style={{ width: size, height: 'auto', display: 'block', ...style }}/>;
}

// ─── Full Lockup (SANDBOX + Pitch & Putt) ────────────────
function Lockup({ size = 200, variant = 'forest', style }) {
  const src = `assets/lockup-${variant}.svg`;
  return <img src={src} alt="Sandbox Pitch & Putt" style={{ width: size, height: 'auto', display: 'block', ...style }}/>;
}

// ─── Score dial ──────────────────────────────────────────
function ScoreDial({ value, max = 54, min = 27, label, color = 'var(--forest)', size = 120 }) {
  const pct = Math.max(0, Math.min(1, (max - value) / (max - min)));
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(14,28,19,0.1)" strokeWidth="6" fill="none"/>
        <circle cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth="6" fill="none" strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: size * 0.35, color, lineHeight: 1 }}>{value}</div>
        {label && <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, opacity: 0.6, marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  );
}

// ─── Tiny sparkline ──────────────────────────────────────
function Spark({ data, width = 60, height = 20, color = 'currentColor' }) {
  if (!data || !data.length) return null;
  const mn = Math.min(...data), mx = Math.max(...data);
  const rng = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - 1 - ((v - mn) / rng) * (height - 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

Object.assign(window, {
  Icon, LiveDot, SppMark, Button, Eyebrow, Chip, Dashed, Ostrich, Wordmark, Lockup, ScoreDial, Spark,
  formatHandle,
});
