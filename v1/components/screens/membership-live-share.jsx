/* global React, MOCK, Icon, Wordmark, Button, Chip, Eyebrow, Dashed, LiveDot, Divider, AvatarBy */

// ─── Membership tiers ─────────────────────────────────
function MembershipScreen({ go, tier, setTier }) {
  const [confirmed, setConfirmed] = React.useState(null); // id of just-selected tier

  const tiers = [
    { id: 'walkup', name: 'Walk-up', price: 'Free', tag: 'No card needed',
      perks: ['Book any open event', 'Mats + balls included', 'Order from the bar'],
      missing: ['Sandbox Rating™', 'Match history', 'Member-only events'] },
    { id: 'stats', name: 'Stats Add On', price: '$10 / mo', tag: 'Data only',
      perks: ['Sandbox Rating™', 'Full match history', 'Shareable result cards'],
      missing: ['Season league', 'Member pricing', 'Guest passes'] },
    { id: 'league', name: 'Sandbox League', price: '$89 / mo', tag: 'Most popular', highlight: true,
      perks: ['Weekly league slot', '$10 off all events', '2 guest passes / mo', 'Stats Add On included', 'Partner pairings', 'Members lounge'],
      missing: ['Plus perks'] },
    { id: 'plus', name: 'Sandbox Plus', price: '$189 / mo', tag: 'Inner circle',
      perks: ['Everything in League', 'Unlimited guest passes', 'Free coaching monthly', 'Priority event booking', 'Season championship'],
      missing: [] },
  ];

  function chooseTier(id) {
    setTier(id);
    localStorage.setItem('spp_tier_explicit', '1');
    setConfirmed(id);
    setTimeout(() => { setConfirmed(null); go({ screen: 'profile' }); }, 900);
  }

  return (
    <div style={{
      background: `linear-gradient(180deg, var(--forest-dark) 0%, var(--forest) 60%, var(--forest-deep) 100%)`,
      minHeight: '100%', color: 'var(--cream)', paddingBottom: 100, position: 'relative',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ padding: '58px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <button onClick={() => go({ screen: 'profile' })} style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'rgba(234,226,206,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--cream)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(234,226,206,0.22)',
        }}>
          <Icon.Close size={14}/>
        </button>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Manage Membership</div>
        <div style={{ width: 40 }}/>
      </div>

      <div style={{ padding: '22px 24px 24px', position: 'relative' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.88, letterSpacing: '-0.03em' }}>
          Join the<br/>Sandbox.
        </div>
        <div className="caption-serif" style={{ fontSize: 17, opacity: 0.75, marginTop: 14, maxWidth: 320 }}>
          Anyone can play walk-up. Members get ratings, a weekly league slot, and everybody knows their @handle.
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
        {tiers.map(t => {
          const isCurrent = tier === t.id;
          const isConfirmed = confirmed === t.id;
          return (
            <div key={t.id} style={{
              background: t.highlight ? 'var(--cream)' : 'rgba(234,226,206,0.06)',
              color: t.highlight ? 'var(--ink)' : 'var(--cream)',
              borderRadius: 'var(--radius-card-lg)', padding: 22,
              border: isCurrent && !t.highlight ? '1.5px solid rgba(234,226,206,0.5)' : t.highlight ? 'none' : '1px solid rgba(234,226,206,0.14)',
              position: 'relative',
              boxShadow: t.highlight ? 'var(--shadow-hero)' : 'none',
              backdropFilter: t.highlight ? 'none' : 'blur(8px)',
              WebkitBackdropFilter: t.highlight ? 'none' : 'blur(8px)',
            }}>
              {t.highlight && (
                <div style={{
                  position: 'absolute', top: -12, left: 22,
                  background: 'var(--forest)', color: 'var(--cream)',
                  padding: '5px 12px', borderRadius: 999,
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  {t.tag}
                </div>
              )}
              {isCurrent && !t.highlight && (
                <div style={{
                  position: 'absolute', top: -10, right: 18,
                  background: 'rgba(234,226,206,0.18)', color: 'var(--cream)',
                  padding: '4px 10px', borderRadius: 999,
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                  border: '1px solid rgba(234,226,206,0.3)',
                }}>Active</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 0.95, letterSpacing: '-0.01em', color: t.highlight ? 'var(--forest)' : 'var(--cream)' }}>{t.name}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, marginTop: 6, letterSpacing: '0.04em' }}>{t.tag}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="display-num" style={{ fontSize: 28, color: t.highlight ? 'var(--forest)' : 'var(--cream)' }}>
                    {t.price}
                  </div>
                </div>
              </div>
              <div style={{ height: 1, background: t.highlight ? 'rgba(14,28,19,0.1)' : 'rgba(234,226,206,0.14)', margin: '16px 0' }}/>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {t.perks.map(p => (
                  <div key={p} style={{ display: 'flex', gap: 10, fontSize: 13, alignItems: 'center' }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: 999,
                      background: t.highlight ? 'var(--forest)' : 'rgba(234,226,206,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon.Check size={11} color="var(--cream)"/>
                    </span>
                    <span>{p}</span>
                  </div>
                ))}
                {t.missing.map(p => (
                  <div key={p} style={{ display: 'flex', gap: 10, fontSize: 13, opacity: 0.35, alignItems: 'center' }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: 999,
                      background: 'transparent', border: '1px solid currentColor',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon.Close size={9} color="currentColor"/>
                    </span>
                    <span style={{ textDecoration: 'line-through' }}>{p}</span>
                  </div>
                ))}
              </div>
              <Button
                variant={t.highlight ? 'forest' : 'outlineCream'}
                size="md" full style={{ marginTop: 18 }}
                onClick={() => { if (!isCurrent) chooseTier(t.id); }}
                disabled={isCurrent || isConfirmed}
              >
                {isConfirmed ? '✓ Plan updated' : isCurrent ? 'Current plan' : t.id === 'walkup' ? 'Switch to walk-up' : `Choose ${t.name}`}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Live scorecard (2-man scramble match play) ────────
function LiveScorecardScreen({ go }) {
  const card = MOCK.YOUR_CARD;
  const [showSheet, setShowSheet] = React.useState(false);

  if (!card) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center', opacity: 0.45 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>No live match</div>
        <div style={{ fontSize: 14 }}>Your scorecard will appear here during a live event.</div>
      </div>
    );
  }

  // Compute match state from hole results (W/H/L)
  const played = card.holes.filter(h => h.result);
  const state = played.reduce((s, h) => s + (h.result === 'W' ? 1 : h.result === 'L' ? -1 : 0), 0);
  const thru = played.length;
  const remaining = card.holes.length - thru;
  const label = state > 0 ? `${state} UP` : state < 0 ? `${-state} DN` : 'ALL SQUARE';
  const sub = remaining === 0 ? 'MATCH OVER'
    : Math.abs(state) > remaining ? `DORMIE+${Math.abs(state) - remaining}`
    : Math.abs(state) === remaining ? 'DORMIE'
    : `${remaining} to play`;

  const wonH = played.filter(h => h.result === 'W').length;
  const halvedH = played.filter(h => h.result === 'H').length;
  const lostH = played.filter(h => h.result === 'L').length;

  return (
    <div style={{
      background: `linear-gradient(180deg, var(--forest-dark) 0%, var(--forest) 50%, var(--forest-deep) 100%)`,
      minHeight: '100%', color: 'var(--cream)', paddingBottom: 120, position: 'relative',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ padding: '58px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <button onClick={() => go({ screen: 'home' })} style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'rgba(234,226,206,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--cream)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(234,226,206,0.22)',
        }}>
          <Icon.Close size={14}/>
        </button>
        <div style={{
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(234,226,206,0.14)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(234,226,206,0.24)',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          <LiveDot/> LIVE · MELREESE
        </div>
        <div style={{ width: 40 }}/>
      </div>

      {/* Match state hero */}
      <div style={{ padding: '10px 20px 0', textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Week 11 · match play</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '-0.01em' }}>{card.teamName}</span>
          <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 800, letterSpacing: '0.18em', fontFamily: 'var(--font-mono)' }}>VS</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, opacity: 0.7, letterSpacing: '-0.01em' }}>{card.opponent}</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 92, lineHeight: 0.82, marginTop: 20,
          letterSpacing: '-0.04em',
          color: state > 0 ? 'var(--cream)' : state < 0 ? '#E7B8A7' : 'var(--cream)',
          textShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{label}</div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.7, marginTop: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          THRU {thru} · {sub}
        </div>
      </div>

      {/* Match card — minimalist hole strip */}
      <div style={{ padding: '22px 16px 0', position: 'relative' }}>
        <div style={{
          background: 'var(--paper)',
          borderRadius: 'var(--radius-card-lg)', padding: 20,
          color: 'var(--ink)',
          boxShadow: 'var(--shadow-hero)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Match card</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.5, letterSpacing: '0.06em' }}>
              THRU {thru} · {remaining} LEFT
            </div>
          </div>

          {/* Unified hole strip — one pill per hole */}
          <div style={{ display: 'flex', gap: 5 }}>
            {card.holes.map(h => {
              const r = h.result;
              const isCurrent = h.current;
              const you = h.you, opp = h.opp;
              let bg, fg, border;
              if (r === 'W') { bg = 'var(--forest)'; fg = 'var(--cream)'; border = 'none'; }
              else if (r === 'L') { bg = 'var(--cream)'; fg = 'var(--forest)'; border = 'none'; }
              else if (r === 'H') { bg = 'var(--paper)'; fg = 'var(--forest)'; border = '1px solid rgba(28,73,42,0.25)'; }
              else if (isCurrent) { bg = 'transparent'; fg = 'var(--forest)'; border = '1.5px solid var(--forest)'; }
              else { bg = 'transparent'; fg = 'rgba(14,28,19,0.3)'; border = '1px solid rgba(14,28,19,0.08)'; }
              return (
                <div key={h.hole} style={{
                  flex: 1, aspectRatio: '0.78',
                  borderRadius: 12,
                  background: bg, color: fg, border,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2,
                  position: 'relative',
                }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.65, letterSpacing: '0.04em' }}>{h.hole}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, lineHeight: 1 }}>
                    {isCurrent ? '·' : r || ''}
                  </span>
                  {you != null && opp != null && (
                    <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '-0.02em' }}>
                      {you}·{opp}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ height: 1, background: 'rgba(14,28,19,0.06)', margin: '18px 0 14px' }}/>

          {/* Legend + summary */}
          <div style={{ display: 'flex', gap: 14, fontSize: 10, fontFamily: 'var(--font-mono)', justifyContent: 'space-between', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--forest)' }}/>
              <strong style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>{wonH}</strong> won
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--paper)', border: '1px solid rgba(28,73,42,0.3)' }}/>
              <strong style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>{halvedH}</strong> halved
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--cream)' }}/>
              <strong style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>{lostH}</strong> lost
            </span>
          </div>
        </div>
      </div>

      {/* Current hole callout */}
      <div style={{ padding: '16px', position: 'relative' }}>
        <div style={{
          background: 'rgba(234,226,206,0.08)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(234,226,206,0.18)',
          borderRadius: 'var(--radius-card-lg)', padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>You're on</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 54, lineHeight: 0.88, marginTop: 6, letterSpacing: '-0.03em' }}>Hole 6</div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.75, marginTop: 8, letterSpacing: '0.06em' }}>72 YD · MAT 2 · PAR 3</div>
            </div>
            <div style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="84" height="84" viewBox="0 0 100 100">
                <circle cx="50" cy="55" r="36" fill="rgba(234,226,206,0.15)"/>
                <circle cx="50" cy="55" r="24" fill="none" stroke="rgba(234,226,206,0.3)" strokeWidth="1"/>
                <circle cx="50" cy="55" r="12" fill="none" stroke="rgba(234,226,206,0.4)" strokeWidth="1" strokeDasharray="3 2"/>
                <circle cx="50" cy="55" r="3" fill="var(--clay)"/>
                <line x1="50" y1="55" x2="50" y2="22" stroke="var(--cream)" strokeWidth="1.5"/>
                <polygon points="50,22 63,26 50,31" fill="var(--clay)"/>
                <circle cx="18" cy="82" r="3.2" fill="#FFF8E8" stroke="var(--forest-deep)" strokeWidth="0.5"/>
              </svg>
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(234,226,206,0.14)', margin: '16px 0' }}/>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="md" full onClick={() => setShowSheet(true)}>
              Log hole 6 <Icon.ArrowRight size={14}/>
            </Button>
            <Button variant="ghost" size="md">
              <Icon.Share size={14}/>
            </Button>
          </div>
        </div>
      </div>

      {/* Other matches */}
      <div style={{ padding: '6px 16px 0', position: 'relative' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.14em', textTransform: 'uppercase', paddingLeft: 4, marginBottom: 10 }}>Other matches</div>
        <div style={{ background: 'rgba(234,226,206,0.06)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 18, border: '1px solid rgba(234,226,206,0.12)', overflow: 'hidden' }}>
          {MOCK.LIVE.matches.filter(m => !m.isYou).slice(0, 5).map((m, i, arr) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(234,226,206,0.08)' : 'none',
            }}>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{m.teams}</span>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 14,
                color: m.status === 'DORMIE' ? 'var(--clay)' : 'var(--cream)',
                opacity: m.status === 'AS' ? 0.7 : 1,
              }}>{m.status}</span>
              <span style={{ fontSize: 10, opacity: 0.55, minWidth: 46, textAlign: 'right' }}>thru {m.thru}</span>
            </div>
          ))}
        </div>
      </div>

      {showSheet && <HoleResultSheet hole={6} onClose={() => setShowSheet(false)} onDone={() => { setShowSheet(false); go({ screen: 'resultShare' }); }}/>}
    </div>
  );
}

function ScoreRow({ label, holes, field }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(9, 1fr)', gap: 3, alignItems: 'center', marginTop: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--forest)', opacity: 0.75 }}>{label}</span>
      {holes.map((h, i) => {
        const val = h[field];
        const other = h[field === 'you' ? 'opp' : 'you'];
        const best = val != null && other != null && val < other;
        return (
          <div key={i} style={{
            padding: '8px 0',
            borderRadius: 8,
            background: h.current ? 'rgba(200,100,40,0.12)' : val != null ? 'rgba(14,28,19,0.04)' : 'transparent',
            border: val == null && !h.current ? '1px dashed rgba(14,28,19,0.15)' : 'none',
            textAlign: 'center',
            fontFamily: 'var(--font-display)', fontSize: 14,
            color: best ? 'var(--forest)' : 'var(--ink)',
            fontWeight: best ? 800 : 600,
          }}>
            {val != null ? val : h.current ? '…' : ''}
          </div>
        );
      })}
    </div>
  );
}

function ResultCell({ h }) {
  if (!h.result) {
    return <div style={{ textAlign: 'center', fontSize: 9, opacity: 0.35, fontWeight: 700 }}>·</div>;
  }
  const cfg = {
    W: { bg: 'var(--forest)', fg: 'var(--cream)' },
    L: { bg: 'var(--clay-deep)', fg: 'var(--cream)' },
    H: { bg: 'transparent', fg: '#8A6A4A', border: '1.5px solid #8A6A4A' },
  }[h.result];
  return (
    <div style={{
      margin: '0 auto', width: 22, height: 22, borderRadius: 6,
      background: cfg.bg, color: cfg.fg, border: cfg.border || 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: 12, lineHeight: 1,
    }}>{h.result}</div>
  );
}

// ─── Hole-entry sheet: quick (W/H/L) OR shot-level (scramble intel) ───
function HoleResultSheet({ hole, onClose, onDone }) {
  const [mode, setMode] = React.useState('detailed'); // 'quick' | 'detailed'

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(14,28,19,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: 'var(--cream)', color: 'var(--ink)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '16px 20px 24px',
        maxHeight: '88%', overflowY: 'auto',
        animation: 'sheet-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 3, background: 'rgba(14,28,19,0.2)', margin: '0 auto 14px' }}/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Eyebrow color="var(--forest)">Hole {hole} · par 3 · 72 yd</Eyebrow>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, marginTop: 4, color: 'var(--forest)' }}>
              Log the hole
            </div>
          </div>
          {/* mode toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(14,28,19,0.06)', padding: 2, borderRadius: 10 }}>
            {['quick', 'detailed'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '7px 11px', borderRadius: 8,
                background: mode === m ? 'var(--paper)' : 'transparent',
                color: 'var(--forest)', fontWeight: 700, fontSize: 10,
                boxShadow: mode === m ? '0 1px 3px rgba(14,28,19,0.1)' : 'none',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>{m === 'detailed' ? 'Shot-by-shot' : 'Quick'}</button>
            ))}
          </div>
        </div>

        {mode === 'quick' ? <QuickHoleLog onDone={onDone} onClose={onClose}/> : <DetailedHoleLog onDone={onDone} onClose={onClose}/>}
      </div>
    </div>
  );
}

function QuickHoleLog({ onDone, onClose }) {
  const [you, setYou] = React.useState(null);
  const [opp, setOpp] = React.useState(null);
  const result = you != null && opp != null
    ? (you < opp ? 'HOLE WIN' : you > opp ? 'HOLE LOSS' : 'HALVED')
    : null;
  const isWin = result === 'HOLE WIN';
  const isLoss = result === 'HOLE LOSS';
  return (
    <>
      <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(14,28,19,0.04)', borderRadius: 10, fontSize: 11, color: 'var(--ink)', opacity: 0.7, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
        Quick mode · just score, no shot tracking. Stats won't update for this hole.
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 6 }}>Your best ball</div>
          <ScorePicker value={you} onPick={setYou}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 6 }}>Opponent</div>
          <ScorePicker value={opp} onPick={setOpp} muted/>
        </div>
      </div>
      {result && (
        <div style={{
          marginTop: 14, padding: 12, borderRadius: 12,
          background: isWin ? 'var(--forest)' : isLoss ? 'var(--cream)' : 'var(--paper)',
          color: isWin ? 'var(--cream)' : 'var(--forest)',
          border: !isWin && !isLoss ? '1.5px solid rgba(28,73,42,0.25)' : 'none',
          textAlign: 'center',
          fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.01em',
        }}>{result}</div>
      )}
      <SheetActions onClose={onClose} onDone={onDone} disabled={!result}/>
    </>
  );
}

// Proximity buckets (18Birdies-style pin tracker)
const PROX = [
  { key: 'tap',    label: 'Tap in',  ft: 2,  color: 'var(--forest)', tone: 'green' },
  { key: '10',     label: "< 10'",   ft: 8,  color: 'var(--forest)', tone: 'green' },
  { key: '20',     label: "< 20'",   ft: 16, color: '#3E8A57',        tone: 'green' },
  { key: '30',     label: "< 30'",   ft: 26, color: '#C57B48',        tone: 'green' },
  { key: 'fringe', label: 'Fringe',  ft: 38, color: '#8A6A4A',        tone: 'fringe' },
  { key: 'miss',   label: 'Off',     ft: 60, color: 'var(--clay-deep)', tone: 'off' },
];

function DetailedHoleLog({ onDone, onClose }) {
  // First-tee shots
  const [youProx, setYouProx] = React.useState(null);
  const [partnerProx, setPartnerProx] = React.useState(null);
  const [pickedBall, setPickedBall] = React.useState(null); // 'you' | 'partner'
  const [putts, setPutts] = React.useState(null);
  const [teamScore, setTeamScore] = React.useState(null); // auto
  const [oppScore, setOppScore] = React.useState(null);

  // Auto-compute team score: if GIR (either on green), 1 + putts; else 2 + putts approx
  React.useEffect(() => {
    const gir = (youProx && youProx !== 'miss' && youProx !== 'fringe') ||
                (partnerProx && partnerProx !== 'miss' && partnerProx !== 'fringe');
    if (pickedBall && putts != null) {
      setTeamScore(gir ? 1 + putts : 2 + putts);
    }
  }, [youProx, partnerProx, pickedBall, putts]);

  const result = teamScore != null && oppScore != null
    ? (teamScore < oppScore ? 'HOLE WIN' : teamScore > oppScore ? 'HOLE LOSS' : 'HALVED')
    : null;
  const isWin = result === 'HOLE WIN';
  const isLoss = result === 'HOLE LOSS';

  const pickedOn = pickedBall === 'you' ? youProx : partnerProx;
  const pickedGIR = pickedOn && pickedOn !== 'miss' && pickedOn !== 'fringe';

  // Clutch flag: partner missed first, you rescued
  const clutch = partnerProx === 'miss' && pickedBall === 'you';

  return (
    <>
      {/* Step 1: Tee shots · proximity per player */}
      <div style={{ marginTop: 14 }}>
        <StepLabel n={1} label="Tee shots · tap where each ball finished"/>
        <PlayerShotRow name="You" handle="@alex.miami" accent="var(--clay)"
          value={youProx} onPick={setYouProx}/>
        <PlayerShotRow name="Jay Soto" handle="@jaybird" accent="var(--forest)"
          value={partnerProx} onPick={setPartnerProx} style={{ marginTop: 8 }}/>

        {/* Visual green — shows both balls */}
        {(youProx || partnerProx) && (
          <GreenViz youProx={youProx} partnerProx={partnerProx} picked={pickedBall}/>
        )}
      </div>

      {/* Step 2: pick which ball */}
      {youProx && partnerProx && (
        <div style={{ marginTop: 18 }}>
          <StepLabel n={2} label="Which ball did the team play?"/>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {[
              { k: 'you', label: 'Your ball', sub: PROX.find(p => p.key === youProx)?.label, color: 'var(--clay)' },
              { k: 'partner', label: "Jay's ball", sub: PROX.find(p => p.key === partnerProx)?.label, color: 'var(--forest)' },
            ].map(b => (
              <button key={b.k} onClick={() => setPickedBall(b.k)} style={{
                flex: 1, padding: '12px 10px', borderRadius: 12,
                background: pickedBall === b.k ? b.color : 'var(--paper)',
                color: pickedBall === b.k ? (b.k === 'you' ? 'var(--forest-deep)' : 'var(--cream)') : 'var(--ink)',
                border: pickedBall === b.k ? 'none' : '1px solid rgba(14,28,19,0.08)',
                textAlign: 'left',
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.75 }}>{b.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginTop: 3, lineHeight: 1 }}>{b.sub}</div>
              </button>
            ))}
          </div>
          {clutch && pickedBall === 'you' && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(200,100,40,0.12)', color: 'var(--clay-deep)', borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon.Bolt size={11} color="var(--clay-deep)"/> CLUTCH · partner missed, your shot saved the team
            </div>
          )}
        </div>
      )}

      {/* Step 3: putts to hole out */}
      {pickedBall && (
        <div style={{ marginTop: 18 }}>
          <StepLabel n={3} label={pickedGIR ? 'Putts to hole out' : 'Chip + putts to hole out'}/>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => setPutts(n)} style={{
                flex: 1, padding: '14px 0', borderRadius: 12,
                background: putts === n ? 'var(--forest)' : 'var(--paper)',
                color: putts === n ? 'var(--cream)' : 'var(--forest)',
                border: '1px solid rgba(14,28,19,0.08)',
                fontFamily: 'var(--font-display)', fontSize: 20,
              }}>{n === 4 ? '4+' : n}</button>
            ))}
          </div>
          <div style={{ fontSize: 10, opacity: 0.55, marginTop: 5, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
            {pickedGIR ? 'From the green.' : "Include chip-on + putts."}
          </div>
        </div>
      )}

      {/* Step 4: team score computed, opponent score picker */}
      {putts != null && teamScore != null && (
        <div style={{ marginTop: 18 }}>
          <StepLabel n={4} label="Opponent score"/>
          <div style={{
            marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          }}>
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              background: 'rgba(62,138,87,0.08)', border: '1px solid rgba(62,138,87,0.25)',
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', opacity: 0.6 }}>YOUR TEAM</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--forest)', lineHeight: 1, marginTop: 3 }}>
                {teamScore}
              </div>
              <div style={{ fontSize: 10, opacity: 0.65, marginTop: 3 }}>
                {pickedGIR ? 'GIR · ' : 'no GIR · '}{putts} putt{putts !== 1 ? 's' : ''}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', opacity: 0.6, marginBottom: 6 }}>OPPONENT</div>
              <ScorePicker value={oppScore} onPick={setOppScore} muted/>
            </div>
          </div>
        </div>
      )}

      {/* Result banner */}
      {result && (
        <div style={{
          marginTop: 14, padding: '14px 12px', borderRadius: 12,
          background: isWin ? 'var(--forest)' : isLoss ? 'var(--cream)' : 'var(--paper)',
          color: isWin ? 'var(--cream)' : 'var(--forest)',
          border: !isWin && !isLoss ? '1.5px solid rgba(28,73,42,0.25)' : 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', opacity: isWin ? 0.75 : 0.6 }}>RESULT</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, marginTop: 2 }}>{result}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, opacity: isWin ? 0.85 : 0.7, letterSpacing: '0.06em' }}>
            <div>Team {teamScore} · Opp {oppScore}</div>
            <div style={{ marginTop: 2 }}>
              GIR {pickedGIR ? '✓' : '✗'} · {putts}P · usage: {pickedBall === 'you' ? 'YOU' : 'JAY'}
            </div>
          </div>
        </div>
      )}

      <SheetActions onClose={onClose} onDone={onDone} disabled={!result} label="Save · next hole"/>
    </>
  );
}

