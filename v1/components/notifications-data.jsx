/* global React, sbx */
// Generic in-app notifications + partner-invite actions (Phase C1).
//
// Reads the `notifications` table (pairing / refund / partner_invite / …)
// with realtime, and wraps the SECURITY DEFINER RPCs that create
// cross-user notifications (you can't insert a notification for someone
// else directly under RLS).

function useNotifications(userId) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!userId) { setItems([]); setLoading(false); return; }
    const { data } = await sbx.from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    setItems(data || []);
    setLoading(false);
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`notifications-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx.channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, channelName, load]);

  return [items, loading, load];
}

async function markNotificationRead(id) {
  if (!id) return;
  await sbx.from('notifications').update({ read: true }).eq('id', id);
}

// Reserve a 2v2 with a chosen partner — creates your booking + sends them
// an invite notification (they must accept to be registered).
async function invitePartner({ slotId, partnerId, price }) {
  const { data, error } = await sbx.rpc('book_with_partner', {
    p_slot: slotId, p_partner: partnerId, p_price: price != null ? price : null,
  });
  if (error) throw new Error(error.message || 'Could not send invite.');
  return data; // booking id
}

async function acceptPartnerInvite(notifId) {
  const { data, error } = await sbx.rpc('accept_partner_invite', { p_notif: notifId });
  if (error) throw new Error(error.message || 'Could not accept.');
  return data; // new booking id
}

async function declinePartnerInvite(notifId) {
  const { error } = await sbx.rpc('decline_partner_invite', { p_notif: notifId });
  if (error) throw new Error(error.message || 'Could not decline.');
}

Object.assign(window, {
  useNotifications, markNotificationRead,
  invitePartner, acceptPartnerInvite, declinePartnerInvite,
});
