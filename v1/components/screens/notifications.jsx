/* global React, Icon, Button, useMyPendingInvites, acceptInvite, declineInvite */
// Notifications screen — opened from the bell on Home.
// MVP: surfaces pending match invites with Accept / Decline.
// Phase 5 will add event reminders, follow notifications, etc.

function NotificationsScreen({ profile, go }) {
  const [invites, loading] = useMyPendingInvites(profile && profile.id);

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120, position: 'relative' }}>
      {/* Ambient top-right wash, matches Home/Stats/Social */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, right: 0, width: '85%', height: '40%',
        background: 'radial-gradient(ellipse at 80% 10%, rgba(28,73,42,0.08) 0%, rgba(28,73,42,0.02) 40%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* Header */}
      <div style={{ position: 'relative', padding: '58px 22px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => go({ screen: 'home' })}
          aria-label="Back"
          style={{
            width: 42, height: 42, borderRadius: 999,
            background: 'var(--paper)', border: 'var(--hairline)',
            boxShadow: 'var(--shadow-sm)', color: 'var(--forest)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon.ArrowLeft size={16}/>
        </button>
        <div style={{ width: 42 }}/>
      </div>

      <div style={{ position: 'relative', padding: '0 22px 20px', color: 'var(--forest)' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Notifications
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 0.92, marginTop: 8, letterSpacing: '-0.02em' }}>
          Inbox.
        </div>
        <div className="caption-serif" style={{ fontSize: 16, opacity: 0.65, marginTop: 6 }}>
          Match invites, event reminders, season updates.
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '8px 16px 0', position: 'relative' }}>
        {loading ? (
          <div style={{ padding: '20px 4px', fontSize: 13, color: 'var(--forest)', opacity: 0.5, textAlign: 'center' }}>
            Loading…
          </div>
        ) : invites.length === 0 ? (
          <div className="card" style={{ padding: 28, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', lineHeight: 1, letterSpacing: '-0.01em' }}>
              All caught up.
            </div>
            <div className="caption-serif" style={{ fontSize: 14, color: 'var(--ink)', opacity: 0.7, marginTop: 8 }}>
              No notifications right now. Match invites and reminders will land here.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {invites.map(inv => (
              <NotificationCard key={inv.id} invite={inv} profile={profile} go={go}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Single invite notification card ─────────────────────────────────
function NotificationCard({ invite, profile, go }) {
  const [busy, setBusy] = React.useState(null); // 'accept' | 'decline' | null
  const [err, setErr]   = React.useState('');

  const senderLabel = invite.invited_by_handle || invite.invited_by_first_name || 'Someone';
  const modeLabel   = invite.match_type === '2v2' ? '2v2' : '1v1';
  const courseHint  = invite.course_name ? ` at ${invite.course_name}` : '';
  const ago         = timeAgo(invite.created_at);

  async function onAccept() {
    setBusy('accept'); setErr('');
    try {
      const matchId = await acceptInvite({ invite, profile });
      go({ screen: 'match', matchId });
    } catch (e) { setErr(e.message || 'Could not accept.'); setBusy(null); }
  }

  async function onDecline() {
    setBusy('decline'); setErr('');
    try { await declineInvite({ invite }); }
    catch (e) { setErr(e.message || 'Could not decline.'); setBusy(null); }
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Match invite
        </div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink)', opacity: 0.45 }}>
          {ago}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)', lineHeight: 1.2, marginTop: 8, letterSpacing: '-0.01em' }}>
        {senderLabel} invited you to a {modeLabel}{courseHint}.
      </div>
      {err && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--loss)' }}>{err}</div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <Button variant="forest" full onClick={onAccept} disabled={!!busy}>
          {busy === 'accept' ? 'Joining…' : 'Accept'}
        </Button>
        <Button variant="outline" onClick={onDecline} disabled={!!busy}>
          {busy === 'decline' ? '…' : 'Decline'}
        </Button>
      </div>
    </div>
  );
}

// ─── tiny relative-time formatter ────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)        return 'just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

Object.assign(window, { NotificationsScreen });
