/* global React, Icon, LiveDot, SppMark, Button, Eyebrow, Chip, Dashed, Ostrich, Wordmark, ScoreDial, Spark, MOCK */
// V2 Home — airy, swipeable event carousel with a compact feed below.

function HomeScreen({ go, tier, brandLoud, liveMode, mascot }) {
  const isMember = tier === 'league' || tier === 'leaguePlus';
  // Events shown in the carousel: live first, then open, then upcoming/members-only
  const carousel = React.useMemo(() => {
    const live = MOCK.EVENTS.filter(e => e.status === 'live');
    const open = MOCK.EVENTS.filter(e => e.status === 'open');
    const rest = MOCK.EVENTS.filter(e => e.status !== 'live' && e.status !== 'open');
    return [...live, ...open, ...rest].slice(0, 5);
  }, []);

  const [cardIndex, setCardIndex] = React.useState(0);
  const scrollerRef = React.useRef(null);

  // Track which card is centered in the horizontal scroller
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const card = el.querySelector('[data-card]');
      if (!card) return;
      const cardW = card.getBoundingClientRect().width + 14; // gap
      setCardIndex(Math.min(carousel.length - 1, Math.max(0, Math.round(el.scrollLeft / cardW))));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [carousel.length]);

  const activeEvent = carousel[cardIndex];
  const activeIsLive = activeEvent?.status === 'live';
  const activeCanRegister = activeEvent?.status === 'open';

  const firstName = (MOCK.USER.name || 'Alex').split(' ')[0];

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 140, position: 'relative' }}>
      {/* Ambient top-right wash */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, right: 0, width: '85%', height: '46%',
        background: 'radial-gradient(ellipse at 80% 10%, rgba(28,73,42,0.08) 0%, rgba(28,73,42,0.02) 40%, transparent 70%)',
        pointerEvents: 'none',
      }}/>
      {/* Secondary soft rings */}
      <svg aria-hidden="true" style={{ position: 'absolute', top: 40, right: -30, opacity: 0.22, pointerEvents: 'none' }} width="220" height="220" viewBox="0 0 200 200">
        <circle cx="150" cy="50" r="48" fill="none" stroke="var(--forest)" strokeWidth="0.6"/>
        <circle cx="150" cy="50" r="68" fill="none" stroke="var(--forest)" strokeWidth="0.5"/>
        <circle cx="150" cy="50" r="92" fill="none" stroke="var(--forest)" strokeWidth="0.4"/>
      </svg>

      {/* Brand bar — menu left, avatar right */}
      <div style={{ position: 'relative', padding: '58px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button aria-label="Menu" style={{
          width: 44, height: 44, borderRadius: 999,
          background: 'var(--paper)',
          border: 'var(--hairline)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--forest)',
        }}>
          <svg width="18" height="14" viewBox="0 0 24 18" fill="none">
            <path d="M2 3h20M2 9h14M2 15h20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 999,
            overflow: 'hidden',
            border: '2px solid var(--paper)',
            boxShadow: 'var(--shadow-sm)',
            background: 'var(--forest)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--cream)', lineHeight: 1,
            }}>{firstName[0]}</div>
          </div>
          {/* Online dot */}
          <div style={{
            position: 'absolute', right: -2, top: -2,
            width: 12, height: 12, borderRadius: 999,
            background: '#4ECB71',
            border: '2px solid var(--paper)',
          }}/>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ position: 'relative', padding: '24px 24px 22px' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 44, color: 'var(--forest)',
          letterSpacing: '-0.02em', lineHeight: 0.9,
        }}>
          Hello, {firstName}.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, color: 'var(--forest)', opacity: 0.55 }}>
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
            <path d="M6 1a5 5 0 0 0-5 5c0 3.5 5 7 5 7s5-3.5 5-7a5 5 0 0 0-5-5z" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="6" cy="6" r="1.6" fill="currentColor"/>
          </svg>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Miami · Week 12
          </span>
        </div>
      </div>

      {/* Swipeable event stack */}
      <div
        ref={scrollerRef}
        className="scroll-hide"
        style={{
          display: 'flex', gap: 14,
          overflowX: 'auto', scrollSnapType: 'x mandatory',
          padding: '0 24px 4px',
          scrollPaddingLeft: 24,
        }}
      >
        {carousel.map((e, i) => (
          <EventCard key={e.id} event={e} isMember={isMember} go={go} active={i === cardIndex}/>
        ))}
      </div>

      {/* Page indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16, position: 'relative' }}>
        {carousel.map((_, i) => (
          <div key={i} style={{
            width: i === cardIndex ? 20 : 6,
            height: 6, borderRadius: 999,
            background: i === cardIndex ? 'var(--forest)' : 'rgba(14,28,19,0.14)',
            transition: 'width 0.25s, background 0.25s',
          }}/>
        ))}
      </div>

      {/* Primary CTA — reacts to the centered card */}
      <div style={{ padding: '22px 22px 0', position: 'relative' }}>
        <button
          onClick={() => {
            if (!activeEvent) return;
            if (activeIsLive) return go({ screen: 'live' });
            return go({ screen: 'eventDetail', eventId: activeEvent.id });
          }}
          style={{
            width: '100%',
            background: '#0E1C13', color: 'var(--paper)',
            borderRadius: 999, padding: '14px 22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
            boxShadow: '0 12px 30px rgba(14,28,19,0.22)',
            border: 'none',
          }}
        >
          <span style={{
            width: 34, height: 34, borderRadius: 999,
            background: 'var(--forest)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginLeft: -6,
          }}>
            {activeIsLive ? (
              <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" fill="var(--cream)"/></svg>
            ) : (
              <svg width="12" height="14" viewBox="0 0 12 14" fill="var(--cream)"><path d="M2 1.5v11l9-5.5z"/></svg>
            )}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '-0.01em' }}>
            {activeIsLive ? 'Continue round' : activeCanRegister ? 'Register' : 'View details'}
          </span>
        </button>
      </div>

      {/* Compact quick-stats row */}
      <div style={{ display: 'flex', gap: 10, padding: '22px 22px 0', overflowX: 'auto' }} className="scroll-hide">
        <QuickPill label="SBX" value={MOCK.USER.sbx.toFixed(3)} trend={`+${MOCK.USER.sbxDelta.toFixed(3)}`} featured/>
        <QuickPill label="Record" value={`${MOCK.USER.matchesW}–${MOCK.USER.matchesL}–${MOCK.USER.matchesH}`} sub="season"/>
        <QuickPill label="Unbeaten" value={MOCK.USER.streak} sub="matches"/>
      </div>

      {/* Activity feed — condensed */}
      <div style={{ padding: '28px 22px 0', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            The Feed
          </div>
          <button style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.65, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            See all →
          </button>
        </div>
        <div className="card" style={{ padding: '4px 6px', borderRadius: 24 }}>
          {MOCK.ACTIVITY.slice(0, 4).map((a, i) => (
            <div key={a.id} style={{
              padding: '14px 12px',
              display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i < Math.min(3, MOCK.ACTIVITY.length - 1) ? '1px solid rgba(14,28,19,0.05)' : 'none',
            }}>
              <AvatarBy handle={a.user} size={36}/>
              <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, color: 'var(--forest)' }}>{a.user}</span>
                <span style={{ opacity: 0.7 }}> {a.detail}</span>
              </div>
              {a.badge && <span style={{ fontSize: 18 }}>{a.badge}</span>}
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.5, letterSpacing: '0.06em' }}>
                {a.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Swipeable course card (the Pinterest-inspired hero) ─────────────
function EventCard({ event, isMember, go, active }) {
  const live = event.status === 'live';
  // Pick a few friends attending — mock. Real data can come from event.attendees.
  const friends = MOCK.FRIENDS.slice(0, 4);
  const attendingCount = 6 + (event.filled % 4); // fake but stable-ish

  const onClick = () => {
    if (live) return go({ screen: 'live' });
    return go({ screen: 'eventDetail', eventId: event.id });
  };

  return (
    <button
      data-card="true"
      onClick={onClick}
      style={{
        scrollSnapAlign: 'start',
        flexShrink: 0,
        width: 280, height: 420,
        borderRadius: 28, overflow: 'hidden',
        position: 'relative',
        border: 'none', padding: 0,
        boxShadow: active ? '0 24px 48px rgba(14,28,19,0.22), 0 6px 14px rgba(14,28,19,0.08)' : '0 12px 28px rgba(14,28,19,0.12)',
        transition: 'box-shadow 0.25s, transform 0.25s',
        transform: active ? 'scale(1)' : 'scale(0.97)',
        textAlign: 'left',
        background: 'var(--paper)',
      }}>
      {/* Left green rail */}
      <div style={{
        position: 'absolute', left: 0, top: 28, bottom: 28, width: 8,
        background: 'var(--forest)', borderTopRightRadius: 8, borderBottomRightRadius: 8,
      }}/>
      {/* Right cream rail */}
      <div style={{
        position: 'absolute', right: 0, top: 28, bottom: 28, width: 8,
        background: 'var(--cream)', borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
      }}/>

      {/* Hero image */}
      <div style={{
        position: 'absolute', inset: '10px 14px 0',
        borderRadius: 22, overflow: 'hidden',
        backgroundImage: `linear-gradient(180deg, rgba(14,28,19,0) 0%, rgba(14,28,19,0.05) 50%, rgba(14,28,19,0.85) 100%), url('${event.img}')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        {/* Badges top-left */}
        <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 6 }}>
          {event.isMajor && (
            <div style={{
              padding: '4px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.22)',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cream)',
            }}>⛳ Major</div>
          )}
          {live && (
            <div style={{
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--forest)',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--cream)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--cream)', animation: 'ball-bounce 1.2s ease-in-out infinite' }}/>
              Live now
            </div>
          )}
        </div>

        {/* Play button top-right */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          width: 44, height: 44, borderRadius: 999,
          background: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 14px rgba(14,28,19,0.22)',
          border: '2px solid var(--forest)',
        }}>
          <svg width="14" height="14" viewBox="0 0 12 14" fill="var(--forest)"><path d="M2 1.5v11l9-5.5z"/></svg>
        </div>

        {/* Course identity bottom */}
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, color: 'var(--cream)' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 0.9,
            letterSpacing: '-0.02em',
          }}>
            {event.courseShort}
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 13, opacity: 0.85, marginTop: 6, maxWidth: 220,
            lineHeight: 1.35,
          }}>
            {event.description || `${event.tagline}. ${event.dateFull}.`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <div style={{ display: 'flex' }}>
              {friends.slice(0, 4).map((f, i) => (
                <img key={f.id} src={f.avatar} alt={f.name} style={{
                  width: 26, height: 26, borderRadius: 999, objectFit: 'cover',
                  border: '2px solid var(--cream)',
                  marginLeft: i === 0 ? 0 : -8,
                }}/>
              ))}
            </div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', opacity: 0.85 }}>
              {attendingCount} friends here
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Compact quick-stat pill (home) ──────────────────────────────────
function QuickPill({ label, value, sub, trend, featured }) {
  const bg = featured ? 'var(--forest)' : 'var(--paper)';
  const fg = featured ? 'var(--cream)' : 'var(--forest)';
  return (
    <div style={{
      background: bg, color: fg,
      border: featured ? 'none' : 'var(--hairline)',
      boxShadow: featured ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      borderRadius: 20,
      padding: '14px 18px',
      minWidth: 128,
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: 10, fontFamily: 'var(--font-mono)',
        opacity: featured ? 0.7 : 0.55,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
        <span className="display-num" style={{ fontSize: 26 }}>{value}</span>
        {trend && (
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 800, opacity: featured ? 0.8 : 0.7 }}>
            {trend}
          </span>
        )}
      </div>
      {sub && (
        <div style={{ fontSize: 10, opacity: 0.55, marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── AvatarBy — shared across screens, keep the export ───────────────
function AvatarBy({ handle, size = 36 }) {
  const f = MOCK.FRIENDS.find(x => x.handle === handle);
  if (!f) return <div style={{ width: size, height: size, borderRadius: 999, background: 'var(--sand)' }}/>;
  return (
    <img src={f.avatar} alt={f.name} style={{
      width: size, height: size, borderRadius: 999, objectFit: 'cover',
      border: '2px solid var(--paper)',
    }}/>
  );
}

Object.assign(window, { HomeScreen, EventCard, QuickPill, AvatarBy });
