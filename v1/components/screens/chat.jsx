/* global React, Icon, formatHandle, useThread, sendMessage */
// Chat thread screen (Phase C3) — partner DM or foursome group chat.
// Routed via { screen: 'chat', matchId } (group) or { dmWith, title } (DM).

function ChatScreen({ go, profile, matchId, dmWith, title }) {
  const myId = profile && profile.id;
  const [messages, loading] = useThread({ matchId, dmWith, myId });
  const [text, setText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const endRef = React.useRef(null);

  React.useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setText('');
    try { await sendMessage({ matchId, dmWith, myId, body }); }
    catch (_) { setText(body); }
    setBusy(false);
  }

  const isGroup = !!matchId;
  const back = () => go(matchId ? { screen: 'matchup', matchId } : { screen: 'home' });

  return (
    <div style={{ background: 'var(--canvas)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '54px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(14,28,19,0.06)', background: 'var(--paper)' }}>
        <button onClick={back} style={{ width: 38, height: 38, borderRadius: 999, background: 'var(--canvas)', border: 'var(--hairline)', color: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon.ArrowLeft size={16}/>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)', lineHeight: 1, letterSpacing: '-0.01em' }}>
            {title || (isGroup ? 'Group chat' : 'Direct message')}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, marginTop: 4, letterSpacing: '0.06em' }}>
            {isGroup ? 'YOUR FOURSOME' : 'DIRECT MESSAGE'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', fontSize: 13, opacity: 0.5, padding: 24 }}>Loading…</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)' }}>Say hello.</div>
            <div className="caption-serif" style={{ fontSize: 14, opacity: 0.65, marginTop: 6 }}>
              {isGroup ? 'Coordinate with your foursome — who’s where, when to tee off.' : 'Message your partner before the round.'}
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender_id === myId;
            const prev = messages[i - 1];
            const showSender = isGroup && !mine && (!prev || prev.sender_id !== m.sender_id);
            const s = m.sender || {};
            const name = [s.first_name, s.last_name].filter(Boolean).join(' ') || s.handle || '';
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', marginTop: showSender ? 12 : 4 }}>
                {showSender && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--forest)', opacity: 0.7, margin: '0 6px 3px' }}>{name} <span style={{ opacity: 0.6, fontWeight: 500 }}>{formatHandle(s.handle)}</span></div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '9px 13px', borderRadius: 16,
                  background: mine ? 'var(--forest)' : 'var(--paper)',
                  color: mine ? 'var(--cream)' : 'var(--ink)',
                  border: mine ? 'none' : 'var(--hairline)',
                  fontSize: 14, lineHeight: 1.35,
                  borderBottomRightRadius: mine ? 4 : 16,
                  borderBottomLeftRadius: mine ? 16 : 4,
                }}>{m.body}</div>
              </div>
            );
          })
        )}
        <div ref={endRef}/>
      </div>

      {/* Composer */}
      <div style={{ padding: '10px 12px 22px', borderTop: '1px solid rgba(14,28,19,0.06)', background: 'var(--paper)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Message…"
          style={{ flex: 1, background: 'var(--canvas)', border: 'var(--hairline)', borderRadius: 999, padding: '12px 16px', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
        />
        <button onClick={send} disabled={busy || !text.trim()} style={{
          width: 44, height: 44, borderRadius: 999, flexShrink: 0,
          background: text.trim() ? 'var(--forest)' : 'rgba(14,28,19,0.12)',
          color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon.ArrowRight size={18}/>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ChatScreen });
