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
        match_type, player_a, player_a2, player_b, player_b2,
        total_holes, created_at, started_at, completed_at,
        player_a_profile:profiles!matches_player_a_fkey(first_name, handle),
        player_b_profile:profiles!matches_player_b_fkey(first_name, handle)
      `)
      .or(`player_a.eq.${profileId},player_a2.eq.${profileId},player_b.eq.${profileId},player_b2.eq.${profileId}`)
      .order('created_at', { ascending: false });

    const list = (matches || []).filter(m => m.status !== 'abandoned');
    let W = 0, L = 0, H = 0;
    for (const m of list) {
      if (m.status !== 'completed') continue;
      const userIsA = m.player_a === profileId || m.player_a2 === profileId;
      if (m.result === 'H') H++;
      else if ((m.result === 'A' && userIsA) || (m.result === 'B' && !userIsA)) W++;
      else L++;
    }

    // Streak = consecutive completed matches (most recent first) without a loss.
    let streak = 0;
    for (const m of list) {
      if (m.status !== 'completed') continue;
      const userIsA = m.player_a === profileId || m.player_a2 === profileId;
      const userLost = (m.result === 'A' && !userIsA) || (m.result === 'B' && userIsA);
      if (userLost) break;
      streak++;
    }

    // Pull hole-level data for all the user's matches and derive advanced stats.
    // Only 1v1 matches have per-player GIR/putts/proximity columns populated; in
    // 2v2 those are team-level and we skip them for now.
    const matchIds = list.map(m => m.id);
    let gir = null, putts = null, proximity = null, girTrend = [];
    let holeCount = 0;
    if (matchIds.length > 0) {
      const { data: holes } = await sbx.from('match_holes').select('*').in('match_id', matchIds);
      const matchById = Object.fromEntries(list.map(m => [m.id, m]));
      let girNum = 0, girDen = 0;
      let puttsSum = 0, puttsCount = 0;
      let proxSum = 0, proxCount = 0;
      for (const h of holes || []) {
        const m = matchById[h.match_id];
        if (!m || m.match_type === '2v2') continue;
        const userIsA = m.player_a === profileId;
        const girV   = userIsA ? h.player_a_gir           : h.player_b_gir;
        const puttsV = userIsA ? h.player_a_putts         : h.player_b_putts;
        const proxV  = userIsA ? h.player_a_proximity_ft  : h.player_b_proximity_ft;
        if (girV !== null && girV !== undefined) { girDen++; if (girV) girNum++; }
        if (puttsV != null) { puttsSum += puttsV; puttsCount++; }
        if (proxV  != null) { proxSum  += proxV;  proxCount++; }
        holeCount++;
      }
      if (girDen > 0) gir = girNum / girDen;
      if (puttsCount > 0) putts = puttsSum / puttsCount;
      if (proxCount > 0)  proximity = proxSum / proxCount;

      // GIR trend: per-match GIR % over the last up-to-8 completed matches (reverse chron).
      const completedIds = list.filter(m => m.status === 'completed' && m.match_type !== '2v2').slice(0, 8).reverse().map(m => m.id);
      for (const id of completedIds) {
        let n = 0, d = 0;
        for (const h of holes || []) {
          if (h.match_id !== id) continue;
          const m = matchById[id];
          const userIsA = m.player_a === profileId;
          const girV = userIsA ? h.player_a_gir : h.player_b_gir;
          if (girV !== null && girV !== undefined) { d++; if (girV) n++; }
        }
        if (d > 0) girTrend.push(+(n / d).toFixed(2));
      }
    }

    setStats({
      matchesW: W,
      matchesL: L,
      matchesH: H,
      matchesTotal: W + L + H,
      streak,
      seasonPoints: W + 0.5 * H,
      recentMatches: list,
      // Advanced (real) — null when the user hasn't logged any stats yet.
      gir, putts, proximity, girTrend,
      holesLogged: holeCount,
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
    // 0 (not null) so `.toLocaleString()` in profile.jsx doesn't blow up
    // for fresh accounts with no global rank yet.
    sbxGlobalRank: 0,
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

    // Advanced per-hole stats, computed from match_holes. Zero when the user
    // hasn't logged any yet (screens show honest zeros instead of Alex's).
    gir:       stats && stats.gir       != null ? stats.gir       : 0,
    girTrend:  stats && stats.girTrend ? stats.girTrend : [],
    putts:     stats && stats.putts     != null ? stats.putts     : 0,
    proximity: stats && stats.proximity != null ? stats.proximity : 0,

    // Scramble-specific metrics we don't track yet — overridden to honest
    // zeros rather than inheriting Alex's mock numbers. Trends default to
    // a single-zero array so sparkline math (`trend.length - 1` divisor,
    // `pts[pts.length - 1]` access) doesn't crash on empty arrays.
    shotUsage: 0, shotUsageTrend: [0], shotUsageRank: '—',
    clutchUsage: 0, leadoffUsage: 0, cleanupUsage: 0,
    proximityByDist: [],
    parOrBetter: 0, bailoutRate: 0, concedeRate: 0,
    holeWinByDist: [],
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
