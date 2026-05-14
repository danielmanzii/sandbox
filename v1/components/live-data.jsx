/* global React, sbx */
// Live-match hooks. Pulls the signed-in user's active match from
// `matches` + `match_holes` and shapes it like MOCK.LIVE.yourMatch
// so the existing LiveInlinePreview / live UI can consume it
// without per-screen refactors.
//
// Returned object shape:
//   {
//     id, courseName, totalHoles,
//     state: number,    //  +N = N UP,  -N = N DN,  0 = AS
//     thru: number,     //  holes played
//     remaining: number,
//     youSide: 'A' | 'B',
//     teamA: { name: string },
//     teamB: { name: string },
//   }
//
// state semantics:
//   For 1v1: state counts (you wins) - (opp wins) across played holes.
//   For 2v2: state counts (your team wins) - (opp team wins).
//   match_holes.result is 'A' | 'B' | 'H' | null. We translate A/B
//   relative to which side the user is on (player_a/player_a2 = 'A',
//   player_b/player_b2 = 'B').

// ─── Compose a side's display name from its (up to 2) handles ────────
function sideName(handles) {
  const cleaned = handles.filter(Boolean);
  if (cleaned.length === 0) return '???';
  if (cleaned.length === 1) return cleaned[0];
  return `${cleaned[0]} + ${cleaned[1]}`;
}

// ─── Hook: signed-in user's currently-active match ───────────────────
// Returns [match, loading]. match is null when there's no active match.
function useActiveMatchForUser(userId) {
  const [match, setMatch]     = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!userId) { setMatch(null); setLoading(false); return; }

    // 1) Find an active match where the user is any of the four players.
    //    `or` syntax: comma-separated eq.<col>.<val> filters.
    const { data: matches } = await sbx
      .from('matches')
      .select('*')
      .eq('status', 'active')
      .or(`player_a.eq.${userId},player_a2.eq.${userId},player_b.eq.${userId},player_b2.eq.${userId}`)
      .order('started_at', { ascending: false, nullsFirst: false })
      .limit(1);

    const m = matches && matches[0];
    if (!m) { setMatch(null); setLoading(false); return; }

    // 2) Resolve player handles for both sides.
    const playerIds = [m.player_a, m.player_a2, m.player_b, m.player_b2].filter(Boolean);
    const { data: profiles } = await sbx
      .from('profiles')
      .select('id, handle, first_name')
      .in('id', playerIds);

    const handleFor = (id) => {
      if (!id) return null;
      const p = (profiles || []).find(x => x.id === id);
      if (!p) return null;
      return p.handle ? `@${String(p.handle).replace(/^@/, '')}` : p.first_name;
    };

    const youSide = (userId === m.player_a || userId === m.player_a2) ? 'A' : 'B';
    const teamA = sideName([handleFor(m.player_a), handleFor(m.player_a2)]);
    const teamB = sideName([handleFor(m.player_b), handleFor(m.player_b2)]);

    // 3) Pull holes to compute state + thru.
    const { data: holes } = await sbx
      .from('match_holes')
      .select('hole_number, result')
      .eq('match_id', m.id);

    const played = (holes || []).filter(h => h.result === 'A' || h.result === 'B' || h.result === 'H');
    const youWins  = played.filter(h => h.result === youSide).length;
    const oppWins  = played.filter(h => h.result === (youSide === 'A' ? 'B' : 'A')).length;
    const state    = youWins - oppWins;
    const thru     = played.length;
    const remaining = Math.max(0, (m.total_holes || 9) - thru);

    setMatch({
      id:         m.id,
      courseName: m.course_name || '',
      totalHoles: m.total_holes || 9,
      state, thru, remaining,
      youSide,
      teamA: { name: teamA },
      teamB: { name: teamB },
    });
    setLoading(false);
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  // Realtime: refresh when this user's matches OR their match_holes change.
  // Unique channel suffix so multiple consumers don't collide.
  const channelName = React.useRef(`live-match-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx
      .channel(channelName)
      // Any change to matches involving this user re-pulls.
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          const r = payload.new || payload.old || {};
          if ([r.player_a, r.player_a2, r.player_b, r.player_b2].includes(userId)) {
            load();
          }
        })
      // Any hole result change might affect our state.
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'match_holes' },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, channelName, load]);

  return [match, loading];
}

// ─── Hook: fetch a completed match's detail + hole results ──────────
// Used by the match history scorecard sheet. Returns [detail, loading].
// detail shape: { id, teamA, teamB, youSide, holes: [{hole_number, result}], final_margin, result, course_name }
function useCompletedMatchDetail(matchId) {
  const [detail, setDetail] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setDetail(null); setLoading(true);
    if (!matchId) { setLoading(false); return; }
    (async () => {
      const { data: m } = await sbx
        .from('matches')
        .select('id, result, final_margin, course_name, total_holes, player_a, player_a2, player_b, player_b2')
        .eq('id', matchId)
        .maybeSingle();
      if (!m || cancelled) { setLoading(false); return; }

      const playerIds = [m.player_a, m.player_a2, m.player_b, m.player_b2].filter(Boolean);
      const [{ data: profiles }, { data: holesData }] = await Promise.all([
        sbx.from('profiles').select('id, handle, first_name').in('id', playerIds),
        sbx.from('match_holes').select('hole_number, result').eq('match_id', matchId).order('hole_number'),
      ]);

      if (cancelled) return;

      const handleFor = (id) => {
        if (!id) return null;
        const p = (profiles || []).find(x => x.id === id);
        if (!p) return null;
        return p.handle ? `@${String(p.handle).replace(/^@/, '')}` : p.first_name;
      };

      const teamA = [handleFor(m.player_a), handleFor(m.player_a2)].filter(Boolean).join(' + ') || 'Team A';
      const teamB = [handleFor(m.player_b), handleFor(m.player_b2)].filter(Boolean).join(' + ') || 'Team B';

      setDetail({
        id:         m.id,
        result:     m.result,
        finalMargin: m.final_margin,
        courseName: m.course_name,
        totalHoles: m.total_holes || 9,
        player_a:   m.player_a,
        teamA, teamB,
        holes: holesData || [],
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [matchId]);

  return [detail, loading];
}

Object.assign(window, { useActiveMatchForUser, useCompletedMatchDetail });
