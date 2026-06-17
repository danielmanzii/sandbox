/* global React, sbx */
// Loyalty points (Phase D4): balance + recent ledger, realtime.

function useLoyalty(userId) {
  const [balance, setBalance] = React.useState(0);
  const [recent, setRecent]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!userId) { setBalance(0); setRecent([]); setLoading(false); return; }
    const { data } = await sbx.from('loyalty_points')
      .select('points, reason, match_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    const rows = data || [];
    setRecent(rows);
    setBalance(rows.reduce((s, r) => s + (r.points || 0), 0));
    setLoading(false);
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`loyalty-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_points', filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, channelName, load]);

  return [balance, recent, loading];
}

Object.assign(window, { useLoyalty });
