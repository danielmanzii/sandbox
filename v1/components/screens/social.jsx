/* global React, Icon, LiveDot, Button, Eyebrow, Chip, Dashed, MOCK, AvatarBy, useUserSearch, useIsFollowing, followUser, unfollowUser, useLiveEvent, useNextMajor, useUpcomingEvents */
// Social: people search + leaderboards + member directory-lite

function SocialScreen({ go, tier }) {
  const [tab, setTab] = React.useState('live');
  const [liveEvent]   = useLiveEvent();
  const [nextMajor]   = useNextMajor();
  const [upcoming]    = useUpcomingEvents(1);
  const nextEvent     = nextMajor || (upcoming && upcoming[0]) || null;
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

      {tab === 'live' && <LiveLeaderboard go={go} liveEvent={liveEvent} nextEvent={nextEvent}/>}
      {tab === 'season' && <SeasonLeaderboard go={go}/>}
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

function LiveLeaderboard({ go, liveEvent, nextEvent }) {
  if (!liveEvent) {
    return (
      <div style={{ padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', lineHeight: 1, marginBottom: 6 }}>
          No live leaderboard available.
        </div>
        <div className="caption-serif" style={{ fontSize: 15, color: 'var(--ink)', opacity: 0.6, marginBottom: 24 }}>
          Check back when a match is in progress.
        </div>
        {nextEvent ? (
          <div className="card" style={{ padding: '18px 20px', textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Next match
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--forest)', lineHeight: 1, letterSpacing: '-0.01em' }}>
              {nextEvent.courseShort}
            </div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, marginTop: 6, letterSpacing: '0.04em' }}>
              {(nextEvent.dateFull || '').toUpperCase()} · {nextEvent.time}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--ink)', opacity: 0.4 }}>No upcoming events scheduled.</div>
        )}
      </div>
    );
  }

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
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1, letterSpacing: '-0.01em' }}>{liveEvent.courseShort}</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.75, marginTop: 5, letterSpacing: '0.06em' }}>
            {(liveEvent.dateFull || '').toUpperCase()} · LIVE NOW
          </div>
        </div>
        <Icon.ArrowRight size={14} color="var(--cream)"/>
      </button>
      <div style={{ padding: '20px', textAlign: 'center', opacity: 0.45 }}>
        <div style={{ fontSize: 13 }}>Live match board coming soon.</div>
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

