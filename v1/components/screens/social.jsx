/* global React, Icon, LiveDot, Button, Eyebrow, Chip, Dashed, MOCK, AvatarBy, useUserSearch, useIsFollowing, followUser, unfollowUser */
// Social: people search + leaderboards + member directory-lite

function SocialScreen({ go, tier }) {
  const [tab, setTab] = React.useState('live');
  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ padding: '58px 20px 20px', background: 'var(--canvas)', color: 'var(--forest)' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase' }}>The Board</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, marginTop: 8, letterSpacing: '-0.02em' }}>Leaderboards.</div>
        <div className="caption-serif" style={{ fontSize: 16, opacity: 0.65, marginTop: 6 }}>
          Talk less. Shoot lower.
        </div>
      </div>

      <FindPlayers go={go}/>

      <div style={{ display: 'flex', gap: 4, margin: '0 16px 0', background: 'rgba(14,28,19,0.05)', borderRadius: 14, padding: 4 }}>
        {[['live', 'Live'], ['season', 'Season'], ['alltime', 'All-time']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, padding: '10px 12px', borderRadius: 11,
            background: tab === k ? 'var(--paper)' : 'transparent',
            color: 'var(--forest)', fontWeight: 700, fontSize: 12,
            boxShadow: tab === k ? 'var(--shadow-sm)' : 'none',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {k === 'live' && <LiveDot/>}
            {l}
          </button>
        ))}
      </div>

      {tab === 'live' && <LiveLeaderboard go={go}/>}
      {tab === 'season' && <SeasonLeaderboard/>}
      {tab === 'alltime' && <AllTimeLeaderboard/>}
    </div>
  );
}

