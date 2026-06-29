/* global React, sbx */
// Admin data layer for users: search profiles, set membership tier, toggle
// admin, and manage guest passes. Requires v1/sql/membership.sql to be applied
// (tier column + guest_passes table). If it isn't, useUsers reports 'MIGRATION'.

function useUsers(query) {
  const [rows, setRows]   = React.useState(null);
  const [error, setError] = React.useState('');
  const load = React.useCallback(async () => {
    const term = (query || '').trim().replace(/^@/, '');
    let req = sbx.from('profiles').select('id, handle, first_name, last_name, avatar_url, is_admin, tier, sbx, created_at');
    if (term) req = req.or(`handle.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
    req = req.order('created_at', { ascending: false }).limit(100);
    const { data, error } = await req;
    if (error) {
      const missingCol = /tier|column .* does not exist/i.test(error.message || '');
      setError(missingCol ? 'MIGRATION' : (error.message || 'Could not load users.'));
      setRows([]);
      return;
    }
    setError('');
    setRows(data || []);
  }, [query]);
  React.useEffect(() => { load(); }, [load]);
  return [rows, error, load];
}

async function setUserTier(id, tier) {
  const { error } = await sbx.from('profiles').update({ tier }).eq('id', id);
  if (error) throw humanizeUser(error);
}

async function setUserAdmin(id, is_admin) {
  const { error } = await sbx.from('profiles').update({ is_admin }).eq('id', id);
  if (error) throw humanizeUser(error);
}

function useGuestPasses(userId) {
  const [rows, setRows] = React.useState(null);
  const load = React.useCallback(async () => {
    if (!userId) { setRows([]); return; }
    const { data } = await sbx.from('guest_passes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setRows(data || []);
  }, [userId]);
  React.useEffect(() => { load(); }, [load]);
  return [rows, load];
}

async function grantGuestPass({ userId, grantedBy, note }) {
  const { error } = await sbx.from('guest_passes').insert({
    user_id: userId, granted_by: grantedBy || null, note: note ? note.trim() : null, status: 'available',
  });
  if (error) throw humanizeUser(error);
}

async function revokeGuestPass(id) {
  const { error } = await sbx.from('guest_passes').delete().eq('id', id);
  if (error) throw humanizeUser(error);
}

function humanizeUser(error) {
  const msg = (error && error.message) || 'Something went wrong.';
  if (/row-level security|permission/i.test(msg)) return new Error('Not allowed — your account needs admin access.');
  if (/only admins/i.test(msg)) return new Error(msg);
  return new Error(msg);
}

Object.assign(window, { useUsers, setUserTier, setUserAdmin, useGuestPasses, grantGuestPass, revokeGuestPass });
