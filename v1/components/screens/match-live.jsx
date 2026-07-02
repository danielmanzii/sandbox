/* global React, Button, Chip, Eyebrow, Icon, sbx, suggestBall */
// Live 1v1 match screen. Real-time synced via Supabase channels.
// Match-play scoring: lower score wins the hole; state = holes_up (A) vs (B).

function MatchLive({ matchId, profile, tier, onExit, go }) {
  const isMember = tier === 'league' || tier === 'plus' || tier === 'stats';
  const [match, setMatch]   = React.useState(null);
  const [holes, setHoles]   = React.useState([]);
  const [players, setPlayers] = React.useState({}); // id → { first_name, handle }
  const [currentHole, setCurrentHole] = React.useState(1);
  const [err, setErr] = React.useState('');
  const [ready, setReady] = React.useState(false); // all data loaded + hole seeded
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
        const { data: ps } = await sbx.from('profiles').select('id, first_name, last_name, handle, avatar_url').in('id', ids);
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
      // Everything (match, holes, players, current hole) is in place — only now
      // reveal the match so we never flash the wrong hole or generic names.
      if (!cancelled) setReady(true);
    }
    setReady(false);
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

  const [confirmingCancel, setConfirmingCancel] = React.useState(false);
  const shareCardRef = React.useRef(null);
  async function doCancelMatch() {
    await sbx.from('matches').update({ status: 'abandoned', completed_at: new Date().toISOString() }).eq('id', matchId);
    try { localStorage.removeItem('spp_active_match'); } catch {}
    onExit();
  }

  if (err) return <FullScreenMessage title="Something went wrong" detail={err} onBack={onExit}/>;
  // Bouncing-logo loader so launch → match is one seamless brand moment.
  if (!ready || !hasData) return <SppLoader fill/>;
  if (match.status === 'abandoned') {
    return <FullScreenMessage title="Match cancelled" detail="This match was abandoned." onBack={onExit}/>;
  }

  const hole = holes.find(h => h.hole_number === currentHole) || holes[0];
  const matchDecided = match.status === 'completed' || state.decided;

  // (No up-front score-mode chooser — Quick Score / + Track Stats are
  //  interchangeable from the toggle inside the match.)

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

  // Your side's player(s): one for 1v1, two for 2v2 (the *_2 ids are null in
  // 1v1, so filter() collapses to a single player). Same scoring UI either way.
  const yourTeamIds = youAreA ? [match.player_a, match.player_a2] : [match.player_b, match.player_b2];
  const toPlayer = (id) => ({
    id,
    name: (players[id] && (players[id].first_name || players[id].handle)) || 'Player',
    handle: players[id] && players[id].handle,
    avatar: players[id] && players[id].avatar_url,
  });
  const yourTeam = yourTeamIds.filter(Boolean).map(toPlayer);
  const theirTeamIds = youAreA ? [match.player_b, match.player_b2] : [match.player_a, match.player_a2];
  const theirTeam = theirTeamIds.filter(Boolean).map(toPlayer);

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
        <div style={{ flex: 1 }}/>
        <StateBadge state={state} youAreA={youAreA}/>
      </div>

      {matchDecided ? (
        /* Decided — shareable 3D result card + confirm + actions, centred lower */
        <div style={{ flex: 1, padding: '0 16px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '7%' }}>
          <ResultCard cardRef={shareCardRef} match={match} state={state} youAreA={youAreA} is2v2={is2v2}
            yourTeamLabel={yourTeamLabel} theirTeamLabel={theirTeamLabel} holes={holes} yourTeam={yourTeam} theirTeam={theirTeam}/>
          <ResultConfirm match={match} youAreA={youAreA} theirTeamLabel={theirTeamLabel}/>
          {(match.confirmed_a && match.confirmed_b) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 0 34px' }}>
              <button onClick={() => shareCardImage(shareCardRef.current, {
                youWon: (state.up > 0 && youAreA) || (state.up < 0 && !youAreA),
                halved: state.up === 0, margin: match.final_margin || state.margin, theirLabel: theirTeamLabel,
              })} style={{ width: '100%', padding: 15, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: 'var(--forest)', color: 'var(--cream)', fontWeight: 800, fontSize: 14 }}>
                Share scorecard
              </button>
              <button onClick={() => go && go({ screen: 'matchDetail', matchId })} style={{ width: '100%', padding: 15, borderRadius: 14, cursor: 'pointer',
                background: 'transparent', border: '1px solid var(--forest)', color: 'var(--forest)', fontWeight: 800, fontSize: 14 }}>
                Hole by hole details
              </button>
              <button onClick={onExit} style={{ width: '100%', padding: 13, borderRadius: 14, cursor: 'pointer',
                background: 'transparent', border: 'none', color: 'var(--forest)', opacity: 0.6, fontWeight: 800, fontSize: 13 }}>
                Exit
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Current hole card */}
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
              theirTeam={theirTeam}
              yourTeamLabel={yourTeamLabel}
              theirTeamLabel={theirTeamLabel}
              liveOpp={liveOpp}
              draft={youAreA ? hole.draft_a : hole.draft_b}
              meId={profile.id}
              onSaveDraft={(d) => saveDraft(matchId, hole.hole_number, youAreA ? 'a' : 'b', d)}
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
            <button onClick={() => setConfirmingCancel(true)} style={{
              fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--loss)', opacity: 0.85, fontWeight: 700, padding: '8px 12px', borderRadius: 8,
            }}>
              Cancel match
            </button>
            <button onClick={onExit} style={{
              fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--forest)', opacity: 0.5, fontWeight: 700, padding: '8px 12px',
            }}>
              Back to hub
            </button>
          </div>
        </>
      )}

      {/* Cancel confirmation — branded */}
      {confirmingCancel && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(14,28,19,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card" style={{ padding: 26, textAlign: 'center', maxWidth: 340, width: '100%' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--forest)', lineHeight: 1 }}>Cancel this match?</div>
            <div className="caption-serif" style={{ fontSize: 14, opacity: 0.75, marginTop: 10, lineHeight: 1.5 }}>
              All scores so far will be lost and the match marked abandoned. This can’t be undone.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
              <button onClick={doCancelMatch} style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--loss)', color: 'var(--paper)', fontWeight: 800, fontSize: 15 }}>Yes, cancel match</button>
              <button onClick={() => setConfirmingCancel(false)} style={{ width: '100%', padding: 14, borderRadius: 14, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(14,28,19,0.2)', color: 'var(--forest)', fontWeight: 800, fontSize: 15 }}>Keep playing</button>
            </div>
          </div>
        </div>
      )}
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
      <Card m="stats" emoji="📊" title="Quick scoring + stats" sub="Track every shot — fairways, greens, putts — and earn bonus Sandbox points."/>
      <div className="caption-serif" style={{ fontSize: 13, color: 'var(--ink)', opacity: 0.6, marginTop: 6, textAlign: 'center' }}>
        You can switch anytime during the round.
      </div>
    </div>
  );
}

