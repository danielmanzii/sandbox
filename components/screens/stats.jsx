/* global React, Icon, LiveDot, Button, Eyebrow, Chip, Dashed, ScoreDial, Spark, MOCK, AvatarBy */
// Stats dashboard + handicap + badges (deep, member-gated)

function StatsScreen({ go, tier }) {
  const isMember = tier === 'league' || tier === 'leaguePlus' || tier === 'stats';
  const [tab, setTab] = React.useState('you');

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ padding: '58px 20px 20px', background: 'var(--canvas)', color: 'var(--forest)', position: 'relative' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase' }}>The Numbers</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, marginTop: 8, letterSpacing: '-0.02em' }}>
          Stats.
        </div>
        <div className="caption-serif" style={{ fontSize: 16, opacity: 0.65, marginTop: 6 }}>
          Your receipts, ranked.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, margin: '0 16px 0', background: 'rgba(14,28,19,0.05)', borderRadius: 14, padding: 4 }}>
        {[['you', 'You'], ['h2h', 'Head-to-Head'], ['badges', 'Badges']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, padding: '10px 12px', borderRadius: 11,
            background: tab === k ? 'var(--paper)' : 'transparent',
            color: 'var(--forest)',
            fontWeight: 700, fontSize: 12,
            boxShadow: tab === k ? 'var(--shadow-sm)' : 'none',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>{l}</button>
        ))}
      </div>

      {!isMember ? (
        <StatsLocked go={go}/>
      ) : tab === 'you' ? (
        <StatsYou/>
      ) : tab === 'h2h' ? (
        <StatsH2H/>
      ) : (
        <StatsBadges/>
      )}
    </div>
  );
}