// ─── Find players: live search + inline follow ───────────────────────
function FindPlayers({ go }) {
  const [q, setQ] = React.useState('');
  const [results, loading] = useUserSearch(q, 8);
  const viewerId = MOCK.USER && MOCK.USER.id;

  return (
    <div style={{ padding: '0 16px 18px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--paper)', borderRadius: 14,
        padding: '12px 14px',
        border: '1px solid rgba(14,28,19,0.06)',
      }}>
        <Icon.Search size={16} color="var(--forest)"/>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find players by handle or name…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: 14, color: 'var(--ink)', fontWeight: 600,
          }}
        />
        {q && (
          <button onClick={() => setQ('')} style={{
            background: 'transparent', border: 'none', color: 'var(--forest)',
            fontSize: 12, opacity: 0.6, cursor: 'pointer', padding: 0,
          }}>Clear</button>
        )}
      </div>

      {q.trim().length > 0 && (
        <div className="card" style={{ marginTop: 10, overflow: 'hidden' }}>
          {loading && (
            <div style={{ padding: 14, fontSize: 12, opacity: 0.55, textAlign: 'center' }}>Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: 14, fontSize: 12, opacity: 0.55, textAlign: 'center' }}>No players found.</div>
          )}
          {!loading && results.map((r, i) => (
            <SearchResultRow
              key={r.id}
              row={r}
              viewerId={viewerId}
              last={i === results.length - 1}
              onOpen={() => go({ screen: 'profile', viewingHandle: r.handle })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultRow({ row, viewerId, last, onOpen }) {
  const isSelf = viewerId === row.id;
  const isFollowing = useIsFollowing(viewerId, isSelf ? null : row.id);
  const [busy, setBusy] = React.useState(false);
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ') || row.handle;
  const initial = (name || row.handle || '?').replace(/^@/, '').charAt(0).toUpperCase();

  async function toggle(e) {
    e.stopPropagation();
    if (!viewerId || isSelf || busy) return;
    setBusy(true);
    try {
      if (isFollowing) await unfollowUser({ viewerId, targetId: row.id });
      else             await followUser({ viewerId, targetId: row.id });
    } catch (_) {}
    setBusy(false);
  }

  return (
    <div
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        borderBottom: last ? 'none' : '1px solid rgba(14,28,19,0.05)',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 999,
        background: '#5A7B4A', color: 'var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 16, overflow: 'hidden',
        flexShrink: 0,
      }}>
        {row.avatar_url
          ? <img src={row.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          : initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{name}</div>
        <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>
          {row.handle.startsWith('@') ? row.handle : `@${row.handle}`}
        </div>
      </div>
      {!isSelf && viewerId && (
        <Button
          variant={isFollowing ? 'outline' : 'forest'}
          size="sm"
          onClick={toggle}
          disabled={busy || isFollowing === null}
        >
          {isFollowing === null ? '…' : (isFollowing ? 'Following' : 'Follow')}
        </Button>
      )}
      {isSelf && (
        <span style={{ fontSize: 10, opacity: 0.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>You</span>
      )}
    </div>
  );
}

function LiveLeaderboard({ go }) {
  const ym = MOCK.LIVE.yourMatch;
  return (
    <div style={{ padding: '18px 16px' }}>
      <button onClick={() => go({ screen: 'live' })} style={{
        width: '100%', textAlign: 'left',
        background: `linear-gradient(135deg, var(--forest-dark), var(--forest))`,
        color: 'var(--cream)',
        padding: 16, borderRadius: 18, marginBottom: 14,
        border: 'none',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: 'var(--shadow-md)',
      }}>
        <LiveDot/>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1, letterSpacing: '-0.01em' }}>Week 11 · Melreese</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.75, marginTop: 5, letterSpacing: '0.06em' }}>{MOCK.LIVE.matches.length} MATCHES · THRU HOLE {MOCK.LIVE.currentHole}</div>
        </div>
        <Icon.ArrowRight size={14} color="var(--cream)"/>
      </button>

      {/* Your match hero */}
      <div style={{
        background: `linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)`,
        color: 'var(--cream)',
        borderRadius: 'var(--radius-card-lg)', padding: 20, marginBottom: 14, position: 'relative', overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.65, letterSpacing: '0.14em', textTransform: 'uppercase', position: 'relative' }}>Your match</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, position: 'relative' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{ym.teamA.name} <span style={{ opacity: 0.55 }}>(you)</span></div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.7, marginTop: 4, letterSpacing: '0.04em' }}>VS {ym.teamB.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: ym.state > 0 ? 'var(--cream)' : ym.state < 0 ? '#E7B8A7' : 'var(--cream)', lineHeight: 0.9, letterSpacing: '-0.02em' }}>
              {ym.state > 0 ? `${ym.state} UP` : ym.state < 0 ? `${-ym.state} DN` : 'AS'}
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.7, marginTop: 4, letterSpacing: '0.06em' }}>THRU {ym.thru} · {ym.remaining} LEFT</div>
          </div>
        </div>
      </div>

      {/* Match board */}
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 4px 10px' }}>All matches · week 11</div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {MOCK.LIVE.matches.map((m, i) => (
          <MatchBoardRow key={m.id} m={m} last={i === MOCK.LIVE.matches.length - 1}/>
        ))}
      </div>
    </div>
  );
}

function MatchBoardRow({ m, last }) {
  const statusColor = m.status === 'AS' ? '#8A6A4A' : m.status === 'DORMIE' ? 'var(--clay-deep)' : 'var(--forest)';
  const [teamA, teamB] = m.teams.split(' vs ');
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px',
      borderBottom: last ? 'none' : '1px solid rgba(14,28,19,0.05)',
      background: m.isYou ? 'rgba(28,73,42,0.07)' : 'transparent',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            color: m.leader === 'A' ? 'var(--forest)' : 'var(--ink)',
            fontWeight: m.leader === 'A' ? 800 : 600,
          }}>{teamA}</span>
          {m.isYou && <Chip variant="forest" style={{ fontSize: 9, padding: '1px 6px' }}>YOU</Chip>}
        </div>
        <div style={{
          fontSize: 12, marginTop: 2,
          color: m.leader === 'B' ? 'var(--forest)' : 'rgba(14,28,19,0.55)',
          fontWeight: m.leader === 'B' ? 800 : 600,
        }}>{teamB}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, lineHeight: 1, color: statusColor, letterSpacing: '-0.01em' }}>
          {m.status}
        </div>
        <div style={{ fontSize: 9, opacity: 0.55, marginTop: 3, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          THRU {m.thru}
        </div>
      </div>
    </div>
  );
}

