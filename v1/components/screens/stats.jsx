/* global React, Icon, Button, Chip, MOCK, AvatarBy, RealSbxCard, formatHandle */
// Stats dashboard — real data only. SBX (D2 engine), record, shot stats
// (GIR/putts/proximity when captured), match history, head-to-head, and
// achievements are all derived from the signed-in user's real matches.
// Shot-level intel that needs per-shot capture fills in once D3 ships.

function StatsScreen({ go, tier }) {
  const isMember = tier === 'league' || tier === 'plus' || tier === 'stats';
  const [tab, setTab] = React.useState('you');

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ padding: '58px 20px 20px', background: 'var(--canvas)', color: 'var(--forest)' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase' }}>The Numbers</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, marginTop: 8, letterSpacing: '-0.02em' }}>Stats.</div>
        <div className="caption-serif" style={{ fontSize: 16, opacity: 0.65, marginTop: 6 }}>Your receipts, ranked.</div>
      </div>

      <div style={{ display: 'flex', gap: 4, margin: '0 16px 0', background: 'rgba(14,28,19,0.05)', borderRadius: 14, padding: 4 }}>
        {[['you', 'You'], ['h2h', 'Head-to-Head'], ['badges', 'Badges']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, padding: '10px 12px', borderRadius: 11,
            background: tab === k ? 'var(--paper)' : 'transparent',
            color: 'var(--forest)', fontWeight: 700, fontSize: 12,
            boxShadow: tab === k ? 'var(--shadow-sm)' : 'none',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>{l}</button>
        ))}
      </div>

      {!isMember ? <StatsLocked go={go}/>
        : tab === 'you' ? <StatsYou go={go}/>
        : tab === 'h2h' ? <StatsH2H/>
        : <StatsBadges/>}
    </div>
  );
}

function StatsLocked({ go }) {
  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ textAlign: 'center', padding: '28px 24px 24px', background: 'var(--paper)', borderRadius: 20, border: 'var(--hairline)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 999, background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream)', margin: '0 auto 16px' }}>
          <Icon.Lock size={20} color="var(--cream)"/>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--forest)', lineHeight: 1, marginBottom: 8 }}>Your stats are ready.</div>
        <div className="caption-serif" style={{ fontSize: 15, color: 'var(--ink)', opacity: 0.7, marginBottom: 20, maxWidth: 280, display: 'inline-block' }}>
          Add the Stats Add On for $10/mo — less than your last cortadito order, probably.
        </div>
        <Button variant="forest" onClick={() => go({ screen: 'membership' })}>See plans <Icon.ArrowRight size={14}/></Button>
      </div>
    </div>
  );
}