function StatsLocked({ go }) {
  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Blurred preview behind lock */}
      <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', minHeight: 460 }}>
        <div style={{ filter: 'blur(8px)', opacity: 0.5, pointerEvents: 'none' }}>
          <StatsYou/>
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(234,226,206,0.5), rgba(234,226,206,0.98) 60%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '0 24px', textAlign: 'center',
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 999, background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream)' }}>
            <Icon.Lock size={20} color="var(--cream)"/>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--forest)', margin: '18px 0 6px', lineHeight: 1 }}>
            Your stats are ready.
          </h3>
          <p className="caption-serif" style={{ fontSize: 15, color: 'var(--ink)', opacity: 0.75, margin: '0 0 20px', maxWidth: 280 }}>
            Members only. Stats Membership is $15/mo — less than your last cortadito order, probably.
          </p>
          <Button variant="forest" onClick={() => go({ screen: 'membership' })}>
            See plans <Icon.ArrowRight size={14}/>
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatsYou() {
  const u = MOCK.USER;
  return (
    <div style={{ padding: '16px' }}>
      {/* SBX Rating hero */}
      <SBXHero user={u}/>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
        <StatTile label="Record" value={`${u.matchesW}–${u.matchesL}–${u.matchesH}`} sub={`${u.matchesTotal} matches`}/>
        <StatTile label="Hole win %" value="54%" sub="38 of 70" highlight/>
        <StatTile label="Best win" value="5&4" sub="W8 · vs María+Nats"/>
        <StatTile label="Unbeaten" value={`${u.streak}`} sub="matches · 🔥" accent/>
      </div>

      {/* Scramble Intelligence — the shot-level truth */}
      <ScrambleIntel u={u}/>

      {/* How SBX works explainer */}
      <div className="card" style={{ marginTop: 16, padding: 16 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>How it moves</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {[
            { label: 'Last match', delta: '+0.043', detail: 'W 2 UP vs Riv+Theo · they\'re 5.547' },
            { label: 'If you win next', delta: '+0.08', detail: 'Dukes+Leo are 6.351 · upside match' },
            { label: 'If you lose', delta: '–0.11', detail: 'Rating-weighted — a loss here stings' },
          ].map((r, i) => (
            <div key={i} style={{
              flex: 1, padding: 10, borderRadius: 12,
              background: i === 0 ? 'rgba(62,138,87,0.1)' : 'transparent',
              border: i === 0 ? '1px solid rgba(62,138,87,0.25)' : '1px dashed rgba(14,28,19,0.1)',
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>{r.label}</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1, marginTop: 5,
                color: r.delta.startsWith('+') ? 'var(--forest)' : 'var(--clay-deep)',
              }}>{r.delta}</div>
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, lineHeight: 1.3 }}>{r.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Win rate by opponent rating */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Your win rate vs rating</div>
        <div className="card" style={{ padding: 16 }}>
          {[
            { label: 'vs 3.5–4.5', W: 4, L: 0, H: 0, pct: 100 },
            { label: 'vs 4.5–5.5', W: 4, L: 3, H: 1, pct: 56 },
            { label: 'vs 5.5–6.5', W: 2, L: 3, H: 1, pct: 42 },
            { label: 'vs 6.5+', W: 1, L: 1, H: 0, pct: 50 },
          ].map((r, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(14,28,19,0.06)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{r.label}</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{r.W}–{r.L}–{r.H} · {r.pct}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(14,28,19,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${r.pct}%`, height: '100%', background: r.pct > 50 ? 'var(--forest)' : 'var(--clay)' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Match history */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Match history</div>
        <div className="card" style={{ overflow: 'hidden' }}>
          {MOCK.HISTORY.slice(0, 6).map((r, i) => (
            <MatchRow key={r.id} r={r} last={i === 5}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScrambleIntel({ u }) {
  const pct = (n) => `${Math.round(n * 100)}%`;
  // Shot usage sparkline
  const usage = u.shotUsageTrend;
  const uLo = Math.min(...usage), uHi = Math.max(...usage);

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Scramble intel</div>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.5, letterSpacing: '0.04em' }}>
          LAST 20 MATCHES
        </span>
      </div>

      {/* Shot Usage — the headline scramble stat */}
      <div className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--forest)' }}>SHOT USAGE</span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                background: 'var(--clay)', color: 'var(--forest-deep)',
                padding: '2px 7px', borderRadius: 999,
              }}>{u.shotUsageRank.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--forest)' }}>
                {pct(u.shotUsage)}
              </span>
              <span style={{ fontSize: 11, opacity: 0.55, fontWeight: 600 }}>of team shots were yours</span>
            </div>
          </div>
          {/* Mini 7-match sparkline */}
          <svg width="80" height="40" viewBox="0 0 80 40" style={{ flexShrink: 0 }}>
            {(() => {
              const pts = usage.map((v, i) => {
                const x = (i / (usage.length - 1)) * 76 + 2;
                const y = 36 - ((v - uLo) / (uHi - uLo || 1)) * 32 + 2;
                return `${x},${y}`;
              });
              return (
                <>
                  <polyline points={pts.join(' ')} fill="none" stroke="var(--clay)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2.5" fill="var(--clay)"/>
                </>
              );
            })()}
          </svg>
        </div>

        {/* 50% reference bar */}
        <div style={{ marginTop: 14, position: 'relative' }}>
          <div style={{ height: 10, background: 'rgba(14,28,19,0.06)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              width: `${u.shotUsage * 100}%`, height: '100%',
              background: 'linear-gradient(90deg, var(--forest), var(--clay))',
            }}/>
            {/* 50% tick */}
            <div style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'var(--forest-deep)' }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, opacity: 0.55, fontWeight: 600 }}>
            <span>0%</span>
            <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 14 }}>50% · even with partner</span>
            <span>100%</span>
          </div>
        </div>

        <div className="caption-serif" style={{ fontSize: 12, opacity: 0.72, marginTop: 22, lineHeight: 1.45 }}>
          Your shot gets picked slightly under half the time — right around what you'd want from a partner.
          Up from 38% three months ago.
        </div>
      </div>

      {/* 3-up core tiles: GIR · Putts · Proximity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
        <CoreStat label="GIR" value={pct(u.gir)} sub={`${Math.round(u.gir * 126)} / 126 greens`}/>
        <CoreStat label="Putts" value={u.putts.toFixed(2)} sub="team · per hole"/>
        <CoreStat label="Proximity" value={`${u.proximity}′`} sub="avg ft to pin"/>
      </div>

      {/* Leadoff vs Cleanup vs Clutch split */}
      <div className="card" style={{ marginTop: 10, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Usage by situation</div>
          <span style={{ fontSize: 10, opacity: 0.55, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            when do you show up?
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 12 }}>
          {[
            { label: 'Leadoff', val: u.leadoffUsage, hint: 'you hit first' },
            { label: 'Cleanup', val: u.cleanupUsage, hint: 'you hit second' },
            { label: 'Clutch', val: u.clutchUsage, hint: 'partner missed', hot: true },
          ].map((r) => (
            <div key={r.label} style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', opacity: 0.6, textTransform: 'uppercase' }}>
                {r.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1, marginTop: 4,
                color: r.hot ? 'var(--clay-deep)' : 'var(--forest)',
              }}>
                {pct(r.val)}
              </div>
              <div style={{ fontSize: 9, opacity: 0.55, marginTop: 3, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
                {r.hint}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 12, padding: '8px 10px',
          background: 'rgba(200,100,40,0.08)',
          borderRadius: 10,
          fontSize: 11, color: 'var(--clay-deep)',
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          <Icon.Bolt size={12} color="var(--clay-deep)"/>
          <span className="caption-serif"><b>Clutch specialist.</b> When your partner's out, your ball saves the hole 62% of the time.</span>
        </div>
      </div>

      {/* Proximity by distance */}
      <div className="card" style={{ marginTop: 10, padding: 16 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Proximity by distance</div>
        <div style={{ marginTop: 10 }}>
          {u.proximityByDist.map((r, i) => {
            // visualize closer = better (shorter bar = closer)
            const maxFt = 30;
            const pctFull = Math.min(r.avg / maxFt, 1);
            const good = r.avg < 15;
            return (
              <div key={r.bucket} style={{ padding: '7px 0', borderBottom: i < 2 ? '1px solid rgba(14,28,19,0.06)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{r.bucket}</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>
                    <b style={{ color: good ? 'var(--forest)' : 'var(--clay-deep)', fontFamily: 'var(--font-display)', fontSize: 14 }}>{r.avg}′</b>
                    <span style={{ opacity: 0.5, marginLeft: 6 }}>· {r.shots} shots</span>
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(14,28,19,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pctFull * 100}%`, height: '100%', background: good ? 'var(--forest)' : 'var(--clay)' }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Par-or-better + bailout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
        <CoreStat label="Par or better" value={pct(u.parOrBetter)} sub="team scoring rate" accent/>
        <CoreStat label="Bailout rate" value={pct(u.bailoutRate)} sub="both off line" muted/>
      </div>
    </div>
  );
}

function CoreStat({ label, value, sub, accent, muted }) {
  return (
    <div style={{
      background: accent ? 'var(--forest)' : 'var(--paper)',
      color: accent ? 'var(--cream)' : 'var(--ink)',
      border: accent ? 'none' : 'var(--hairline)',
      borderRadius: 16, padding: '12px 14px',
      opacity: muted ? 0.85 : 1,
      boxShadow: accent ? 'var(--shadow-sm)' : 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 9, opacity: 0.6, marginTop: 3, fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

function SBXHero({ user }) {
  const reliable = user.sbxReliability >= 0.5;
  const trend = user.sbxTrend; // 7 points
  const lo = Math.min(...trend);
  const hi = Math.max(...trend);
  return (
    <div style={{
      background: `linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)`,
      color: 'var(--cream)',
      borderRadius: 'var(--radius-card-lg)',
      padding: 22,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      {/* watermark brand */}
      <div style={{
        position: 'absolute', right: 20, top: 20,
        fontFamily: 'var(--font-mono)', fontSize: 10,
        opacity: 0.55, letterSpacing: '0.24em', fontWeight: 700,
      }}>SBX · v1</div>

      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.65, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Sandbox Rating™</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 10 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 84, lineHeight: 0.85,
          letterSpacing: '-0.04em',
          borderBottom: reliable ? 'none' : '3px dotted rgba(234,226,206,0.5)',
        }}>{user.sbx.toFixed(3)}</span>
        <span style={{
          fontSize: 13, color: user.sbxDelta >= 0 ? '#B8E0A4' : '#E7B8A7',
          fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)',
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: user.sbxDelta >= 0 ? 'rotate(180deg)' : 'none' }}>
            <path d="M5 2L1 6h8z" fill="currentColor"/>
          </svg>
          {user.sbxDelta >= 0 ? '+' : ''}{user.sbxDelta.toFixed(3)}
        </span>
      </div>
      <div className="caption-serif" style={{ fontSize: 14, opacity: 0.75, marginTop: 2 }}>
        {reliable
          ? `Top ${100 - user.sbxPercentile}% in Sandbox · #${user.sbxGlobalRank.toLocaleString()} globally`
          : `Provisional · ${user.sbxMatchesToProvisional} matches to reliable`}
      </div>

      {/* Dynamic trend curve */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', opacity: 0.55 }}>
          <span>RATING HISTORY · LAST 7 MATCHES</span>
          <span>PEAK {user.sbxPeak.toFixed(3)}</span>
        </div>
        <svg viewBox="0 0 280 66" preserveAspectRatio="none" style={{ width: '100%', height: 66, marginTop: 8, overflow: 'visible' }}>
          {/* gridlines */}
          {[0.25, 0.5, 0.75].map(t => (
            <line key={t} x1="0" y1={t * 60 + 3} x2="280" y2={t * 60 + 3} stroke="rgba(234,226,206,0.1)" strokeDasharray="2 3"/>
          ))}
          {(() => {
            const pts = trend.map((v, i) => {
              const x = (i / (trend.length - 1)) * 280;
              const y = 60 - ((v - lo) / (hi - lo || 1)) * 54 + 3;
              return [x, y];
            });
            // smooth cubic path
            let d = `M${pts[0][0]},${pts[0][1]}`;
            for (let i = 1; i < pts.length; i++) {
              const [x, y] = pts[i];
              const [px, py] = pts[i - 1];
              const cx = (px + x) / 2;
              d += ` Q${cx},${py} ${cx},${(py + y) / 2} T${x},${y}`;
            }
            const last = pts[pts.length - 1];
            return (
              <>
                <path d={`${d} L280,66 L0,66 Z`} fill="url(#sbxArea)" opacity="0.4"/>
                <path d={d} fill="none" stroke="var(--clay)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                {pts.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 2}
                    fill={i === pts.length - 1 ? 'var(--clay)' : 'rgba(234,226,206,0.5)'}
                    stroke={i === pts.length - 1 ? 'var(--cream)' : 'none'}
                    strokeWidth="1.5"/>
                ))}
                <text x={last[0]} y={last[1] - 9} textAnchor="end" fill="var(--clay)" fontSize="10" fontWeight="800" fontFamily="var(--font-display)">
                  {trend[trend.length - 1].toFixed(3)}
                </text>
              </>
            );
          })()}
          <defs>
            <linearGradient id="sbxArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--clay)"/>
              <stop offset="100%" stopColor="var(--clay)" stopOpacity="0"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div style={{ height: 1, background: 'rgba(234,226,206,0.14)', margin: '14px 0 12px' }}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        <span>Reliability {Math.round(user.sbxReliability * 100)}%</span>
        <span>Updates every match</span>
      </div>
    </div>
  );
}

function MatchRow({ r, last }) {
  const isW = r.result === 'W', isL = r.result === 'L';
  // Badge styling: W = filled forest, H = filled tan, L = white with forest outline
  const badgeStyle = isW
    ? { background: 'var(--forest)', color: 'var(--cream)', border: 'none' }
    : isL
    ? { background: 'var(--cream)', color: 'var(--forest)', border: 'none' }
    : { background: 'var(--paper)', color: 'var(--forest)', border: '1px solid rgba(28,73,42,0.25)' };
  const marginColor = isW ? 'var(--forest)' : isL ? 'var(--forest)' : '#8A6A4A';
  const marginOpacity = isL ? 0.55 : 1;
  const label = isW ? 'W' : isL ? 'L' : 'H';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      borderBottom: last ? 'none' : '1px solid rgba(14,28,19,0.05)',
      background: r.best ? 'rgba(28,73,42,0.04)' : r.live ? 'rgba(28,73,42,0.03)' : 'transparent',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 13,
        color: 'var(--forest)',
        width: 32, textAlign: 'center', opacity: 0.7,
      }}>{r.week}</div>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 15, lineHeight: 1,
        ...badgeStyle,
      }}>{label}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>
          vs {r.opp}
          {r.live && <span style={{ color: 'var(--forest)', marginLeft: 6, fontSize: 10 }}>• LIVE</span>}
        </div>
        <div style={{ fontSize: 10, opacity: 0.55, marginTop: 2 }}>
          {r.best && '🏆 Career win · '}
          w/ {r.partner} · {r.holesWon}W–{r.holesLost}L holes
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: marginColor, opacity: marginOpacity }}>
        {r.live && r.result === 'W' ? `${r.margin}*` : r.margin}
      </div>
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

function StatsH2H() {
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ background: `linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)`, color: 'var(--cream)', borderRadius: 'var(--radius-card-lg)', padding: 20, position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.65, letterSpacing: '0.14em', textTransform: 'uppercase', position: 'relative' }}>Best Pairing</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
          <div style={{ position: 'relative' }}>
            <AvatarBy handle="@jaybird" size={56}/>
            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 999, background: 'var(--clay)', color: 'var(--forest-deep)', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--forest)' }}>1</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1 }}>You + @jaybird</div>
            <div className="caption-serif" style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>Chemistry 88 · 5W 3L 1H</div>
          </div>
        </div>
        <div style={{ height: 1, background: 'rgba(234,226,206,0.14)', margin: '16px 0 14px', position: 'relative' }}/>
        <div style={{ fontSize: 13, opacity: 0.85, fontStyle: 'italic', fontFamily: 'var(--font-serif)', lineHeight: 1.45, position: 'relative' }}>
          "You two cover each other's weak distances. Jay kills it inside 80, you take anything longer."
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>All records</div>
        <div className="card" style={{ overflow: 'hidden' }}>
          {MOCK.H2H.map((h, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              borderBottom: i < MOCK.H2H.length - 1 ? '1px solid rgba(14,28,19,0.05)' : 'none',
            }}>
              <AvatarBy handle={h.vs} size={36}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}>
                  {h.vs}
                  <Chip variant={h.kind === 'Partner' ? 'forest' : 'ghostDark'} style={{ fontSize: 9, padding: '2px 7px' }}>{h.kind}</Chip>
                </div>
                <div style={{ fontSize: 10, opacity: 0.55, marginTop: 3, letterSpacing: '0.06em' }}>
                  {h.kind === 'Partner' ? `Chem ${h.chemistry} · last: ${h.lastMargin}` : `Last: ${h.lastMargin}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-display)' }}>
                <span style={{ color: 'var(--forest)', fontSize: 18 }}>{h.wins}</span>
                <span style={{ color: 'rgba(14,28,19,0.3)', fontSize: 12 }}>–</span>
                <span style={{ color: 'var(--clay-deep)', fontSize: 18 }}>{h.losses}</span>
                <span style={{ color: 'rgba(14,28,19,0.3)', fontSize: 12 }}>–</span>
                <span style={{ color: '#8A6A4A', fontSize: 16 }}>{h.halved}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsBadges() {
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Collected · 4 of 22</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        {MOCK.BADGES.map(b => <BadgeCard key={b.id} b={b}/>)}
      </div>
    </div>
  );
}

function BadgeCard({ b }) {
  const ic = {
    flag: <Icon.Flag size={22}/>,
    fire: <Icon.Fire size={22}/>,
    bolt: <Icon.Bolt size={22}/>,
    trophy: <Icon.Trophy size={22}/>,
    ball: <Icon.Ball size={22}/>,
  }[b.icon];
  return (
    <div style={{
      background: b.locked ? 'transparent' : 'var(--paper)',
      border: b.locked ? '1.5px dashed rgba(14,28,19,0.15)' : 'var(--hairline)',
      borderRadius: 18, padding: '16px 14px',
      textAlign: 'center',
      opacity: b.locked ? 0.55 : 1,
      boxShadow: b.locked ? 'none' : 'var(--shadow-sm)',
      position: 'relative',
    }}>
      <div style={{
        width: 48, height: 48,
        margin: '0 auto',
        borderRadius: '50%',
        background: b.locked ? 'transparent' : b.color,
        color: b.locked ? 'var(--forest)' : b.color === 'var(--clay)' ? 'var(--forest-deep)' : 'var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: b.locked ? '1.5px dashed currentColor' : 'none',
      }}>
        {b.locked ? <Icon.Lock size={18}/> : ic}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginTop: 10, lineHeight: 1, color: 'var(--forest)' }}>{b.name}</div>
      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, lineHeight: 1.3 }}>{b.sub}</div>
      {!b.locked && b.count > 1 && <div style={{ fontSize: 10, marginTop: 6, color: 'var(--clay-deep)', fontWeight: 700 }}>×{b.count}</div>}
      <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginTop: 6, opacity: 0.4 }}>{b.rarity}</div>
    </div>
  );
}

Object.assign(window, { StatsScreen });
