/* global React, Icon, Button, Eyebrow, Wordmark, BookScreen, MOCK, formatHandle */
// Play tab — two lanes, replacing the old Ranked/Unranked split:
//   • SBX Matches    → book a twilight tee time at a network course (ranked,
//                      full SBX weight). Renders the booking availability.
//   • Challenge Friends → casual: pick format (Pitch & Putt / Regular course)
//                      then 1v1 / 2v2, then into the live match. Still feeds
//                      SBX at casual weight.

function PlayScreen({ go, tier, brandLoud, liveMode, mascot, profile, playTab }) {
  // Back-compat with old routes: 'unranked' → challenge, anything else → sbx.
  const tab = (playTab === 'challenge' || playTab === 'unranked') ? 'challenge' : 'sbx';
  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <PlayHeader tab={tab} go={go}/>
      {tab === 'sbx'
        ? <BookScreen go={go} profile={profile} embedded/>
        : <ChallengeFriendsView go={go} profile={profile}/>}
    </div>
  );
}

// ─── Header with SBX Matches / Challenge Friends segmented control ────
function PlayHeader({ tab, go }) {
  return (
    <div style={{ padding: '58px 20px 8px', background: 'var(--canvas)' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {tab === 'sbx' ? 'Twilight tee times' : 'Casual match play'}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 0.92, marginTop: 8, letterSpacing: '-0.02em', color: 'var(--forest)' }}>
        {tab === 'sbx' ? 'Book an SBX match.' : 'Challenge friends.'}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 18, padding: 4, background: 'rgba(14,28,19,0.06)', borderRadius: 999 }}>
        <SegmentButton active={tab === 'sbx'} onClick={() => go({ screen: 'events', playTab: 'sbx' })}>
          Pitch &amp; Putt
        </SegmentButton>
        <SegmentButton active={tab === 'challenge'} onClick={() => go({ screen: 'events', playTab: 'challenge' })}>
          Casual
        </SegmentButton>
      </div>
    </div>
  );
}

function SegmentButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 16px', borderRadius: 999,
      background: active ? 'var(--forest)' : 'transparent',
      color: active ? 'var(--cream)' : 'var(--forest)',
      fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', transition: 'all 0.15s',
    }}>{children}</button>
  );
}

// ─── Challenge Friends: Start a Match / Join. Setup (course → holes → type)
// happens inside Start a Match; joining jumps to picking a team. ─────────
function ChallengeFriendsView({ go, profile }) {
  return (
    <div style={{ padding: '10px 16px 0' }}>
      <div className="caption-serif" style={{ fontSize: 15, color: 'var(--forest)', opacity: 0.7, padding: '0 4px 16px', lineHeight: 1.4 }}>
        Casual matches still move your Sandbox Rating (at casual weight) — they just don't count for the season ladder or prizes.
      </div>

      <ModeCard
        onClick={() => go({ screen: 'challenge', initialMode: 'start', format: 'regular' })}
        eyebrow="⛳ New match"
        title="Start a Match"
        subtitle="Pick a course & tees, the holes, and 1v1 or 2v2 — then share the code."
        accent="forest"
        available
      />
      <div style={{ height: 12 }}/>
      <ModeCard
        onClick={() => go({ screen: 'challenge', initialMode: 'join', format: 'regular' })}
        eyebrow="Got a code?"
        title="Joining Someone Else?"
        subtitle="Enter a match code and pick your team."
        accent="moss"
        available
      />
    </div>
  );
}

function ModeCard({ onClick, eyebrow, title, subtitle, accent = 'forest', available = true }) {
  const bg = accent === 'moss'
    ? 'linear-gradient(135deg, var(--moss) 0%, var(--forest) 100%)'
    : 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 45%, var(--moss) 100%)';

  return (
    <button onClick={available ? onClick : undefined} disabled={!available} style={{
      width: '100%', textAlign: 'left', borderRadius: 'var(--radius-card-lg)', overflow: 'hidden',
      background: bg, color: 'var(--cream)', padding: 22, position: 'relative', border: 'none', display: 'block',
      boxShadow: available ? 'var(--shadow-md)' : 'none', opacity: available ? 1 : 0.55,
      cursor: available ? 'pointer' : 'not-allowed',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, background: 'var(--forest)', color: 'var(--cream)', fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{eyebrow}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 0.9, marginTop: 12, letterSpacing: '-0.02em' }}>{title}</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8, maxWidth: 320 }}>{subtitle}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '9px 14px', borderRadius: 999, background: 'var(--cream)', color: 'var(--forest)', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', boxShadow: '0 6px 14px rgba(14,28,19,0.25)' }}>
          {available ? 'Start' : 'Coming soon'} {available && <Icon.ArrowRight size={14}/>}
        </div>
      </div>
    </button>
  );
}

Object.assign(window, { PlayScreen });
