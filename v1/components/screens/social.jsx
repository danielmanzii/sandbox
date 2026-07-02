/* global React, Icon, LiveDot, Button, MOCK, sbx, useUserSearch, useIsFollowing, followUser, unfollowUser, useLiveEvent, useSbxLeaderboard, formatHandle */
// Explore: player search + your-band top 10 (tap → full band leaderboard with
// a band switcher) + stat leaders. (Tab is labelled "Explore"; route id = social.)

function SocialScreen({ go }) {
  const [liveEvent] = useLiveEvent();
  const data        = useSbxLeaderboard(500); // null = loading, [] = nobody rated yet
  const streaks     = useStreaks();           // null = loading, else per-user array
  const meId        = MOCK.USER && MOCK.USER.id;
  const [bandView, setBandView] = React.useState(null); // null = home, else a band int
  const [statView, setStatView] = React.useState(null); // null = home, else 'sbx'|'matches'|'longest'|'active'

  const rated  = data || [];
  const myRow  = rated.find(p => p.id === meId);
  const bandsPresent = React.useMemo(
    () => [...new Set(rated.filter(p => p.sbx != null).map(p => Math.floor(Number(p.sbx))))].sort((a, b) => a - b),
    [data]
  );
  const highestBand = bandsPresent.length ? bandsPresent[bandsPresent.length - 1] : null;
  const myBand = (myRow && myRow.sbx != null) ? Math.floor(Number(myRow.sbx)) : highestBand;

  // Full stat leaderboard view (all users, ranked by one stat).
  if (statView != null) {
    return (
      <StatLeaderboard
        kind={statView}
        data={data}
        streaks={streaks}
        meId={meId}
        go={go}
        onBack={() => setStatView(null)}
      />
    );
  }

  // Full band leaderboard view (with switcher).
  if (bandView != null) {
    return (
      <BandLeaderboard
        band={bandView}
        data={data}
        meId={meId}
        go={go}
        bands={bandsPresent}
        onBack={() => setBandView(null)}
        onChangeBand={setBandView}
      />
    );
  }

  const myBandRows = (myBand != null) ? rated.filter(p => p.sbx != null && Math.floor(Number(p.sbx)) === myBand) : [];
  const top10 = myBandRows.slice(0, 10);

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ padding: '58px 20px 16px', background: 'var(--canvas)', color: 'var(--forest)' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Explore</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, marginTop: 8, letterSpacing: '-0.02em' }}>Who's hot.</div>
        <div className="caption-serif" style={{ fontSize: 16, opacity: 0.65, marginTop: 6 }}>
          Find players. Track the ladder.
        </div>
      </div>

      <ExploreSearch go={go}/>

      {liveEvent && (
        <div style={{ padding: '0 16px 16px' }}>
          <button onClick={() => go({ screen: 'live' })} style={{
            width: '100%', textAlign: 'left',
            background: 'linear-gradient(135deg, var(--forest-dark), var(--forest))',
            color: 'var(--cream)', padding: 16, borderRadius: 18, border: 'none',
            display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-md)',
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
        </div>
      )}

      {/* Your rank within your band — tap to open the full band board */}
      <BandRankCard data={data} meId={meId} onOpen={(b) => setBandView(b)}/>

      {/* Top 10 of MY band — tap to open all players in the band */}
      <BandTopTen
        band={myBand}
        rows={top10}
        total={myBandRows.length}
        loading={data === null}
        meId={meId}
        go={go}
        onOpenBoard={() => myBand != null && setBandView(myBand)}
      />

      {/* Stat leaders */}
      <StatLeaders data={data} streaks={streaks} openStat={setStatView}/>
    </div>
  );
}

// ─── Prominent search: tap-to-focus bar + live results ───────────────
function ExploreSearch({ go }) {
  const [q, setQ] = React.useState('');
  const [results, loading] = useUserSearch(q, 8);
  const viewerId = MOCK.USER && MOCK.USER.id;
  const inputRef = React.useRef(null);

  return (
    <div style={{ padding: '0 16px 18px' }}>
      <div
        onClick={() => inputRef.current && inputRef.current.focus()}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--forest)', borderRadius: 13,
          padding: '10px 15px', cursor: 'text',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Icon.Search size={15} color="var(--cream)"/>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search players by name or @handle…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: 13, color: 'var(--cream)', fontWeight: 600,
          }}
          className="explore-search-input"
        />
        {q && (
          <button onClick={(e) => { e.stopPropagation(); setQ(''); }} style={{
            background: 'rgba(234,226,206,0.18)', border: 'none', color: 'var(--cream)',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '4px 10px', borderRadius: 999,
          }}>Clear</button>
        )}
      </div>
      <style>{`.explore-search-input::placeholder { color: rgba(234,226,206,0.6); }`}</style>

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