function StepLabel({ n, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 18, height: 18, borderRadius: 999,
        background: 'var(--forest)', color: 'var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-display)',
      }}>{n}</div>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--forest)' }}>{label}</span>
    </div>
  );
}

function PlayerShotRow({ name, handle, accent, value, onPick, style }) {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid rgba(14,28,19,0.06)',
      borderRadius: 14, padding: 10, marginTop: 8, ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 999, background: accent,
          color: accent === 'var(--clay)' ? 'var(--forest-deep)' : 'var(--cream)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-display)',
        }}>{name[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>{name}</div>
          <div style={{ fontSize: 9, opacity: 0.55, fontWeight: 600 }}>{handle}</div>
        </div>
        {value && (
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
            padding: '3px 8px', borderRadius: 999,
            background: PROX.find(p => p.key === value)?.color, color: 'var(--cream)',
          }}>{PROX.find(p => p.key === value)?.label.toUpperCase()}</div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
        {PROX.map(p => (
          <button key={p.key} onClick={() => onPick(p.key)} style={{
            padding: '9px 4px', borderRadius: 9,
            background: value === p.key ? p.color : 'transparent',
            color: value === p.key ? 'var(--cream)' : 'var(--ink)',
            border: value === p.key ? 'none' : '1px solid rgba(14,28,19,0.1)',
            fontSize: 10, fontWeight: 700,
          }}>{p.label}</button>
        ))}
      </div>
    </div>
  );
}

