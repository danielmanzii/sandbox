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
        {[['you', 'You'], ['h2h', 'Head-to-Head']].map(([k, l]) => (
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
        : <StatsH2H/>}
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

// Plain-language explainers for the tappable "i" on each advanced stat.
const STAT_INFO = {
  clutch: "When your partner's ball is compromised — they miss the green, go OB, or miss the fairway off the tee — Clutch % is how often YOUR ball bailed the team out: the team played your ball AND won or halved the hole. It only counts when the rescue actually saved the hole, so it can't be padded.",
  shotEff: "Of the holes where the team picked a ball to play, the share where they played YOUR ball. 50% is an even partnership — above 50% means your ball is carrying the team, below means you're riding your partner's.",
  finisher: "Of the team's holes that came down to a holed putt, how often YOU were the one who sank it. The closer rating.",
  scrambling: "When you miss the green, how often you still win or halve the hole — your up-and-down grit under pressure.",
  bounceBack: "Right after you LOSE a hole, how often you win the very next one. Pure momentum and mental resilience.",
  conversion: "When you hit the green in regulation, how often you actually win the hole. Rewards capitalizing on your good shots.",
  closer: "Your hole-win rate when the match is tight (all square or 1 up/down) or in the closing two holes. Performance when it matters most.",
};

function StatsYou({ go }) {
  const u = MOCK.USER;
  const f2 = u.fmt2v2 || {};
  const f1 = u.fmt1v1 || {};
  const hasShotData = (u.gir > 0) || (u.putts > 0) || (u.fairway != null);
  const history = (MOCK.HISTORY || []);
  const [fmt, setFmt] = React.useState('duo'); // duo = 2v2, solo = 1v1

  return (
    <div style={{ padding: '16px' }}>
      {/* SBX rating hero (shared with Profile) */}
      <RealSbxCard user={u} go={go} showDashboard={false}/>

      {/* Shot stats — apply to both formats, so they lead */}
      <SectionHeader eyebrow="Your game" title="Shot stats"/>
      {hasShotData ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <ShotStat label="GIR" value={u.gir != null ? `${Math.round((u.gir || 0) * 100)}%` : '—'} sub="greens in reg"/>
          <ShotStat label="Fairways Hit" value={u.fairway != null ? `${Math.round(u.fairway * 100)}%` : '—'} sub="off the tee"/>
          <ShotStat label="Avg Putts" value={u.putts ? u.putts.toFixed(2) : '—'} sub="per hole · 1v1"/>
        </div>
      ) : (
        <EmptyNote title="No shot data yet." body="Track stats during scoring to unlock fairways, greens, putts and more."/>
      )}

      {/* Duo (2v2) / Solo (1v1) split — the format-specific stats live here */}
      <div style={{ display: 'flex', gap: 6, marginTop: 24, background: 'rgba(14,28,19,0.05)', borderRadius: 999, padding: 4 }}>
        {[['duo', '2v2 Stats'], ['solo', '1v1 Stats']].map(([k, l]) => (
          <button key={k} onClick={() => setFmt(k)} style={{
            flex: 1, padding: '11px 14px', borderRadius: 999,
            background: fmt === k ? 'var(--forest)' : 'transparent',
            color: fmt === k ? 'var(--cream)' : 'var(--forest)',
            fontWeight: 800, fontSize: 14, letterSpacing: '0.01em', transition: 'all 0.15s',
          }}>{l}</button>
        ))}
      </div>

      {fmt === 'duo' ? (
        <div style={{ marginTop: 14 }}>
          <RecordHero rec={f2} fmt="2v2"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <StatChip label="Win streak" fire value={`${f2.winStreak || 0}`} sub={f2.longestStreak ? `longest ${f2.longestStreak}` : 'current run'}/>
            <StatChip label="Best win" value={f2.bestWin ? f2.bestWin.margin : '—'} sub={f2.bestWin && f2.bestWin.opp ? `vs ${formatHandle(f2.bestWin.opp)}` : 'biggest margin'}/>
            <PctChip label="Clutch %" stat={f2.clutch} desc="saved the hole for your team" info={STAT_INFO.clutch}/>
            <PctChip label="Shot efficiency" stat={f2.shotEff} desc="team played your ball" info={STAT_INFO.shotEff}/>
            <PctChip label="Finisher %" stat={f2.finisher} desc="team putts you sank" info={STAT_INFO.finisher}/>
            <StatChip label="Best partner" value={f2.bestPartner && f2.bestPartner.handle ? formatHandle(f2.bestPartner.handle) : '—'} sub={f2.bestPartner ? `${f2.bestPartner.winPct}% · ${f2.bestPartner.games} games` : 'min 2 games together'}/>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <RecordHero rec={f1} fmt="1v1"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <StatChip label="Win streak" fire value={`${f1.winStreak || 0}`} sub={f1.longestStreak ? `longest ${f1.longestStreak}` : 'current run'}/>
            <StatChip label="Best win" value={f1.bestWin ? f1.bestWin.margin : '—'} sub={f1.bestWin && f1.bestWin.opp ? `vs ${formatHandle(f1.bestWin.opp)}` : 'biggest margin'}/>
            <PctChip label="Scrambling %" stat={f1.scrambling} desc="missed green, still won/halved" info={STAT_INFO.scrambling}/>
            <PctChip label="Bounce-back %" stat={f1.bounceBack} desc="won the hole after a loss" info={STAT_INFO.bounceBack}/>
            <PctChip label="Conversion %" stat={f1.conversion} desc="GIR holes you won" info={STAT_INFO.conversion}/>
            <PctChip label="Closer %" stat={f1.closer} desc="tight / closing holes won" info={STAT_INFO.closer}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── On-brand stat building blocks ────────────────────────────────────
function SectionHeader({ eyebrow, title }) {
  return (
    <div style={{ marginTop: 24, marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{eyebrow}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 0.95, letterSpacing: '-0.02em', color: 'var(--forest)', marginTop: 3 }}>{title}</div>
    </div>
  );
}

// Forest-gradient mini stat (shot stats row).
function ShotStat({ label, value, sub }) {
  return (
    <div style={{ background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 60%, var(--moss) 100%)', color: 'var(--cream)', borderRadius: 16, padding: '13px 12px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1, marginTop: 5 }}>{value}</div>
        <div style={{ fontSize: 9, opacity: 0.65, marginTop: 3 }}>{sub}</div>
      </div>
    </div>
  );
}

// Forest-gradient record hero with a W/H/L proportion bar = the win rate.
function RecordHero({ rec, fmt }) {
  const W = rec.W || 0, L = rec.L || 0, H = rec.H || 0, total = W + L + H;
  const wr = rec.winRate;
  return (
    <div style={{ background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)', color: 'var(--cream)', borderRadius: 'var(--radius-card-lg)', padding: 20, position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65 }}>Record · {fmt}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.85, letterSpacing: '-0.02em', marginTop: 6 }}>{W}–{L}–{H}</div>
          </div>
          {total > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 0.9 }}>{wr}%</div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>win rate</div>
            </div>
          )}
        </div>
        {total > 0 ? (
          <>
            <div style={{ display: 'flex', gap: 3, marginTop: 16, height: 9, borderRadius: 999, overflow: 'hidden' }}>
              {W > 0 && <div style={{ flex: W, background: 'var(--cream)' }}/>}
              {H > 0 && <div style={{ flex: H, background: 'rgba(234,226,206,0.45)' }}/>}
              {L > 0 && <div style={{ flex: L, background: 'rgba(14,28,19,0.5)' }}/>}
            </div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
              {W} W · {L} L · {H} H — {total} {total === 1 ? 'match' : 'matches'}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>No {fmt} matches yet — go play one.</div>
        )}
      </div>
    </div>
  );
}

// Non-percentage chip (win streak, best win, best partner).
function StatChip({ label, value, sub, fire }) {
  return (
    <div className="card" style={{ padding: '13px 15px' }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}{fire ? ' 🔥' : ''}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1, color: 'var(--forest)', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.03em', color: 'var(--forest)' }}>{sub}</div>
    </div>
  );
}

// Percentage chip with a fill bar + tappable "i" explainer.
function PctChip({ label, stat, desc, info }) {
  const has = stat && stat.pct != null;
  return (
    <div className="card" style={{ padding: '13px 15px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        {info && <InfoDot title={label} text={info}/>}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1, color: 'var(--forest)', marginTop: 6 }}>{has ? `${stat.pct}%` : '—'}</div>
      <div style={{ height: 5, borderRadius: 999, background: 'rgba(14,28,19,0.08)', marginTop: 8, overflow: 'hidden' }}>
        <div style={{ width: has ? `${stat.pct}%` : '0%', height: '100%', background: 'var(--forest)', borderRadius: 999 }}/>
      </div>
      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 6, color: 'var(--forest)', lineHeight: 1.3 }}>
        {desc}{has ? ` · ${stat.sample} ${stat.sample === 1 ? 'hole' : 'holes'}` : ''}
      </div>
    </div>
  );
}

// Tappable "i" → centered explainer modal.
function InfoDot({ title, text }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }} style={{
        width: 18, height: 18, borderRadius: 999, flexShrink: 0,
        border: '1px solid rgba(14,28,19,0.3)', background: 'transparent', color: 'var(--forest)',
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>i</button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(14,28,19,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--canvas)', borderRadius: 20, padding: 22, maxWidth: 340, boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--forest)', opacity: 0.6 }}>What it means</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', marginTop: 6, lineHeight: 1 }}>{title}</div>
            <div className="caption-serif" style={{ fontSize: 15, color: 'var(--ink)', opacity: 0.85, marginTop: 10, lineHeight: 1.45 }}>{text}</div>
            <button onClick={() => setOpen(false)} style={{ marginTop: 16, width: '100%', padding: '11px', borderRadius: 12, background: 'var(--forest)', color: 'var(--cream)', border: 'none', fontWeight: 800, fontSize: 13 }}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}