const bandLabel = (b) => `${b}.000–${b}.999`;
const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const matchesOf = (p) => (p.sbx_2v2_n || 0) + (p.sbx_1v1_n || 0);

// ─── Your rank within your SBX band (tap → full band board) ──────────
function BandRankCard({ data, meId, onOpen }) {
  if (data === null) return null; // loading — stay quiet
  const myRow = data.find(p => p.id === meId);

  if (!myRow || myRow.sbx == null) {
    return (
      <div style={{ padding: '0 16px 18px' }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Your band</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', lineHeight: 1.05, marginTop: 8 }}>
            Not rated yet.
          </div>
          <div className="caption-serif" style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>
            Play and confirm 3 matches to earn your Sandbox Rating and see where you rank.
          </div>
        </div>
      </div>
    );
  }

  const band        = Math.floor(Number(myRow.sbx));
  const bandPlayers = data.filter(p => p.sbx != null && Math.floor(Number(p.sbx)) === band); // already SBX-desc
  const myBandRank  = bandPlayers.findIndex(p => p.id === meId) + 1;

  return (
    <div style={{ padding: '0 16px 18px' }}>
      <button onClick={() => onOpen && onOpen(band)} style={{
        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
        color: 'var(--cream)', borderRadius: 20, padding: '20px 22px',
        position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-md)',
      }}>
        <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.7, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Your rank · {bandLabel(band)} band
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              VIEW BAND <Icon.ArrowRight size={11} color="var(--cream)"/>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 0.8, letterSpacing: '-0.03em' }}>
                {ordinal(myBandRank)}
              </div>
              <div style={{ fontSize: 13, opacity: 0.8, fontFamily: 'var(--font-mono)' }}>
                of {bandPlayers.length}
              </div>
            </div>
            <div style={{ textAlign: 'right', opacity: 0.85 }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>Your SBX</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1, marginTop: 4 }}>
                {Number(myRow.sbx).toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── Shared leaderboard row ──────────────────────────────────────────
// valueText overrides the right-hand number (defaults to SBX).
// subText overrides the secondary line (defaults to "@handle · N matches").
function LeaderRow({ rank, player, meId, go, last, valueText, subText }) {
  const name    = [player.first_name, player.last_name].filter(Boolean).join(' ') || formatHandle(player.handle);
  const isYou   = player.id === meId;
  const matches = matchesOf(player);
  const sub     = subText != null ? subText : `${formatHandle(player.handle)} · ${matches} ${matches === 1 ? 'match' : 'matches'}`;
  const val     = valueText != null ? valueText : (player.sbx != null ? Number(player.sbx).toFixed(3) : '—');
  return (
    <button onClick={() => go && go({ screen: 'profile', viewingHandle: player.handle })} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '12px 14px', textAlign: 'left',
      borderBottom: last ? 'none' : '1px dashed rgba(14,28,19,0.08)',
      background: isYou ? 'rgba(28,73,42,0.07)' : 'transparent',
      cursor: 'pointer', border: 'none',
    }}>
      <div style={{
        width: 26, textAlign: 'center',
        fontFamily: 'var(--font-display)', fontSize: 14,
        color: 'var(--forest)', opacity: rank <= 3 ? 1 : 0.4,
        fontWeight: rank <= 3 ? 700 : 400,
      }}>{rank}</div>
      <LbAvatar player={{ name, handle: player.handle, avatar: player.avatar_url }} size={30}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}{isYou && ' · you'}</div>
        <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ width: 64, textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--forest)' }}>
        {val}
      </div>
    </button>
  );
}