// Visual: green with two ball positions
function GreenViz({ youProx, partnerProx, picked }) {
  // Map prox key → (radius from pin in viewport units)
  const r = { tap: 4, '10': 12, '20': 22, '30': 32, fringe: 44, miss: 54 };
  // Deterministic angles per player so it feels consistent
  const ballPos = (key, angle) => {
    if (!key) return null;
    const dist = r[key];
    return [50 + Math.cos(angle) * dist, 50 + Math.sin(angle) * dist];
  };
  const yPos = ballPos(youProx, -Math.PI / 3);
  const pPos = ballPos(partnerProx, Math.PI * 0.7);

  return (
    <div style={{
      marginTop: 10, background: 'var(--forest)', borderRadius: 14,
      padding: 12, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--cream)', opacity: 0.6, textTransform: 'uppercase' }}>
        The green · top-down
      </div>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: 160, marginTop: 4, display: 'block' }}>
        {/* fringe ring */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(234,226,206,0.12)" strokeWidth="0.4" strokeDasharray="2 2"/>
        {/* green */}
        <circle cx="50" cy="50" r="40" fill="rgba(180,210,150,0.14)" stroke="rgba(234,226,206,0.3)" strokeWidth="0.4"/>
        {/* distance rings */}
        {[30, 20, 10].map(rr => (
          <circle key={rr} cx="50" cy="50" r={rr * 0.9} fill="none" stroke="rgba(234,226,206,0.15)" strokeWidth="0.3" strokeDasharray="1 2"/>
        ))}
        {/* pin */}
        <line x1="50" y1="50" x2="50" y2="30" stroke="var(--cream)" strokeWidth="0.6"/>
        <polygon points="50,30 58,32 50,35" fill="var(--clay)"/>
        <circle cx="50" cy="50" r="1.2" fill="var(--clay)"/>

        {/* your ball */}
        {yPos && (
          <g>
            <circle cx={yPos[0]} cy={yPos[1]} r={picked === 'you' ? 3.5 : 2.5}
              fill="var(--clay)" stroke="var(--cream)" strokeWidth="0.6"/>
            {picked === 'you' && <circle cx={yPos[0]} cy={yPos[1]} r="5" fill="none" stroke="var(--clay)" strokeWidth="0.5" strokeDasharray="1 1"/>}
            <text x={yPos[0]} y={yPos[1] - 5} fontSize="3.5" fill="var(--cream)" textAnchor="middle" fontWeight="800">YOU</text>
          </g>
        )}
        {/* partner ball */}
        {pPos && (
          <g>
            <circle cx={pPos[0]} cy={pPos[1]} r={picked === 'partner' ? 3.5 : 2.5}
              fill="#B8E0A4" stroke="var(--cream)" strokeWidth="0.6"/>
            {picked === 'partner' && <circle cx={pPos[0]} cy={pPos[1]} r="5" fill="none" stroke="#B8E0A4" strokeWidth="0.5" strokeDasharray="1 1"/>}
            <text x={pPos[0]} y={pPos[1] - 5} fontSize="3.5" fill="var(--cream)" textAnchor="middle" fontWeight="800">JAY</text>
          </g>
        )}
      </svg>
    </div>
  );
}

