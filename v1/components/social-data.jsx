/* global React, sbx */
// Social hooks: follows + avatar uploads + user search.
//
// Powers:
//   - Profile screen: Follow/Unfollow button, follower/following counts
//   - Profile screen: avatar upload UI (own profile only)
//   - Social tab + match-hub invite: search users by handle/name
//   - (Phase 5.2) friend feed driven by useFollowing()
//
// All hooks subscribe to realtime changes on `follows` so counts and
// follow-state flip instantly on either side.

// ─── Hooks: counts + state ────────────────────────────────────────────
function useFollowCounts(userId) {
  const [counts, setCounts] = React.useState({ followers: 0, following: 0 });
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!userId) { setCounts({ followers: 0, following: 0 }); setLoading(false); return; }
    const [{ count: followers }, { count: following }] = await Promise.all([
      sbx.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      sbx.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id',  userId),
    ]);
    setCounts({ followers: followers || 0, following: following || 0 });
    setLoading(false);
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`follow-counts-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, (payload) => {
        const r = payload.new || payload.old || {};
        if (r.follower_id === userId || r.following_id === userId) load();
      })
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, channelName, load]);

  return [counts, loading];
}

// Does viewer follow target? Returns null while loading, then true/false.
function useIsFollowing(viewerId, targetId) {
  const [following, setFollowing] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!viewerId || !targetId || viewerId === targetId) { setFollowing(false); return; }
    const { data } = await sbx
      .from('follows')
      .select('follower_id')
      .eq('follower_id', viewerId)
      .eq('following_id', targetId)
      .maybeSingle();
    setFollowing(!!data);
  }, [viewerId, targetId]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`is-following-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!viewerId || !targetId) return;
    const ch = sbx.channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows', filter: `follower_id=eq.${viewerId}` },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [viewerId, targetId, channelName, load]);

  return following;
}

// People the user follows (mapped to enriched profile rows).
function useFollowing(userId) {
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!userId) { setList([]); setLoading(false); return; }
    const { data: rows } = await sbx
      .from('follows').select('following_id').eq('follower_id', userId);
    if (!rows || rows.length === 0) { setList([]); setLoading(false); return; }
    const ids = rows.map(r => r.following_id);
    const { data: profs } = await sbx.from('profiles')
      .select('id, handle, first_name, last_name, avatar_url, sbx')
      .in('id', ids);
    setList(profs || []);
    setLoading(false);
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`following-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx.channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows', filter: `follower_id=eq.${userId}` },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, channelName, load]);

  return [list, loading, load];
}

// People who follow the user.
function useFollowers(userId) {
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!userId) { setList([]); setLoading(false); return; }
    const { data: rows } = await sbx
      .from('follows').select('follower_id').eq('following_id', userId);
    if (!rows || rows.length === 0) { setList([]); setLoading(false); return; }
    const ids = rows.map(r => r.follower_id);
    const { data: profs } = await sbx.from('profiles')
      .select('id, handle, first_name, last_name, avatar_url, sbx')
      .in('id', ids);
    setList(profs || []);
    setLoading(false);
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`followers-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx.channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows', filter: `following_id=eq.${userId}` },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, channelName, load]);

  return [list, loading, load];
}

// ─── Mutations ────────────────────────────────────────────────────────
async function followUser({ viewerId, targetId }) {
  if (!viewerId || !targetId || viewerId === targetId) return;
  const { error } = await sbx.from('follows').insert({
    follower_id: viewerId, following_id: targetId,
  });
  if (error && error.code !== '23505') throw error; // 23505 = already following
}

async function unfollowUser({ viewerId, targetId }) {
  if (!viewerId || !targetId) return;
  const { error } = await sbx.from('follows')
    .delete()
    .eq('follower_id', viewerId)
    .eq('following_id', targetId);
  if (error) throw error;
}