function SeasonLeaderboard({ go }) {
  const u = MOCK.USER;
  const [selectedPlayer, setSelectedPlayer] = React.useState(null);

  const userRow = {
    name: u.handle,
    W: u.matchesW, L: u.matchesL, H: u.matchesH,
    holesW: u.holesWonTotal || 0,
    events: u.eventsPlayed || u.matchesTotal || 0,
    sbx: u.sbx,
    isYou: true,
  };
  const rows = [
    { name: '@dukes',    W: 9, L: 2, H: 0, holesW: 58, events: 11, sbx: 6.712 },
    { name: '@bigleo',   W: 8, L: 2, H: 1, holesW: 55, events: 11, sbx: 6.201 },
    { name: '@jaybird',  W: 7, L: 2, H: 1, holesW: 51, events: 10, sbx: 5.988 },
    { name: '@riv',      W: 7, L: 4, H: 0, holesW: 48, events: 11, sbx: 5.544 },
    userRow,
    { name: '@theo.m',   W: 5, L: 4, H: 1, holesW: 38, events: 10, sbx: 4.821 },
    { name: '@maria.cg', W: 4, L: 4, H: 1, holesW: 34, events:  9, sbx: 4.503 },
    { name: '@camicu',   W: 3, L: 6, H: 1, holesW: 31, events: 10, sbx: 4.012 },
  ];

  return (
    <div style={{ padding: '18px 16px' }}>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 12, padding: '0 4px', lineHeight: 1.45, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
        Match wins primary. Halved = 0.5. Holes won is the tiebreak. Top 16 make the season championship.
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', padding: '10px 14px', fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--forest)', opacity: 0.5, borderBottom: '1px solid rgba(14,28,19,0.06)' }}>
          <span style={{ width: 26, textAlign: 'center' }}>#</span>
          <span style={{ flex: 1, paddingLeft: 8 }}>Player</span>
          <span style={{ width: 64, textAlign: 'right' }}>W–L–H</span>
          <span style={{ width: 44, textAlign: 'right' }}>Holes</span>
        </div>
        {rows.map((r, i) => {
          const pts = r.W + r.H * 0.5;
          return (
            <button key={r.name} onClick={() => setSelectedPlayer(r)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '12px 14px', textAlign: 'left',
              borderBottom: i < rows.length - 1 ? '1px dashed rgba(14,28,19,0.08)' : 'none',
              background: r.isYou ? 'rgba(28,73,42,0.07)' : 'transparent',
              cursor: 'pointer', border: 'none',
            }}>
              <div style={{
                width: 26, textAlign: 'center',
                fontFamily: 'var(--font-display)', fontSize: 14,
                color: 'var(--forest)', opacity: i < 3 ? 1 : 0.4,
                fontWeight: i < 3 ? 700 : 400,
              }}>{i + 1}</div>
              <AvatarBy name={r.name} size={30}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{r.name}{r.isYou && ' · you'}</div>
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{pts} pts · {r.events} events</div>
              </div>
              <div style={{ width: 64, textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--forest)' }}>
                {r.W}–{r.L}–{r.H}
              </div>
              <div style={{ width: 44, textAlign: 'right', fontSize: 12, opacity: 0.65, fontWeight: 700 }}>
                {r.holesW}
              </div>
            </button>
          );
        })}
      </div>

      {selectedPlayer && (
        <PlayerStatsSheet
          player={selectedPlayer}
          go={go}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

function PlayerStatsSheet({ player, go, onClose }) {
  const isYou = player.isYou;
  const pts = player.W + player.H * 0.5;
  const history = isYou ? (MOCK.HISTORY || []) : [];
  const badges = isYou ? (MOCK.BADGES || []).filter(b => !b.locked) : [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}/>
      <div style={{ position: 'relative', background: 'var(--paper)', borderRadius: '24px 24px 0 0', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(14,28,19,0.15)', margin: '14px auto 0' }}/>
        <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(14,28,19,0.07)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)', lineHeight: 1 }}>{player.name}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!isYou && (
              <button onClick={() => { onClose(); go({ screen: 'profile', viewingHandle: player.name }); }} style={{
                padding: '6px 12px', borderRadius: 999, background: 'var(--forest)', border: 'none',
                color: 'var(--cream)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>View profile</button>
            )}
            <button onClick={onClose} style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(14,28,19,0.07)', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--forest)', cursor: 'pointer' }}>Done</button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 16px 32px' }}>
          {/* SBX Rating */}
          <div style={{
            background: `linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)`,
            color: 'var(--cream)', borderRadius: 18, padding: '18px 20px',
            marginBottom: 16, position: 'relative', overflow: 'hidden',
          }}>
            <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.65, letterSpacing: '0.14em', textTransform: 'uppercase', position: 'relative' }}>Sandbox Rating™</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8, position: 'relative' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.85, letterSpacing: '-0.03em' }}>
                {player.sbx ? Number(player.sbx).toFixed(3) : '—'}
              </div>
              <div style={{ textAlign: 'right', opacity: 0.75 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1 }}>{player.W}–{player.L}–{player.H}</div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', marginTop: 4, letterSpacing: '0.04em' }}>{pts} pts · {player.events} events</div>
              </div>
            </div>
          </div>

          {/* Recent matches */}
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            Recent matches
          </div>
          <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
            {history.length === 0 ? (
              <div style={{ padding: '16px 14px', textAlign: 'center', opacity: 0.4, fontSize: 13 }}>
                {isYou ? 'No matches yet.' : 'Match history is private.'}
              </div>
            ) : history.slice(0, 4).map((r, i) => {
              const isW = r.result === 'W', isL = r.result === 'L';
              const badgeStyle = isW
                ? { background: 'var(--forest)', color: 'var(--cream)', border: 'none' }
                : isL
                ? { background: 'var(--cream)', color: 'var(--forest)', border: 'none' }
                : { background: 'var(--paper)', color: 'var(--forest)', border: '1px solid rgba(28,73,42,0.25)' };
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                  borderBottom: i < Math.min(history.length, 4) - 1 ? '1px solid rgba(14,28,19,0.05)' : 'none',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--forest)', width: 30, opacity: 0.7 }}>{r.week}</div>
                  <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 13, ...badgeStyle }}>{r.result}</div>
                  <div style={{ flex: 1, fontSize: 12 }}>vs {r.opp}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--forest)', opacity: isL ? 0.55 : 1 }}>{r.margin}</div>
                </div>
              );
            })}
          </div>

          {/* Badges */}
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            Badges earned
          </div>
          {badges.length === 0 ? (
            <div className="card" style={{ padding: '16px 14px', textAlign: 'center', opacity: 0.4, fontSize: 13 }}>
              {isYou ? 'No badges earned yet.' : 'Badges are private.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {badges.map(b => (
                <div key={b.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon.Trophy size={14} color="var(--cream)"/>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--forest)', lineHeight: 1.2 }}>{b.name}</div>
                    <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{b.rarity}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