// ─── Hole card ───────────────────────────────────────────────
function HoleCard({ hole, youAreA, is2v2, isMember, isRegular, initialMode, yourTeam, theirTeam, yourTeamLabel, theirTeamLabel, liveOpp, draft, meId, onLiveScore, onSaveDraft, onYourScore, onOpponentScore, onSaveStat, onSavePlayerStat, onAdvance }) {
  const yourScore = youAreA ? hole.player_a_score : hole.player_b_score;
  const oppScore  = youAreA ? hole.player_b_score : hole.player_a_score;
  const [showStats, setShowStats] = React.useState(initialMode === 'stats'); // 1v1 expander default-open if they chose +stats
  const hasTeam   = (yourTeam || []).length >= 1; // 1 (1v1) or 2 (2v2)
  const hasDraft  = !!(draft && draft.phase && draft.phase !== 'done');
  // The toggle now fully controls the mode — you can switch back to Quick Score
  // at any time. Open in stats on mount if that's the saved mode or a draft is
  // already in progress (e.g. a teammate started the hole).
  const [mode, setMode] = React.useState(() => (initialMode === 'stats' || hasDraft) ? 'stats' : 'quick');
  const [statsSeq, setStatsSeq] = React.useState(0);      // bump to remount ShotFlow at stroke 1
  const [freshStats, setFreshStats] = React.useState(false);
  const statsMode = mode === 'stats' && hasTeam;
  function toQuick() { setMode('quick'); }
  function toStats() {
    // (Re)entering stats restarts the shot flow from the first stroke.
    if (mode !== 'stats') { if (onSaveDraft) onSaveDraft(null); setFreshStats(true); setStatsSeq(s => s + 1); }
    setMode('stats');
  }
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
              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 700, opacity: 0.75, letterSpacing: '0.14em' }}>PAR</span>
              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 700, opacity: 0.75, letterSpacing: '0.14em' }}>{hole.par || 3}</span>
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

        {/* Scoring mode toggle — same for 1v1 and 2v2 */}
        {hasTeam && (
          <div style={{ display: 'flex', gap: 6, marginTop: 18, padding: 4, background: 'rgba(14,28,19,0.28)', borderRadius: 999 }}>
            {[['quick', 'Quick Score'], ['stats', '+ Track Stats']].map(([k, l]) => (
              <button key={k} onClick={() => (k === 'stats' ? toStats() : toQuick())} style={{
                flex: 1, padding: '8px', borderRadius: 999,
                background: mode === k ? 'var(--cream)' : 'transparent',
                color: mode === k ? 'var(--forest)' : 'var(--cream)',
                fontWeight: 700, fontSize: 12,
              }}>{l}</button>
            ))}
          </div>
        )}

        {/* Track-stats callout — directly under the toggle, in quick mode (1v1 + 2v2) */}
        {!statsMode && hasTeam && (
          <TeamCapture onTrackStats={toStats}/>
        )}

        {statsMode ? (
          <div style={{ marginTop: 16 }}>
            <ShotFlow
              key={statsSeq}
              yourTeam={yourTeam} par={hole.par || 3} savedScore={yourScore}
              isRegular={isRegular} isMember={isMember}
              draft={freshStats ? null : draft} meId={meId} yourTeamLabel={yourTeamLabel}
              onLiveScore={onLiveScore}
              onSaveDraft={onSaveDraft}
              onSavePlayerStat={onSavePlayerStat}
              onComplete={({ score, gir, putts, zone, ballPlayer, holedBy, shotLog }) => {
                onYourScore(score);
                // Side-suffixed columns only — ball_player/holed_by/zone used to be
                // shared between teams, so the last side to finish clobbered the other.
                const side = youAreA ? '_a' : '_b';
                if (gir != null)   onSaveStat(statPrefixEarly + '_gir', gir);
                if (putts != null) onSaveStat(statPrefixEarly + '_putts', putts);
                if (zone)          onSaveStat('zone' + side, zone);
                if (ballPlayer)    onSaveStat('ball_player' + side, ballPlayer);
                if (holedBy)       onSaveStat('holed_by' + side, holedBy);
                if (shotLog && shotLog.length) onSaveStat('shot_log' + side, shotLog);
              }}
            />
            <div style={{ height: 14 }}/>
            <OppReadout label={theirTeamLabel || 'Opponent'} labelPlayers={theirTeam} value={oppScore} par={hole.par || 3} live={liveOpp} holeNumber={hole.hole_number}/>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            <ScoreWheel label={yourTeamLabel || 'Your score'} labelPlayers={yourTeam} value={yourScore} par={hole.par || 3}
              onChange={(n) => { onYourScore(n); onLiveScore && onLiveScore(n, true); }}/>
            <div style={{ height: 12 }}/>
            <OppReadout label={theirTeamLabel || 'Opponent'} labelPlayers={theirTeam} value={oppScore} par={hole.par || 3} live={liveOpp} holeNumber={hole.hole_number}/>
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

// ─── 2v2 per-hole capture: whose ball + who holed + optional zone ──────
const GREEN_ZONES = ['Long L', 'Long', 'Long R', 'Left', 'Pin high', 'Right', 'Short L', 'Short', 'Short R'];

// Quick Score callout: the bonus-points reward now drives players to
// "+ Track Stats" (where the detailed shot/ball/putt capture lives).
function TeamCapture({ onTrackStats }) {
  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={onTrackStats} style={{
        width: '100%', textAlign: 'left',
        background: 'rgba(212,165,116,0.25)',
        border: '1px solid var(--clay)', borderRadius: 12, padding: '12px 14px',
        color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <img src="assets/monogram-forest.svg" alt="" style={{ height: 26, width: 'auto', display: 'block', flexShrink: 0 }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--clay)' }}>Bonus Sandbox Points</div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>Track your stats to earn bonus Sandbox points</div>
        </div>
        <span style={{ fontSize: 16, opacity: 0.7 }}>→</span>
      </button>
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
// Fairway direction glyph: one straight arrow rotated per direction.
function FairwayArrow({ dir }) {
  const rot = { up: 0, right: 90, down: 180, left: -90 }[dir] || 0;
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', transform: rot ? `rotate(${rot}deg)` : 'none' }}>
      <path d="M12 19 V6"/>
      <path d="M7 11 L12 6 L17 11"/>
    </svg>
  );
}

function FairwayCross({ value, onPick }) {
  const Btn = ({ v, area, dir }) => {
    const on = value === v;
    const hit = v === 'hit';
    return (
      <button onClick={() => onPick(on ? null : v)} style={{
        gridArea: area, width: 38, height: 38, borderRadius: 999, margin: '0 auto',
        background: on ? (hit ? '#4F9D5B' : 'var(--cream)') : 'rgba(255,255,255,0.08)',
        color: on ? (hit ? '#fff' : 'var(--forest)') : 'var(--cream)',
        border: on ? 'none' : '1px solid rgba(234,226,206,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {hit ? <StrokeIcon kind="check" size={22}/> : <FairwayArrow dir={dir}/>}
      </button>
    );
  };
  const FW_LABEL = { long: 'Past the fairway', short: 'Short of the fairway', left: 'To the left', right: 'To the right', hit: 'On the fairway' };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 38px)', gridTemplateRows: 'repeat(3, 38px)', gap: 9,
        gridTemplateAreas: '". long ." "left hit right" ". short ."', width: 'max-content', margin: '0 auto' }}>
        <Btn v="long"  area="long"  dir="up"/>
        <Btn v="left"  area="left"  dir="left"/>
        <Btn v="hit"   area="hit"/>
        <Btn v="right" area="right" dir="right"/>
        <Btn v="short" area="short" dir="down"/>
      </div>
      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, fontWeight: 700,
        color: value === 'hit' ? '#8FE0A0' : 'var(--cream)', opacity: value ? 0.95 : 0.45 }}>
        {value ? FW_LABEL[value] : 'Where did it land?'}
      </div>
    </div>
  );
}