// ─── Single profile by handle (for viewing other users) ─────────────
// Tolerates both "rob" and "@rob" storage conventions.
function useProfileByHandle(handle) {
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    if (!handle) { setProfile(null); setLoading(false); return; }
    const cleaned = String(handle).replace(/^@/, '').toLowerCase();
    (async () => {
      const { data } = await sbx.from('profiles')
        .select('id, handle, first_name, last_name, avatar_url, sbx, created_at')
        .or(`handle.ilike.${cleaned},handle.ilike.@${cleaned}`)
        .limit(1);
      if (!cancelled) {
        setProfile((data && data[0]) || null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [handle]);

  return [profile, loading];
}

// ─── User search by handle or name (for invite + follow flows) ───────
// Strips leading @, case-insensitive; returns up to `limit` matches.
function useUserSearch(query, limit = 10) {
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const trimmed = (query || '').trim().replace(/^@/, '');

  React.useEffect(() => {
    let cancelled = false;
    if (trimmed.length < 1) { setResults([]); setLoading(false); return; }
    setLoading(true);
    // Debounce 250ms.
    const t = setTimeout(async () => {
      const pat = `%${trimmed}%`;
      const { data } = await sbx.from('profiles')
        .select('id, handle, first_name, last_name, avatar_url')
        .or(`handle.ilike.${pat},first_name.ilike.${pat},last_name.ilike.${pat}`)
        .limit(limit);
      if (!cancelled) { setResults(data || []); setLoading(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [trimmed, limit]);

  return [results, loading];
}

// ─── Avatar upload (Supabase Storage `avatars` bucket) ───────────────
// Uploads the file to `<userId>/avatar.<ext>`, then writes the public
// URL to profiles.avatar_url. Returns the new public URL.
async function uploadAvatar({ userId, file }) {
  if (!userId || !file) throw new Error('Missing user or file.');
  // 20 MB cap is for the SELECTED file. The cropper downscales to 512×512
  // before this function is called, so the actual upload is usually <200 KB.
  if (file.size > 20 * 1024 * 1024) throw new Error('Image must be under 20 MB.');

  const ext = (file.name.match(/\.([a-z0-9]+)$/i) || [])[1] || 'jpg';
  // Stable path so re-uploads overwrite the prior file (upsert: true).
  const path = `${userId}/avatar.${ext.toLowerCase()}`;

  const { error: upErr } = await sbx.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });
  if (upErr) throw upErr;

  // Public URL (bucket is public). Append a cache-buster so the new image
  // shows immediately even if the URL itself is unchanged.
  const { data: pub } = sbx.storage.from('avatars').getPublicUrl(path);
  const url = `${pub.publicUrl}?t=${Date.now()}`;

  const { error: updErr } = await sbx.from('profiles').update({ avatar_url: url }).eq('id', userId);
  if (updErr) throw updErr;

  // Trigger any global listeners (user-data.jsx) to refetch the profile.
  try { if (typeof window.reloadProfile === 'function') window.reloadProfile(); } catch (_) {}

  return url;
}

// ─── Friend feed: signups + match results from people you follow ─────
// Returns a unified, time-sorted list of activity items. Subscribes to
// event_registrations + matches realtime so new activity flows in live.
//
// Item shape:
//   { id, type: 'event_signup'|'match_result', ts, actor: {...}, payload: {...} }
function useFriendFeed(userId, limit = 25) {
  const [items, setItems]     = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [followCount, setFollowCount] = React.useState(0);

  const load = React.useCallback(async () => {
    if (!userId) { setItems([]); setLoading(false); return; }

    // 1) Who do I follow? (always include myself so my own activity shows up)
    const { data: followRows } = await sbx
      .from('follows').select('following_id').eq('follower_id', userId);
    const ids = Array.from(new Set([userId, ...((followRows || []).map(r => r.following_id))]));
    setFollowCount((followRows || []).length);
    if (ids.length === 0) { setItems([]); setLoading(false); return; }

    const idsCsv = ids.join(',');

    // 2) Event signups by those users
    const signupsP = sbx.from('event_registrations')
      .select(`
        id, created_at, user_id,
        actor:profiles!event_registrations_user_id_fkey(id, handle, first_name, last_name, avatar_url),
        event:events!event_registrations_event_id_fkey(id, course_short, course_name, starts_at, tagline)
      `)
      .in('user_id', ids)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 3) Completed matches involving any of those users (as A or B)
    const matchesP = sbx.from('matches')
      .select(`
        id, status, result, final_margin, completed_at, course_name,
        player_a, player_b,
        a:profiles!matches_player_a_fkey(id, handle, first_name, last_name, avatar_url),
        b:profiles!matches_player_b_fkey(id, handle, first_name, last_name, avatar_url)
      `)
      .eq('status', 'completed')
      .or(`player_a.in.(${idsCsv}),player_b.in.(${idsCsv})`)
      .order('completed_at', { ascending: false })
      .limit(limit);

    const [{ data: signups }, { data: matches }] = await Promise.all([signupsP, matchesP]);

    // 4) Normalize into activity items
    const out = [];
    (signups || []).forEach(r => {
      if (!r.actor || !r.event) return;
      out.push({
        id:     `sg-${r.id}`,
        type:   'event_signup',
        ts:     r.created_at,
        actor:  r.actor,
        payload: { event: r.event },
      });
    });
    (matches || []).forEach(m => {
      // Pick the "actor" — prefer the friend who isn't me; if both are friends, prefer A.
      const aIsFriend = ids.includes(m.player_a);
      const bIsFriend = m.player_b && ids.includes(m.player_b);
      let actor, opponent, won;
      if (aIsFriend && (!bIsFriend || m.player_a !== userId)) {
        actor = m.a; opponent = m.b;
        won = m.result === 'A';
      } else if (bIsFriend) {
        actor = m.b; opponent = m.a;
        won = m.result === 'B';
      } else {
        return;
      }
      if (!actor) return;
      out.push({
        id:     `mt-${m.id}`,
        type:   'match_result',
        ts:     m.completed_at || m.created_at,
        actor,
        payload: {
          opponent,
          result: m.result,           // 'A' | 'B' | 'H'
          margin: m.final_margin,     // "3&2" etc.
          won,
          courseName: m.course_name,
        },
      });
    });

    out.sort((x, y) => new Date(y.ts) - new Date(x.ts));
    setItems(out.slice(0, limit));
    setLoading(false);
  }, [userId, limit]);

  React.useEffect(() => { load(); }, [load]);

  // Realtime: refetch when relevant rows change
  const channelName = React.useRef(`friend-feed-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: `follower_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, channelName, load]);

  return [items, loading, followCount];
}

// ─── Friends registered for events (for "X friends here" pill) ──────
// Returns a Map<event_id, [profile, ...]> covering every friend (people
// the viewer follows) who has registered for one of the given events.
function useFriendsRegisteredForEvents(viewerId, eventIds) {
  const [byEvent, setByEvent] = React.useState({});
  const [loading, setLoading] = React.useState(true);

  // Stable key so we don't refetch when the array reference changes but values don't.
  const eventKey = (eventIds || []).slice().sort().join(',');

  const load = React.useCallback(async () => {
    if (!viewerId || !eventIds || eventIds.length === 0) {
      setByEvent({}); setLoading(false); return;
    }
    // Who do I follow?
    const { data: followRows } = await sbx
      .from('follows').select('following_id').eq('follower_id', viewerId);
    const friendIds = (followRows || []).map(r => r.following_id);
    if (friendIds.length === 0) { setByEvent({}); setLoading(false); return; }

    // Friends registered for any of these events.
    const { data: regs } = await sbx.from('event_registrations')
      .select(`
        event_id, user_id,
        actor:profiles!event_registrations_user_id_fkey(id, handle, first_name, last_name, avatar_url)
      `)
      .in('event_id', eventIds)
      .in('user_id', friendIds);

    const out = {};
    (regs || []).forEach(r => {
      if (!r.actor) return;
      (out[r.event_id] = out[r.event_id] || []).push(r.actor);
    });
    setByEvent(out);
    setLoading(false);
  }, [viewerId, eventKey]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { load(); }, [load]);

  // Realtime: refetch on any change to follows or event_registrations.
  const channelName = React.useRef(`friends-on-events-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!viewerId) return;
    const ch = sbx.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: `follower_id=eq.${viewerId}` }, () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [viewerId, channelName, load]);

  return [byEvent, loading];
}

// ─── New followers (for notifications) ───────────────────────────────
// Recent rows where someone followed YOU. Returns last `windowDays`.
function useNewFollowers(userId, windowDays = 30) {
  const [list, setList]       = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!userId) { setList([]); setLoading(false); return; }
    const since = new Date(Date.now() - windowDays * 86400 * 1000).toISOString();
    const { data } = await sbx.from('follows')
      .select(`
        created_at, follower_id,
        follower:profiles!follows_follower_id_fkey(id, handle, first_name, last_name, avatar_url)
      `)
      .eq('following_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);
    setList((data || []).filter(r => r.follower));
    setLoading(false);
  }, [userId, windowDays]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`new-followers-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx.channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows', filter: `following_id=eq.${userId}` },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, channelName, load]);

  return [list, loading];
}

// ─── Profile editing ──────────────────────────────────────────────────
// Updates editable profile fields. Throws a friendly Error on the most
// common failures (handle taken, missing required field, etc.) so the
// UI can show them inline.
async function updateProfile({ userId, first_name, last_name, handle, bio, home_course }) {
  if (!userId) throw new Error('Not signed in.');
  if (!first_name || !first_name.trim()) throw new Error('First name is required.');
  if (!last_name  || !last_name.trim())  throw new Error('Last name is required.');
  if (!handle     || !handle.trim())     throw new Error('Username is required.');

  // Normalize handle: strip leading @, lowercase, validate charset.
  const cleanedHandle = handle.trim().replace(/^@/, '').toLowerCase();
  if (cleanedHandle.length < 2)  throw new Error('Username must be at least 2 characters.');
  if (cleanedHandle.length > 24) throw new Error('Username must be 24 characters or fewer.');
  if (!/^[a-z0-9_.]+$/.test(cleanedHandle)) {
    throw new Error('Username can only contain letters, numbers, _ and .');
  }

  const patch = {
    first_name:  first_name.trim(),
    last_name:   last_name.trim(),
    handle:      cleanedHandle,
    bio:         (bio || '').trim() || null,
    home_course: (home_course || '').trim() || null,
  };

  const { error } = await sbx.from('profiles').update(patch).eq('id', userId);
  if (error) {
    if (error.code === '23505') throw new Error('That username is already taken.');
    throw new Error(error.message || 'Could not save profile.');
  }

  // Refresh the global profile so MOCK.USER updates everywhere.
  try { if (typeof window.reloadProfile === 'function') window.reloadProfile(); } catch (_) {}
}

Object.assign(window, {
  useFollowCounts, useIsFollowing, useFollowing, useFollowers,
  useUserSearch, useProfileByHandle,
  useFriendFeed, useNewFollowers, useFriendsRegisteredForEvents,
  followUser, unfollowUser, uploadAvatar, updateProfile,
});
