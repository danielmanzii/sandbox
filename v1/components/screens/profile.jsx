/* global React, Icon, Button, Eyebrow, Chip, Dashed, MOCK, AvatarBy, useProfileByHandle, useFollowCounts, useIsFollowing, followUser, unfollowUser, uploadAvatar */
// Profile (self + public) with member-gated stats

function ProfileScreen({ go, tier, viewingHandle, profile: signedInProfile }) {
  const isSelf = !viewingHandle || viewingHandle === MOCK.USER.handle;

  // For other users, fetch their real profile from Supabase by handle
  // (tolerates @-prefix). Falls back to the legacy mock lookup so
  // links from MOCK-driven screens (e.g. Social leaderboard) still work.
  const [realTarget, targetLoading] = useProfileByHandle(isSelf ? null : viewingHandle);
  const mockTarget = isSelf ? null : (MOCK.FRIENDS.find(f => f.handle === viewingHandle) || null);

  const user = isSelf
    ? MOCK.USER
    : (realTarget
        ? {
            id:           realTarget.id,
            handle:       realTarget.handle,
            name:         [realTarget.first_name, realTarget.last_name].filter(Boolean).join(' ') || realTarget.handle,
            avatar:       realTarget.avatar_url || null,
            avatar_url:   realTarget.avatar_url || null,
            sbx:          Number(realTarget.sbx) || 4.0,
            color:        'var(--moss)',
          }
        : (mockTarget || MOCK.FRIENDS[0]));

  const userInitial = (user.name || user.handle || '?').replace(/^@/, '').charAt(0).toUpperCase();
  const targetId    = (realTarget && realTarget.id) || (isSelf ? MOCK.USER.id : null);

  // Real follow state + counts
  const viewerId = signedInProfile && signedInProfile.id;
  const [counts] = useFollowCounts(targetId);
  const isFollowing = useIsFollowing(viewerId, targetId);
  const [followBusy, setFollowBusy] = React.useState(false);

  async function toggleFollow() {
    if (!viewerId || !targetId || viewerId === targetId || followBusy) return;
    setFollowBusy(true);
    try {
      if (isFollowing) await unfollowUser({ viewerId, targetId });
      else             await followUser({ viewerId, targetId });
    } catch (_) { /* swallow — RLS errors etc. */ }
    setFollowBusy(false);
  }

  const [youAreMember] = [tier === 'league' || tier === 'leaguePlus' || tier === 'stats'];

  if (!isSelf && targetLoading && !mockTarget) {
    return (
      <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--forest)', opacity: 0.5 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      {/* Cover */}
      <div style={{
        height: 200,
        background: `linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        <img src="assets/mascot-full-cream.svg" alt="" style={{
          position: 'absolute', right: -24, top: 24, width: 220, opacity: 0.16, transform: 'rotate(-6deg)',
        }}/>
        {!isSelf && (
          <button onClick={() => go({ screen: 'social' })} style={{
            position: 'absolute', top: 58, left: 16,
            width: 40, height: 40, borderRadius: 999,
            background: 'rgba(14,28,19,0.55)', backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'var(--cream)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(234,226,206,0.22)',
          }}>
            <Icon.ArrowLeft size={16}/>
          </button>
        )}
      </div>

      <div style={{ padding: '0 20px', marginTop: -50, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <AvatarCircle
            url={user.avatar || user.avatar_url}
            initial={userInitial}
            isSelf={isSelf}
            userId={viewerId}
          />
          <div style={{ flex: 1, paddingBottom: 8 }}>
            {isSelf && MOCK.USER.foundingMember && (
              <div style={{
                display: 'inline-block',
                padding: '4px 10px', borderRadius: 999,
                background: 'var(--forest)', color: 'var(--cream)',
                fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase',
                boxShadow: 'var(--shadow-sm)', marginBottom: 6,
              }}>⛳ Founding</div>
            )}
          </div>
          {!isSelf && viewerId && targetId && viewerId !== targetId && (
            <Button
              variant={isFollowing ? 'outline' : 'forest'}
              size="sm"
              onClick={toggleFollow}
              disabled={followBusy || isFollowing === null}
              style={{ marginBottom: 8 }}
            >
              {isFollowing === null ? '…' : (isFollowing ? 'Following' : 'Follow')}
            </Button>
          )}
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: 'var(--forest)' }}>
            {user.name}
          </div>
          <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4, fontWeight: 600 }}>{user.handle}</div>
          {isSelf && (
            <div className="caption-serif" style={{ fontSize: 15, marginTop: 8, color: 'var(--ink)', opacity: 0.85 }}>
              "{user.bio}"
            </div>
          )}
          {/* Follow stats — works for self + others */}
          <div style={{ display: 'flex', gap: 18, marginTop: 12, alignItems: 'baseline' }}>
            <FollowStat label="Followers" value={counts.followers}/>
            <FollowStat label="Following" value={counts.following}/>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
            <Mini label="Home" value={isSelf ? user.homeCourse : 'Melreese'}/>
            <Mini label="Joined" value={isSelf ? user.joined : 'Jan 2026'}/>
            <Mini label="Events" value={isSelf ? user.eventsPlayed : '14'}/>
          </div>
        </div>
      </div>

      {/* Public stats shown for self. For other users — gated by whether THEY'RE a member. */}
      <div style={{ padding: '22px 16px 0' }}>
        {isSelf ? (
          <SelfStatsBlock user={user} go={go} tier={tier}/>
        ) : (
          <PublicStatsBlock user={user} viewerIsMember={youAreMember} go={go}/>
        )}
      </div>

      {/* Recent matches (public) */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Recent matches</div>
        <div className="card" style={{ overflow: 'hidden' }}>
          {MOCK.HISTORY.slice(0, 4).map((r, i) => {
            const isW = r.result === 'W', isL = r.result === 'L';
            const badgeStyle = isW
              ? { background: 'var(--forest)', color: 'var(--cream)', border: 'none' }
              : isL
              ? { background: 'var(--cream)', color: 'var(--forest)', border: 'none' }
              : { background: 'var(--paper)', color: 'var(--forest)', border: '1px solid rgba(28,73,42,0.25)' };
            const marginColor = isW ? 'var(--forest)' : isL ? 'var(--forest)' : '#8A6A4A';
            const marginOpacity = isL ? 0.55 : 1;
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 14px',
                borderBottom: i < 3 ? '1px solid rgba(14,28,19,0.05)' : 'none',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--forest)', width: 30, opacity: 0.7 }}>{r.week}</div>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 13,
                  ...badgeStyle,
                }}>{r.result}</div>
                <div style={{ flex: 1, fontSize: 12 }}>vs {r.opp}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: marginColor, opacity: marginOpacity }}>{r.margin}</div>
              </div>
            );
          })}
        </div>
      </div>

      {isSelf && (
        <div style={{ padding: '22px 16px 0' }}>
          <div className="card" style={{ padding: 4 }}>
            <MenuRow label="My membership" onClick={() => go({ screen: 'membership' })}/>
            <MenuRow label="Guest passes · 2 left"/>
            <MenuRow label="Shareable cards"/>
            <MenuRow label="Notifications"/>
            <MenuRow label="Sign out" last/>
          </div>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)', marginTop: 3 }}>{value}</div>
    </div>
  );
}

function SelfStatsBlock({ user, go, tier }) {
  const isStatsEnabled = tier !== 'walkup';
  if (!isStatsEnabled) {
    return (
      <div style={{
        background: 'var(--paper)', borderRadius: 18, padding: 18,
        border: '1px dashed rgba(14,28,19,0.15)', textAlign: 'center',
      }}>
        <Icon.Lock size={20} color="var(--forest)"/>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginTop: 8, color: 'var(--forest)' }}>Rating locked</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4, marginBottom: 14 }}>
          Walk-up matches don't count toward your Sandbox Rating. Unlock with Stats or League.
        </div>
        <Button variant="forest" size="sm" onClick={() => go({ screen: 'membership' })}>See plans</Button>
      </div>
    );
  }
  const trend = user.sbxTrend;
  return (
    <div style={{
      background: `linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)`,
      color: 'var(--cream)',
      borderRadius: 'var(--radius-card-lg)', padding: 20, position: 'relative', overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', right: 16, top: 16, fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.6, letterSpacing: '0.24em', fontWeight: 700 }}>SBX · v1</div>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.65, letterSpacing: '0.14em', textTransform: 'uppercase', position: 'relative' }}>Sandbox Rating™</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10, position: 'relative' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 0.85, letterSpacing: '-0.03em' }}>{user.sbx.toFixed(3)}</span>
            <span style={{ fontSize: 12, color: user.sbxDelta >= 0 ? '#B8E0A4' : 'var(--clay)', fontWeight: 700 }}>
              {user.sbxDelta >= 0 ? '+' : ''}{user.sbxDelta.toFixed(3)}
            </span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>Top {100 - user.sbxPercentile}% · #{user.sbxGlobalRank.toLocaleString()} global</div>
        </div>
        {/* mini sparkline */}
        <svg viewBox="0 0 80 36" style={{ width: 90, height: 40 }} preserveAspectRatio="none">
          {(() => {
            const lo = Math.min(...trend), hi = Math.max(...trend);
            const pts = trend.map((v, i) => [(i / (trend.length - 1)) * 78 + 1, 34 - ((v - lo) / (hi - lo || 1)) * 30]);
            const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
            return (
              <>
                <path d={d} fill="none" stroke="var(--clay)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill="var(--clay)"/>
              </>
            );
          })()}
        </svg>
      </div>
      <div style={{ height: 1, background: 'rgba(234,226,206,0.14)', margin: '16px 0 12px' }}/>
      <div style={{ display: 'flex', gap: 14, fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.7, letterSpacing: '0.06em' }}>
        <span><strong>{user.matchesW}–{user.matchesL}–{user.matchesH}</strong> RECORD</span>
        <span>·</span>
        <span>REL. {Math.round(user.sbxReliability * 100)}%</span>
      </div>
      <Button variant="outlineCream" size="sm" full style={{ marginTop: 12 }} onClick={() => go({ screen: 'stats' })}>
        Full dashboard <Icon.ArrowRight size={14}/>
      </Button>
    </div>
  );
}

function PublicStatsBlock({ user, viewerIsMember, go }) {
  // If viewer is member, show full. If not, show gated teaser.
  if (viewerIsMember) {
    const rel = user.rel ?? 0.8;
    const reliable = rel >= 0.5;
    return (
      <div style={{
        background: `linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)`,
        color: 'var(--cream)',
        borderRadius: 'var(--radius-card-lg)', padding: 20, position: 'relative', overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', right: 16, top: 16, fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.6, letterSpacing: '0.24em', fontWeight: 700 }}>SBX · v1</div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.65, letterSpacing: '0.14em', textTransform: 'uppercase', position: 'relative' }}>Sandbox Rating™</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.85,
            letterSpacing: '-0.03em',
            borderBottom: reliable ? 'none' : '3px dotted rgba(234,226,206,0.5)',
          }}>{user.sbx?.toFixed(3) ?? '—'}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Mini2 label="Record" value="9–5–1"/>
            <Mini2 label="Events" value="14"/>
          </div>
        </div>
        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 6 }}>
          {reliable ? 'Rated · reliability ' : 'Provisional · reliability '}{Math.round(rel * 100)}%
        </div>
      </div>
    );
  }
  return (
    <div style={{
      background: 'var(--paper)', border: '1px dashed rgba(14,28,19,0.18)',
      borderRadius: 18, padding: 18, textAlign: 'center',
    }}>
      <Icon.Lock size={20} color="var(--forest)"/>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginTop: 8, color: 'var(--forest)' }}>Ratings are member-only</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4, marginBottom: 14 }}>
        Members see each other's Sandbox Rating, trend and full head-to-head.
      </div>
      <Button variant="forest" size="sm" onClick={() => go({ screen: 'membership' })}>Become a member</Button>
    </div>
  );
}

function Mini2({ label, value }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginTop: 3 }}>{value}</div>
    </div>
  );
}

function MenuRow({ label, onClick, last }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', width: '100%',
      padding: '15px 14px', borderBottom: last ? 'none' : '1px solid rgba(14,28,19,0.05)',
      fontSize: 13, fontWeight: 600, color: 'var(--ink)', textAlign: 'left',
    }}>
      <span style={{ flex: 1 }}>{label}</span>
      <Icon.Chevron dir="right" size={12} color="var(--forest)"/>
    </button>
  );
}

// ─── Avatar circle with optional upload UI for self ───────────────────
function AvatarCircle({ url, initial, isSelf, userId }) {
  const fileRef = React.useRef(null);
  const [busy, setBusy]   = React.useState(false);
  const [err, setErr]     = React.useState('');

  async function onPick(e) {
    const file = e.target.files && e.target.files[0];
    if (!file || !userId) return;
    setErr(''); setBusy(true);
    try {
      await uploadAvatar({ userId, file });
      // useProfile re-runs via window.reloadProfile inside uploadAvatar;
      // MOCK.USER.avatar_url is then refreshed via useRealUserSync.
    } catch (e) {
      setErr(e.message || 'Upload failed.');
    }
    setBusy(false);
    e.target.value = ''; // reset so the same file can be reselected
  }

  const circle = (
    <div style={{
      width: 96, height: 96, borderRadius: 999,
      background: '#5A7B4A',
      border: '4px solid var(--cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--cream)', fontFamily: 'var(--font-display)', fontSize: 38,
      overflow: 'hidden', position: 'relative',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {url ? (
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
      ) : (
        initial
      )}
      {isSelf && (
        <div style={{
          position: 'absolute', right: -2, bottom: -2,
          width: 28, height: 28, borderRadius: 999,
          background: 'var(--forest)', color: 'var(--cream)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--cream)',
          fontSize: 14, fontWeight: 800,
        }}>
          {busy ? '…' : '+'}
        </div>
      )}
    </div>
  );

  if (!isSelf) return circle;

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current && fileRef.current.click()}
        disabled={busy}
        aria-label="Change profile photo"
        style={{ padding: 0, background: 'transparent', border: 'none', cursor: busy ? 'wait' : 'pointer' }}
      >
        {circle}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        style={{ display: 'none' }}
      />
      {err && (
        <div style={{ fontSize: 11, color: 'var(--loss)', marginTop: 4 }}>{err}</div>
      )}
    </>
  );
}

// ─── Follower / Following stat (compact display) ──────────────────────
function FollowStat({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)', lineHeight: 1, letterSpacing: '-0.01em' }}>
        {value}
      </div>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

Object.assign(window, { ProfileScreen });