function SeasonLeaderboard() {
  // Match-play ladder: record primary, holes-won tiebreak (as per user's answer).
  // The signed-in user's row uses MOCK.USER (real handle + real record) so the
  // leaderboard shows them in their actual slot.
  const u = MOCK.USER;
  const userRow = {
    name: u.handle,
    W: u.matchesW, L: u.matchesL, H: u.matchesH,
    holesW: u.holesWonTotal || 0,
    events: u.eventsPlayed || u.matchesTotal || 0,
    isYou: true,
  };
  const rows = [
    { name: '@dukes', W: 9, L: 2, H: 0, holesW: 58, events: 11 },
    { name: '@bigleo', W: 8, L: 2, H: 1, holesW: 55, events: 11 },
    { name: '@jaybird', W: 7, L: 2, H: 1, holesW: 51, events: 10 },
    { name: '@riv', W: 7, L: 4, H: 0, holesW: 48, events: 11 },
    userRow,
    { name: '@theo.m', W: 5, L: 4, H: 1, holesW: 38, events: 10 },
    { name: '@maria.cg', W: 4, L: 4, H: 1, holesW: 34, events: 9 },
    { name: '@camicu', W: 3, L: 6, H: 1, holesW: 31, events: 10 },
  ];
  return (
    <div style={{ padding: '18px 16px' }}>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 12, padding: '0 4px', lineHeight: 1.45, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
        Match wins primary. Halved = 0.5. Holes won is the tiebreak. Top 16 make the season championship.
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', padding: '10px 14px', fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--forest)', opacity: 0.5, borderBottom: '1px solid rgba(14,28,19,0.06)' }}>
          <span style={{ width: 26, textAlign: 'center' }}>#</span>
          <span style={{ flex: 1, paddingLeft: 36 }}>Player</span>
          <span style={{ width: 64, textAlign: 'right' }}>W–L–H</span>
          <span style={{ width: 44, textAlign: 'right' }}>Holes</span>
        </div>
        {rows.map((r, i) => {
          const pts = r.W + r.H * 0.5;
          return (
            <div key={r.name} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              borderBottom: i < rows.length - 1 ? '1px dashed rgba(14,28,19,0.08)' : 'none',
              background: r.isYou ? 'rgba(28,73,42,0.07)' : 'transparent',
            }}>
              <div style={{
                width: 26, textAlign: 'center',
                fontFamily: 'var(--font-display)', fontSize: 14,
                color: 'var(--forest)', opacity: i < 3 ? 1 : 0.4,
                fontWeight: i < 3 ? 700 : 400,
              }}>{i + 1}</div>
              <AvatarBy handle={r.name} size={28}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{r.name}{r.isYou && ' · you'}</div>
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{pts} pts · {r.events} events</div>
              </div>
              <div style={{ width: 64, textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--forest)' }}>
                {r.W}–{r.L}–{r.H}
              </div>
              <div style={{ width: 44, textAlign: 'right', fontSize: 12, opacity: 0.65, fontWeight: 700 }}>
                {r.holesW}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AllTimeLeaderboard() {
  return (
    <div style={{ padding: '18px 16px' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Records</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <RecordCard title="Highest SBX ever" holder="@dukes" value="6.712"/>
        <RecordCard title="Longest unbeaten" holder="@jaybird" value="11 m"/>
        <RecordCard title="Biggest win" holder="@dukes + @bigleo" value="7&6"/>
        <RecordCard title="Partner chemistry" holder="Dukes + Leo" value="96"/>
      </div>
    </div>
  );
}

function RecordCard({ title, holder, value }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</div>
      <div className="display-num" style={{ fontSize: 32, color: 'var(--forest)', marginTop: 10 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>{holder}</div>
    </div>
  );
}

Object.assign(window, { SocialScreen });
