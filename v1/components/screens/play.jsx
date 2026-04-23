/* global React, Icon, Button, Eyebrow, Wordmark, EventsScreen, EventDetailScreen, MOCK */
// Play tab — split into Ranked (upcoming events) and Unranked (Challenge a Friend).
//   - Ranked uses the existing EventsScreen (mock events for now).
//   - Unranked shows mode cards for 1v1 and 2v2 that route into the real
//     Supabase-backed Challenge flow.

function PlayScreen({ go, tier, brandLoud, liveMode, mascot, profile, playTab }) {
  const tab = playTab === 'unranked' ? 'unranked' : 'ranked';
  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <PlayHeader tab={tab} go={go}/>
      {tab === 'ranked'
        ? <EventsScreen go={go} tier={tier} brandLoud={brandLoud} liveMode={liveMode} mascot={mascot} profile={profile} embedded/>
        : <UnrankedView go={go} profile={profile}/>}
    </div>
  );
}

// ─── Header with Ranked / Unranked segmented control ──────
function PlayHeader({ tab, go }) {
  return (
    <div style={{ padding: '58px 20px 8px', background: 'var(--canvas)' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Play
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 0.92, marginTop: 8, letterSpacing: '-0.02em', color: 'var(--forest)' }}>
        {tab === 'ranked' ? 'Tee times.' : 'Challenge a friend.'}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 18, padding: 4,
        background: 'rgba(14,28,19,0.06)', borderRadius: 999,
      }}>
        <SegmentButton active={tab === 'ranked'} onClick={() => go({ screen: 'events', playTab: 'ranked' })}>
          Ranked
        </SegmentButton>
        <SegmentButton active={tab === 'unranked'} onClick={() => go({ screen: 'events', playTab: 'unranked' })}>
          Unranked
        </SegmentButton>
      </div>
    </div>
  );
}

function SegmentButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 16px',
      borderRadius: 999,
      background: active ? 'var(--forest)' : 'transparent',
      color: active ? 'var(--cream)' : 'var(--forest)',
      fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  );
}

// ─── Unranked: Challenge a Friend mode picker ─────────────
function UnrankedView({ go, profile }) {
  return (
    <div style={{ padding: '10px 16px 0' }}>
      <div className="caption-serif" style={{ fontSize: 15, color: 'var(--forest)', opacity: 0.7, padding: '0 4px 16px', lineHeight: 1.4 }}>
        Unranked matches don't affect the season ladder, but your Sandbox Rating still moves.
      </div>

      <ModeCard
        onClick={() => go({ screen: 'challenge', mode: '1v1' })}
        eyebrow="1v1 · You vs them"
        title="Head-to-head"
        subtitle="Hole-by-hole match play. Both phones in sync, live W/L/H scoring."
        accent="forest"
        available
      />

      <div style={{ height: 12 }}/>

      <ModeCard
        onClick={() => go({ screen: 'challenge', mode: '2v2' })}
        eyebrow="2v2 · Scramble"
        title="Partner up"
        subtitle="Grab a teammate, face off against another duo. Team score per hole."
        accent="moss"
        available
      />

      <div style={{ marginTop: 24, padding: '16px 16px', borderRadius: 16, background: 'rgba(14,28,19,0.04)' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--forest)', opacity: 0.55, fontWeight: 700 }}>
          Playing as
        </div>
        <div style={{ marginTop: 4, fontSize: 14, color: 'var(--forest)', fontWeight: 700 }}>
          {profile.handle}
        </div>
      </div>
    </div>
  );
}

function ModeCard({ onClick, eyebrow, title, subtitle, accent = 'forest', available = true }) {
  const bg = accent === 'moss'
    ? 'linear-gradient(135deg, var(--moss) 0%, var(--forest) 100%)'
    : 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 45%, var(--moss) 100%)';

  return (
    <button onClick={available ? onClick : undefined} disabled={!available} style={{
      width: '100%', textAlign: 'left',
      borderRadius: 'var(--radius-card-lg)',
      overflow: 'hidden',
      background: bg, color: 'var(--cream)',
      padding: 22, position: 'relative', border: 'none',
      display: 'block',
      boxShadow: available ? 'var(--shadow-md)' : 'none',
      opacity: available ? 1 : 0.55,
      cursor: available ? 'pointer' : 'not-allowed',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 10px', borderRadius: 999,
          background: 'rgba(234,226,206,0.14)',
          border: '1px solid rgba(234,226,206,0.22)',
          fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>{eyebrow}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 0.9, marginTop: 12, letterSpacing: '-0.02em' }}>
          {title}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8, maxWidth: 320 }}>
          {subtitle}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16,
          padding: '9px 14px', borderRadius: 999,
          background: 'var(--cream)', color: 'var(--forest)',
          fontSize: 12, fontWeight: 800, letterSpacing: '0.04em',
          boxShadow: '0 6px 14px rgba(14,28,19,0.25)',
        }}>
          {available ? 'Start' : 'Coming soon'} {available && <Icon.ArrowRight size={14}/>}
        </div>
      </div>
    </button>
  );
}

Object.assign(window, { PlayScreen });
