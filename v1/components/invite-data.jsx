/* global React, sbx */
// Match-invite hooks + mutations.
//
// Powers the "Invite by username" flow on the Match Hub waiting screen
// and the invitee-side notification banner. Reads from / writes to
// public.match_invites (see v1/sql/match-invites.sql).
//
// Returned shapes:
//   useMyPendingInvites(userId) → [invites, loading]
//     invites = [{ id, match_id, status, created_at,
//                  invited_by_handle, invited_by_first_name,
//                  match_type, course_name, total_holes,
//                  match_status, join_code }, ...]
//   useMatchInvitesForMatch(matchId) → [invites, loading]
//     invites = same shape but for one match (used by sender to track status)

// ─── Hook: invites where I'm the invitee, status='pending' ───────────
function useMyPendingInvites(userId) {
  const [invites, setInvites] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!userId) { setInvites([]); setLoading(false); return; }
    // Two-step query: invites + matches/profiles separately. Cleaner
    // than embedded selects since RLS sometimes blocks deep nesting.
    const { data: rows } = await sbx
      .from('match_invites')
      .select('*')
      .eq('invitee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) { setInvites([]); setLoading(false); return; }

    const matchIds  = [...new Set(rows.map(r => r.match_id))];
    const senderIds = [...new Set(rows.map(r => r.invited_by))];

    const [{ data: matches }, { data: senders }] = await Promise.all([
      sbx.from('matches').select('id, match_type, course_name, total_holes, status, join_code, player_a, player_a2, player_b, player_b2').in('id', matchIds),
      sbx.from('profiles').select('id, handle, first_name').in('id', senderIds),
    ]);

    const mById = Object.fromEntries((matches || []).map(m => [m.id, m]));
    const sById = Object.fromEntries((senders || []).map(s => [s.id, s]));

    const enriched = rows.map(r => {
      const m = mById[r.match_id] || {};
      const s = sById[r.invited_by] || {};
      return {
        id: r.id,
        match_id: r.match_id,
        status: r.status,
        created_at: r.created_at,
        invited_by: r.invited_by,
        invited_by_handle: s.handle ? `@${String(s.handle).replace(/^@/, '')}` : null,
        invited_by_first_name: s.first_name || null,
        match_type: m.match_type || '1v1',
        course_name: m.course_name || '',
        total_holes: m.total_holes || 9,
        match_status: m.status,
        join_code: m.join_code,
        match: m,
      };
    }).filter(x => x.match_status !== 'completed' && x.match_status !== 'abandoned');

    setInvites(enriched);
    setLoading(false);
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  // Realtime — fire on any insert/update where I'm the invitee.
  const channelName = React.useRef(`my-invites-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'match_invites', filter: `invitee_id=eq.${userId}` },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, channelName, load]);

  return [invites, loading, load];
}

// ─── Hook: invites for a specific match (sender's tracking view) ─────
function useMatchInvitesForMatch(matchId) {
  const [invites, setInvites] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!matchId) { setInvites([]); setLoading(false); return; }
    const { data: rows } = await sbx
      .from('match_invites')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) { setInvites([]); setLoading(false); return; }

    const ids = [...new Set(rows.map(r => r.invitee_id))];
    const { data: profs } = await sbx.from('profiles').select('id, handle, first_name').in('id', ids);
    const pById = Object.fromEntries((profs || []).map(p => [p.id, p]));
    setInvites(rows.map(r => {
      const p = pById[r.invitee_id] || {};
      return {
        ...r,
        invitee_handle: p.handle ? `@${String(p.handle).replace(/^@/, '')}` : null,
        invitee_first_name: p.first_name || null,
      };
    }));
    setLoading(false);
  }, [matchId]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`match-invites-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!matchId) return;
    const ch = sbx
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'match_invites', filter: `match_id=eq.${matchId}` },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [matchId, channelName, load]);

  return [invites, loading, load];
}

// ─── Mutations ───────────────────────────────────────────────────────
// Send an invite by handle. Throws on error so the caller can show it.
async function sendInviteByHandle({ matchId, invitedBy, handle }) {
  const cleaned = String(handle).replace(/^@/, '').trim().toLowerCase();
  if (!cleaned) throw new Error('Enter a username.');

  // Look up the invitee via the @-stripping ilike pattern setup uses.
  const { data: target } = await sbx
    .from('profiles')
    .select('id, handle')
    .ilike('handle', cleaned)
    .maybeSingle();
  if (!target) throw new Error(`No user with handle @${cleaned}.`);
  if (target.id === invitedBy) throw new Error("You can't invite yourself.");

  const { error } = await sbx.from('match_invites').insert({
    match_id:   matchId,
    invited_by: invitedBy,
    invitee_id: target.id,
  });
  if (error) {
    if (error.code === '23505') throw new Error(`@${cleaned} is already invited to this match.`);
    throw error;
  }
}

// Accept: claim the next free slot in the match, then mark invite accepted.
// Mirrors the slot logic used by JoinMatchView.
async function acceptInvite({ invite, profile }) {
  const m = invite.match || {};
  const userId = profile.id;

  // Already in the match? Just mark accepted.
  if ([m.player_a, m.player_a2, m.player_b, m.player_b2].includes(userId)) {
    await sbx.from('match_invites').update({
      status: 'accepted', responded_at: new Date().toISOString(),
    }).eq('id', invite.id);
    return invite.match_id;
  }

  const is2v2 = m.match_type === '2v2';
  let update = null;
  if (is2v2) {
    if (!m.player_a2)      update = { player_a2: userId };
    else if (!m.player_b)  update = { player_b:  userId };
    else if (!m.player_b2) update = { player_b2: userId, status: 'active', started_at: new Date().toISOString() };
    else throw new Error('That match already has four players.');
  } else {
    if (!m.player_b) update = { player_b: userId, status: 'active', started_at: new Date().toISOString() };
    else throw new Error('That match already has two players.');
  }

  const { error: updErr } = await sbx.from('matches').update(update).eq('id', invite.match_id);
  if (updErr) throw updErr;

  await sbx.from('match_invites').update({
    status: 'accepted', responded_at: new Date().toISOString(),
  }).eq('id', invite.id);

  return invite.match_id;
}

async function declineInvite({ invite }) {
  await sbx.from('match_invites').update({
    status: 'declined', responded_at: new Date().toISOString(),
  }).eq('id', invite.id);
}

async function cancelInvite({ invite }) {
  await sbx.from('match_invites').update({
    status: 'cancelled', responded_at: new Date().toISOString(),
  }).eq('id', invite.id);
}

Object.assign(window, {
  useMyPendingInvites, useMatchInvitesForMatch,
  sendInviteByHandle, acceptInvite, declineInvite, cancelInvite,
});