function EmptyNote({ title, body }) {
  return (
    <div className="card" style={{ padding: '22px 20px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)', lineHeight: 1 }}>{title}</div>
      <div className="caption-serif" style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>{body}</div>
    </div>
  );
}

function MatchRow({ r, last, go }) {
  const isW = r.result === 'W', isL = r.result === 'L';
  const badgeStyle = isW
    ? { background: 'var(--forest)', color: 'var(--cream)', border: 'none' }
    : isL
    ? { background: '#C44536', color: '#FFFFFF', border: 'none' }
    : { background: 'var(--paper)', color: 'var(--forest)', border: '1px solid rgba(28,73,42,0.25)' };
  const label = isW ? 'W' : isL ? 'L' : 'H';
  return (
    <div
      onClick={() => go && go({ screen: r.live ? 'match' : 'matchDetail', matchId: r.id })}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        borderBottom: last ? 'none' : '1px solid rgba(14,28,19,0.05)',
        background: r.live ? 'rgba(28,73,42,0.04)' : 'transparent',
        cursor: 'pointer',
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
      <SectionHeader eyebrow="Rivalries" title="Head-to-head"/>
      {rows.length === 0 ? (
        <EmptyNote title="No rivalries yet." body="Head-to-head records build as you play opponents more than once."/>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(h => <RivalCard key={h.opp} h={h}/>)}
        </div>
      )}
    </div>
  );
}

// One rival: avatar + handle, W–L–H + win rate, and a W/H/L proportion bar
// (same visual language as the You section's record hero).
function RivalCard({ h }) {
  const total = h.w + h.l + h.h;
  const wr = total > 0 ? Math.round((h.w / total) * 100) : 0;
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AvatarBy handle={h.opp} size={40}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatHandle(h.opp)}</div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.55, marginTop: 5, letterSpacing: '0.06em' }}>{total} {total === 1 ? 'match' : 'matches'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 0.9, color: 'var(--forest)' }}>{h.w}–{h.l}–{h.h}</div>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginTop: 3 }}>{wr}% win</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 12, height: 8, borderRadius: 999, overflow: 'hidden', background: 'rgba(14,28,19,0.06)' }}>
        {h.w > 0 && <div style={{ flex: h.w, background: 'var(--forest)' }}/>}
        {h.h > 0 && <div style={{ flex: h.h, background: 'rgba(14,28,19,0.2)' }}/>}
        {h.l > 0 && <div style={{ flex: h.l, background: 'var(--loss)' }}/>}
      </div>
    </div>
  );
}

Object.assign(window, { StatsScreen });
