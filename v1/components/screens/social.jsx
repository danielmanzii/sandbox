/* global React, Icon, LiveDot, Button, MOCK, useUserSearch, useIsFollowing, followUser, unfollowUser, useLiveEvent, useSbxLeaderboard, formatHandle */
// Explore: prominent player search + top 10 by SBX + your band rank + stat leaders.
// (Tab is labelled "Explore" in the shell; the route id stays `social`.)

function SocialScreen({ go }) {
  const [liveEvent] = useLiveEvent();
  const data        = useSbxLeaderboard(200); // null = loading, [] = nobody rated yet
  const meId        = MOCK.USER && MOCK.USER.id;

  const rated = data || [];
  const top10 = rated.slice(0, 10);

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ padding: '58px 20px 16px', background: 'var(--canvas)', color: 'var(--forest)' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Explore</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, marginTop: 8, letterSpacing: '-0.02em' }}>Who's hot.</div>
        <div className="caption-serif" style={{ fontSize: 16, opacity: 0.65, marginTop: 6 }}>
          Find players. Track the ladder.
        </div>
      </div>

      {/* Prominent search */}
      <ExploreSearch go={go}/>

      {/* Live now banner (only when a match is in progress) */}
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

      {/* Your rank within your SBX band */}
      <BandRankCard data={data} meId={meId}/>

      {/* Top 10 by SBX */}
      <TopTen rows={top10} loading={data === null} meId={meId} go={go}/>

      {/* Stat leaders across all players */}
      <StatLeaders data={data}/>
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
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--forest)', borderRadius: 16,
          padding: '15px 18px', cursor: 'text',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Icon.Search size={18} color="var(--cream)"/>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search players by name or @handle…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: 15, color: 'var(--cream)', fontWeight: 600,
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

// ─── Your rank within your SBX band (e.g. 3rd in the 3.000–3.999 band) ──
function BandRankCard({ data, meId }) {
  if (data === null) return null; // loading — stay quiet
  const myRow = data.find(p => p.id === meId);

  // Unrated / not in the ranked set yet.
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

  const band      = Math.floor(Number(myRow.sbx));
  const bandLabel = `${band}.000–${band}.999`;
  const bandPlayers = data.filter(p => p.sbx != null && Math.floor(Number(p.sbx)) === band); // already SBX-desc
  const myBandRank  = bandPlayers.findIndex(p => p.id === meId) + 1;
  const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div style={{ padding: '0 16px 18px' }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
        color: 'var(--cream)', borderRadius: 20, padding: '20px 22px',
        position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-md)',
      }}>
        <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.7, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Your rank · {bandLabel} band
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
      </div>
    </div>
  );
}

// ─── Top 10 by Sandbox Rating ────────────────────────────────────────
function TopTen({ rows, loading, meId, go }) {
  return (
    <div style={{ padding: '0 16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Top 10</div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.45, letterSpacing: '0.06em' }}>BY SANDBOX RATING™</div>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', padding: '10px 14px', fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--forest)', opacity: 0.5, borderBottom: '1px solid rgba(14,28,19,0.06)' }}>
          <span style={{ width: 26, textAlign: 'center' }}>#</span>
          <span style={{ flex: 1, paddingLeft: 8 }}>Player</span>
          <span style={{ width: 56, textAlign: 'right' }}>SBX</span>
        </div>
        {loading ? (
          <div style={{ padding: '20px 14px', textAlign: 'center', opacity: 0.45, fontSize: 13 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '20px 14px', textAlign: 'center', opacity: 0.5, fontSize: 13 }}>
            No rated players yet — play and confirm a few matches to appear here.
          </div>
        ) : rows.map((p, i) => {
          const name   = [p.first_name, p.last_name].filter(Boolean).join(' ') || formatHandle(p.handle);
          const isYou  = p.id === meId;
          const matches = (p.sbx_2v2_n || 0) + (p.sbx_1v1_n || 0);
          return (
            <button key={p.id} onClick={() => go && go({ screen: 'profile', viewingHandle: p.handle })} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '12px 14px', textAlign: 'left',
              borderBottom: i < rows.length - 1 ? '1px dashed rgba(14,28,19,0.08)' : 'none',
              background: isYou ? 'rgba(28,73,42,0.07)' : 'transparent',
              cursor: 'pointer', border: 'none',
            }}>
              <div style={{
                width: 26, textAlign: 'center',
                fontFamily: 'var(--font-display)', fontSize: 14,
                color: 'var(--forest)', opacity: i < 3 ? 1 : 0.4,
                fontWeight: i < 3 ? 700 : 400,
              }}>{i + 1}</div>
              <LbAvatar player={{ name, handle: p.handle, avatar: p.avatar_url }} size={30}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}{isYou && ' · you'}</div>
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{formatHandle(p.handle)} · {matches} {matches === 1 ? 'match' : 'matches'}</div>
              </div>
              <div style={{ width: 56, textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--forest)' }}>
                {p.sbx != null ? Number(p.sbx).toFixed(3) : '—'}
              </div>
            </button>
          );
        })}
      </div>
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

// ─── Stat leaders across all rated players ───────────────────────────
function StatLeaders({ data }) {
  if (data === null) {
    return <div style={{ padding: '6px 16px 0', textAlign: 'center', opacity: 0.45, fontSize: 13 }}>Loading…</div>;
  }
  if (!data.length) return null;

  const matchesOf = (p) => (p.sbx_2v2_n || 0) + (p.sbx_1v1_n || 0);
  const maxBy = (key) => {
    const pool = data.filter(p => p[key] != null);
    if (!pool.length) return null;
    return pool.reduce((a, b) => (Number(b[key]) > Number(a[key]) ? b : a));
  };

  const topSbx     = data[0]; // already SBX-desc
  const mostActive = data.reduce((a, b) => (matchesOf(b) > matchesOf(a) ? b : a), data[0]);
  const best1v1    = maxBy('sbx_1v1');
  const best2v2    = maxBy('sbx_2v2');

  const cards = [
    { title: 'Highest SBX',  holder: topSbx,     value: topSbx.sbx != null ? Number(topSbx.sbx).toFixed(3) : '—' },
    { title: 'Most matches', holder: mostActive, value: String(matchesOf(mostActive)) },
    best2v2 && { title: 'Best 2v2', holder: best2v2, value: Number(best2v2.sbx_2v2).toFixed(3) },
    best1v1 && { title: 'Best 1v1', holder: best1v1, value: Number(best1v1.sbx_1v1).toFixed(3) },
  ].filter(Boolean);

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, padding: '0 4px' }}>Stat leaders</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {cards.map(c => (
          <RecordCard key={c.title} title={c.title} holder={formatHandle(c.holder.handle)} value={c.value}/>
        ))}
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
