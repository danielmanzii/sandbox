/* global React, sbx */
// Chat (Phase C3): partner DMs + per-match foursome group threads.
//
// One `messages` table serves both:
//   - match thread : match_id set      (the foursome / 1v1 group chat)
//   - direct DM    : dm_a/dm_b set     (1:1, e.g. you + your partner)
// RLS restricts each thread to its participants. Realtime keeps it live.

// Canonical sorted pair for a DM (so both users resolve the same thread).
function dmPair(a, b) {
  return [a, b].sort();
}

function useThread({ matchId, dmWith, myId }) {
  const [messages, setMessages] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [lo, hi] = dmWith && myId ? dmPair(myId, dmWith) : [null, null];

  const load = React.useCallback(async () => {
    let q = sbx.from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id, handle, first_name, last_name, avatar_url)')
      .order('created_at', { ascending: true })
      .limit(200);
    if (matchId)      q = q.eq('match_id', matchId);
    else if (lo && hi) q = q.eq('dm_a', lo).eq('dm_b', hi);
    else { setMessages([]); setLoading(false); return; }
    const { data } = await q;
    setMessages(data || []);
    setLoading(false);
  }, [matchId, lo, hi]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`thread-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!matchId && !lo) return;
    const filter = matchId ? `match_id=eq.${matchId}` : `dm_a=eq.${lo}`;
    const ch = sbx.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter }, () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [matchId, lo, channelName, load]);

  return [messages, loading];
}

async function sendMessage({ matchId, dmWith, myId, body }) {
  const text = (body || '').trim();
  if (!text || !myId) return;
  const row = { sender_id: myId, body: text };
  if (matchId) { row.match_id = matchId; }
  else if (dmWith) { const [lo, hi] = dmPair(myId, dmWith); row.dm_a = lo; row.dm_b = hi; }
  else return;
  const { error } = await sbx.from('messages').insert(row);
  if (error) throw new Error(error.message || 'Could not send.');
}

Object.assign(window, { useThread, sendMessage });