function SheetActions({ onClose, onDone, disabled, label = 'Save · next hole' }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
      <button onClick={onClose} style={{
        flex: 1, padding: '14px 0', borderRadius: 14,
        background: 'transparent', border: '1px dashed rgba(14,28,19,0.2)',
        fontWeight: 700, fontSize: 14, color: 'var(--ink)',
      }}>Cancel</button>
      <Button variant="forest" full onClick={onDone} disabled={disabled}>
        {label}
      </Button>
    </div>
  );
}

function ScorePicker({ value, onPick, muted }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
      {[1,2,3,4,5,6].map(v => (
        <button key={v} onClick={() => onPick(v)} style={{
          padding: '12px 0', borderRadius: 10,
          background: value === v ? (muted ? '#8A6A4A' : 'var(--forest)') : 'var(--paper)',
          color: value === v ? 'var(--cream)' : 'var(--forest)',
          border: '1px solid rgba(14,28,19,0.08)',
          fontFamily: 'var(--font-display)', fontSize: 18,
        }}>{v}</button>
      ))}
    </div>
  );
}

// ─── Share card (match result) ──────────────────────────
function ResultShareScreen({ go }) {
  return (
    <div style={{
      background: `linear-gradient(180deg, var(--forest-dark) 0%, var(--forest-deep) 100%)`,
      minHeight: '100%', color: 'var(--cream)', paddingBottom: 120, position: 'relative',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ padding: '58px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <button onClick={() => go({ screen: 'home' })} style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'rgba(234,226,206,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--cream)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(234,226,206,0.22)',
        }}>
          <Icon.Close size={14}/>
        </button>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Match result · Week 11</div>
        <div style={{ width: 40 }}/>
      </div>

      <div style={{ padding: '24px 20px 0', textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Swipe to pick a card style</div>
      </div>

      <div style={{ padding: '20px 24px 0', position: 'relative' }}>
        <div style={{
          background: 'var(--cream)', color: 'var(--ink)',
          borderRadius: 28, padding: 24,
          aspectRatio: '4/5',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 20px 40px rgba(0,0,0,0.3)',
        }}>
          <img src="assets/mascot-full-forest.svg" alt="" style={{
            position: 'absolute', right: -32, bottom: -28, width: 240, opacity: 0.92,
          }}/>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <Wordmark variant="forest" size={110}/>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, marginTop: 6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Pitch & Putt · Miami</div>
            </div>
            <div style={{
              padding: '5px 11px', borderRadius: 999,
              background: 'var(--forest)', color: 'var(--cream)',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
              boxShadow: 'var(--shadow-sm)',
            }}>Week 11</div>
          </div>
          <div style={{ marginTop: 24, position: 'relative' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Final</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 108, color: 'var(--forest)', lineHeight: 0.82, letterSpacing: '-0.04em', marginTop: 4 }}>
              2 & 1
            </div>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--forest)', marginTop: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>WIN vs Riv + Theo</div>
            <div style={{ height: 1, background: 'rgba(14,28,19,0.12)', margin: '16px 0' }}/>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.85, letterSpacing: '0.04em' }}>
              <span><strong style={{ fontSize: 14 }}>5</strong> WON</span>
              <span><strong style={{ fontSize: 14 }}>1</strong> HALVED</span>
              <span><strong style={{ fontSize: 14 }}>2</strong> LOST</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <div style={{ display: 'flex' }}>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--forest)', color: 'var(--cream)', border: '2px solid var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'var(--font-display)' }}>A</div>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--moss)', color: 'var(--cream)', border: '2px solid var(--cream)', marginLeft: -10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'var(--font-display)' }}>J</div>
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--forest)', letterSpacing: '0.04em' }}>@alex.miami + @jaybird · SBX +0.043</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 24px 0', display: 'flex', gap: 10, position: 'relative' }}>
        <Button variant="primary" full size="lg">
          <Icon.Share size={14}/> Share to IG
        </Button>
        <Button variant="ghost" size="lg">
          Save
        </Button>
      </div>
    </div>
  );
}

Object.assign(window, { MembershipScreen, LiveScorecardScreen, ResultShareScreen });