// ─── Guided shot-by-shot flow (2v2 scramble) — two-card, per player ───
// Each stroke both teammates log their own shot on their own card (@handle),
// the caddie compares the two balls, you pick which to play, repeat until
// holed. The team score emerges from the stroke count.
function ShotFlow({ yourTeam, par, isRegular, isMember, savedScore, draft, meId, yourTeamLabel, onLiveScore, onSaveDraft, onSavePlayerStat, onComplete }) {
  const [p1, p2] = yourTeam;
  // Seed from the shared draft (a teammate may have already started this hole).
  const init = (draft && typeof draft === 'object') ? draft : {};
  const [stroke, setStroke] = React.useState(init.stroke || 0);     // 0-based stroke (0 = tee)
  const [card, setCard]     = React.useState(init.card || {});      // { pid: { fairway, reached, ob, zone } }
  // 'cards' | 'putt' | 'done'. A finalized hole opens straight to the summary.
  const [phase, setPhase]   = React.useState(init.phase || (savedScore != null ? 'done' : 'cards'));
  const [putts, setPutts]   = React.useState(init.putts || 0);      // completed missed putt rounds
  const [puttCard, setPuttCard] = React.useState(init.puttCard || {}); // this round: { pid: 'made'|'missed' }
  const [chosen, setChosen] = React.useState(init.chosen || null);  // { ball, zone, strokesToGreen }
  const [doneScore, setDoneScore] = React.useState(null); // shown instantly on finish, before DB echoes back
  const [history, setHistory] = React.useState(init.history || []); // prior states for one-step "Go Back"
  // Whose ball the team took on each shot, in order. Powers PURE individual GIR:
  // you only get a green-in-reg if YOUR ball was the one played on every shot up
  // to the green — otherwise a scramble blends your tee with a partner's approach.
  const [picks, setPicks] = React.useState(init.picks || []);
  // Full stroke-by-stroke record — every player's outcome on every shot, whose
  // ball the team took (+ caddie suggestion), and each putt round's made/missed.
  // Persisted to match_holes.shot_log when the hole finishes; nothing captured
  // during play is thrown away.
  const [log, setLog] = React.useState(init.log || []);

  // ── Shared-state sync bookkeeping ──
  // lastRev: the rev of the draft we last wrote or adopted (ignore its echo).
  // skipWrite: set when we adopt a teammate's draft (or seed) so we don't
  // immediately echo it straight back to the DB.
  const lastRev   = React.useRef(init.rev || null);
  const skipWrite = React.useRef(true); // skip the initial seed write

  // Running strokes so far: full swings to the green, plus putt rounds.
  const count = (phase === 'putt' && chosen) ? chosen.strokesToGreen + putts : stroke;

  // Stream our running stroke count to the other team's scoreboard.
  React.useEffect(() => {
    if (onLiveScore) onLiveScore(count, phase === 'done');
  }, [count, phase]);

  // Adopt a teammate's newer draft (their write, not ours, not one we've seen).
  React.useEffect(() => {
    if (!draft || typeof draft !== 'object') return;
    if (draft.by === meId || draft.rev === lastRev.current) return;
    lastRev.current = draft.rev;
    skipWrite.current = true;
    setStroke(draft.stroke || 0);
    setCard(draft.card || {});
    setPhase(draft.phase || 'cards');
    setPutts(draft.putts || 0);
    setPuttCard(draft.puttCard || {});
    setChosen(draft.chosen || null);
    setHistory(draft.history || []);
    setPicks(draft.picks || []);
    setLog(draft.log || []);
    setDoneScore(null);
  }, [draft, meId]);

  // When this side's score lands (either teammate finalized), both jump to done.
  React.useEffect(() => {
    if (savedScore != null && phase !== 'done') { skipWrite.current = true; setPhase('done'); }
  }, [savedScore]);

  // Push every local change to the shared draft so the other teammate mirrors
  // it; clear the draft once the hole finalizes.
  React.useEffect(() => {
    if (!onSaveDraft) return;
    if (skipWrite.current) { skipWrite.current = false; return; }
    if (phase === 'done') { onSaveDraft(null); return; }
    const rev = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    lastRev.current = rev;
    onSaveDraft({ stroke, card, phase, putts, puttCard, chosen, history, picks, log, rev, by: meId });
  }, [stroke, card, phase, putts, puttCard, chosen, history, picks, log]);

  // Snapshot the current state before any forward move so "Go Back" undoes
  // exactly one shot / putt-round (not the whole hole).
  const pushHistory = () => setHistory(h => [...h, { stroke, card, phase, putts, puttCard, chosen, picks, log }]);
  const goBack = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setStroke(prev.stroke); setCard(prev.card); setPhase(prev.phase);
    setPutts(prev.putts); setPuttCard(prev.puttCard); setChosen(prev.chosen);
    setPicks(prev.picks || []);
    setLog(prev.log || []);
    setDoneScore(null); setHistory(history.slice(0, -1));
  };

  function reset() {
    setStroke(0); setCard({}); setPhase('cards'); setPutts(0); setPuttCard({}); setChosen(null); setDoneScore(null); setHistory([]); setPicks([]); setLog([]);
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
  const setOutcome = (pid, patch) => setCard(c => ({ ...c, [pid]: { ...(c[pid] || {}), ...patch } }));
  const cardDone = (pid) => {
    const c = card[pid]; if (!c) return false;
    if (c.ob) return true;                               // OB / penalty marked
    if (c.reached === 'holed') return true;              // holed out (incl. a drivable par-4 ace)
    if (fairwayTee) return !!c.fairway;                  // drive: a fairway result
    return c.reached != null;                            // approach: off / on / holed out
  };
  const allDone = yourTeam.every(p => cardDone(p.id));
  const suggestion = (isMember && p2 && card[p1.id] && card[p2.id] && card[p1.id].zone && card[p2.id].zone)
    ? suggestBall(yourTeam, { [p1.id]: card[p1.id].zone, [p2.id]: card[p2.id].zone }) : null;

  // Finish the hole immediately (used by a hole-out from off the green).
  function finishHole(score, holedBy, zone, logArg) {
    setDoneScore(score); setPhase('done');
    onComplete({ score, putts: 0, gir: false, zone, ballPlayer: holedBy, holedBy, shotLog: logArg || log });
  }

  function pickBall(pid) {
    pushHistory();
    // Append this stroke to the permanent shot log: every player's outcome,
    // whose ball the team took, and (when shown) which ball the caddie suggested.
    const outcomes = {};
    yourTeam.forEach(p => {
      const co = card[p.id];
      if (co) outcomes[p.id] = { fairway: co.fairway || null, reached: co.reached != null ? co.reached : null, ob: !!co.ob, zone: co.zone || null };
    });
    const logEvent = { shot: stroke + 1, phase: 'shot', outcomes, picked: pid };
    if (suggestion && suggestion.pick && suggestion.pick !== 'tie') logEvent.suggested = suggestion.pick;
    const nextLog = [...log, logEvent];
    setLog(nextLog);
    yourTeam.forEach(p => {
      const c = card[p.id] || {}; const patch = {};
      if (c.fairway) patch.fairway = c.fairway;
      // Persist green result + OB per player so rescue stats (Clutch %) can tell
      // "missed the green / went OB" from "untracked". GIR is PURE + in regulation:
      //   • in regulation = reached the green within par − 2 strokes
      //     (par-3 by shot 1, par-4 by shot 2, par-5 by shot 3; stroke is 0-based)
      //   • pure = YOUR ball was the one the team played on every shot up to here,
      //     so a scramble can't credit you a green your partner's shot reached.
      if (c.reached === true || c.reached === 'holed') {
        patch.on_green = true;                              // raw: ball on the green (any shot)
        const inReg = (stroke + 1) <= ((par || 3) - 2);
        const pure  = picks.every(pk => pk === p.id);
        patch.gir = inReg && pure;                          // pure green-in-regulation
        if (c.zone) patch.zone = c.zone;
      } else if (c.reached === false) { patch.on_green = false; patch.gir = false; }
      if (c.ob) patch.ob = true;
      if (Object.keys(patch).length) onSavePlayerStat(p.id, patch);
    });
    setPicks(prev => [...prev, pid]); // record whose ball the team took this shot
    const c = card[pid] || {};
    // OB/penalty: the shot counts AND adds a 1-stroke penalty (skip one),
    // then re-hit — so shot 2 OB makes the next tracked shot #4.
    if (c.ob) { setStroke(stroke + 2); setCard({}); return; }
    // Holed out (from off the green, or a drivable par-4 tee) → hole done now.
    if (c.reached === 'holed') { finishHole(stroke + 1, pid, c.zone, nextLog); return; }
    // On the green → go to putting.
    if (!fairwayTee && c.reached === true) { setChosen({ ball: pid, zone: c.zone, strokesToGreen: stroke + 1 }); setPhase('putt'); return; }
    // Off the green / a drive → next shot.
    setStroke(stroke + 1); setCard({});
  }

  // Putting — both teammates putt the chosen ball each round. The first to
  // hole ends it (their ball is the line, the round is the team's last putt).
  // If both miss, it's another round.
  if (phase === 'putt') {
    const roundNo = putts + 1;
    const strokesToGreen = chosen ? chosen.strokesToGreen : stroke;
    const finish = (holer, logArg) => {
      const score = strokesToGreen + roundNo;
      setDoneScore(score);
      setPhase('done');
      onComplete({
        score, putts: roundNo,
        gir: strokesToGreen <= Math.max(1, (par || 3) - 2),
        zone: chosen && chosen.zone, ballPlayer: chosen && chosen.ball, holedBy: holer,
        shotLog: logArg || log,
      });
    };
    // Selecting ✓/✕ only marks a pending choice — nothing commits until Confirm.
    const setPending = (pid, val) => setPuttCard(prev => ({ ...prev, [pid]: val }));
    const allChosen = yourTeam.every(p => puttCard[p.id]);
    const confirmPutt = () => {
      const holer = yourTeam.find(p => puttCard[p.id] === 'made');
      // Log the putt round (each player's made/missed) whether it ends the hole or not.
      const nextLog = [...log, { shot: strokesToGreen + roundNo, phase: 'putt', round: roundNo, results: { ...puttCard } }];
      if (holer) { setLog(nextLog); finish(holer.id, nextLog); return; }
      pushHistory(); setLog(nextLog); setPutts(putts + 1); setPuttCard({}); // all missed → next putt round
    };
    return (
      <SfWrap count={count} onBack={goBack} canBack={history.length > 0} label={yourTeamLabel} labelPlayers={yourTeam} title={`Shot ${strokesToGreen + roundNo} — Putt made?`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {yourTeam.map(p => (
            <PuttCard key={p.id} player={p} result={puttCard[p.id]}
              onMade={() => setPending(p.id, 'made')} onMissed={() => setPending(p.id, 'missed')}/>
          ))}
        </div>
        <button onClick={confirmPutt} disabled={!allChosen} style={{
          marginTop: 12, width: '100%', padding: '12px', borderRadius: 12, border: 'none',
          background: allChosen ? 'var(--cream)' : 'rgba(234,226,206,0.22)',
          color: allChosen ? 'var(--forest)' : 'var(--cream)', fontWeight: 800, fontSize: 13,
          cursor: allChosen ? 'pointer' : 'default', opacity: allChosen ? 1 : 0.55,
        }}>Confirm →</button>
      </SfWrap>
    );
  }

  // Cards phase — both teammates log this stroke
  return (
    <SfWrap count={count} onBack={goBack} canBack={history.length > 0} label={yourTeamLabel} labelPlayers={yourTeam}
      title={`Shot ${stroke + 1} — ${fairwayTee ? 'Fairway hit?' : 'Reached the green?'}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {yourTeam.map(p => (
          <PlayerShotCard key={p.id} player={p} data={card[p.id] || {}}
            showFairway={fairwayTee} showGreen={!fairwayTee}
            showHoledOut={!fairwayTee || (par || 3) === 4}
            onFairway={(v) => setOutcome(p.id, { fairway: v, ob: false })}
            onReached={(v) => setOutcome(p.id, { reached: v, ob: false })}
            onOb={() => setOutcome(p.id, { ob: true, reached: null, fairway: null })}/>
        ))}
      </div>

      {suggestion && (
        <div style={{ marginTop: 10, background: 'rgba(212,165,116,0.16)', border: '1px solid var(--clay)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clay)', fontWeight: 800, marginBottom: 4 }}>🤖 Caddie</div>
          <div style={{ fontSize: 12, lineHeight: 1.4 }}>{suggestion.line}</div>
        </div>
      )}

      {allDone && (yourTeam.length > 1 ? (
        <div style={{ marginTop: 12 }}>
          {/* 2v2 only — pick which teammate's ball the scramble plays. */}
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700, marginBottom: 6 }}>Whose ball did the team take?</div>
          <SfPick options={yourTeam} onPick={pickBall}/>
        </div>
      ) : (
        <button onClick={() => pickBall(p1.id)} style={{
          marginTop: 12, width: '100%', padding: '12px', borderRadius: 12,
          background: 'var(--cream)', color: 'var(--forest)', border: 'none', fontWeight: 800, fontSize: 13,
        }}>Continue →</button>
      ))}
    </SfWrap>
  );
}

function SfWrap({ title, count, label, labelPlayers, onBack, canBack, children }) {
  return (
    <div>
      {/* Your team's running score — mirrors the opponent scoreboard */}
      <YouReadout label={label} labelPlayers={labelPlayers} count={count}/>
      <div style={{ height: 12 }}/>
      <div style={{ padding: 14, borderRadius: 14, background: 'rgba(14,28,19,0.25)' }}>
        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, marginBottom: 10 }}>{title}</div>
        {children}
        {canBack && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--cream)', opacity: 0.7, fontSize: 11, fontWeight: 700 }}>← Go Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Your team's live strokes — same card language as the opponent readout, with
// a cream accent so "you" reads distinct from "them".
function YouReadout({ label, labelPlayers, count }) {
  const n = count || 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <TeamLabel players={labelPlayers} fallback={label || 'Your team'}/>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55, fontWeight: 700 }}>{n === 0 ? 'Tee it up' : 'Playing this hole…'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'rgba(234,226,206,0.12)', border: '1px solid rgba(234,226,206,0.35)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.9, minWidth: 40, textAlign: 'center', opacity: n === 0 ? 0.5 : 1 }}>
          {n === 0 ? '–' : n}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, opacity: 0.7, lineHeight: 1.3 }}>
          strokes so far
        </div>
      </div>
    </div>
  );
}

function SfPick({ options, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onPick(o.id)} style={{
          flex: 1, padding: '12px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(234,226,206,0.2)', color: 'var(--cream)', fontWeight: 700, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, overflow: 'hidden',
        }}>
          <Avatar player={o} size={22}/>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</span>
        </button>
      ))}
    </div>
  );
}

// Circular avatar (falls back to the player's initial).
function Avatar({ player, size = 24 }) {
  const initial = (player.name || player.handle || '?').replace(/^@/, '').charAt(0).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: 999, overflow: 'hidden', flexShrink: 0,
      background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.46), fontWeight: 800, fontFamily: 'var(--font-display)' }}>
      {player.avatar
        ? <img src={player.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        : initial}
    </div>
  );
}

// Team header label with each player's avatar 9px before their name.
function TeamLabel({ players, fallback }) {
  if (!players || !players.length) {
    return <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>{fallback}</span>;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
      {players.map((p, i) => (
        <React.Fragment key={p.id}>
          {i > 0 && <span style={{ opacity: 0.45 }}>+</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <Avatar player={p} size={18}/>
            <span style={{ opacity: 0.7 }}>{p.name}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// Player name row with avatar to the left.
function PlayerTag({ player }) {
  const handle = player.handle ? (player.handle.startsWith('@') ? player.handle : '@' + player.handle) : '';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
      <Avatar player={player} size={24}/>
      <div style={{ fontSize: 13, fontWeight: 800 }}>
        {player.name} <span style={{ opacity: 0.6, fontWeight: 600 }}>{handle}</span>
      </div>
    </div>
  );
}

// Per-player putt card (@handle) — each teammate logs their own putt.
function PuttCard({ player, result, onMade, onMissed }) {
  return (
    <div style={{ padding: '9px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(234,226,206,0.16)' }}>
      <PlayerTag player={player}/>
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
// When selected: ✓ turns green, ✕ turns red.
function XoButton({ kind, active, onClick }) {
  const isCheck = kind === 'check';
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '12px 8px', borderRadius: 10,
      background: active ? (isCheck ? '#4F9D5B' : 'var(--cream)') : 'rgba(255,255,255,0.08)',
      color: active ? (isCheck ? '#fff' : 'var(--forest)') : 'var(--cream)',
      border: active ? 'none' : '1px solid rgba(234,226,206,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <StrokeIcon kind={isCheck ? 'check' : 'x'} size={24}/>
    </button>
  );
}

// Per-player card (@handle). A tee drive shows the fairway cross; an approach
// shows off/on green. Holed Out shows on any shot that can plausibly find the
// cup (par-3/4 tees + every approach — but never a par-5 tee). Penalty / OB
// is always available.
function PlayerShotCard({ player, data, showFairway, showGreen, showHoledOut, onFairway, onReached, onOb }) {
  return (
    <div style={{ padding: '9px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(234,226,206,0.16)' }}>
      <PlayerTag player={player}/>

      {showFairway && (
        <FairwayCross value={data.fairway} onPick={onFairway}/>
      )}

      {showGreen && (
        <div style={{ display: 'flex', gap: 6 }}>
          <XoButton kind="x"     active={data.reached === false} onClick={() => onReached(false)}/>
          <XoButton kind="check" active={data.reached === true}  onClick={() => onReached(true)}/>
        </div>
      )}

      {/* Holed Out (par-3/4 tees + approaches) + Penalty / OB (always) */}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {showHoledOut && (
          <button onClick={() => onReached('holed')} style={{ ...pillStyle(data.reached === 'holed'), fontSize: 11 }}>Holed Out</button>
        )}
        <button onClick={onOb} style={{ ...pillStyle(!!data.ob), fontSize: 11 }}>Penalty / OB</button>
      </div>
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

function ScoreWheel({ label, labelPlayers, value, par, onChange }) {
  const p = par || 3;
  const nums = Array.from({ length: p + 5 }, (_, i) => i + 1); // 1 … par+5
  const sel = value;
  const shape = parShape(sel, p);
  const isCircle = shape === 'birdie' || shape === 'eagle';
  const isDouble = shape === 'eagle' || shape === 'double';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TeamLabel players={labelPlayers} fallback={label}/>
        {sel != null
          ? (shape && shape !== 'par' && <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>{SHAPE_LABEL[shape]}</span>)
          : <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.55, fontWeight: 700 }}>How many strokes?</span>}
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
function OppReadout({ label, labelPlayers, value, par, live, holeNumber }) {
  const p = par || 3;
  const shape = parShape(value, p);
  // A live running count for THIS hole, only while no final score is in yet.
  const liveOn = value == null && live && live.holeNumber === holeNumber && !live.done && live.strokes > 0;
  const big = value != null ? value : (liveOn ? live.strokes : '–');
  const sub = value != null ? `logged by ${label || 'their team'}`
            : liveOn ? `Currently playing Shot ${live.strokes + 1}`
            : 'Waiting for their score…';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <TeamLabel players={labelPlayers} fallback={label}/>
        {value != null ? (
          shape && shape !== 'par'
            ? <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>{SHAPE_LABEL[shape]}</span>
            : <span/>
        ) : (
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: liveOn ? '#7BD389' : 'inherit', opacity: liveOn ? 1 : 0.55 }}>
            Strokes so far
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, background: 'rgba(14,28,19,0.3)', border: liveOn ? '1px solid rgba(123,211,137,0.4)' : '1px solid rgba(234,226,206,0.14)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {liveOn && <span style={{ width: 8, height: 8, borderRadius: 999, background: '#7BD389', flexShrink: 0 }}/>}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.9, textAlign: 'center', opacity: (value == null && !liveOn) ? 0.4 : 1 }}>
            {big}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, opacity: 0.6, lineHeight: 1.3 }}>{sub}</div>
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
    return <div style={{ width: 18, height: 18, borderRadius: 999, background: 'transparent', border: '1.5px solid currentColor', color: 'currentColor', fontSize: 10, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>H</div>;
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
  const is2v2     = match.match_type === '2v2';
  const sideWord  = is2v2 ? 'teams' : 'players';
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
            <div className="caption-serif" style={{ fontSize: 13, opacity: 0.7, marginTop: 4, marginBottom: 12, textAlign: 'center', lineHeight: 1.5 }}>
              Both {sideWord} confirm before it counts toward SBX.
              {theyConfirmed && <><br/>{theirTeamLabel} already confirmed.</>}
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

// ─── Shareable 3D result card ────────────────────────────────
// Plain-English wording for a match-play margin ("2&1" → "2 up with 1 to play").
function plainMargin(margin) {
  if (!margin) return '';
  const m = String(margin).trim();
  const amp = m.match(/^(\d+)\s*&\s*(\d+)$/);
  if (amp) return `${amp[1]} up with ${amp[2]} to play`;
  const up = m.match(/^(\d+)\s*up$/i);
  if (up) return `${up[1]} up on the last`;
  if (/^as$/i.test(m) || /halv/i.test(m)) return 'all square';
  return m;
}

function shareCaption({ youWon, halved, margin }) {
  const line = halved ? 'We halved our Sandbox match.'
    : youWon ? `Won my Sandbox match ${margin || ''}!`.trim()
    : `Lost a close one ${margin || ''} in my Sandbox match.`.trim();
  return `${line} ⛳ https://sbx.golf`;
}

async function shareResult(args) {
  const text = shareCaption(args || {});
  const url = 'https://sbx.golf';
  try {
    if (navigator.share) { await navigator.share({ title: 'Sandbox', text, url }); return; }
    if (navigator.clipboard) { await navigator.clipboard.writeText(`${text} ${url}`); alert('Result copied — paste it anywhere to share.'); }
  } catch (_) { /* user dismissed the share sheet */ }
}

// Capture the result card DOM node as a PNG and share it as an image (falls back
// to a text share, then to a download, so it always does *something*).
// html-to-image can't reliably inline cross-origin images (the Supabase
// avatar URLs) during capture, so they come out blank. Fetch every <img>
// ourselves, swap in a data: URL, capture, then restore the originals.
async function inlineImages(node) {
  const imgs = Array.from(node.querySelectorAll('img'));
  const restore = [];
  await Promise.all(imgs.map(async (img) => {
    const src = img.getAttribute('src') || '';
    if (!src || src.indexOf('data:') === 0) return;
    try {
      const res = await fetch(src, { mode: 'cors', cache: 'force-cache' });
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
      restore.push([img, src]);
      img.setAttribute('src', dataUrl);
      await new Promise((resolve) => {
        if (img.complete && img.naturalWidth) return resolve();
        img.onload = img.onerror = () => resolve();
      });
    } catch (_) { /* leave the original src; better a fallback than a crash */ }
  }));
  return () => restore.forEach(([img, src]) => img.setAttribute('src', src));
}

async function shareCardImage(node, args) {
  const H = window.htmlToImage;
  if (!node || !H || !H.toBlob) { return shareResult(args); }
  let restore = () => {};
  try {
    restore = await inlineImages(node);
    // No backgroundColor → the PNG keeps a transparent alpha channel, so the
    // card's rounded corners (and around the circular avatars) cut out clean.
    const blob = await H.toBlob(node, { pixelRatio: 2.5 });
    restore(); restore = () => {};
    if (!blob) return shareResult(args);
    const file = new File([blob], 'sandbox-result.png', { type: 'image/png' });
    const caption = shareCaption(args || {});
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Sandbox', text: caption });
      return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sandbox-result.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  } catch (_) { shareResult(args); }
  finally { restore(); }
}

// Reusable flippable 3D card. Tilts toward the pointer/finger (glare follows);
// tap to flip → the back is just the Sandbox wordmark. Takes already-computed
// display pieces so it works on the live match-over screen AND profile history.
//   cells: [{ n, lab }] where lab ∈ 'W' | 'L' | 'H' | ''
const ShareResultCard = React.forwardRef(function ShareResultCard({ headline, summary, subline, cells, totalHoles, matchup, dateLine, plain }, captureRef) {
  const tiltRef = React.useRef(null);
  const frontRef = React.useRef(null);
  const avEl = (p, i) => {
    const initial = ((p.name || '?').replace(/^@/, '')[0] || '?').toUpperCase();
    return (
      <div key={i} style={{ width: 28, height: 28, borderRadius: 999, marginLeft: i ? -9 : 0, overflow: 'hidden',
        background: 'var(--cream)', color: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 13, boxShadow: '0 0 0 2px rgba(14,28,19,0.4)' }}>
        {p.avatar ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initial}
      </div>
    );
  };
  const hasMatchup = matchup && ((matchup.yours && matchup.yours.length) || (matchup.theirs && matchup.theirs.length));
  const flipping = React.useRef(false);
  const start = React.useRef({ x: 0, y: 0, down: false });
  const [face, setFace] = React.useState('front');
  const [cardH, setCardH] = React.useState(null); // lock both faces to the front's height
  const [flip, setFlip] = React.useState({ transform: 'rotateX(0deg) rotateY(0deg)', transition: 'transform 0.3s ease' });
  const cols = Math.min(totalHoles || (cells ? cells.length : 9) || 9, 9);
  const TILT = 18; // degrees at the card edge — noticeably 3D

  React.useLayoutEffect(() => {
    if (face === 'front' && frontRef.current) setCardH(frontRef.current.offsetHeight);
  }, [face, cells, headline, summary, subline]);

  function onDown(e) {
    start.current = { x: e.clientX, y: e.clientY, t: (performance.now ? performance.now() : Date.now()), down: true };
    const el = tiltRef.current; if (el) el.style.transition = 'none';
  }
  function onMove(e) {
    const el = tiltRef.current; if (!el || !start.current.down) return;
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    el.style.setProperty('--tx', `${((cy - rect.height / 2) / (rect.height / 2)) * -TILT}deg`);
    el.style.setProperty('--ty', `${((cx - rect.width / 2) / (rect.width / 2)) * TILT}deg`);
    el.style.setProperty('--mx', `${cx}px`);
    el.style.setProperty('--my', `${cy}px`);
  }
  function springBack() {
    const el = tiltRef.current; if (!el) return;
    el.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1)';
    el.style.setProperty('--tx', '0deg'); el.style.setProperty('--ty', '0deg');
  }
  function onUp(e) {
    if (!start.current.down) return;
    start.current.down = false;
    const dx = e.clientX - start.current.x, dy = e.clientY - start.current.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    const dist = Math.max(adx, ady);
    const dt = (performance.now ? performance.now() : Date.now()) - start.current.t;
    const v = dist / Math.max(dt, 1); // px per ms
    springBack();
    // Only a deliberate flick flips: clearly one direction AND either a fast
    // swipe or a long deliberate drag. Slow tilting-around never flips.
    const dominant = dist > Math.min(adx, ady) * 1.7;
    const flick = (dist > 80 && v > 0.7) || dist > 190;
    if (dominant && flick) {
      const dir = adx > ady ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      doFlip(dir);
    }
  }
  function onLeave() { if (start.current.down) { start.current.down = false; springBack(); } }

  // Swipe flips the card 180° in the swiped direction and lands the new side
  // upright (swap content while edge-on at the midpoint).
  function doFlip(dir) {
    if (flipping.current) return;
    flipping.current = true;
    const DUR = 230;
    const half  = { right: 'rotateY(90deg)',  left: 'rotateY(-90deg)',  up: 'rotateX(90deg)',  down: 'rotateX(-90deg)' }[dir];
    const enter = { right: 'rotateY(-90deg)', left: 'rotateY(90deg)',   up: 'rotateX(-90deg)', down: 'rotateX(90deg)' }[dir];
    setFlip({ transition: `transform ${DUR}ms ease-in`, transform: half });
    setTimeout(() => {
      setFace(f => (f === 'front' ? 'back' : 'front'));
      setFlip({ transition: 'none', transform: enter });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setFlip({ transition: `transform ${DUR}ms ease-out`, transform: 'rotateX(0deg) rotateY(0deg)' });
        setTimeout(() => { flipping.current = false; }, DUR);
      }));
    }, DUR);
  }

  const faceVisual = {
    borderRadius: 'var(--radius-card-lg)', overflow: 'hidden', boxSizing: 'border-box',
    background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
    color: 'var(--cream)', boxShadow: '0 26px 54px rgba(14,28,19,0.45)',
  };

  return (
    <div style={{ perspective: 680, marginBottom: 4 }}>
      <div ref={tiltRef}
        onPointerDown={plain ? undefined : onDown} onPointerMove={plain ? undefined : onMove}
        onPointerUp={plain ? undefined : onUp} onPointerLeave={plain ? undefined : onLeave}
        style={{ transformStyle: 'preserve-3d', transition: 'transform 0.06s ease-out',
          touchAction: plain ? 'auto' : 'none', cursor: plain ? 'default' : 'grab',
          transform: 'rotateX(var(--tx,0deg)) rotateY(var(--ty,0deg))' }}>
        <div ref={captureRef} style={{ position: 'relative', transformStyle: 'preserve-3d', ...flip }}>
          {face === 'front' ? (
            <div ref={frontRef} style={{ ...faceVisual, position: 'relative', padding: '22px 22px 18px' }}>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(300px circle at var(--mx,50%) var(--my,0%), rgba(234,226,206,0.22), transparent 60%)' }}/>
              <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span className="eyebrow" style={{ color: 'var(--cream)', opacity: 0.7 }}>Match result</span>
                  {hasMatchup ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ display: 'flex' }}>{(matchup.yours || []).map(avEl)}</div>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.7, fontWeight: 700 }}>vs</span>
                      <div style={{ display: 'flex' }}>{(matchup.theirs || []).map(avEl)}</div>
                    </div>
                  ) : (
                    <img src="assets/monogram-cream.svg" alt="" style={{ height: 26, opacity: 0.9 }}/>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, marginTop: 12, letterSpacing: '-0.02em' }}>{headline}</div>
                <div style={{ fontSize: 14, opacity: 0.88, marginTop: 8 }}>{summary}</div>
                {subline && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{subline}</div>}
                {dateLine && <div style={{ fontSize: 10, opacity: 0.55, marginTop: 5, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}><Icon.Clock size={11}/> {dateLine}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 5, marginTop: 16 }}>
                  {(cells || []).map(c => {
                    const won = c.lab === 'W', halv = c.lab === 'H';
                    return (
                      <div key={c.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 8, fontFamily: 'var(--font-mono)', opacity: 0.5 }}>H{c.n}</div>
                        <div style={{
                          width: 22, height: 22, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontSize: 12,
                          background: won ? 'var(--cream)' : halv ? 'transparent' : (c.lab ? 'rgba(234,226,206,0.16)' : 'transparent'),
                          color: won ? 'var(--forest)' : 'var(--cream)',
                          border: (halv || !c.lab) ? '1.5px solid rgba(234,226,206,0.4)' : 'none',
                          opacity: c.lab ? 1 : 0.4,
                        }}>{c.lab}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                  <img src="assets/wordmark-cream.svg" alt="Sandbox" style={{ height: 15, opacity: 0.85 }}/>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{plain ? 'Tap to open' : 'Swipe to flip ⇄'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...faceVisual, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: cardH || 300, padding: 20 }}>
              <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
              <img src="assets/wordmark-cream.svg" alt="Sandbox" style={{ width: '75%', position: 'relative' }}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Match-live wrapper: compute the display pieces from live match state.
function ResultCard({ match, state, youAreA, is2v2, yourTeamLabel, theirTeamLabel, holes, cardRef, yourTeam, theirTeam }) {
  const youWon = (state.up > 0 && youAreA) || (state.up < 0 && !youAreA);
  const halved = state.up === 0;
  const margin = match.final_margin || state.margin || '';
  const plain = plainMargin(margin);
  const headline = halved ? 'Halved' : youWon ? `W ${margin}` : `L ${margin}`;
  const summary = halved ? 'All square — matched hole for hole.'
    : youWon ? `Beat ${theirTeamLabel} · ${plain}`
    : `${theirTeamLabel} took it · ${plain}`;
  const subline = `${is2v2 ? `${yourTeamLabel} vs ${theirTeamLabel}` : `You vs ${theirTeamLabel}`} · ${match.course_name || 'Sandbox'}`;
  const cells = holes.map(h => ({ n: h.hole_number, lab: h.result == null ? '' : resultLabel(h.result, youAreA) }));
  const matchup = {
    yours: (yourTeam || []).map(p => ({ name: p.name, avatar: p.avatar })),
    theirs: (theirTeam || []).map(p => ({ name: p.name, avatar: p.avatar })),
  };
  return <ShareResultCard ref={cardRef} headline={headline} summary={summary} subline={subline} cells={cells} totalHoles={match.total_holes} matchup={matchup}/>;
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

// Save (or clear) a side's in-progress hole so both teammates share it live.
// `draft` is the ShotFlow scratchpad, or null to wipe it on finalize.
async function saveDraft(matchId, holeNumber, who, draft) {
  const col = who === 'a' ? 'draft_a' : 'draft_b';
  await sbx.from('match_holes').update({ [col]: draft }).eq('match_id', matchId).eq('hole_number', holeNumber);
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

Object.assign(window, { MatchLive, ShareResultCard, shareResult, shareCardImage, plainMargin });
