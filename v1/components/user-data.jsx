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
    // Per-format records: a 2v2 result never counts toward 1v1 and vice-versa
    // (mirrors the rating engine, which solves each format independently).
    const rec2v2 = { W: 0, L: 0, H: 0 }, rec1v1 = { W: 0, L: 0, H: 0 };
    for (const m of list) {
      if (m.status !== 'completed') continue;
      const userIsA = m.player_a === profileId || m.player_a2 === profileId;
      const res = m.result === 'H' ? 'H'
        : ((m.result === 'A' && userIsA) || (m.result === 'B' && !userIsA)) ? 'W' : 'L';
      if (res === 'W') W++; else if (res === 'L') L++; else H++;
      const bucket = m.match_type === '2v2' ? rec2v2 : m.match_type === '1v1' ? rec1v1 : null;
      if (bucket) bucket[res]++;
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
    let gir = null, putts = null, proximity = null, fairway = null, girTrend = [];
    let holeCount = 0;
    // Per-format stat blocks (empty defaults so the UI never sees undefined).
    let fmt2v2 = { W: 0, L: 0, H: 0, total: 0, winRate: null, winStreak: 0, longestStreak: 0, bestWin: null, shotEff: null, finisher: null, clutch: null, bestPartner: null };
    let fmt1v1 = { W: 0, L: 0, H: 0, total: 0, winRate: null, winStreak: 0, longestStreak: 0, bestWin: null, scrambling: null, conversion: null, bounceBack: null, closer: null };
    if (matchIds.length > 0) {
      const { data: holes } = await sbx.from('match_holes').select('*').in('match_id', matchIds);
      const matchById = Object.fromEntries(list.map(m => [m.id, m]));
      let girNum = 0, girDen = 0;
      let puttsSum = 0, puttsCount = 0;
      let proxSum = 0, proxCount = 0;
      let fairNum = 0, fairDen = 0;
      for (const h of holes || []) {
        const m = matchById[h.match_id];
        if (!m || m.match_type === '2v2') continue;
        const userIsA = m.player_a === profileId;
        const girV   = userIsA ? h.player_a_gir           : h.player_b_gir;
        const puttsV = userIsA ? h.player_a_putts         : h.player_b_putts;
        const proxV  = userIsA ? h.player_a_proximity_ft  : h.player_b_proximity_ft;
        const fairV  = userIsA ? h.player_a_fairway        : h.player_b_fairway;
        if (girV !== null && girV !== undefined) { girDen++; if (girV) girNum++; }
        if (puttsV != null) { puttsSum += puttsV; puttsCount++; }
        if (proxV  != null) { proxSum  += proxV;  proxCount++; }
        if (fairV) { fairDen++; if (fairV === 'hit') fairNum++; }
        holeCount++;
      }

      // 2v2 per-player stats (fairway + GIR) from hole_player_stats.
      const { data: ps } = await sbx.from('hole_player_stats')
        .select('fairway, gir').eq('player_id', profileId).in('match_id', matchIds);
      for (const s of ps || []) {
        if (s.fairway) { fairDen++; if (s.fairway === 'hit') fairNum++; }
        if (s.gir != null) { girDen++; if (s.gir) girNum++; }
      }

      if (girDen > 0) gir = girNum / girDen;
      if (puttsCount > 0) putts = puttsSum / puttsCount;
      if (proxCount > 0)  proximity = proxSum / proxCount;
      if (fairDen > 0) fairway = fairNum / fairDen;

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

      // ── Per-format advanced stats ──────────────────────────────────
      // Per-player rows for EVERYONE in these matches (we need partner data,
      // not just the user's, to compute rescues).
      const { data: psAll } = await sbx.from('hole_player_stats')
        .select('match_id, hole_number, player_id, fairway, gir, ob').in('match_id', matchIds);
      const psMap = {};
      for (const s of psAll || []) psMap[`${s.match_id}|${s.hole_number}|${s.player_id}`] = s;
      const holesByMatch = {};
      for (const h of holes || []) (holesByMatch[h.match_id] = holesByMatch[h.match_id] || []).push(h);
      for (const k in holesByMatch) holesByMatch[k].sort((a, b) => a.hole_number - b.hole_number);

      // Completed matches, newest-first, from the user's perspective.
      const mine = list.filter(m => m.status === 'completed').map(m => {
        const aSide = [m.player_a, m.player_a2], bSide = [m.player_b, m.player_b2];
        const userIsA = aSide.includes(profileId);
        const res = m.result === 'H' ? 'H' : ((m.result === 'A') === userIsA ? 'W' : 'L');
        const partnerId = (userIsA ? aSide : bSide).find(x => x && x !== profileId) || null;
        const oppProfile = userIsA ? m.player_b_profile : m.player_a_profile;
        return { m, fmt: m.match_type, userIsA, res, partnerId, opp: (oppProfile && oppProfile.handle) || null };
      });

      const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : null);
      const marginRank = (s) => {
        if (!s) return -1; const t = String(s).trim().toUpperCase();
        if (t.includes('&')) { const p = t.split('&'); return (parseInt(p[0], 10) || 0) * 100 + (parseInt(p[1], 10) || 0); }
        const up = t.match(/(\d+)\s*UP/); if (up) return (parseInt(up[1], 10) || 0) * 100;
        return 0;
      };

      const buildFmt = (fmtKey, rec) => {
        const ms = mine.filter(x => x.fmt === fmtKey);
        const total = rec.W + rec.L + rec.H;
        let cur = 0; for (const x of ms) { if (x.res === 'W') cur++; else break; }       // ms is newest-first
        let longest = 0, run = 0; for (const x of ms) { if (x.res === 'W') { run++; longest = Math.max(longest, run); } else run = 0; }
        let bestWin = null, bestR = -1;
        for (const x of ms) if (x.res === 'W') { const r = marginRank(x.m.final_margin); if (r > bestR) { bestR = r; bestWin = { margin: x.m.final_margin || 'WIN', opp: x.opp }; } }
        const f = { W: rec.W, L: rec.L, H: rec.H, total, winRate: total > 0 ? Math.round((rec.W / total) * 100) : null, winStreak: cur, longestStreak: longest, bestWin };

        if (fmtKey === '2v2') {
          let effN = 0, effD = 0, finN = 0, finD = 0, clN = 0, clD = 0;
          const partnerAgg = {};
          for (const x of ms) {
            const teamLetter = x.userIsA ? 'A' : 'B';
            if (x.partnerId) { const a = partnerAgg[x.partnerId] || (partnerAgg[x.partnerId] = { W: 0, L: 0, H: 0 }); a[x.res]++; }
            for (const h of holesByMatch[x.m.id] || []) {
              if (h.result == null) continue;
              const teamRes = h.result === 'H' ? 'H' : (h.result === teamLetter ? 'W' : 'L');
              if (h.ball_player != null) { effD++; if (h.ball_player === profileId) effN++; }
              if (h.holed_by   != null) { finD++; if (h.holed_by   === profileId) finN++; }
              const pp = x.partnerId ? psMap[`${h.match_id}|${h.hole_number}|${x.partnerId}`] : null;
              if (pp && h.ball_player != null) {
                const compromised = pp.gir === false || pp.ob === true || (pp.fairway && pp.fairway !== 'hit');
                if (compromised) { clD++; if (h.ball_player === profileId && (teamRes === 'W' || teamRes === 'H')) clN++; }
              }
            }
          }
          f.shotEff  = effD ? { pct: pct(effN, effD), sample: effD } : null;
          f.finisher = finD ? { pct: pct(finN, finD), sample: finD } : null;
          f.clutch   = clD  ? { pct: pct(clN, clD),   sample: clD  } : null;
          let bp = null;
          for (const pid in partnerAgg) { const a = partnerAgg[pid]; const g = a.W + a.L + a.H; if (g < 2) continue; const wp = Math.round((a.W / g) * 100); if (!bp || wp > bp.winPct || (wp === bp.winPct && g > bp.games)) bp = { id: pid, winPct: wp, games: g }; }
          f.bestPartnerRaw = bp;
        }

        if (fmtKey === '1v1') {
          let scrN = 0, scrD = 0, conN = 0, conD = 0, bbN = 0, bbD = 0, clsN = 0, clsD = 0;
          for (const x of ms) {
            const hs = holesByMatch[x.m.id] || [];
            const tot = x.m.total_holes || hs.length;
            let up = 0, prev = null;
            hs.forEach((h, i) => {
              if (h.result == null) return;
              const userGir = x.userIsA ? h.player_a_gir : h.player_b_gir;
              const holeRes = h.result === 'H' ? 'H' : (h.result === (x.userIsA ? 'A' : 'B') ? 'W' : 'L');
              if (userGir === false) { scrD++; if (holeRes === 'W' || holeRes === 'H') scrN++; }
              if (userGir === true)  { conD++; if (holeRes === 'W') conN++; }
              if (prev === 'L')      { bbD++; if (holeRes === 'W') bbN++; }
              if (Math.abs(up) <= 1 || i >= tot - 2) { clsD++; if (holeRes === 'W') clsN++; }
              up += holeRes === 'W' ? 1 : holeRes === 'L' ? -1 : 0;
              prev = holeRes;
            });
          }
          f.scrambling = scrD ? { pct: pct(scrN, scrD), sample: scrD } : null;
          f.conversion = conD ? { pct: pct(conN, conD), sample: conD } : null;
          f.bounceBack = bbD ? { pct: pct(bbN, bbD), sample: bbD } : null;
          f.closer     = clsD ? { pct: pct(clsN, clsD), sample: clsD } : null;
        }
        return f;
      };

      fmt2v2 = buildFmt('2v2', rec2v2);
      fmt1v1 = buildFmt('1v1', rec1v1);

      // Resolve the best-partner handle (id → @handle).
      if (fmt2v2.bestPartnerRaw) {
        const { data: bpP } = await sbx.from('profiles').select('handle').eq('id', fmt2v2.bestPartnerRaw.id).maybeSingle();
        fmt2v2.bestPartner = { handle: (bpP && bpP.handle) || null, winPct: fmt2v2.bestPartnerRaw.winPct, games: fmt2v2.bestPartnerRaw.games };
      }
    }

    setStats({
      matchesW: W,
      matchesL: L,
      matchesH: H,
      rec2v2,
      rec1v1,
      fmt2v2,
      fmt1v1,
      matchesTotal: W + L + H,
      streak,
      seasonPoints: W + 0.5 * H,
      recentMatches: list,
      // Advanced (real) — null when the user hasn't logged any stats yet.
      gir, putts, proximity, fairway, girTrend,
      holesLogged: holeCount,
    });
  }, [profileId]);

  React.useEffect(() => { load(); }, [load]);

  // Keep stats fresh when matches change. UNIQUE channel name per hook instance:
  // this hook runs both in the App shell (useRealUserSync) and on the You tab, so
  // a fixed name made the second mount reuse the already-subscribed cached channel
  // → "cannot add postgres_changes callbacks ... after subscribe()". A random name
  // per instance avoids the collision.
  const matchesChan = React.useRef(`user-matches-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!profileId) return;
    const ch = sbx.channel(matchesChan)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_holes' }, () => load())
      .subscribe();
    return () => sbx.removeChannel(ch);
  }, [profileId, load, matchesChan]);

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
    avatar_url:    profile.avatar_url || null,
    avatar:        profile.avatar_url || null,    // alias used by AvatarBy
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

    // ── Real SBX engine fields (Phase D2). Placement: unrated until 3
    //    confirmed matches; provisional until 10.
    sbx2v2:     profile.sbx_2v2 != null ? Number(profile.sbx_2v2) : null,
    sbx1v1:     profile.sbx_1v1 != null ? Number(profile.sbx_1v1) : null,
    sbx2v2N:    profile.sbx_2v2_n || 0,
    sbx1v1N:    profile.sbx_1v1_n || 0,
    sbx2v2Rel:  profile.sbx_2v2_rel != null ? Number(profile.sbx_2v2_rel) : 0,
    sbx1v1Rel:  profile.sbx_1v1_rel != null ? Number(profile.sbx_1v1_rel) : 0,
    matchesW:     stats ? stats.matchesW : 0,
    matchesL:     stats ? stats.matchesL : 0,
    matchesH:     stats ? stats.matchesH : 0,
    rec2v2:       stats ? stats.rec2v2 : { W: 0, L: 0, H: 0 },
    rec1v1:       stats ? stats.rec1v1 : { W: 0, L: 0, H: 0 },
    fmt2v2:       stats ? stats.fmt2v2 : null,
    fmt1v1:       stats ? stats.fmt1v1 : null,
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
    fairway:   stats && stats.fairway   != null ? stats.fairway   : null,

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
