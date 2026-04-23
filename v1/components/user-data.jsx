/* global React, sbx, MOCK */
// Real-user data layer. Loads the signed-in user's matches, derives stats,
// and globally swaps MOCK.USER + MOCK.ACTIVITY so every v1 screen that still
// reads `MOCK.USER.whatever` now sees the real user. Advanced metrics that
// we don't compute yet (shot usage, GIR, proximity, etc.) fall back to the
// mock defaults so screens don't break — those are still clearly demo data.

// ─── Hook: load matches + compute aggregate stats ─────────
function useUserStats(profileId) {
  const [stats, setStats] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!profileId) { setStats(null); return; }

    // Fetch matches plus both players' display fields via FK joins so we can
    // show the opponent's name/handle in history/activity without per-row lookups.
    const { data: matches } = await sbx
      .from('matches')
      .select(`
        id, join_code, course_name, status, result, final_margin,
        player_a, player_b, total_holes, created_at, started_at, completed_at,
        player_a_profile:profiles!matches_player_a_fkey(first_name, handle),
        player_b_profile:profiles!matches_player_b_fkey(first_name, handle)
      `)
      .or(`player_a.eq.${profileId},player_b.eq.${profileId}`)
      .order('created_at', { ascending: false });

    const list = matches || [];
    let W = 0, L = 0, H = 0;
    for (const m of list) {
      if (m.status !== 'completed') continue;
      const userIsA = m.player_a === profileId;
      if (m.result === 'H') H++;
      else if ((m.result === 'A' && userIsA) || (m.result === 'B' && !userIsA)) W++;
      else L++;
    }

    // Streak = consecutive completed matches (most recent first) without a loss.
    let streak = 0;
    for (const m of list) {
      if (m.status !== 'completed') continue;
      const userIsA = m.player_a === profileId;
      const userLost = (m.result === 'A' && !userIsA) || (m.result === 'B' && userIsA);
      if (userLost) break;
      streak++;
    }

    setStats({
      matchesW: W,
      matchesL: L,
      matchesH: H,
      matchesTotal: W + L + H,
      streak,
      seasonPoints: W + 0.5 * H,
      recentMatches: list,
    });
  }, [profileId]);

  React.useEffect(() => { load(); }, [load]);

  // Keep stats fresh when matches change.
  React.useEffect(() => {
    if (!profileId) return;
    const ch = sbx.channel(`user-matches:${profileId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_holes' }, () => load())
      .subscribe();
    return () => sbx.removeChannel(ch);
  }, [profileId, load]);

  return stats;
}

// ─── Build a MOCK.USER-shaped object from real data ───────
function buildRealUser(profile, stats) {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  return {
    ...MOCK.USER,
    id:            profile.id,
    handle:        profile.handle,
    name:          fullName || profile.handle,
    sbx:           Number(profile.sbx) || 4.0,
    sbxDelta:      0,
    sbxTrend:      [profile.sbx || 4.0],
    sbxPercentile: 50,
    sbxPeak:       Number(profile.sbx) || 4.0,
    sbxGlobalRank: null,
    sbxReliability: Math.min(1, (stats ? stats.matchesTotal : 0) / 10),
    sbxMatchesToProvisional: Math.max(0, 5 - (stats ? stats.matchesTotal : 0)),
    matchesW:     stats ? stats.matchesW : 0,
    matchesL:     stats ? stats.matchesL : 0,
    matchesH:     stats ? stats.matchesH : 0,
    matchesTotal: stats ? stats.matchesTotal : 0,
    streak:       stats ? stats.streak : 0,
    seasonPoints: stats ? stats.seasonPoints : 0,
    eventsPlayed: stats ? stats.matchesTotal : 0,
    // Real users start with zero on these; v1 tracks them by-hole, not yet computed.
    holesWonTotal:    0,
    holesLostTotal:   0,
    holesHalvedTotal: 0,
    guestPassesLeft:  0,
    partnerWith:      null,
    ig:               null,
    joined:       formatJoinedDate(profile.created_at),
    foundingMember: false,
    bio: profile.bio || "New to Sandbox. Sharpening the short game.",
    homeCourse: profile.home_course || 'Melreese',
    // DOB / gender are in the DB but v1 screens don't render them yet.
  };
}

function formatJoinedDate(iso) {
  if (!iso) return 'Recent';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Recent';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ─── Rebuild the activity feed from the user's real matches ─────
// Home shows MOCK.ACTIVITY as a rolling activity feed. With no friends/social
// data model yet, we replace it with the user's own recent match events —
// which is still useful content (and honest: "your" activity).
function buildActivityFromMatches(profile, matches) {
  if (!matches || matches.length === 0) return [];
  return matches.slice(0, 6).map(m => {
    const userIsA = m.player_a === profile.id;
    const opp = userIsA ? m.player_b_profile : m.player_a_profile;
    const oppName = opp ? (opp.first_name || opp.handle) : 'opponent';
    const where   = m.course_name ? ' at ' + m.course_name : '';

    let detail, badge;
    if (m.status === 'waiting') {
      detail = `started a match · waiting (code ${m.join_code})`;
      badge = '⏳';
    } else if (m.status === 'active') {
      detail = `playing ${oppName}${where}`;
      badge = '🏌';
    } else if (m.status === 'completed') {
      const userWon = (m.result === 'A' && userIsA) || (m.result === 'B' && !userIsA);
      const halved  = m.result === 'H';
      if (halved)       { detail = `halved with ${oppName}${where}`;                      badge = '🤝'; }
      else if (userWon) { detail = `beat ${oppName} ${m.final_margin || ''}${where}`;     badge = '🏆'; }
      else              { detail = `lost to ${oppName} ${m.final_margin || ''}${where}`;  badge = ''; }
    } else {
      detail = 'abandoned a match'; badge = '';
    }
    return {
      id: m.id,
      kind: 'match',
      user: profile.handle,
      detail,
      time: formatRelativeTime(m.created_at),
      badge,
    };
  });
}

// Real match history in MOCK.HISTORY-shape so Profile/Stats screens "just work".
// The shape is 2-man-scramble-flavoured (partner field) but for our 1v1 matches
// we leave partner empty; downstream screens render it gracefully.
function buildHistoryFromMatches(profile, matches) {
  if (!matches) return [];
  return matches.slice(0, 12).map(m => {
    const userIsA = m.player_a === profile.id;
    const opp = userIsA ? m.player_b_profile : m.player_a_profile;
    const oppLabel = opp ? (opp.handle || opp.first_name || 'Opponent') : 'Opponent';
    let result;
    if (m.status !== 'completed') result = m.status === 'active' ? 'W' : 'H';
    else if (m.result === 'H') result = 'H';
    else result = ((m.result === 'A' && userIsA) || (m.result === 'B' && !userIsA)) ? 'W' : 'L';

    return {
      id: m.id,
      week: '',
      course: m.course_name || 'Match',
      opp: oppLabel,
      partner: null,
      result,
      margin: m.final_margin || (m.status === 'active' ? 'Live' : m.status === 'waiting' ? 'Waiting' : 'AS'),
      thru: null,
      live: m.status === 'active',
      holesWon: 0,
      holesLost: 0,
    };
  });
}

function formatRelativeTime(iso) {
  if (!iso) return 'recently';
  const t = Date.parse(iso);
  if (!t) return 'recently';
  const delta = (Date.now() - t) / 1000;
  if (delta < 60)     return 'now';
  if (delta < 3600)   return Math.floor(delta / 60)   + 'm';
  if (delta < 86400)  return Math.floor(delta / 3600) + 'h';
  if (delta < 604800) return Math.floor(delta / 86400) + 'd';
  const d = new Date(t);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Combined hook: applies real data globally to window.MOCK ─────
// Every render, writes the current realUser + realActivity into window.MOCK
// so every screen that still reads MOCK.USER / MOCK.ACTIVITY picks them up.
// Returns the stats so callers (App) can trigger a re-render via React state.
function useRealUserSync(profile) {
  const stats = useUserStats(profile && profile.id);
  const [syncedKey, setSyncedKey] = React.useState(0);

  React.useEffect(() => {
    if (!profile) return;
    window.MOCK.USER = buildRealUser(profile, stats);
    window.MOCK.ACTIVITY = buildActivityFromMatches(profile, stats ? stats.recentMatches : []);
    window.MOCK.HISTORY = buildHistoryFromMatches(profile, stats ? stats.recentMatches : []);
    // Bump a state key so the App re-renders (and thus children re-read MOCK).
    setSyncedKey(k => k + 1);
  }, [profile, stats]);

  return { stats, syncedKey };
}

Object.assign(window, {
  useUserStats,
  useRealUserSync,
  buildRealUser,
  buildActivityFromMatches,
  buildHistoryFromMatches,
});