// ─── Top 10 of a band (Explore home) ─────────────────────────────────
function BandTopTen({ band, rows, total, loading, meId, go, onOpenBoard }) {
  return (
    <div style={{ padding: '0 16px 18px' }}>
      <button
        onClick={onOpenBoard}
        disabled={!onOpenBoard || band == null}
        style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          width: '100%', marginBottom: 10, padding: '0 4px',
          background: 'transparent', border: 'none',
          cursor: (onOpenBoard && band != null) ? 'pointer' : 'default',
        }}
      >
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Top 10 · {band != null ? `${bandLabel(band)} band` : 'your band'}
        </div>
        {band != null && (
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            VIEW ALL <Icon.ArrowRight size={11} color="var(--forest)"/>
          </div>
        )}
      </button>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', padding: '10px 14px', fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--forest)', opacity: 0.5, borderBottom: '1px solid rgba(14,28,19,0.06)' }}>
          <span style={{ width: 26, textAlign: 'center' }}>#</span>
          <span style={{ flex: 1, paddingLeft: 8 }}>Player</span>
          <span style={{ width: 56, textAlign: 'right' }}>SBX</span>
        </div>
        {loading ? (
          <SppLoader/>
        ) : rows.length === 0 ? (
          <div style={{ padding: '20px 14px', textAlign: 'center', opacity: 0.5, fontSize: 13 }}>
            No rated players yet — play and confirm a few matches to appear here.
          </div>
        ) : (
          <>
            {rows.map((p, i) => (
              <LeaderRow key={p.id} rank={i + 1} player={p} meId={meId} go={go} last={false}/>
            ))}
            {total > rows.length && (
              <button onClick={onOpenBoard} style={{
                width: '100%', padding: '13px 14px',
                background: 'transparent', border: 'none',
                color: 'var(--forest)', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                View all {total} in band <Icon.ArrowRight size={12}/>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Full band leaderboard with a band switcher ──────────────────────
function BandLeaderboard({ band, data, meId, go, bands, onBack, onChangeBand }) {
  const rated = data || [];
  const rows  = rated.filter(p => p.sbx != null && Math.floor(Number(p.sbx)) === band); // SBX-desc

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ padding: '58px 20px 14px', background: 'var(--canvas)', color: 'var(--forest)' }}>
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--forest)', fontSize: 12, fontWeight: 700, padding: 0, marginBottom: 12, opacity: 0.7,
        }}>
          <Icon.ArrowLeft size={14}/> Explore
        </button>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Band leaderboard</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 0.95, marginTop: 6, letterSpacing: '-0.02em' }}>
          {bandLabel(band)}
        </div>
      </div>

      {/* Band switcher (slide across bands) */}
      <BandSwitcher bands={bands} active={band} onChange={onChangeBand}/>

      <div style={{ padding: '4px 16px 0' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '10px 14px', fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--forest)', opacity: 0.5, borderBottom: '1px solid rgba(14,28,19,0.06)' }}>
            <span style={{ width: 26, textAlign: 'center' }}>#</span>
            <span style={{ flex: 1, paddingLeft: 8 }}>Player</span>
            <span style={{ width: 56, textAlign: 'right' }}>SBX</span>
          </div>
          {data === null ? (
            <SppLoader/>
          ) : rows.length === 0 ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', opacity: 0.5, fontSize: 13 }}>
              No players in the {bandLabel(band)} band yet.
            </div>
          ) : rows.map((p, i) => (
            <LeaderRow key={p.id} rank={i + 1} player={p} meId={meId} go={go} last={i === rows.length - 1}/>
          ))}
        </div>
        <div style={{ fontSize: 11, opacity: 0.5, textAlign: 'center', marginTop: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          {rows.length} {rows.length === 1 ? 'player' : 'players'} in this band
        </div>
      </div>
    </div>
  );
}

function BandSwitcher({ bands, active, onChange }) {
  if (!bands || bands.length === 0) return null;
  return (
    <div className="scroll-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 16px' }}>
      {bands.map(b => {
        const on = b === active;
        return (
          <button key={b} onClick={() => onChange(b)} style={{
            flexShrink: 0, padding: '9px 16px', borderRadius: 999,
            background: on ? 'var(--forest)' : 'var(--paper)',
            color: on ? 'var(--cream)' : 'var(--forest)',
            border: on ? 'none' : '1px solid rgba(14,28,19,0.12)',
            boxShadow: on ? 'var(--shadow-sm)' : 'none',
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em',
            cursor: 'pointer',
          }}>{b}.0–{b}.9</button>
        );
      })}
    </div>
  );
}

