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
          SBX Matches
        </SegmentButton>
        <SegmentButton active={tab === 'challenge'} onClick={() => go({ screen: 'events', playTab: 'challenge' })}>
          Challenge Friends
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

// ─── Challenge Friends: format → mode → challenge ─────────────────────
function ChallengeFriendsView({ go, profile }) {
  const [format, setFormat] = React.useState(null); // 'pp' | 'regular'

  return (
    <div style={{ padding: '10px 16px 0' }}>
      <div className="caption-serif" style={{ fontSize: 15, color: 'var(--forest)', opacity: 0.7, padding: '0 4px 16px', lineHeight: 1.4 }}>
        Casual matches still move your Sandbox Rating (at casual weight) — they just don't count for the season ladder or prizes.
      </div>

      {!format ? (
        <>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 4px 10px' }}>
            Step 1 · Where are you playing?
          </div>
          <ModeCard
            onClick={() => setFormat('pp')}
            eyebrow="⛳ Sandbox format"
            title="Pitch & Putt"
            subtitle="Nine sub-100yd holes, 2-man scramble or 1v1. The Sandbox 9."
            accent="forest"
            available
          />
          <div style={{ height: 12 }}/>
          <ModeCard
            onClick={() => setFormat('regular')}
            eyebrow="🏌 Full course"
            title="Regular course"
            subtitle="9 or 18 on a real course — real pars, with fairway + GIR tracking."
            accent="moss"
            available
          />
        </>
      ) : (
        <>
          <button onClick={() => setFormat(null)} style={{
            background: 'transparent', border: 'none', color: 'var(--forest)', fontSize: 13, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0 0 12px', opacity: 0.75,
          }}>
            <Icon.ArrowLeft size={14}/> {format === 'regular' ? 'Regular course' : 'Pitch & Putt'}
          </button>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 4px 10px' }}>
            Step 2 · Pick your format
          </div>
          <ModeCard
            onClick={() => go({ screen: 'challenge', mode: '1v1', format })}
            eyebrow="1v1 · You vs them"
            title="Head-to-head"
            subtitle="Hole-by-hole match play. Shared scorecard, live W/L/H scoring."
            accent="forest"
            available
          />
          <div style={{ height: 12 }}/>
          <ModeCard
            onClick={() => go({ screen: 'challenge', mode: '2v2', format })}
            eyebrow="2v2 · Scramble"
            title="Partner up"
            subtitle="Grab a teammate, face off against another duo. Team score per hole."
            accent="moss"
            available
          />
        </>
      )}

      <div style={{ marginTop: 24, padding: '16px 16px', borderRadius: 16, background: 'rgba(14,28,19,0.04)' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--forest)', opacity: 0.55, fontWeight: 700 }}>
          Playing as
        </div>
        <div style={{ marginTop: 4, fontSize: 14, color: 'var(--forest)', fontWeight: 700 }}>
          {formatHandle(profile.handle)}
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