function StatsYou({ go }) {
  const u = MOCK.USER;
  const total = u.matchesTotal || 0;
  const decided = (u.matchesW || 0) + (u.matchesL || 0);
  const winRate = decided > 0 ? Math.round((u.matchesW / decided) * 100) + '%' : '—';
  const hasShotData = (u.gir > 0) || (u.putts > 0) || (u.proximity > 0);
  const history = (MOCK.HISTORY || []);

  return (
    <div style={{ padding: '16px' }}>
      {/* Real SBX hero (shared with Profile) */}
      <RealSbxCard user={u} go={go} showDashboard={false}/>

      {/* Summary tiles — all real */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
        <StatTile label="Record" value={`${u.matchesW || 0}–${u.matchesL || 0}–${u.matchesH || 0}`} sub={`${total} matches`}/>
        <StatTile label="Win rate" value={winRate} sub={decided > 0 ? `${u.matchesW} of ${decided}` : 'no matches yet'} highlight/>
        <StatTile label="Matches" value={total} sub="played"/>
        <StatTile label="Unbeaten" value={`${u.streak || 0}`} sub="current streak · 🔥" accent/>
      </div>

      {/* Shot-level stats: real when captured, honest empty otherwise */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Shot stats</div>
        {hasShotData ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <CoreStat label="GIR" value={`${Math.round(u.gir * 100)}%`} sub="greens in reg"/>
            <CoreStat label="Putts" value={(u.putts || 0).toFixed(2)} sub="per hole"/>
            <CoreStat label="Proximity" value={`${u.proximity || 0}′`} sub="avg to pin"/>
          </div>
        ) : (
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)' }}>No shot data yet.</div>
            <div className="caption-serif" style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>
              GIR, putts, proximity, and ball-selection intel appear here as you track rounds during scoring.
            </div>
          </div>
        )}
      </div>

      {/* Match history — real */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Match history</div>
        {history.length > 0 ? (
          <div className="card" style={{ overflow: 'hidden' }}>
            {history.slice(0, 8).map((r, i) => <MatchRow key={r.id} r={r} last={i === Math.min(history.length, 8) - 1}/>)}
          </div>
        ) : (
          <div className="card" style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)', lineHeight: 1, marginBottom: 6 }}>No matches yet.</div>
            <div className="caption-serif" style={{ fontSize: 14, color: 'var(--ink)', opacity: 0.6 }}>Your match history shows up here after your first game.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function CoreStat({ label, value, sub, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--forest)' : 'var(--paper)',
      color: accent ? 'var(--cream)' : 'var(--ink)',
      border: accent ? 'none' : 'var(--hairline)',
      borderRadius: 16, padding: '12px 14px', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 9, opacity: 0.6, marginTop: 3, fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

function MatchRow({ r, last }) {
  const isW = r.result === 'W', isL = r.result === 'L';
  const badgeStyle = isW
    ? { background: 'var(--forest)', color: 'var(--cream)', border: 'none' }
    : isL
    ? { background: 'var(--cream)', color: 'var(--forest)', border: 'none' }
    : { background: 'var(--paper)', color: 'var(--forest)', border: '1px solid rgba(28,73,42,0.25)' };
  const label = isW ? 'W' : isL ? 'L' : 'H';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderBottom: last ? 'none' : '1px solid rgba(14,28,19,0.05)',
      background: r.live ? 'rgba(28,73,42,0.04)' : 'transparent',
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 15, lineHeight: 1, ...badgeStyle }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>
          vs {formatHandle(r.opp)}
          {r.live && <span style={{ color: 'var(--forest)', marginLeft: 6, fontSize: 10 }}>• LIVE</span>}
        </div>
        <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>{r.course}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: isL ? 'rgba(14,28,19,0.5)' : 'var(--forest)' }}>{r.margin}</div>
    </div>
  );
}

function StatTile({ label, value, sub, highlight, accent }) {
  return (
    <div style={{
      background: highlight ? 'var(--cream)' : accent ? 'var(--forest)' : 'var(--paper)',
      color: highlight ? 'var(--forest)' : accent ? 'var(--cream)' : 'var(--ink)',
      borderRadius: 18, padding: '14px 16px',
      border: highlight || accent ? 'none' : 'var(--hairline)',
      boxShadow: accent ? 'var(--shadow-md)' : 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
      <div className="display-num" style={{ fontSize: 28, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{sub}</div>
    </div>
  );
}

// ─── Head-to-head, aggregated from real recent matches ────────────────
function StatsH2H() {
  const history = MOCK.HISTORY || [];
  const byOpp = {};
  history.forEach(r => {
    if (!r.opp) return;
    const k = r.opp;
    byOpp[k] = byOpp[k] || { opp: k, w: 0, l: 0, h: 0 };
    if (r.result === 'W') byOpp[k].w++;
    else if (r.result === 'L') byOpp[k].l++;
    else byOpp[k].h++;
  });
  const rows = Object.values(byOpp).sort((a, b) => (b.w + b.l + b.h) - (a.w + a.l + a.h));

  return (
    <div style={{ padding: '16px' }}>
      {rows.length === 0 ? (
        <div className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)', lineHeight: 1, marginBottom: 6 }}>No rivalries yet.</div>
          <div className="caption-serif" style={{ fontSize: 14, color: 'var(--ink)', opacity: 0.6 }}>Head-to-head records build as you play.</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Your records</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {rows.map((h, i) => (
              <div key={h.opp} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i < rows.length - 1 ? '1px solid rgba(14,28,19,0.05)' : 'none' }}>
                <AvatarBy handle={h.opp} size={36}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{formatHandle(h.opp)}</div>
                  <div style={{ fontSize: 10, opacity: 0.55, marginTop: 3 }}>{h.w + h.l + h.h} matches</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-display)' }}>
                  <span style={{ color: 'var(--forest)', fontSize: 18 }}>{h.w}</span>
                  <span style={{ color: 'rgba(14,28,19,0.3)', fontSize: 12 }}>–</span>
                  <span style={{ color: 'var(--clay-deep)', fontSize: 18 }}>{h.l}</span>
                  <span style={{ color: 'rgba(14,28,19,0.3)', fontSize: 12 }}>–</span>
                  <span style={{ color: '#8A6A4A', fontSize: 16 }}>{h.h}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Achievements, computed from real stats ───────────────────────────
function StatsBadges() {
  const u = MOCK.USER;
  const total = u.matchesTotal || 0;
  const badges = [
    { id: 'first',  name: 'First Round',  sub: 'Play your first match',   icon: 'flag',   earned: total >= 1 },
    { id: 'win',    name: 'First Win',    sub: 'Win a match',             icon: 'trophy', earned: (u.matchesW || 0) >= 1 },
    { id: 'rated',  name: 'Rated',        sub: 'Complete 3 matches',      icon: 'ball',   earned: (u.sbx2v2N || 0) >= 3 },
    { id: 'fire',   name: 'On Fire',      sub: '3-match unbeaten streak', icon: 'fire',   earned: (u.streak || 0) >= 3 },
    { id: 'reg',    name: 'Regular',      sub: 'Play 10 matches',         icon: 'bolt',   earned: total >= 10 },
    { id: 'sharp',  name: 'Sharp',        sub: 'Reach 5.000 SBX',         icon: 'trophy', earned: (u.sbx2v2 || 0) >= 5 },
  ];
  const earned = badges.filter(b => b.earned).length;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Earned · {earned} of {badges.length}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        {badges.map(b => <BadgeCard key={b.id} b={b}/>)}
      </div>
    </div>
  );
}

function BadgeCard({ b }) {
  const ic = {
    flag: <Icon.Flag size={22}/>, fire: <Icon.Fire size={22}/>, bolt: <Icon.Bolt size={22}/>,
    trophy: <Icon.Trophy size={22}/>, ball: <Icon.Ball size={22}/>,
  }[b.icon];
  const locked = !b.earned;
  return (
    <div style={{
      background: locked ? 'transparent' : 'var(--paper)',
      border: locked ? '1.5px dashed rgba(14,28,19,0.15)' : 'var(--hairline)',
      borderRadius: 18, padding: '16px 14px', textAlign: 'center',
      opacity: locked ? 0.55 : 1, boxShadow: locked ? 'none' : 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 48, height: 48, margin: '0 auto', borderRadius: '50%',
        background: locked ? 'transparent' : 'var(--forest)',
        color: locked ? 'var(--forest)' : 'var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: locked ? '1.5px dashed currentColor' : 'none',
      }}>{locked ? <Icon.Lock size={18}/> : ic}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginTop: 10, lineHeight: 1, color: 'var(--forest)' }}>{b.name}</div>
      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, lineHeight: 1.3 }}>{b.sub}</div>
    </div>
  );
}

Object.assign(window, { StatsScreen });