// Leaderboard avatar — real picture if set, else the player's initial.
function LbAvatar({ player, size = 30 }) {
  const initial = (player.name || player.handle || '?').replace(/^@/, '').charAt(0).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: 999, overflow: 'hidden', flexShrink: 0,
      background: 'var(--forest)', color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: Math.round(size * 0.42) }}>
      {player.avatar
        ? <img src={player.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        : initial}
    </div>
  );
}

// ─── Per-user win streaks across all players (computed from matches) ─
// Streak = consecutive WINS (a loss or halve breaks it), per player, over
// their completed matches in chronological order.
//   longest = best run ever;  active = trailing run up to the latest match.
// Returns an array of { id, handle, first_name, last_name, avatar_url,
// longest, active, played } (all players with ≥1 completed match), or null
// while loading.
function useStreaks() {
  const [rows, setRows] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: ms } = await sbx
        .from('matches')
        .select('player_a, player_a2, player_b, player_b2, result, completed_at, created_at')
        .eq('status', 'completed')
        .in('result', ['A', 'B', 'H']);
      if (cancelled) return;

      const tsOf = (m) => new Date(m.completed_at || m.created_at || 0).getTime();
      const byUser = {};
      const add = (id, won, t) => { if (id) (byUser[id] = byUser[id] || []).push({ t, won }); };
      for (const m of (ms || [])) {
        const t = tsOf(m);
        add(m.player_a,  m.result === 'A', t);
        add(m.player_a2, m.result === 'A', t);
        add(m.player_b,  m.result === 'B', t);
        add(m.player_b2, m.result === 'B', t);
      }

      const stats = {}; // id -> { longest, active, played }
      for (const id in byUser) {
        const arr = byUser[id].sort((x, y) => x.t - y.t);
        let cur = 0, best = 0;
        for (const e of arr) { if (e.won) { cur++; if (cur > best) best = cur; } else cur = 0; }
        let act = 0;
        for (let i = arr.length - 1; i >= 0; i--) { if (arr[i].won) act++; else break; }
        stats[id] = { longest: best, active: act, played: arr.length };
      }

      const ids = Object.keys(stats);
      let profiles = [];
      if (ids.length) {
        const { data: ps } = await sbx
          .from('profiles')
          .select('id, handle, first_name, last_name, avatar_url')
          .in('id', ids);
        profiles = ps || [];
      }
      const out = profiles.map(p => ({ ...p, ...stats[p.id] }));
      if (!cancelled) setRows(out);
    })();
    return () => { cancelled = true; };
  }, []);
  return rows;
}

