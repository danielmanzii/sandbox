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

Object.assign(window, {
  useFollowCounts, useIsFollowing, useFollowing, useFollowers,
  useUserSearch, useProfileByHandle,
  followUser, unfollowUser, uploadAvatar,
});
