/* global React, Button, Chip, Eyebrow, Icon, sbx, suggestBall */
// Live 1v1 match screen. Real-time synced via Supabase channels.
// Match-play scoring: lower score wins the hole; state = holes_up (A) vs (B).

function MatchLive({ matchId, profile, tier, onExit }) {
  const isMember = tier === 'league' || tier === 'plus' || tier === 'stats';
  const [match, setMatch]   = React.useState(null);
  const [holes, setHoles]   = React.useState([]);
  const [players, setPlayers] = React.useState({}); // id → { first_name, handle }
  const [currentHole, setCurrentHole] = React.useState(1);
  const [err, setErr] = React.useState('');
  // Ephemeral live running scores broadcast by each side as they tap through a
  // hole (NOT persisted — the authoritative score lands in the DB on finish).
  // { a: { holeNumber, strokes, done }, b: { … } }
  const [liveScores, setLiveScores] = React.useState({});
  const chRef = React.useRef(null);
  // How the player chose to score this match (asked once, up front).
  const [scoreMode, setScoreMode] = React.useState(() => {
    try { return localStorage.getItem('spp_scoremode_' + matchId); } catch (_) { return null; }
  });
  function chooseMode(m) {
    try { localStorage.setItem('spp_scoremode_' + matchId, m); } catch (_) {}
    setScoreMode(m);
  }

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
      // Live running score the other side broadcasts while they tap a hole.
      .on('broadcast', { event: 'live' }, ({ payload }) => {
        if (payload && payload.side) setLiveScores(prev => ({ ...prev, [payload.side]: payload }));
      })
      .subscribe();

    chRef.current = ch;
    return () => { cancelled = true; chRef.current = null; sbx.removeChannel(ch); };
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

  // Ask how to score this match — once, before play begins.
  if (!scoreMode && !matchDecided) {
    return <ScoreModeChooser onPick={chooseMode} onExit={onExit}/>;
  }

  // Team label helpers
  const teamAName = is2v2
    ? [players[match.player_a], players[match.player_a2]].filter(Boolean).map(p => p.first_name || p.handle).join(' + ') || 'Team A'
    : (players[match.player_a] ? (players[match.player_a].first_name || players[match.player_a].handle) : 'A');
  const teamBName = is2v2
    ? [players[match.player_b], players[match.player_b2]].filter(Boolean).map(p => p.first_name || p.handle).join(' + ') || 'Team B'
    : (players[match.player_b] ? (players[match.player_b].first_name || players[match.player_b].handle) : 'B');
  const yourTeamLabel  = is2v2 ? (youAreA ? teamAName : teamBName) : 'You';
  const theirTeamLabel = is2v2 ? (youAreA ? teamBName : teamAName) : (youAreA ? teamBName : teamAName);

  // Push our running count to the other side's scoreboard (ephemeral).
  const broadcastLive = (strokes, done) => {
    const c = chRef.current; if (!c) return;
    c.send({ type: 'broadcast', event: 'live', payload: { side: youAreA ? 'a' : 'b', holeNumber: currentHole, strokes, done } });
  };
  const liveOpp = liveScores[youAreA ? 'b' : 'a']; // what the OTHER team is doing live

  // Your team's two players (for 2v2 ball-selection / who-holed capture).
  const yourTeamIds = is2v2
    ? (youAreA ? [match.player_a, match.player_a2] : [match.player_b, match.player_b2])
    : [];
  const yourTeam = yourTeamIds.filter(Boolean).map(id => ({
    id,
    name: (players[id] && (players[id].first_name || players[id].handle)) || 'Player',
    handle: players[id] && players[id].handle,
  }));

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
        <StateBadge state={state} youAreA={youAreA}/>
      </div>

      {/* Decided — final result banner */}
      {matchDecided && <FinalBanner match={match} state={state} youAreA={youAreA} theirTeamLabel={theirTeamLabel}/>}

      {/* Dual result confirmation — gates SBX + points */}
      {matchDecided && <ResultConfirm match={match} youAreA={youAreA} theirTeamLabel={theirTeamLabel}/>}

      {/* Current hole card */}
      {!matchDecided && (
        <div style={{ padding: '0 16px' }}>
          <HoleCard
            key={hole.hole_number}
            hole={hole}
            youAreA={youAreA}
            is2v2={is2v2}
            isMember={isMember}
            isRegular={match.format === 'regular'}
            initialMode={scoreMode}
            yourTeam={yourTeam}
            yourTeamLabel={yourTeamLabel}
            theirTeamLabel={theirTeamLabel}
            liveOpp={liveOpp}
            flowKey={`spp_flow_${matchId}_${hole.hole_number}`}
            onLiveScore={broadcastLive}
            onYourScore={(score) => saveScore(matchId, hole.hole_number, youAreA ? 'a' : 'b', score)}
            onOpponentScore={(score) => saveScore(matchId, hole.hole_number, youAreA ? 'b' : 'a', score)}
            onSaveStat={(col, value) => saveHoleStat(matchId, hole.hole_number, col, value)}
            onSavePlayerStat={(playerId, patch) => savePlayerHoleStat(matchId, hole.hole_number, playerId, patch)}
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

// ─── Score-mode chooser (asked once, before the match) ────────────────
function ScoreModeChooser({ onPick, onExit }) {
  const Card = ({ m, emoji, title, sub }) => (
    <button onClick={() => onPick(m)} style={{
      width: '100%', textAlign: 'left', border: 'none', display: 'block',
      borderRadius: 'var(--radius-card-lg)', overflow: 'hidden', marginBottom: 14,
      background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--cream)', padding: 22, position: 'relative', boxShadow: 'var(--shadow-md)',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 30 }}>{emoji}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 0.95, marginTop: 10, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8, maxWidth: 320 }}>{sub}</div>
      </div>
    </button>
  );
  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', padding: '56px 20px 24px' }}>
      <button onClick={onExit} style={{
        width: 40, height: 40, borderRadius: 999, background: 'var(--paper)', border: 'var(--hairline)',
        color: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
      }}><Icon.ArrowLeft size={16}/></button>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Before you tee off</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.95, marginTop: 8, letterSpacing: '-0.02em', color: 'var(--forest)', marginBottom: 22 }}>
        How do you want to score?
      </div>
      <Card m="quick" emoji="⚡" title="Quick scoring" sub="Just the score each hole — fastest. Your match result and SBX still count."/>
      <Card m="stats" emoji="📊" title="Quick scoring + stats" sub="Track every shot — fairways, greens, whose ball, the caddie — and earn bonus points. 🎁"/>
      <div className="caption-serif" style={{ fontSize: 13, color: 'var(--ink)', opacity: 0.6, marginTop: 6, textAlign: 'center' }}>
        You can switch anytime during the round.
      </div>
    </div>
  );
}

// ─── Hole card ───────────────────────────────────────────────
function HoleCard({ hole, youAreA, is2v2, isMember, isRegular, initialMode, yourTeam, yourTeamLabel, theirTeamLabel, liveOpp, flowKey, onLiveScore, onYourScore, onOpponentScore, onSaveStat, onSavePlayerStat, onAdvance }) {
  const yourScore = youAreA ? hole.player_a_score : hole.player_b_score;
  const oppScore  = youAreA ? hole.player_b_score : hole.player_a_score;
  const [showStats, setShowStats] = React.useState(initialMode === 'stats'); // 1v1 expander default-open if they chose +stats
  const [mode, setMode] = React.useState(initialMode || 'quick'); // 'quick' | 'stats'
  const statsMode = mode === 'stats' && is2v2 && (yourTeam || []).length === 2;
  const statPrefixEarly = youAreA ? 'player_a' : 'player_b';

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
                <span style={{ fontSize: 26, verticalAlign: 'top', lineHeight: 1, position: 'relative', top: '7px', marginRight: '10px' }}>Hole</span>{hole.hole_number}
              </span>
              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', opacity: 0.75, letterSpacing: '0.08em' }}>PAR</span>
              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', opacity: 0.75, letterSpacing: '0.08em' }}>{hole.par || 3}</span>
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

        {/* Scoring mode toggle — 2v2 only (1v1 uses the wheel + stat expander) */}
        {is2v2 && (yourTeam || []).length === 2 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 18, padding: 4, background: 'rgba(14,28,19,0.28)', borderRadius: 999 }}>
            {[['quick', 'Quick Score'], ['stats', '+ Track Stats']].map(([k, l]) => (
              <button key={k} onClick={() => setMode(k)} style={{
                flex: 1, padding: '8px', borderRadius: 999,
                background: mode === k ? 'var(--cream)' : 'transparent',
                color: mode === k ? 'var(--forest)' : 'var(--cream)',
                fontWeight: 700, fontSize: 12,
              }}>{l}</button>
            ))}
          </div>
        )}

        {statsMode ? (
          <div style={{ marginTop: 16 }}>
            <ShotFlow
              yourTeam={yourTeam} par={hole.par || 3} savedScore={yourScore}
              isRegular={isRegular} isMember={isMember}
              flowKey={flowKey} yourTeamLabel={yourTeamLabel}
              onLiveScore={onLiveScore}
              onSavePlayerStat={onSavePlayerStat}
              onComplete={({ score, gir, zone, ballPlayer, holedBy }) => {
                onYourScore(score);
                if (gir != null)   onSaveStat(statPrefixEarly + '_gir', gir);
                if (zone)          onSaveStat('zone', zone);
                if (ballPlayer)    onSaveStat('ball_player', ballPlayer);
                if (holedBy)       onSaveStat('holed_by', holedBy);
              }}
            />
            <div style={{ height: 14 }}/>
            <OppReadout label={theirTeamLabel || 'Opponent'} value={oppScore} par={hole.par || 3} live={liveOpp} holeNumber={hole.hole_number}/>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            <ScoreWheel label={yourTeamLabel || 'Your score'} value={yourScore} par={hole.par || 3}
              onChange={(n) => { onYourScore(n); onLiveScore && onLiveScore(n, true); }}/>
            <div style={{ height: 12 }}/>
            <OppReadout label={theirTeamLabel || 'Opponent'} value={oppScore} par={hole.par || 3} live={liveOpp} holeNumber={hole.hole_number}/>
          </div>
        )}

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
              <span>{statsLogged ? '✓ Stats tracked' : '+ Track Stats'}</span>
              <span>{showStats ? '–' : '+'}</span>
            </button>

            {showStats && (
              <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(14,28,19,0.25)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Fairway — regular course, par 4+ only */}
                {isRegular && (hole.par || 3) >= 4 && (
                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65, fontWeight: 700, marginBottom: 8 }}>
                      Fairway
                    </div>
                    <FairwayCross value={hole[statPrefix + '_fairway']} onPick={(v) => onSaveStat(statPrefix + '_fairway', v)}/>
                  </div>
                )}
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
                {/* Putts */}
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
              </div>
            )}
          </div>
        )}

        {/* 2v2 ball-selection capture — one tap, optional zone. Feeds shot
            usage, the clutch stat, and the future "whose ball" AI. */}
        {!statsMode && is2v2 && yourScore != null && (yourTeam || []).length === 2 && (
          <TeamCapture hole={hole} yourTeam={yourTeam} isMember={isMember} onSaveStat={onSaveStat}/>
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

// ─── 2v2 per-hole capture: whose ball + who holed + optional zone ──────
const GREEN_ZONES = ['Long L', 'Long', 'Long R', 'Left', 'Pin high', 'Right', 'Short L', 'Short', 'Short R'];

function TeamCapture({ hole, yourTeam, isMember, onSaveStat }) {
  const [showZone, setShowZone] = React.useState(false);
  const [p1, p2] = yourTeam;
  const ball  = hole.ball_player;
  const holed = hole.holed_by;
  const zone  = hole.zone;

  return (
    <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(14,28,19,0.25)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <CaptureRow label="Whose ball did the team play?">
          {[p1, p2].map(p => (
            <StatChoice key={p.id} active={ball === p.id} onClick={() => onSaveStat('ball_player', ball === p.id ? null : p.id)}>{p.name}</StatChoice>
          ))}
        </CaptureRow>
        {/* AI caddie — a subtle suggestion that hovers under the ball pick */}
        <CaddieTip players={yourTeam} isMember={isMember}/>
      </div>

      <CaptureRow label="Who holed it?">
        {[p1, p2].map(p => (
          <StatChoice key={p.id} active={holed === p.id} onClick={() => onSaveStat('holed_by', holed === p.id ? null : p.id)}>{p.name}</StatChoice>
        ))}
      </CaptureRow>

      <div>
        {/* Bonus-points callout — make the reward obvious */}
        <button onClick={() => setShowZone(s => !s)} style={{
          width: '100%', textAlign: 'left',
          background: zone ? 'rgba(212,165,116,0.18)' : 'rgba(212,165,116,0.25)',
          border: '1px solid var(--clay)', borderRadius: 12, padding: '10px 12px',
          color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🎁</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--clay)' }}>
              {zone ? `✓ Ball position: ${zone}` : 'Bonus points up for grabs'}
            </div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>
              {zone ? '+10 pts earned this hole' : 'Log your ball position to earn +10 pts'}
            </div>
          </div>
          <span style={{ fontSize: 16, opacity: 0.7 }}>{showZone ? '–' : '+'}</span>
        </button>
        {showZone && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
            {GREEN_ZONES.map(z => (
              <StatChoice key={z} active={zone === z} onClick={() => onSaveStat('zone', zone === z ? null : z)}>{z}</StatChoice>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CaptureRow({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.65, fontWeight: 700 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

// ─── AI caddie: a subtle suggestion tip under the ball pick ───────────
function CaddieTip({ players, isMember }) {
  const [open, setOpen] = React.useState(false);
  const [zones, setZones] = React.useState({}); // playerId -> zone
  const suggestion = suggestBall(players, zones);

  // Non-members: a faint nudge to the perk, no interaction.
  if (!isMember) {
    return (
      <div style={{ marginTop: 7, fontSize: 11, opacity: 0.55, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span>🤖</span><span>Caddie tip — whose ball to play</span>
        <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', background: 'rgba(212,165,116,0.4)', color: 'var(--cream)', padding: '2px 5px', borderRadius: 999, fontWeight: 800 }}>SBX+</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 7 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: 'transparent', border: 'none', padding: 0,
        color: 'var(--clay)', fontSize: 11, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
      }}>
        <span>🤖</span> Caddie tip {open ? '▾' : '▸'}
      </button>

      {open && (
        <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(212,165,116,0.14)', border: '1px solid rgba(212,165,116,0.4)' }}>
          <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 8 }}>Where did each ball land? I'll suggest the play.</div>
          {players.map(p => (
            <div key={p.id} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                {GREEN_ZONES.map(z => (
                  <StatChoice key={z} active={zones[p.id] === z} onClick={() => setZones(s => ({ ...s, [p.id]: s[p.id] === z ? undefined : z }))}>{z}</StatChoice>
                ))}
              </div>
            </div>
          ))}
          <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--cream)', marginTop: 4, fontStyle: 'italic' }}>
            {suggestion ? `💡 ${suggestion.line}` : 'Tap both ball positions for a suggestion.'}
          </div>
        </div>
      )}
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

// ─── Fairway directional cross (hit / miss long-short-left-right) ─────
function FairwayCross({ value, onPick }) {
  // SVG arrow centered in its viewBox, rotated per direction — symmetric so
  // every arrow renders identically and stays perfectly centered.
  const Btn = ({ v, area, rot }) => {
    const on = value === v;
    const hit = v === 'hit';
    return (
      <button onClick={() => onPick(on ? null : v)} style={{
        gridArea: area, width: 38, height: 38, borderRadius: hit ? 999 : 9, margin: '0 auto',
        background: on ? (hit ? '#4F9D5B' : 'var(--cream)') : 'rgba(255,255,255,0.08)',
        color: on ? (hit ? '#fff' : 'var(--forest)') : 'var(--cream)',
        border: on ? 'none' : '1px solid rgba(234,226,206,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800,
      }}>
        {hit ? (
          <StrokeIcon kind="check" size={22}/>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
            strokeWidth="2" strokeLinejoin="round"
            style={{ display: 'block', transform: rot ? `rotate(${rot}deg)` : 'none' }}>
            <polygon points="12 7 18 17 6 17"/>
          </svg>
        )}
      </button>
    );
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 38px)', gridTemplateRows: 'repeat(3, 38px)', gap: 9,
      gridTemplateAreas: '". long ." "left hit right" ". short ."', width: 'max-content', margin: '0 auto' }}>
      <Btn v="long"  area="long"  rot={0}/>
      <Btn v="left"  area="left"  rot={-90}/>
      <Btn v="hit"   area="hit"/>
      <Btn v="right" area="right" rot={90}/>
      <Btn v="short" area="short" rot={180}/>
    </div>
  );
}

// ─── Guided shot-by-shot flow (2v2 scramble) — two-card, per player ───
// Each stroke both teammates log their own shot on their own card (@handle),
// the caddie compares the two balls, you pick which to play, repeat until
// holed. The team score emerges from the stroke count.
function ShotFlow({ yourTeam, par, isRegular, isMember, savedScore, flowKey, yourTeamLabel, onLiveScore, onSavePlayerStat, onComplete }) {
  const [p1, p2] = yourTeam;
  // Restore any in-progress hole so backing out of the match doesn't lose it.
  const saved = (() => {
    try { return JSON.parse((flowKey && localStorage.getItem(flowKey)) || 'null') || {}; } catch (_) { return {}; }
  })();
  const [stroke, setStroke] = React.useState(saved.stroke || 0);     // 0-based stroke (0 = tee)
  const [card, setCard]     = React.useState(saved.card || {});      // { pid: { fairway, reached, zone } }
  // 'cards' | 'putt' | 'done'. A finalized hole opens straight to the summary.
  const [phase, setPhase]   = React.useState(saved.phase || (savedScore != null ? 'done' : 'cards'));
  const [putts, setPutts]   = React.useState(saved.putts || 0);      // completed missed putt rounds
  const [puttCard, setPuttCard] = React.useState(saved.puttCard || {}); // this round: { pid: 'made'|'missed' }
  const [chosen, setChosen] = React.useState(saved.chosen || null);  // { ball, zone, strokesToGreen }
  const [doneScore, setDoneScore] = React.useState(null); // shown instantly on finish, before DB echoes back

  // Running strokes so far: full swings to the green, plus putt rounds.
  const count = (phase === 'putt' && chosen) ? chosen.strokesToGreen + putts : stroke;

  // Stream our running stroke count to the other team's scoreboard.
  React.useEffect(() => {
    if (onLiveScore) onLiveScore(count, phase === 'done');
  }, [count, phase]);

  // Persist in-progress state per match+hole; wipe it once the hole finalizes.
  React.useEffect(() => {
    if (!flowKey) return;
    try {
      if (phase === 'done') localStorage.removeItem(flowKey);
      else localStorage.setItem(flowKey, JSON.stringify({ stroke, card, phase, putts, puttCard, chosen }));
    } catch (_) {}
  }, [flowKey, stroke, card, phase, putts, puttCard, chosen]);

  function reset() {
    setStroke(0); setCard({}); setPhase('cards'); setPutts(0); setPuttCard({}); setChosen(null); setDoneScore(null);
    try { if (flowKey) localStorage.removeItem(flowKey); } catch (_) {}
  }

  // Hole finalized → show the team's score + a way to re-score. This is the
  // ONLY place 'done' renders, so it can never fall through to the cards view.
  if (phase === 'done') {
    const shown = savedScore != null ? savedScore : doneScore;
    return (
      <div style={{ padding: 14, borderRadius: 14, background: 'rgba(14,28,19,0.25)', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.7, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your team scored</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, margin: '4px 0 10px' }}>{shown != null ? shown : '✓'}</div>
        <button onClick={reset} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(234,226,206,0.22)', color: 'var(--cream)', borderRadius: 999, padding: '8px 16px', fontSize: 12, fontWeight: 700 }}>Re-score with shots</button>
      </div>
    );
  }

  const isTee = stroke === 0;
  // A tee shot on a regular par 4/5 is a DRIVE: log the fairway result only,
  // no "on the green?" (you're not reaching it off the tee). Everything else —
  // a par-3 tee, a pitch & putt hole, or any approach shot thereafter — asks
  // "is the ball on the green?".
  const fairwayTee = isTee && isRegular && (par || 3) >= 4;
  const setField = (pid, key, val) => setCard(c => ({ ...c, [pid]: { ...(c[pid] || {}), [key]: val } }));
  const cardDone = (pid) => {
    const c = card[pid]; if (!c) return false;
    if (fairwayTee) return !!c.fairway;                 // drive: just need a fairway result
    if (c.reached == null) return false;                // approach: on/off green required
    if (c.reached === true && !c.zone) return false;    // on green: pick a position (bonus pts)
    return true;
  };
  const bothDone = cardDone(p1.id) && cardDone(p2.id);
  const suggestion = (isMember && card[p1.id] && card[p2.id] && card[p1.id].zone && card[p2.id].zone)
    ? suggestBall(yourTeam, { [p1.id]: card[p1.id].zone, [p2.id]: card[p2.id].zone }) : null;

  function pickBall(pid) {
    [p1, p2].forEach(p => {
      const c = card[p.id] || {}; const patch = {};
      if (fairwayTee && c.fairway) patch.fairway = c.fairway;
      if (!fairwayTee && c.reached === true) { patch.gir = true; if (c.zone) patch.zone = c.zone; }
      if (Object.keys(patch).length) onSavePlayerStat(p.id, patch);
    });
    const c = card[pid] || {};
    // Off the tee (drive) you never reach the green → always advance to the
    // approach. Otherwise, if the chosen ball is on the green, go putt.
    if (!fairwayTee && c.reached) { setChosen({ ball: pid, zone: c.zone, strokesToGreen: stroke + 1 }); setPhase('putt'); }
    else { setStroke(stroke + 1); setCard({}); }
  }

  // Putting — both teammates putt the chosen ball each round. The first to
  // hole ends it (their ball is the line, the round is the team's last putt).
  // If both miss, it's another round.
  if (phase === 'putt') {
    const roundNo = putts + 1;
    const strokesToGreen = chosen ? chosen.strokesToGreen : stroke;
    const finish = (holer) => {
      const score = strokesToGreen + roundNo;
      setDoneScore(score);
      setPhase('done');
      onComplete({
        score,
        gir: strokesToGreen <= Math.max(1, (par || 3) - 2),
        zone: chosen && chosen.zone, ballPlayer: chosen && chosen.ball, holedBy: holer,
      });
    };
    const missed = (pid) => setPuttCard(pc => {
      const next = { ...pc, [pid]: 'missed' };
      if (next[p1.id] === 'missed' && next[p2.id] === 'missed') { setPutts(putts + 1); return {}; } // new round
      return next;
    });
    return (
      <SfWrap count={count} onReset={reset} label={yourTeamLabel} title={`Putt ${roundNo} — Putt made?`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[p1, p2].map(p => (
            <PuttCard key={p.id} player={p} result={puttCard[p.id]}
              onMade={() => finish(p.id)} onMissed={() => missed(p.id)}/>
          ))}
        </div>
      </SfWrap>
    );
  }

  // Cards phase — both teammates log this stroke
  return (
    <SfWrap count={count} onReset={reset} label={yourTeamLabel}
      title={`Shot ${stroke + 1} — ${fairwayTee ? 'Fairway hit?' : 'Reached the green?'}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[p1, p2].map(p => (
          <PlayerShotCard key={p.id} player={p} data={card[p.id] || {}}
            showFairway={fairwayTee} showGreen={!fairwayTee}
            onFairway={(v) => setField(p.id, 'fairway', v)}
            onReached={(v) => setField(p.id, 'reached', v)}
            onZone={(z) => setField(p.id, 'zone', z)}/>
        ))}
      </div>

      {suggestion && (
        <div style={{ marginTop: 10, background: 'rgba(212,165,116,0.16)', border: '1px solid var(--clay)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', fontWeight: 800, marginBottom: 4 }}>🤖 Caddie</div>
          <div style={{ fontSize: 12, lineHeight: 1.4 }}>{suggestion.line}</div>
        </div>
      )}

      {bothDone && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700, marginBottom: 6 }}>Whose ball did the team take?</div>
          <SfPick options={[{ k: p1.id, label: p1.name }, { k: p2.id, label: p2.name }]} onPick={pickBall}/>
        </div>
      )}
    </SfWrap>
  );
}

function SfWrap({ title, count, label, onReset, children }) {
  return (
    <div>
      {/* Your team's running score — mirrors the opponent scoreboard */}
      <YouReadout label={label} count={count}/>
      <div style={{ height: 12 }}/>
      <div style={{ padding: 14, borderRadius: 14, background: 'rgba(14,28,19,0.25)' }}>
        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, marginBottom: 10 }}>{title}</div>
        {children}
        {count > 0 && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onReset} style={{ background: 'transparent', border: 'none', color: 'var(--cream)', opacity: 0.7, fontSize: 11, fontWeight: 700 }}>Start over</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Your team's live strokes — same card language as the opponent readout, with
// a cream accent so "you" reads distinct from "them".
function YouReadout({ label, count }) {
  const n = count || 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>{label || 'Your team'}</span>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, fontWeight: 700 }}>Strokes so far</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'rgba(234,226,206,0.12)', border: '1px solid rgba(234,226,206,0.35)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.9, minWidth: 40, textAlign: 'center', opacity: n === 0 ? 0.5 : 1 }}>
          {n === 0 ? '–' : n}
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.3 }}>
          {n === 0 ? 'Tee it up' : 'Playing this hole…'}
        </div>
      </div>
    </div>
  );
}

function SfPick({ options, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(o => (
        <button key={o.k} onClick={() => onPick(o.k)} style={{
          flex: 1, padding: '12px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(234,226,206,0.2)', color: 'var(--cream)', fontWeight: 700, fontSize: 13,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// Per-player putt card (@handle) — each teammate logs their own putt.
function PuttCard({ player, result, onMade, onMissed }) {
  return (
    <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(234,226,206,0.16)' }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
        {player.name} <span style={{ opacity: 0.6, fontWeight: 600 }}>{player.handle ? (player.handle.startsWith('@') ? player.handle : '@' + player.handle) : ''}</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <XoButton kind="x"     active={result === 'missed'} onClick={onMissed}/>
        <XoButton kind="check" active={result === 'made'}   onClick={onMade}/>
      </div>
    </div>
  );
}

// Thick, centered ✕ / ✓ drawn as SVG so they match the chunky display font
// (text glyphs render thin and sit off-center).
function StrokeIcon({ kind, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      {kind === 'check'
        ? <polyline points="5 13 10 18 19 7"/>
        : <g><line x1="7" y1="7" x2="17" y2="17"/><line x1="17" y1="7" x2="7" y2="17"/></g>}
    </svg>
  );
}

// ✕ / ✓ answer pair used across the shot flow (reach green, putt made).
function XoButton({ kind, active, onClick }) {
  return (
    <button onClick={onClick} style={{ ...pillStyle(active), padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <StrokeIcon kind={kind === 'check' ? 'check' : 'x'} size={24}/>
    </button>
  );
}

// Per-player card (@handle). A tee drive shows ONLY the fairway cross; a
// par-3 tee / approach shows ONLY the on/off-green answer (+ position).
function PlayerShotCard({ player, data, showFairway, showGreen, onFairway, onReached, onZone }) {
  return (
    <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(234,226,206,0.16)' }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
        {player.name} <span style={{ opacity: 0.6, fontWeight: 600 }}>{player.handle ? (player.handle.startsWith('@') ? player.handle : '@' + player.handle) : ''}</span>
      </div>

      {showFairway && (
        <FairwayCross value={data.fairway} onPick={onFairway}/>
      )}

      {showGreen && (
        <div style={{ display: 'flex', gap: 6 }}>
          <XoButton kind="x"     active={data.reached === false} onClick={() => onReached(false)}/>
          <XoButton kind="check" active={data.reached === true}  onClick={() => onReached(true)}/>
        </div>
      )}

      {showGreen && data.reached === true && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, fontWeight: 700, marginBottom: 5 }}>Where on the green?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
            {GREEN_ZONES.map(z => (
              <button key={z} onClick={() => onZone(z)} style={{
                padding: '8px 2px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                background: data.zone === z ? 'var(--cream)' : 'rgba(255,255,255,0.08)',
                color: data.zone === z ? 'var(--forest)' : 'var(--cream)',
                border: data.zone === z ? 'none' : '1px solid rgba(234,226,206,0.2)',
              }}>{z}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function pillStyle(active) {
  return {
    flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700,
    background: active ? 'var(--cream)' : 'rgba(255,255,255,0.08)',
    color: active ? 'var(--forest)' : 'var(--cream)',
    border: active ? 'none' : '1px solid rgba(234,226,206,0.2)',
  };
}

// ─── Score wheel (GHIN-style) — tap a number, par-shape auto-draws ────
function parShape(score, par) {
  if (score == null) return null;
  const d = score - par;
  if (d <= -2) return 'eagle';   // double circle
  if (d === -1) return 'birdie'; // circle
  if (d === 0)  return 'par';    // plain
  if (d === 1)  return 'bogey';  // square
  return 'double';               // double square
}
const SHAPE_LABEL = { eagle: 'Eagle or better', birdie: 'Birdie', par: 'Par', bogey: 'Bogey', double: 'Double bogey+' };

function ScoreWheel({ label, value, par, onChange }) {
  const p = par || 3;
  const nums = Array.from({ length: p + 5 }, (_, i) => i + 1); // 1 … par+5
  const sel = value;
  const shape = parShape(sel, p);
  const isCircle = shape === 'birdie' || shape === 'eagle';
  const isDouble = shape === 'eagle' || shape === 'double';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>{label}</span>
        {sel != null && shape && shape !== 'par' && (
          <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>{SHAPE_LABEL[shape]}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 2px 2px' }} className="scroll-hide">
        {nums.map(n => {
          const on = sel === n;
          return (
            <button key={n} onClick={() => onChange(n)} style={{
              flex: '0 0 auto', width: 46, height: 46,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: on ? 'var(--cream)' : 'rgba(255,255,255,0.08)',
              color: on ? 'var(--forest)' : 'var(--cream)',
              borderRadius: on ? (isCircle ? 999 : 8) : 12,
              border: on ? '2px solid var(--forest-deep)' : '1px solid rgba(234,226,206,0.18)',
              boxShadow: on && isDouble ? '0 0 0 2px var(--cream), 0 0 0 4px var(--forest-deep)' : 'none',
              fontFamily: 'var(--font-display)', fontSize: 19, lineHeight: 1,
            }}>{n}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Opponent score — READ ONLY ──────────────────────────────
// You never enter the other team's score; it appears here as they log it on
// their own device (realtime), so you always know what you're up against.
function OppReadout({ label, value, par, live, holeNumber }) {
  const p = par || 3;
  const shape = parShape(value, p);
  // A live running count for THIS hole, only while no final score is in yet.
  const liveOn = value == null && live && live.holeNumber === holeNumber && !live.done && live.strokes > 0;
  const big = value != null ? value : (liveOn ? live.strokes : '–');
  const sub = value != null ? 'Logged by their team'
            : liveOn ? 'Playing this hole…'
            : 'Waiting for their score…';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>{label}</span>
        {value != null ? (
          shape && shape !== 'par'
            ? <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>{SHAPE_LABEL[shape]}</span>
            : <span/>
        ) : (
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, color: liveOn ? '#7BD389' : 'inherit', opacity: liveOn ? 1 : 0.55 }}>
            {liveOn && <span style={{ width: 6, height: 6, borderRadius: 999, background: '#7BD389', display: 'inline-block' }}/>}
            Strokes so far
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'rgba(14,28,19,0.3)', border: liveOn ? '1px solid rgba(123,211,137,0.4)' : '1px solid rgba(234,226,206,0.14)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.9, minWidth: 40, textAlign: 'center', opacity: (value == null && !liveOn) ? 0.4 : 1 }}>
          {big}
        </div>
        <div style={{ fontSize: 11, opacity: 0.6, lineHeight: 1.3 }}>{sub}</div>
      </div>
    </div>
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
function StateBadge({ state, youAreA }) {
  // state.up is in player-A's absolute perspective; flip it to YOURS.
  const up = youAreA === false ? -state.up : state.up;
  const lbl = labelForState(state, up);
  const bg = up > 0 ? 'var(--forest)' : up < 0 ? 'var(--loss)' : 'var(--cream)';
  const fg = up === 0 ? 'var(--forest)' : 'var(--cream)';
  return (
    <div style={{
      padding: '6px 14px', borderRadius: 999,
      background: bg, color: fg,
      fontSize: 13, fontWeight: 800, letterSpacing: '0.04em',
      fontFamily: 'var(--font-display)',
    }}>{lbl}</div>
  );
}

function labelForState(state, up) {
  if (up === 0) return state.remaining === 0 ? 'HALVED' : 'AS';
  const absUp = Math.abs(up);
  if (state.decided) return state.margin;
  if (absUp === state.remaining) return 'DORMIE';
  return `${absUp} ${up > 0 ? 'UP' : 'DN'}`;
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
// ─── Dual result confirmation (one per side) ──────────────────────────
function ResultConfirm({ match, youAreA, theirTeamLabel }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr]   = React.useState('');
  const mySide    = youAreA ? 'a' : 'b';
  const iConfirmed     = mySide === 'a' ? match.confirmed_a : match.confirmed_b;
  const theyConfirmed  = mySide === 'a' ? match.confirmed_b : match.confirmed_a;
  const bothConfirmed  = match.confirmed_a && match.confirmed_b;

  async function confirm() {
    setBusy(true); setErr('');
    const { error } = await sbx.rpc('confirm_match_result', { p_match: match.id });
    if (error) { setErr(error.message || 'Could not confirm.'); setBusy(false); }
    // On success, realtime updates `match` → this re-renders into the next state.
  }

  return (
    <div style={{ padding: '14px 16px 0' }}>
      <div className="card" style={{ padding: 16, textAlign: 'center' }}>
        {bothConfirmed ? (
          <>
            <div style={{ fontSize: 22 }}>✅</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)', marginTop: 4 }}>Result confirmed</div>
            <div className="caption-serif" style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
              Both sides agreed — this match now counts toward your SBX.
            </div>
          </>
        ) : iConfirmed ? (
          <>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Confirmed on your side</div>
            <div className="caption-serif" style={{ fontSize: 14, opacity: 0.75, marginTop: 6 }}>
              Waiting for {theirTeamLabel} to confirm the result…
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)' }}>Confirm the result</div>
            <div className="caption-serif" style={{ fontSize: 13, opacity: 0.7, marginTop: 4, marginBottom: 12 }}>
              Both teams confirm before it counts toward SBX. {theyConfirmed ? `${theirTeamLabel} already confirmed.` : ''}
            </div>
            {err && <div style={{ fontSize: 12, color: 'var(--loss)', marginBottom: 8 }}>{err}</div>}
            <Button variant="forest" full onClick={confirm} disabled={busy}>
              {busy ? 'Confirming…' : 'Confirm result'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function FinalBanner({ match, state, youAreA, theirTeamLabel }) {
  const youWon = (state.up > 0 && youAreA) || (state.up < 0 && !youAreA);
  const halved = state.up === 0;
  const oppLabel = theirTeamLabel || 'Opponent';
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
        {youWon ? `You beat ${oppLabel} ${match.final_margin || state.margin}.` :
         halved ? 'Matched hole-for-hole. Go again.' :
         `${oppLabel} took it ${match.final_margin || state.margin}.`}
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

// Per-player, per-hole stat (2v2) → hole_player_stats (upsert).
async function savePlayerHoleStat(matchId, holeNumber, playerId, patch) {
  await sbx.from('hole_player_stats').upsert(
    { match_id: matchId, hole_number: holeNumber, player_id: playerId, ...patch },
    { onConflict: 'match_id,hole_number,player_id' }
  );
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
