/* global React, Icon, Button, useMyPendingInvites, useMyPendingEventInvites, useNewFollowers, useIsFollowing, followUser, formatHandle, acceptInvite, declineInvite, acceptEventInvite, declineEventInvite */
// Notifications screen — opened from the bell on Home.
// Surfaces:
//   - Pending event partner/general invites (Accept / Decline / View)
//   - Pending match invites (Accept / Decline)
//   - New followers (Follow back)

function NotificationsScreen({ profile, go }) {
  const [invites, invitesLoading]         = useMyPendingInvites(profile && profile.id);
  const [eventInvites, eventInvLoading]   = useMyPendingEventInvites(profile && profile.id);
  const [followers, followersLoading]     = useNewFollowers(profile && profile.id);
  const loading = invitesLoading || eventInvLoading || followersLoading;

  // Merge all notification types, sorted by time desc.
  const items = React.useMemo(() => {
    const a = (invites || []).map(inv => ({
      kind: 'invite', id: `inv-${inv.id}`, ts: inv.created_at, payload: inv,
    }));
    const b = (followers || []).map(f => ({
      kind: 'follow', id: `fol-${f.follower_id}-${f.created_at}`, ts: f.created_at, payload: f,
    }));
    const c = (eventInvites || []).map(ei => ({
      kind: 'event-invite', id: `ei-${ei.id}`, ts: ei.created_at, payload: ei,
    }));
    return [...a, ...b, ...c].sort((x, y) => new Date(y.ts) - new Date(x.ts));
  }, [invites, followers, eventInvites]);

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
        ) : items.length === 0 ? (
          <div className="card" style={{ padding: 28, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', lineHeight: 1, letterSpacing: '-0.01em' }}>
              All caught up.
            </div>
            <div className="caption-serif" style={{ fontSize: 14, color: 'var(--ink)', opacity: 0.7, marginTop: 8 }}>
              No notifications right now. Match invites and new followers will land here.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(it => (
              it.kind === 'event-invite'
                ? <EventInviteCard key={it.id} invite={it.payload} profile={profile} go={go}/>
                : it.kind === 'invite'
                  ? <NotificationCard key={it.id} invite={it.payload} profile={profile} go={go}/>
                  : <FollowerCard key={it.id} row={it.payload} viewerId={profile && profile.id} go={go}/>
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

// ─── New-follower notification card ──────────────────────────────────
function FollowerCard({ row, viewerId, go }) {
  const f = row.follower;
  const ago = timeAgo(row.created_at);
  const isFollowingBack = useIsFollowing(viewerId, f && f.id);
  const [busy, setBusy] = React.useState(false);
  if (!f) return null;
  const name = [f.first_name, f.last_name].filter(Boolean).join(' ') || f.handle;
  const initial = (name || '?').replace(/^@/, '').charAt(0).toUpperCase();

  async function followBack() {
    if (!viewerId || !f.id || busy) return;
    setBusy(true);
    try { await followUser({ viewerId, targetId: f.id }); }
    catch (_) {}
    setBusy(false);
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          New follower
        </div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink)', opacity: 0.45 }}>
          {ago}
        </div>
      </div>
      <button
        onClick={() => go({ screen: 'profile', viewingHandle: f.handle })}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, marginTop: 10,
          background: 'transparent', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 999,
          background: '#5A7B4A', color: 'var(--cream)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 18, overflow: 'hidden',
          flexShrink: 0,
        }}>
          {f.avatar_url
            ? <img src={f.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{name}</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{formatHandle(f.handle)} started following you</div>
        </div>
      </button>
      {!isFollowingBack && isFollowingBack !== null && (
        <Button variant="forest" size="sm" full onClick={followBack} disabled={busy} style={{ marginTop: 12 }}>
          {busy ? '…' : 'Follow back'}
        </Button>
      )}
      {isFollowingBack && (
        <div style={{ fontSize: 12, color: 'var(--forest)', opacity: 0.6, marginTop: 12, textAlign: 'center', fontWeight: 700 }}>
          You follow each other
        </div>
      )}
    </div>
  );
}

// ─── Event invite notification card ──────────────────────────────────
function EventInviteCard({ invite, profile, go }) {
  const [busy, setBusy] = React.useState(null); // 'accept' | 'decline' | null
  const [err, setErr]   = React.useState('');
  const isPartner = invite.invite_type === 'partner';
  const senderLabel = invite.invited_by_handle || invite.invited_by_first_name || 'Someone';
  const ago = timeAgo(invite.created_at);

  async function onAccept() {
    setBusy('accept'); setErr('');
    try { await acceptEventInvite({ invite }); }
    catch (e) { setErr(e.message || 'Could not accept.'); }
    setBusy(null);
  }

  async function onDecline() {
    setBusy('decline'); setErr('');
    try { await declineEventInvite({ invite, userId: profile && profile.id }); }
    catch (e) { setErr(e.message || 'Could not decline.'); }
    setBusy(null);
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {isPartner ? 'Partner invite' : 'Event invite'}
        </div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink)', opacity: 0.45 }}>{ago}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)', lineHeight: 1.2, marginTop: 8, letterSpacing: '-0.01em' }}>
        {isPartner
          ? `${senderLabel} tagged you as their scramble partner for ${invite.event_course_short}.`
          : `${senderLabel} invited you to ${invite.event_course_short}.`
        }
      </div>
      {invite.event_date ? (
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4, color: 'var(--ink)' }}>
          {invite.event_date}{invite.event_time ? ` · ${invite.event_time}` : ''}
        </div>
      ) : null}
      {isPartner && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--forest)', fontWeight: 600 }}>
          You've been registered — decline to opt out.
        </div>
      )}
      {err && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--loss)' }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        {isPartner ? (
          <>
            <Button variant="forest" full onClick={onAccept} disabled={!!busy}>
              {busy === 'accept' ? '…' : '✓ Looks good'}
            </Button>
            <Button variant="outline" onClick={onDecline} disabled={!!busy}>
              {busy === 'decline' ? '…' : 'Decline'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="forest" full onClick={() => go({ screen: 'eventDetail', eventId: invite.event_id })} disabled={!!busy}>
              View event
            </Button>
            <Button variant="outline" onClick={onDecline} disabled={!!busy}>
              {busy === 'decline' ? '…' : 'Dismiss'}
            </Button>
          </>
        )}
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
