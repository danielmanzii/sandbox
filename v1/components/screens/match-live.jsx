/* global React, Button, Chip, Eyebrow, Icon, sbx */
// Live 1v1 match screen. Real-time synced via Supabase channels.
// Match-play scoring: lower score wins the hole; state = holes_up (A) vs (B).

function MatchLive({ matchId, profile, onExit }) {
  const [match, setMatch]   = React.useState(null);
  const [holes, setHoles]   = React.useState([]);
  const [players, setPlayers] = React.useState({}); // id → { first_name, handle }
  const [currentHole, setCurrentHole] = React.useState(1);
  const [err, setErr] = React.useState('');

  // Remember which match we're in across refreshes
  React.useEffect(() => {
    try { localStorage.setItem('spp_active_match', matchId); } catch {}
  }, [matchId]);

  // Initial load + live channels
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: m, error } = await sbx.from('matches').select('*').eq('id', matchId).maybeSingle();
      if (cancelled) return;
      if (error || !m) { setErr((error && error.message) || 'Match not found.'); return; }
      setMatch(m);

      const { data: hs } = await sbx.from('match_holes').select('*').eq('match_id', matchId).order('hole_number');
      if (!cancelled) setHoles(hs || []);

      // Load all player profiles (up to 4 for 2v2)
      const ids = [m.player_a, m.player_a2, m.player_b, m.player_b2].filter(Boolean);
      if (ids.length) {
        const { data: ps } = await sbx.from('profiles').select('id, first_name, last_name, handle').in('id', ids);
        if (!cancelled && ps) {
          const byId = {};
          for (const p of ps) byId[p.id] = p;
          setPlayers(byId);
        }
      }

      // Seed currentHole to first unscored hole
      if (!cancelled && hs) {
        const next = hs.find(h => h.result == null);
        if (next) setCurrentHole(next.hole_number);
      }
    }
    load();

    const ch = sbx.channel(`match-live:${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, async (p) => {
        if (p.new) setMatch(p.new);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_holes', filter: `match_id=eq.${matchId}` }, (p) => {
        if (p.new) {
          setHoles(prev => {
            const next = [...prev];
            const i = next.findIndex(h => h.hole_number === p.new.hole_number);
            if (i >= 0) next[i] = p.new; else next.push(p.new);
            next.sort((a, b) => a.hole_number - b.hole_number);
            return next;
          });
        }
      })
      .subscribe();

    return () => { cancelled = true; sbx.removeChannel(ch); };
  }, [matchId, profile.id]);

  // Always compute state (even before data arrives); this keeps hook count stable
  // across renders, per Rules of Hooks.
  const hasData = match && holes.length > 0;
  // Team membership: "you are A" = profile is on team A (player_a or player_a2 for 2v2).
  const youAreA = hasData && (match.player_a === profile.id || match.player_a2 === profile.id);
  const is2v2   = hasData && match.match_type === '2v2';
  const state = hasData ? computeState(holes, match.total_holes) : { up: 0, remaining: 0, decided: false, margin: null, totalPlayed: 0 };

  // If the match just got decided this render, persist the completion.
  React.useEffect(() => {
    if (!hasData) return;
    if (state.decided && match.status !== 'completed') {
      const winner = state.up > 0 ? 'A' : state.up < 0 ? 'B' : 'H';
      sbx.from('matches').update({
        status: 'completed',
        result: winner,
        final_margin: state.margin,
        completed_at: new Date().toISOString(),
      }).eq('id', matchId).then(() => {});
    }
  }, [hasData, state.decided, state.up, state.margin, match && match.status, matchId]);

  async function cancelMatch() {
    if (!window.confirm('Cancel this match? All scores so far will be lost and the match will be marked abandoned.')) return;
    await sbx.from('matches').update({ status: 'abandoned', completed_at: new Date().toISOString() }).eq('id', matchId);
    try { localStorage.removeItem('spp_active_match'); } catch {}
    onExit();
  }

  if (err) return <FullScreenMessage title="Something went wrong" detail={err} onBack={onExit}/>;
  if (!hasData) return <FullScreenMessage title="Loading match…"/>;
  if (match.status === 'abandoned') {
    return <FullScreenMessage title="Match cancelled" detail="This match was abandoned." onBack={onExit}/>;
  }

  const hole = holes.find(h => h.hole_number === currentHole) || holes[0];
  const matchDecided = match.status === 'completed' || state.decided;

  // Team label helpers
  const teamAName = is2v2
    ? [players[match.player_a], players[match.player_a2]].filter(Boolean).map(p => p.first_name || p.handle).join(' + ') || 'Team A'
    : (players[match.player_a] ? (players[match.player_a].first_name || players[match.player_a].handle) : 'A');
  const teamBName = is2v2
    ? [players[match.player_b], players[match.player_b2]].filter(Boolean).map(p => p.first_name || p.handle).join(' + ') || 'Team B'
    : (players[match.player_b] ? (players[match.player_b].first_name || players[match.player_b].handle) : 'B');
  const yourTeamLabel  = is2v2 ? (youAreA ? teamAName : teamBName) : 'You';
  const theirTeamLabel = is2v2 ? (youAreA ? teamBName : teamAName) : (youAreA ? teamBName : teamAName);

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '50px 16px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--canvas)' }}>
        <button onClick={onExit} style={{
          width: 38, height: 38, borderRadius: 999,
          background: 'var(--paper)', border: 'var(--hairline)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--forest)',
        }}>
          <Icon.ArrowLeft size={16} color="currentColor"/>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.55, color: 'var(--forest)' }}>
            {match.course_name || 'Match'} · {match.total_holes} holes · {match.match_type || '1v1'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--forest)', marginTop: 2 }}>
            {is2v2 ? `${teamAName} vs ${teamBName}` : `You vs ${theirTeamLabel}`}
          </div>
        </div>
        <StateBadge state={state}/>
      </div>

      {/* Decided — final result banner */}
      {matchDecided && <FinalBanner match={match} state={state} youAreA={youAreA} opponent={opponent}/>}

      {/* Current hole card */}
      {!matchDecided && (
        <div style={{ padding: '0 16px' }}>
          <HoleCard
            hole={hole}
            youAreA={youAreA}
            is2v2={is2v2}
            yourTeamLabel={yourTeamLabel}
            theirTeamLabel={theirTeamLabel}
            onYourScore={(score) => saveScore(matchId, hole.hole_number, youAreA ? 'a' : 'b', score)}
            onOpponentScore={(score) => saveScore(matchId, hole.hole_number, youAreA ? 'b' : 'a', score)}
            onSaveStat={(col, value) => saveHoleStat(matchId, hole.hole_number, col, value)}
            onAdvance={() => {
              const next = holes.find(h => h.hole_number > currentHole && h.result == null);
              if (next) setCurrentHole(next.hole_number);
            }}
          />
        </div>
      )}

      {/* Hole-by-hole strip */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>
          Scorecard
        </div>
        <div className="card" style={{ padding: 8, display: 'grid', gridTemplateColumns: `repeat(${Math.min(match.total_holes, 9)}, 1fr)`, gap: 4 }}>
          {holes.map(h => (
            <button key={h.hole_number} onClick={() => setCurrentHole(h.hole_number)} style={{
              padding: '10px 0', borderRadius: 10,
              background: h.hole_number === currentHole ? 'var(--forest)' : 'transparent',
              color: h.hole_number === currentHole ? 'var(--cream)' : 'var(--forest)',
              border: h.hole_number === currentHole ? 'none' : '1px solid rgba(14,28,19,0.08)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.04em' }}>H{h.hole_number}</div>
              <ResultBadge result={h.result} youAreA={youAreA}/>
            </button>
          ))}
        </div>
      </div>

      {/* Footer: cancel + back */}
      <div style={{ flex: 1 }}/>
      <div style={{ padding: '24px 16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!matchDecided ? (
          <button onClick={cancelMatch} style={{
            fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--loss)', opacity: 0.85, fontWeight: 700,
            padding: '8px 12px', borderRadius: 8,
          }}>
            Cancel match
          </button>
        ) : <span/>}
        <button onClick={onExit} style={{
          fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--forest)', opacity: 0.5, fontWeight: 700,
          padding: '8px 12px',
        }}>
          Back to hub
        </button>
      </div>
    </div>
  );
}

// ─── Hole card ───────────────────────────────────────────────
function HoleCard({ hole, youAreA, is2v2, yourTeamLabel, theirTeamLabel, onYourScore, onOpponentScore, onSaveStat, onAdvance }) {
  const yourScore = youAreA ? hole.player_a_score : hole.player_b_score;
  const oppScore  = youAreA ? hole.player_b_score : hole.player_a_score;
  const [showStats, setShowStats] = React.useState(false);

  // Your per-hole stats (1v1 only). In 2v2, team-level stats need per-shot
  // tracking which is a follow-up — so the section is only shown for 1v1.
  const statPrefix = youAreA ? 'player_a' : 'player_b';
  const yourGir   = hole[statPrefix + '_gir'];
  const yourPutts = hole[statPrefix + '_putts'];
  const yourProx  = hole[statPrefix + '_proximity_ft'];
  const statsLogged = yourGir != null || yourPutts != null || yourProx != null;

  return (
    <div className="card-hero" style={{
      background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--cream)', padding: '22px 20px 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <Eyebrow color="var(--cream)">Current hole</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 60, lineHeight: 0.9, letterSpacing: '-0.02em' }}>
                {hole.hole_number}
              </span>
              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', opacity: 0.75, letterSpacing: '0.08em' }}>
                PAR {hole.par || 3}
              </span>
            </div>
          </div>
          {hole.result != null && (
            <div style={{ textAlign: 'right' }}>
              <Eyebrow color="var(--cream)" style={{ opacity: 0.5 }}>Result</Eyebrow>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--cream)', marginTop: 2 }}>
                {resultLabel(hole.result, youAreA)}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>
          <Stepper label={yourTeamLabel || 'Your score'} value={yourScore} onChange={onYourScore}/>
          <Stepper label={theirTeamLabel || 'Opponent'}  value={oppScore}  onChange={onOpponentScore}/>
        </div>

        {/* Advanced stats — 1v1 only for now. Tap "Log stats" to expand. */}
        {!is2v2 && yourScore != null && (
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setShowStats(s => !s)} style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(234,226,206,0.15)',
              color: 'var(--cream)',
              fontSize: 12, fontWeight: 700,
              fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{statsLogged ? '✓ Stats logged' : 'Log stats (optional)'}</span>
              <span>{showStats ? '–' : '+'}</span>
            </button>

            {showStats && (
              <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(14,28,19,0.25)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* GIR toggle */}
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65, fontWeight: 700 }}>
                    Green in regulation
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <StatChoice active={yourGir === true}  onClick={() => onSaveStat(statPrefix + '_gir', true)}>Yes</StatChoice>
                    <StatChoice active={yourGir === false} onClick={() => onSaveStat(statPrefix + '_gir', false)}>No</StatChoice>
                    <StatChoice active={yourGir == null}   onClick={() => onSaveStat(statPrefix + '_gir', null)}>—</StatChoice>
                  </div>
                </div>
                {/* Putts stepper */}
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65, fontWeight: 700 }}>
                    Putts
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {[0, 1, 2, 3, 4, 5].map(n => (
                      <StatChoice key={n} active={yourPutts === n} onClick={() => onSaveStat(statPrefix + '_putts', n)}>{n}</StatChoice>
                    ))}
                  </div>
                </div>
                {/* Proximity (tee-shot to pin in feet) */}
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65, fontWeight: 700 }}>
                    Proximity to pin <span style={{ opacity: 0.6 }}>· feet from tee shot</span>
                  </div>
                  <input
                    type="number" inputMode="numeric" min="0" max="120"
                    value={yourProx == null ? '' : yourProx}
                    onChange={e => onSaveStat(statPrefix + '_proximity_ft', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="e.g. 12"
                    style={{
                      marginTop: 6, width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(234,226,206,0.18)',
                      color: 'var(--cream)', fontSize: 15, outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {yourScore != null && oppScore != null && (
          <Button variant="primary" size="lg" full onClick={onAdvance} style={{ marginTop: 16 }}>
            Next hole <Icon.ArrowRight size={16}/>
          </Button>
        )}
      </div>
    </div>
  );
}

function StatChoice({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      minWidth: 40, padding: '8px 12px', borderRadius: 10,
      background: active ? 'var(--cream)' : 'rgba(255,255,255,0.08)',
      color: active ? 'var(--forest)' : 'var(--cream)',
      border: active ? 'none' : '1px solid rgba(234,226,206,0.18)',
      fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
    }}>{children}</button>
  );
}

// ─── Stepper (score input) ───────────────────────────────────
function Stepper({ label, value, onChange }) {
  const v = value ?? null;
  return (
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(234,226,206,0.18)',
      borderRadius: 18, padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 8 }}>
        <StepBtn disabled={v == null || v <= 1} onClick={() => onChange(Math.max(1, (v ?? 3) - 1))}>−</StepBtn>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1,
          minWidth: 44, textAlign: 'center',
          color: v == null ? 'rgba(234,226,206,0.35)' : 'var(--cream)',
        }}>
          {v == null ? '—' : v}
        </div>
        <StepBtn onClick={() => onChange(Math.min(12, (v ?? 2) + 1))}>+</StepBtn>
      </div>
    </div>
  );
}

function StepBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 38, height: 38, borderRadius: 999,
      background: 'var(--cream)', color: 'var(--forest)',
      fontSize: 22, fontWeight: 800, lineHeight: 1,
      border: 'none', opacity: disabled ? 0.4 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  );
}

// ─── State badge (2 UP / 1 DN / AS / DORMIE / FINAL) ─────────
function StateBadge({ state }) {
  const lbl = labelForState(state);
  const bg = state.up > 0 ? 'var(--forest)' : state.up < 0 ? 'var(--loss)' : 'var(--cream)';
  const fg = state.up === 0 ? 'var(--forest)' : 'var(--cream)';
  return (
    <div style={{
      padding: '6px 14px', borderRadius: 999,
      background: bg, color: fg,
      fontSize: 13, fontWeight: 800, letterSpacing: '0.04em',
      fontFamily: 'var(--font-display)',
    }}>{lbl}</div>
  );
}

function labelForState(state) {
  if (state.up === 0) return state.remaining === 0 ? 'HALVED' : 'AS';
  const absUp = Math.abs(state.up);
  if (state.decided) return state.margin;
  if (absUp === state.remaining) return 'DORMIE';
  return `${absUp} ${state.up > 0 ? 'UP' : 'DN'}`;
}

// ─── Result badge (hole-level) ───────────────────────────────
// Always legible on any pill background: W = small "W" on solid chip,
// L = "L" on muted chip, H = outlined circle.
function ResultBadge({ result, youAreA }) {
  if (result == null) {
    return <div style={{ width: 16, height: 16, borderRadius: 999, border: '1px dashed currentColor', opacity: 0.3 }}/>;
  }
  if (result === 'H') {
    return <div style={{ width: 16, height: 16, borderRadius: 999, background: 'transparent', border: '1.5px solid currentColor' }}/>;
  }
  const youWon = (result === 'A' && youAreA) || (result === 'B' && !youAreA);
  return (
    <div style={{
      width: 18, height: 18, borderRadius: 999,
      background: youWon ? 'var(--moss-light)' : 'var(--loss)',
      color: '#fff',
      fontSize: 10, fontWeight: 900,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      lineHeight: 1,
    }}>{youWon ? 'W' : 'L'}</div>
  );
}

// ─── Final banner ────────────────────────────────────────────
function FinalBanner({ match, state, youAreA, opponent }) {
  const youWon = (state.up > 0 && youAreA) || (state.up < 0 && !youAreA);
  const halved = state.up === 0;
  return (
    <div style={{
      margin: '8px 16px 16px',
      borderRadius: 'var(--radius-card-lg)',
      background: youWon ? 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)' : halved ? 'var(--paper)' : 'var(--paper)',
      color: youWon ? 'var(--cream)' : 'var(--forest)',
      padding: '28px 24px',
      border: youWon ? 'none' : 'var(--hairline)',
      boxShadow: 'var(--shadow-md)',
    }}>
      <Eyebrow color={youWon ? 'var(--cream)' : 'var(--forest)'}>Match final</Eyebrow>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, marginTop: 10, letterSpacing: '-0.02em' }}>
        {halved ? 'Halved.' : youWon ? `W ${match.final_margin || state.margin}` : `L ${match.final_margin || state.margin}`}
      </div>
      <div style={{ fontSize: 13, opacity: 0.75, marginTop: 8 }}>
        {youWon ? `You beat ${opponent?.first_name || 'your opponent'} ${match.final_margin || state.margin}.` :
         halved ? 'Matched hole-for-hole. Go again.' :
         `${opponent?.first_name || 'Opponent'} took it ${match.final_margin || state.margin}.`}
      </div>
    </div>
  );
}

// ─── Full-screen message ─────────────────────────────────────
function FullScreenMessage({ title, detail, onBack }) {
  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ textAlign: 'center', color: 'var(--forest)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.02em' }}>{title}</div>
        {detail && <div style={{ marginTop: 10, fontSize: 14, opacity: 0.7 }}>{detail}</div>}
        {onBack && (
          <button onClick={onBack} style={{ marginTop: 20, fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--forest)', fontWeight: 700 }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Scoring helpers ─────────────────────────────────────────

// Save a single advanced stat column for a given hole (GIR / putts / proximity).
async function saveHoleStat(matchId, holeNumber, column, value) {
  const patch = { [column]: value, updated_at: new Date().toISOString() };
  await sbx.from('match_holes').update(patch).eq('match_id', matchId).eq('hole_number', holeNumber);
}

// Save a score for one player on one hole, recompute result, and bump match_holes row.
async function saveScore(matchId, holeNumber, who, score) {
  const col = who === 'a' ? 'player_a_score' : 'player_b_score';
  const { data: h } = await sbx.from('match_holes').select('*').eq('match_id', matchId).eq('hole_number', holeNumber).maybeSingle();
  if (!h) return;

  const nextA = who === 'a' ? score : h.player_a_score;
  const nextB = who === 'b' ? score : h.player_b_score;

  let result = null;
  if (nextA != null && nextB != null) {
    if (nextA < nextB) result = 'A';
    else if (nextB < nextA) result = 'B';
    else result = 'H';
  }

  await sbx.from('match_holes').update({
    [col]: score,
    result,
    updated_at: new Date().toISOString(),
  }).eq('match_id', matchId).eq('hole_number', holeNumber);
}

// Compute running match state from completed holes.
// Returns { up, remaining, decided, margin, totalPlayed }
function computeState(holes, totalHoles) {
  let aWins = 0, bWins = 0, played = 0;
  for (const h of holes) {
    if (h.result === 'A') { aWins++; played++; }
    else if (h.result === 'B') { bWins++; played++; }
    else if (h.result === 'H') { played++; }
  }
  const up = aWins - bWins; // + = A up
  const remaining = totalHoles - played;
  const absUp = Math.abs(up);
  const decided = (absUp > remaining) || (remaining === 0);
  let margin = null;
  if (decided) {
    if (absUp === 0) margin = 'AS';
    else if (remaining === 0) margin = `${absUp} UP`;
    else margin = `${absUp}&${remaining}`;
  }
  return { up, remaining, decided, margin, totalPlayed: played };
}

// ─── Hole result label: W / L / H from your POV ──────────────
function resultLabel(result, youAreA) {
  if (result === 'H') return 'H';
  const youWon = (result === 'A' && youAreA) || (result === 'B' && !youAreA);
  return youWon ? 'W' : 'L';
}

Object.assign(window, { MatchLive });