// ─── Stat leaders (cards) — tap a card to open that stat's full board ─
function StatLeaders({ data, streaks, openStat }) {
  if (data === null) {
    return <SppLoader size={36} pad={16}/>;
  }
  if (!data.length) return null;

  const topSbx     = data[0]; // already SBX-desc
  const mostActive = data.reduce((a, b) => (matchesOf(b) > matchesOf(a) ? b : a), data[0]);
  const maxBy = (key) => (streaks && streaks.length)
    ? streaks.reduce((a, b) => (b[key] > a[key] ? b : a))
    : null;
  const longestLeader = maxBy('longest');
  const activeLeader  = maxBy('active');
  const streakVal = (leader, key) =>
    streaks === null ? '…' : (leader && leader[key] > 0 ? String(leader[key]) : '—');
  const streakHolder = (leader, key) =>
    (leader && leader[key] > 0) ? leader.handle : null;

  const cards = [
    { title: 'Highest SBX',       holderHandle: topSbx.handle,                    value: topSbx.sbx != null ? Number(topSbx.sbx).toFixed(3) : '—', kind: 'sbx' },
    { title: 'Most matches',      holderHandle: mostActive.handle,                value: String(matchesOf(mostActive)),                            kind: 'matches' },
    { title: 'Longest win streak', holderHandle: streakHolder(longestLeader, 'longest'), value: streakVal(longestLeader, 'longest'),               kind: 'longest' },
    { title: 'Active win streak',  holderHandle: streakHolder(activeLeader, 'active'),   value: streakVal(activeLeader, 'active'),                 kind: 'active' },
  ];

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, padding: '0 4px' }}>Stat leaders</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {cards.map(c => (
          <RecordCard
            key={c.title}
            title={c.title}
            holder={c.holderHandle ? formatHandle(c.holderHandle) : '—'}
            value={c.value}
            onOpen={() => openStat(c.kind)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Full leaderboard for a single stat (all users) ──────────────────
function StatLeaderboard({ kind, data, streaks, meId, go, onBack }) {
  const META = {
    sbx:     { title: 'Highest SBX',       head: 'SBX',     blurb: 'All players, ranked by Sandbox Rating™.' },
    matches: { title: 'Most matches',      head: 'PLAYED',  blurb: 'All players, ranked by matches played.' },
    longest: { title: 'Longest win streak', head: 'STREAK', blurb: 'Best run of consecutive wins, all-time.' },
    active:  { title: 'Active win streak',  head: 'STREAK', blurb: 'Current run of consecutive wins.' },
  };
  const meta = META[kind] || META.sbx;

  let loading, rows, valueOf, subOf;
  if (kind === 'sbx') {
    loading = data === null;
    rows    = (data || []); // already SBX-desc
    valueOf = (p) => (p.sbx != null ? Number(p.sbx).toFixed(3) : '—');
  } else if (kind === 'matches') {
    loading = data === null;
    rows    = [...(data || [])].sort((a, b) => matchesOf(b) - matchesOf(a));
    valueOf = (p) => String(matchesOf(p));
    subOf   = (p) => formatHandle(p.handle);
  } else {
    loading = streaks === null;
    const k = kind; // 'longest' | 'active'
    rows    = (streaks || []).filter(s => s[k] > 0).sort((a, b) => b[k] - a[k]);
    valueOf = (s) => String(s[k]);
    subOf   = (s) => `${formatHandle(s.handle)} · ${s.played} ${s.played === 1 ? 'match' : 'matches'}`;
  }

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ padding: '58px 20px 14px', background: 'var(--canvas)', color: 'var(--forest)' }}>
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--forest)', fontSize: 12, fontWeight: 700, padding: 0, marginBottom: 12, opacity: 0.7,
        }}>
          <Icon.ArrowLeft size={14}/> Explore
        </button>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Leaderboard</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 0.95, marginTop: 6, letterSpacing: '-0.02em' }}>
          {meta.title}
        </div>
        <div className="caption-serif" style={{ fontSize: 15, opacity: 0.65, marginTop: 6 }}>
          {meta.blurb}
        </div>
      </div>

      <div style={{ padding: '4px 16px 0' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', padding: '10px 14px', fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--forest)', opacity: 0.5, borderBottom: '1px solid rgba(14,28,19,0.06)' }}>
            <span style={{ width: 26, textAlign: 'center' }}>#</span>
            <span style={{ flex: 1, paddingLeft: 8 }}>Player</span>
            <span style={{ width: 64, textAlign: 'right' }}>{meta.head}</span>
          </div>
          {loading ? (
            <SppLoader/>
          ) : rows.length === 0 ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', opacity: 0.5, fontSize: 13 }}>
              Nothing here yet — play and confirm matches to appear.
            </div>
          ) : rows.map((p, i) => (
            <LeaderRow
              key={p.id}
              rank={i + 1}
              player={p}
              meId={meId}
              go={go}
              last={i === rows.length - 1}
              valueText={valueOf(p)}
              subText={subOf ? subOf(p) : null}
            />
          ))}
        </div>
        <div style={{ fontSize: 11, opacity: 0.5, textAlign: 'center', marginTop: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          {loading ? '' : `${rows.length} ${rows.length === 1 ? 'player' : 'players'}`}
        </div>
      </div>
    </div>
  );
}

function RecordCard({ title, holder, value, onOpen }) {
  return (
    <button
      onClick={onOpen || undefined}
      disabled={!onOpen}
      className="card"
      style={{
        padding: 16, textAlign: 'left', width: '100%', border: 'none',
        background: 'var(--paper)', cursor: onOpen ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</div>
      <div className="display-num" style={{ fontSize: 32, color: 'var(--forest)', marginTop: 10 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 4 }}>
        {holder}
        {onOpen && <Icon.ArrowRight size={10} color="var(--forest)"/>}
      </div>
    </button>
  );
}

Object.assign(window, { SocialScreen });
