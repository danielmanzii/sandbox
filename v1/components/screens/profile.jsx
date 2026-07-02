/* global React, Icon, Button, Eyebrow, Chip, Dashed, MOCK, sbx, AvatarBy, useProfileByHandle, useFollowCounts, useIsFollowing, useFollowers, useFollowing, followUser, unfollowUser, uploadAvatar, updateProfile, formatHandle, useUpcomingEvents, useCompletedMatchDetail, useLoyalty, useUserStats, signOut, ShareResultCard, shareResult, plainMargin, useLastMatchCard, lastMatchAgoLine */
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
            sbx2v2:       realTarget.sbx_2v2 != null ? Number(realTarget.sbx_2v2) : null,
            sbx1v1:       realTarget.sbx_1v1 != null ? Number(realTarget.sbx_1v1) : null,
            sbx2v2N:      realTarget.sbx_2v2_n || 0,
            sbx1v1N:      realTarget.sbx_1v1_n || 0,
            sbx2v2Rel:    realTarget.sbx_2v2_rel != null ? Number(realTarget.sbx_2v2_rel) : 0,
            sbx1v1Rel:    realTarget.sbx_1v1_rel != null ? Number(realTarget.sbx_1v1_rel) : 0,
            bio:          realTarget.bio || null,
            homeCourse:   realTarget.home_course || null,
            color:        'var(--moss)',
          }
        : (mockTarget || null));

  const userInitial = ((user && (user.name || user.handle)) || '?').replace(/^@/, '').charAt(0).toUpperCase();
  const targetId    = (realTarget && realTarget.id) || (isSelf ? MOCK.USER.id : null);

  // Match history: pull THIS profile's matches (self or other) and shape them
  // as full teams (you + partner vs both opponents). Partner/opponent handles
  // that aren't in the joined rows (player_a2 / player_b2) are resolved by id
  // via a single directory lookup, so every @ in a row is clickable.
  const stats      = useUserStats(targetId);
  const rawMatches = stats ? stats.recentMatches : null;
  const recentCards = useRecentMatchCards(targetId, 5);
  const dirIds = React.useMemo(() => {
    const s = new Set();
    for (const m of (rawMatches || [])) {
      [m.player_a, m.player_a2, m.player_b, m.player_b2].forEach(x => x && s.add(x));
    }
    return [...s];
  }, [rawMatches]);
  const dir = usePlayerDirectory(dirIds);
  const history = React.useMemo(
    () => buildTeamHistory(targetId, rawMatches, dir),
    [targetId, rawMatches, dir]
  );

  // For another user, fill the view object with their REAL aggregates so the
  // SBX card record / "events attended" / joined date show actual data
  // instead of the old hardcoded placeholders.
  if (!isSelf && user) {
    if (stats) {
      user.matchesW    = stats.matchesW;
      user.matchesL    = stats.matchesL;
      user.matchesH    = stats.matchesH;
      user.rec2v2      = stats.rec2v2;
      user.rec1v1      = stats.rec1v1;
      user.eventsPlayed = stats.matchesTotal;
      user.seasonPoints = stats.seasonPoints;
      user.streak      = stats.streak;
    }
    user.joined = (realTarget && realTarget.created_at)
      ? new Date(realTarget.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : null;
  }

  // Real follow state + counts
  const viewerId = signedInProfile && signedInProfile.id;
  const [counts] = useFollowCounts(targetId);
  const isFollowing = useIsFollowing(viewerId, targetId);
  const [followBusy, setFollowBusy] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [followListOpen, setFollowListOpen] = React.useState(null); // null | 'followers' | 'following'
  const [guestPassesOpen, setGuestPassesOpen] = React.useState(false);
  const [matchHistoryOpen, setMatchHistoryOpen] = React.useState(false);

  async function toggleFollow() {
    if (!viewerId || !targetId || viewerId === targetId || followBusy) return;
    setFollowBusy(true);
    try {
      if (isFollowing) await unfollowUser({ viewerId, targetId });
      else             await followUser({ viewerId, targetId });
    } catch (_) { /* swallow — RLS errors etc. */ }
    setFollowBusy(false);
  }

  const [youAreMember] = [tier === 'league' || tier === 'plus' || tier === 'stats'];

  if (!isSelf && targetLoading && !mockTarget) {
    return (
      <SppLoader fill/>
    );
  }

  // No matching profile (handle didn't resolve, or a name was passed instead
  // of a handle). Show a graceful empty state instead of crashing — MOCK has
  // no friend fallback to fall back to anymore.
  if (!user) {
    return (
      <div style={{ background: 'var(--canvas)', minHeight: '100%', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--forest)', lineHeight: 0.95 }}>Not found</div>
        <div className="caption-serif" style={{ fontSize: 15, color: 'var(--ink)', opacity: 0.7, marginTop: 10, marginBottom: 22 }}>
          We couldn't pull up that player's profile.
        </div>
        <Button variant="forest" size="sm" onClick={() => go({ screen: 'social' })}>Back to search</Button>
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
          {isSelf && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              style={{ marginBottom: 8 }}
            >
              Edit profile
            </Button>
          )}
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: 'var(--forest)' }}>
            {user.name}
          </div>
          <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4, fontWeight: 600 }}>{formatHandle(user.handle)}</div>
          {user.bio && (
            <div className="caption-serif" style={{ fontSize: 15, marginTop: 8, color: 'var(--ink)', opacity: 0.85 }}>
              "{user.bio}"
            </div>
          )}
          {/* Follow stats — works for self + others */}
          <div style={{ display: 'flex', gap: 18, marginTop: 12, alignItems: 'baseline' }}>
            <FollowStat label="Followers" value={counts.followers} onClick={() => setFollowListOpen('followers')}/>
            <FollowStat label="Following" value={counts.following} onClick={() => setFollowListOpen('following')}/>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
            <Mini label="Home" value={user.homeCourse || '—'}/>
            <Mini label="Joined" value={user.joined || '—'}/>
            <Mini label="Events attended" value={user.eventsPlayed != null ? user.eventsPlayed : '—'}/>
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

      {/* Match history — the shareable 3D last-match card + a link into the
          full history page. */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          {isSelf && recentCards && recentCards[0] ? lastMatchAgoLine(recentCards[0].completedAt) : 'Match history'}
        </div>
        {recentCards === null ? (
          <div className="card"><SppLoader/></div>
        ) : recentCards.length > 0 ? (
          <>
            <MatchCardStack cards={recentCards} go={go}/>
            <button onClick={() => setMatchHistoryOpen(true)} style={{
              marginTop: 12, width: '100%', padding: '13px 14px', borderRadius: 14,
              background: 'transparent', border: '1px solid var(--forest)',
              color: 'var(--forest)', fontSize: 13, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              View all {history.length || recentCards.length} matches <Icon.ArrowRight size={14}/>
            </button>
          </>
        ) : (
          <div className="card" style={{ padding: '24px 14px', textAlign: 'center', opacity: 0.4 }}>
            <div style={{ fontSize: 14 }}>No matches yet.</div>
          </div>
        )}
      </div>

      {isSelf && <LoyaltyCard userId={viewerId}/>}

      {isSelf && (
        <div style={{ padding: '22px 16px 0' }}>
          <div className="card" style={{ padding: 4 }}>
            <MenuRow label="Manage my membership" onClick={() => go({ screen: 'membership' })}/>
            <MenuRow label="Guest Passes" onClick={() => setGuestPassesOpen(true)}/>
            <MenuRow label="Sign out" last onClick={() => { if (window.confirm('Sign out of Sandbox?')) signOut(); }}/>
          </div>
        </div>
      )}

      {editing && isSelf && (
        <EditProfileSheet
          profile={signedInProfile}
          onClose={() => setEditing(false)}
        />
      )}

      {followListOpen && (
        <FollowListSheet
          userId={targetId}
          mode={followListOpen}
          viewerId={viewerId}
          go={go}
          onClose={() => setFollowListOpen(null)}
        />
      )}

      {guestPassesOpen && (
        <GuestPassesSheet
          tier={tier}
          go={go}
          onClose={() => setGuestPassesOpen(false)}
        />
      )}

      {matchHistoryOpen && (
        <MatchHistorySheet
          history={history}
          ownerId={targetId}
          go={go}
          onClose={() => setMatchHistoryOpen(false)}
        />
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
  return <RealSbxCard user={user} go={go} showDashboard/>;
}

// ─── Tier label from an SBX value (2.000–8.000 scale) ─────────────────
function sbxTier(r) {
  if (r == null) return '';
  if (r >= 6.5) return 'Professional';
  if (r >= 5.0) return 'Advanced';
  if (r >= 3.5) return 'Experienced';
  return 'Beginner';
}

// ─── Placement stage from a format's confirmed-match count ────────────
// Each format (1v1 / 2v2) calibrates on its OWN matches — they never
// cross-count (a 2v2 result can't move your 1v1 rating).
//   0    → unranked    (no rating yet)
//   1–2  → calibrating (fills 3 bars; the 3rd match unlocks Provisional)
//   3–5  → provisional (fills 3 more; the 6th match makes it Official)
//   6+   → official     (skill label unlocked)
function sbxStage(n) {
  if (!n || n <= 0) return 'unranked';
  if (n < 3) return 'calibrating';
  if (n < 6) return 'provisional';
  return 'official';
}

function SbxBars({ filled, total = 3 }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 6, borderRadius: 999,
          background: i < filled ? 'var(--cream)' : 'rgba(234,226,206,0.22)' }}/>
      ))}
    </div>
  );
}

// One placement-aware rating card for a single format (2v2 or 1v1).
function SbxFormatCard({ fmt, rating, n, rel, record }) {
  const stage  = sbxStage(n);
  const relPct = Math.round((rel || 0) * 100);
  const rec    = record || { W: 0, L: 0, H: 0 };
  const recStr = `${rec.W || 0}–${rec.L || 0}–${rec.H || 0}`;

  // Progress + next-milestone within the current journey.
  const filled = stage === 'calibrating' ? n : stage === 'provisional' ? n - 3 : 0;
  const milestone = stage === 'calibrating'
    ? `${3 - n} more ${3 - n === 1 ? 'match' : 'matches'} to unlock your Provisional rating.`
    : stage === 'provisional'
      ? `${6 - n} more ${6 - n === 1 ? 'match' : 'matches'} to make it Official.`
      : '';

  // Right-hand status pill per stage.
  const pill = stage === 'official'
    ? <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>Official <span style={{ color: 'var(--moss-light)' }}>✓</span></span>
    : (stage === 'calibrating' || stage === 'provisional')
      ? <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(234,226,206,0.18)', padding: '4px 8px', borderRadius: 999, fontWeight: 700 }}>{stage}</span>
      : null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--cream)', borderRadius: 'var(--radius-card-lg)', padding: 20,
      position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-md)',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.65, letterSpacing: '0.14em', textTransform: 'uppercase', position: 'relative' }}>Sandbox Rating™ · {fmt}</div>

      {stage === 'unranked' ? (
        <div style={{ position: 'relative', marginTop: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 0.9, letterSpacing: '-0.02em' }}>Unranked</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>Play a match to start your SBX rating.</div>
          <div style={{ marginTop: 12 }}><SbxBars filled={0}/></div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.85, letterSpacing: '-0.03em' }}>{rating != null ? rating.toFixed(3) : '—'}</span>
              {stage === 'official' && <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 700 }}>{sbxTier(rating)}</span>}
            </div>
            {pill}
          </div>

          {stage !== 'official' && (
            <>
              <div className="caption-serif" style={{ fontSize: 12, opacity: 0.72, marginTop: 4, fontStyle: 'italic' }}>
                Unofficial estimate — firms up as you play.
              </div>
              <div style={{ marginTop: 12 }}><SbxBars filled={filled}/></div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>{milestone}</div>
            </>
          )}

          <div style={{ height: 1, background: 'rgba(234,226,206,0.14)', margin: '14px 0 12px' }}/>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.75, letterSpacing: '0.06em' }}>
            <span><strong>{recStr}</strong> W–L–H</span>
            <span>·</span>
            <span>REL. {relPct}%</span>
            <span>·</span>
            <span>{n} {n === 1 ? 'match' : 'matches'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Real SBX card: 2v2 headline on top, 1v1 below — each independent. ─
function RealSbxCard({ user, go, showDashboard }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SbxFormatCard fmt="2v2" rating={user.sbx2v2} n={user.sbx2v2N || 0} rel={user.sbx2v2Rel} record={user.rec2v2}/>
      <SbxFormatCard fmt="1v1" rating={user.sbx1v1} n={user.sbx1v1N || 0} rel={user.sbx1v1Rel} record={user.rec1v1}/>
      {showDashboard && (
        <Button variant="forest" size="sm" full style={{ marginTop: 2 }} onClick={() => go({ screen: 'stats' })}>
          Full dashboard <Icon.ArrowRight size={14}/>
        </Button>
      )}
    </div>
  );
}

function PublicStatsBlock({ user, viewerIsMember, go }) {
  // If viewer is member, show full real card. If not, show gated teaser.
  if (viewerIsMember) {
    return <RealSbxCard user={user} go={go}/>;
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
  const [busy, setBusy]       = React.useState(false);
  const [err, setErr]         = React.useState('');
  const [pending, setPending] = React.useState(null); // file to crop

  function onPick(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow reselecting same file later
    if (!file || !userId) return;
    if (file.size > 20 * 1024 * 1024) {
      setErr('Image must be under 20 MB.');
      return;
    }
    setErr('');
    setPending(file);
  }

  async function onCropConfirm(croppedFile) {
    setBusy(true);
    try {
      await uploadAvatar({ userId, file: croppedFile });
      setPending(null);
    } catch (e) {
      setErr(e.message || 'Upload failed.');
    }
    setBusy(false);
  }

  const circle = (
    <div style={{ position: 'relative', width: 96, height: 96 }}>
      {/* Image clipped to circle */}
      <div style={{
        width: 96, height: 96, borderRadius: 999,
        background: '#5A7B4A',
        border: '4px solid var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--cream)', fontFamily: 'var(--font-display)', fontSize: 38,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        boxSizing: 'border-box',
      }}>
        {url ? (
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        ) : (
          initial
        )}
      </div>
      {/* Badge sits OVER the picture, just inside the bottom-right edge */}
      {isSelf && (
        <div style={{
          position: 'absolute', right: 4, bottom: 4,
          width: 30, height: 30, borderRadius: 999,
          background: 'var(--forest)', color: 'var(--cream)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--cream)',
          fontSize: 16, fontWeight: 800, lineHeight: 1,
          boxShadow: 'var(--shadow-sm)',
          pointerEvents: 'none',
        }}>
          {busy ? '…' : '+'}
        </div>
      )}
    </div>
  );

  if (!isSelf) {
    const [zoomed, setZoomed] = React.useState(false);
    return (
      <>
        <button type="button" onClick={() => setZoomed(true)} style={{ padding: 0, background: 'transparent', border: 'none', cursor: 'pointer' }}>
          {circle}
        </button>
        {zoomed && (
          <div
            onClick={() => setZoomed(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 16,
            }}
          >
            <div style={{
              width: 220, height: 220, borderRadius: 999,
              background: '#5A7B4A',
              border: '4px solid rgba(255,255,255,0.25)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cream)', fontFamily: 'var(--font-display)', fontSize: 80,
            }}>
              {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initial}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>TAP TO CLOSE</div>
          </div>
        )}
      </>
    );
  }

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
      {pending && (
        <AvatarCropper
          file={pending}
          busy={busy}
          onCancel={() => { if (!busy) setPending(null); }}
          onConfirm={onCropConfirm}
        />
      )}
    </>
  );
}

// ─── Avatar cropper (modal) ──────────────────────────────────────────
// Lets the user pan + zoom the picked image inside a circular crop
// window, then exports a 512×512 jpg of exactly what's in the circle.
function AvatarCropper({ file, busy, onCancel, onConfirm }) {
  const FRAME = 280;             // circle window size on screen
  const OUT   = 512;             // exported image size

  const [src,   setSrc]    = React.useState(null);
  const [imgW,  setImgW]   = React.useState(0);
  const [imgH,  setImgH]   = React.useState(0);
  const [zoom,  setZoom]   = React.useState(1);   // multiplier on top of "cover" base
  const [pos,   setPos]    = React.useState({ x: 0, y: 0 }); // image-center offset from frame-center, screen px
  const [drag,  setDrag]   = React.useState(null);
  const [err,   setErr]    = React.useState('');
  const imgRef = React.useRef(null);

  // Read the file into a data URL once
  React.useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => setSrc(e.target.result);
    reader.onerror = () => setErr('Could not read image.');
    reader.readAsDataURL(file);
  }, [file]);

  function onImgLoad(e) {
    setImgW(e.target.naturalWidth);
    setImgH(e.target.naturalHeight);
    setZoom(1);
    setPos({ x: 0, y: 0 });
  }

  // Cover-the-frame base scale × user zoom
  const baseScale       = (imgW && imgH) ? Math.max(FRAME / imgW, FRAME / imgH) : 1;
  const effectiveScale  = baseScale * zoom;
  const renderedW       = imgW * effectiveScale;
  const renderedH       = imgH * effectiveScale;

  // Drag-to-pan (mouse + touch) with global listeners while dragging
  function pointOf(e) {
    const t = e.touches && e.touches[0];
    return { x: (t || e).clientX, y: (t || e).clientY };
  }
  function startDrag(e) {
    const p = pointOf(e);
    setDrag({ x: p.x - pos.x, y: p.y - pos.y });
  }
  React.useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      e.preventDefault();
      const p = pointOf(e);
      setPos({ x: p.x - drag.x, y: p.y - drag.y });
    };
    const end = () => setDrag(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
  }, [drag]);

  async function confirm() {
    if (!imgRef.current || !imgW || !imgH) return;
    setErr('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUT; canvas.height = OUT;
      const ctx = canvas.getContext('2d');

      // Source rect (in original image pixels) that ends up in the frame.
      // Image center on screen = (FRAME/2 + pos.x, FRAME/2 + pos.y)
      // Image top-left on screen = (FRAME/2 + pos.x - renderedW/2, ...)
      // Source x at frame's screen-x=0 = (renderedW/2 - FRAME/2 - pos.x) / effectiveScale
      const sx = (renderedW / 2 - FRAME / 2 - pos.x) / effectiveScale;
      const sy = (renderedH / 2 - FRAME / 2 - pos.y) / effectiveScale;
      const sw = FRAME / effectiveScale;
      const sh = FRAME / effectiveScale;

      ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, OUT, OUT);

      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
      if (!blob) throw new Error('Could not encode image.');
      const baseName = (file.name || 'avatar').replace(/\.[^.]+$/, '') || 'avatar';
      const cropped = new File([blob], baseName + '.jpg', { type: 'image/jpeg' });
      await onConfirm(cropped);
    } catch (e) {
      setErr(e.message || 'Crop failed.');
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(14,28,19,0.88)', backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 4 }}>
        Crop your photo
      </div>
      <div style={{ color: 'rgba(234,226,206,0.55)', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
        Drag to reposition · slider to zoom
      </div>

      <div
        style={{
          width: FRAME, height: FRAME, position: 'relative',
          overflow: 'hidden', borderRadius: 999,
          background: '#000',
          boxShadow: '0 0 0 4px var(--cream), 0 24px 60px rgba(0,0,0,0.5)',
          touchAction: 'none', cursor: drag ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        {src && (
          <img
            ref={imgRef}
            src={src}
            onLoad={onImgLoad}
            draggable={false}
            alt=""
            style={{
              position: 'absolute',
              left: '50%', top: '50%',
              width: renderedW || 'auto',
              height: renderedH || 'auto',
              maxWidth: 'none', maxHeight: 'none',
              transform: `translate(${-renderedW / 2 + pos.x}px, ${-renderedH / 2 + pos.y}px)`,
              userSelect: 'none', pointerEvents: 'none',
            }}
          />
        )}
      </div>

      <div style={{ width: FRAME, marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: 'var(--cream)', fontSize: 14, opacity: 0.6, fontWeight: 800 }}>−</span>
        <input
          type="range" min="1" max="4" step="0.02"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--cream)' }}
        />
        <span style={{ color: 'var(--cream)', fontSize: 14, opacity: 0.6, fontWeight: 800 }}>+</span>
      </div>

      {err && (
        <div style={{ color: '#E7B8A7', fontSize: 12, marginTop: 10 }}>{err}</div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
        <Button variant="outlineCream" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant="primary" onClick={confirm} disabled={busy || !src}>
          {busy ? 'Uploading…' : 'Save photo'}
        </Button>
      </div>
    </div>
  );
}

// ─── Follower / Following stat (compact display) ──────────────────────
function FollowStat({ label, value, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)', lineHeight: 1, letterSpacing: '-0.01em' }}>
        {value}
      </div>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>
        {label}
      </div>
    </button>
  );
}

// ─── Guest Passes Sheet ──────────────────────────────────────────────
function GuestPassesSheet({ tier, go, onClose }) {
  const isPlus = tier === 'plus';
  const isLeague = tier === 'league';
  const totalPasses = isLeague ? 2 : 0; // plus = unlimited, tracked differently

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const nextFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const resetStr = nextFirst.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Invites: [{ id, contact, eventId, eventName, status: 'pending'|'used', sentAt, month }]
  const [invites, setInvites] = React.useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('spp_guest_invites') || '[]');
      return stored.filter(inv => inv.month === currentMonth);
    } catch { return []; }
  });

  const [sendStep, setSendStep] = React.useState(null); // null | 'event' | 'contact'
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [contactInput, setContactInput] = React.useState('');
  const [upcoming] = useUpcomingEvents(6);

  function saveInvites(newInvites) {
    try {
      const all = JSON.parse(localStorage.getItem('spp_guest_invites') || '[]');
      const otherMonths = all.filter(inv => inv.month !== currentMonth);
      localStorage.setItem('spp_guest_invites', JSON.stringify([...otherMonths, ...newInvites]));
    } catch {}
    setInvites(newInvites);
  }

  function sendInvite() {
    if (!selectedEvent || !contactInput.trim()) return;
    const newInvite = {
      id: Date.now().toString(),
      contact: contactInput.trim(),
      eventId: selectedEvent.id,
      eventName: `${selectedEvent.courseShort || selectedEvent.title} · ${selectedEvent.date}`,
      status: 'pending',
      sentAt: now.toISOString().slice(0, 10),
      month: currentMonth,
    };
    saveInvites([...invites, newInvite]);
    setContactInput('');
    setSelectedEvent(null);
    setSendStep(null);
  }

  function cancelInvite(id) {
    saveInvites(invites.filter(inv => inv.id !== id));
  }

  const canSendMore = isPlus || (isLeague && invites.length < totalPasses);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }}/>
      <div style={{ position: 'relative', background: 'var(--forest-dark)', borderRadius: '24px 24px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(234,226,206,0.2)', margin: '14px auto 0', position: 'relative' }}/>
        <div style={{ padding: '16px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', borderBottom: '1px solid rgba(234,226,206,0.1)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.01em' }}>Guest Passes</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--cream)', opacity: 0.5, marginTop: 4, letterSpacing: '0.1em' }}>
              {isPlus ? 'UNLIMITED · 1 PER EVENT' : isLeague ? `${invites.length} OF ${totalPasses} USED · RESETS ${resetStr.toUpperCase()}` : ''}
            </div>
          </div>
          <img src="assets/mascot-full-cream.svg" alt="" style={{ width: 64, opacity: 0.25, marginRight: -8 }}/>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 16px 32px', position: 'relative' }}>
          {!isPlus && !isLeague ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--cream)', opacity: 0.55 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>No guest passes on your plan.</div>
              <div style={{ fontSize: 13 }}>Upgrade to League or Plus to bring a friend.</div>
              <button onClick={() => { onClose(); go({ screen: 'membership' }); }} style={{
                marginTop: 18, padding: '10px 20px', borderRadius: 999,
                background: 'rgba(234,226,206,0.15)', border: '1px solid rgba(234,226,206,0.3)',
                color: 'var(--cream)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>View plans</button>
            </div>
          ) : (
            <>
              {/* Send new pass button */}
              {canSendMore && sendStep === null && (
                <button onClick={() => setSendStep('event')} style={{
                  width: '100%', padding: '18px 20px', borderRadius: 18,
                  background: 'rgba(234,226,206,0.12)', border: '1.5px solid rgba(234,226,206,0.28)',
                  color: 'var(--cream)', cursor: 'pointer', marginBottom: 14,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(234,226,206,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24, lineHeight: 1 }}>+</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1, marginBottom: 4 }}>
                      {isPlus ? 'Send a guest pass' : `Send a guest pass · ${totalPasses - invites.length} left`}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.5, letterSpacing: '0.08em' }}>
                      INVITE VIA EMAIL OR PHONE
                    </div>
                  </div>
                </button>
              )}

              {/* Existing invites */}
              {invites.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
                  {invites.map(invite => (
                    <div key={invite.id} style={{
                      borderRadius: 18, overflow: 'hidden',
                      border: invite.status === 'used' ? '1px solid rgba(234,226,206,0.1)' : '1px solid rgba(234,226,206,0.28)',
                      opacity: invite.status === 'used' ? 0.5 : 1,
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'stretch',
                        background: invite.status === 'used' ? 'rgba(234,226,206,0.06)' : 'rgba(234,226,206,0.12)',
                      }}>
                        <div style={{ flex: 1, padding: '16px 0 16px 18px' }}>
                          <div style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--cream)', opacity: 0.5, letterSpacing: '0.2em' }}>SANDBOX PITCH + PUTT</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--cream)', lineHeight: 0.95, marginTop: 6, letterSpacing: '-0.01em' }}>
                            {invite.status === 'used' ? 'Used' : 'Pending invite'}
                          </div>
                          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--cream)', opacity: 0.65, marginTop: 6, letterSpacing: '0.04em' }}>
                            {invite.contact}
                          </div>
                          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--cream)', opacity: 0.4, marginTop: 3, letterSpacing: '0.04em' }}>
                            {invite.eventName}
                          </div>
                          {invite.status === 'pending' && (
                            <button onClick={() => cancelInvite(invite.id)} style={{
                              marginTop: 8, padding: '4px 10px', borderRadius: 999,
                              background: 'rgba(234,226,206,0.1)', border: '1px solid rgba(234,226,206,0.2)',
                              color: 'var(--cream)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                              cursor: 'pointer', textTransform: 'uppercase',
                            }}>Cancel invite</button>
                          )}
                        </div>
                        <div style={{ width: 0, borderLeft: '1.5px dashed rgba(234,226,206,0.2)', margin: '14px 0' }}/>
                        <div style={{ width: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src="assets/mascot-full-cream.svg" alt="" style={{ width: 48, opacity: invite.status === 'used' ? 0.15 : 0.55 }}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {invites.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--cream)', opacity: 0.3, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 4 }}>
                  {isPlus ? `UNLIMITED · 1 PER EVENT · RESETS ${resetStr.toUpperCase()}` : `${totalPasses} PASSES THIS MONTH · RESETS ${resetStr.toUpperCase()}`}
                </div>
              )}

              {!canSendMore && invites.length > 0 && (
                <div style={{ textAlign: 'center', color: 'var(--cream)', opacity: 0.35, fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 8 }}>
                  ALL PASSES USED · RESETS {resetStr.toUpperCase()}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Event picker sub-sheet */}
      {sendStep === 'event' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setSendStep(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}/>
          <div style={{ position: 'relative', background: 'var(--paper)', borderRadius: '24px 24px 0 0', maxHeight: '65vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(14,28,19,0.15)', margin: '14px auto 0' }}/>
            <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid rgba(14,28,19,0.07)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)' }}>Pick an event</div>
              <div style={{ fontSize: 11, color: 'var(--ink)', opacity: 0.55, marginTop: 3 }}>Your guest will get an invite for this event.</div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {upcoming.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', opacity: 0.4, fontSize: 13 }}>No upcoming events.</div>
              ) : upcoming.map((ev, i) => {
                const alreadySent = isPlus && invites.some(inv => inv.eventId === ev.id);
                return (
                  <button key={ev.id} onClick={() => { if (!alreadySent) { setSelectedEvent(ev); setSendStep('contact'); } }} style={{
                    width: '100%', textAlign: 'left', padding: '14px 20px',
                    borderBottom: i < upcoming.length - 1 ? '1px solid rgba(14,28,19,0.05)' : 'none',
                    background: 'transparent', border: 'none', cursor: alreadySent ? 'not-allowed' : 'pointer',
                    opacity: alreadySent ? 0.4 : 1,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--forest)' }}>{ev.courseShort || ev.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.55, fontFamily: 'var(--font-mono)', marginTop: 3, letterSpacing: '0.03em' }}>
                      {ev.date} · {ev.time}{alreadySent ? ' · Pass already sent' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Contact input sub-sheet */}
      {sendStep === 'contact' && selectedEvent && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setSendStep('event')} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}/>
          <div style={{ position: 'relative', background: 'var(--paper)', borderRadius: '24px 24px 0 0', padding: '0 20px 36px', overflow: 'hidden' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(14,28,19,0.15)', margin: '14px auto 16px' }}/>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', marginBottom: 6 }}>Who's your guest?</div>
            <div style={{ fontSize: 12, color: 'var(--ink)', opacity: 0.55, marginBottom: 18, lineHeight: 1.5 }}>
              Enter their email or phone. They'll receive an invite for {selectedEvent.courseShort || selectedEvent.title} on {selectedEvent.date}. The pass shows as pending until they sign up using the same contact.
            </div>
            <input
              type="text"
              placeholder="email@example.com or (305) 555-0100"
              value={contactInput}
              onChange={e => setContactInput(e.target.value)}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '14px 16px', borderRadius: 14,
                border: '1.5px solid rgba(14,28,19,0.15)', background: 'var(--canvas)',
                fontSize: 15, color: 'var(--ink)', fontFamily: 'inherit',
                outline: 'none', marginBottom: 12,
              }}
            />
            <Button variant="forest" full onClick={sendInvite} disabled={!contactInput.trim()}>
              Send invite <Icon.ArrowRight size={14}/>
            </Button>
            <button onClick={() => setSendStep('event')} style={{
              width: '100%', marginTop: 8, padding: '12px 0',
              background: 'transparent', border: 'none',
              color: 'var(--forest)', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: 0.6,
            }}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Player directory: resolve {id -> {handle, name}} for a set of ids ──
// Used so partner / opponent handles that aren't in the joined match rows
// (player_a2 / player_b2) can still be shown and made clickable.
function usePlayerDirectory(ids) {
  const [map, setMap] = React.useState({});
  const key = (ids || []).filter(Boolean).slice().sort().join(',');
  React.useEffect(() => {
    let cancelled = false;
    const list = key ? key.split(',') : [];
    if (!list.length) { setMap({}); return; }
    (async () => {
      const { data } = await sbx.from('profiles').select('id, handle, first_name, last_name').in('id', list);
      if (cancelled) return;
      const m = {};
      for (const p of (data || [])) {
        m[p.id] = { handle: p.handle, name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.handle };
      }
      setMap(m);
    })();
    return () => { cancelled = true; };
  }, [key]);
  return map;
}

// Shape raw matches into team-aware history rows from `ownerId`'s perspective.
function buildTeamHistory(ownerId, matches, dir) {
  if (!matches || !ownerId) return [];
  return matches.slice(0, 12).map(m => {
    const ownerIsA = m.player_a === ownerId || m.player_a2 === ownerId;
    const aIds = [m.player_a, m.player_a2].filter(Boolean);
    const bIds = [m.player_b, m.player_b2].filter(Boolean);
    const ourIds = ownerIsA ? aIds : bIds;
    const oppIds = ownerIsA ? bIds : aIds;

    const handleOf = (id) => {
      if (id === m.player_a && m.player_a_profile) return m.player_a_profile.handle;
      if (id === m.player_b && m.player_b_profile) return m.player_b_profile.handle;
      return (dir[id] && dir[id].handle) || null;
    };
    const mk = (ids) => ids.map(id => ({ id, handle: handleOf(id) }));

    let result;
    if (m.status !== 'completed') result = m.status === 'active' ? 'W' : 'H';
    else if (m.result === 'H') result = 'H';
    else result = ((m.result === 'A' && ownerIsA) || (m.result === 'B' && !ownerIsA)) ? 'W' : 'L';

    const oppTeam = mk(oppIds);
    return {
      id: m.id,
      is2v2: m.match_type === '2v2',
      ourTeam: mk(ourIds),
      oppTeam,
      // Joined string kept for the scorecard hero ("vs …").
      opp: oppTeam.map(x => (x.handle ? formatHandle(x.handle) : '?')).join(' + '),
      result,
      margin: m.final_margin || (m.status === 'active' ? 'Live' : m.status === 'waiting' ? 'Waiting' : 'AS'),
      week: '',
    };
  });
}

// One clickable @handle. stopPropagation so it never triggers the row.
function HandleChip({ member, onOpenProfile }) {
  if (!member.handle) return <span style={{ opacity: 0.5 }}>…</span>;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpenProfile(member.handle); }}
      style={{
        background: 'transparent', border: 'none', padding: 0, margin: 0,
        color: 'var(--forest)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
      }}
    >
      {formatHandle(member.handle)}
    </button>
  );
}

function TeamHandles({ members, onOpenProfile }) {
  return (
    <>
      {members.map((mem, i) => (
        <React.Fragment key={mem.id || i}>
          {i > 0 && <span style={{ opacity: 0.45 }}> + </span>}
          <HandleChip member={mem} onOpenProfile={onOpenProfile}/>
        </React.Fragment>
      ))}
    </>
  );
}

// A single match-history row: clickable handles + a score that opens the card.
function MatchHistoryRow({ row, last, onOpenProfile, onOpenCard }) {
  const isW = row.result === 'W', isL = row.result === 'L';
  const badgeStyle = isW
    ? { background: 'var(--forest)', color: 'var(--cream)', border: 'none' }
    : isL
    ? { background: '#C44536', color: '#FFFFFF', border: 'none' }
    : { background: 'var(--paper)', color: 'var(--forest)', border: '1px solid rgba(28,73,42,0.25)' };
  const marginColor = isW ? 'var(--forest)' : isL ? 'var(--forest)' : '#8A6A4A';
  const marginOpacity = isL ? 0.55 : 1;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 14px',
      borderBottom: last ? 'none' : '1px solid rgba(14,28,19,0.05)',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 13, ...badgeStyle,
      }}>{row.result}</div>

      <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--ink)', lineHeight: 1.45 }}>
        <TeamHandles members={row.ourTeam} onOpenProfile={onOpenProfile}/>
        <span style={{ opacity: 0.5, margin: '0 6px' }}>vs</span>
        <TeamHandles members={row.oppTeam} onOpenProfile={onOpenProfile}/>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onOpenCard(); }} style={{
        display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0,
        background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 2px',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: marginColor, opacity: marginOpacity }}>{row.margin}</span>
        <Icon.Chevron dir="right" size={12} color="var(--forest)"/>
      </button>
    </div>
  );
}

// ─── "MON DD, YYYY · H:MM AM" from a timestamp (tee time + date) ──────
function formatTeeLine(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

// The 5 most-recent completed matches, each shaped into the exact pieces
// ShareResultCard renders (headline/summary/subline/cells/matchup) plus a
// tee-time date line. Booked matches take their tee time from the reserved
// tee slot; casual matches fall back to when they were played.
function useRecentMatchCards(userId, limit = 5) {
  const [cards, setCards] = React.useState(null);
  React.useEffect(() => {
    if (!userId) { setCards([]); return undefined; }
    let on = true;
    (async () => {
      const { data: ms } = await sbx.from('matches').select('*')
        .or(`player_a.eq.${userId},player_a2.eq.${userId},player_b.eq.${userId},player_b2.eq.${userId}`)
        .eq('status', 'completed').order('completed_at', { ascending: false }).limit(limit);
      if (!ms || !ms.length) { if (on) setCards([]); return; }
      const ids  = ms.map(m => m.id);
      const pids = [...new Set(ms.flatMap(m => [m.player_a, m.player_a2, m.player_b, m.player_b2]).filter(Boolean))];
      const [holesRes, psRes, bkRes] = await Promise.all([
        sbx.from('match_holes').select('match_id, hole_number, result').in('match_id', ids).order('hole_number'),
        sbx.from('profiles').select('id, first_name, handle, avatar_url').in('id', pids),
        sbx.from('bookings').select('match_id, tee_slots(starts_at)').in('match_id', ids),
      ]);
      if (!on) return;
      const byId = {}; (psRes.data || []).forEach(p => { byId[p.id] = p; });
      const holesByMatch = {};
      (holesRes.data || []).forEach(h => { (holesByMatch[h.match_id] = holesByMatch[h.match_id] || []).push(h); });
      const slotByMatch = {};
      (bkRes.data || []).forEach(b => {
        const s = b.tee_slots && b.tee_slots.starts_at;
        if (s && !slotByMatch[b.match_id]) slotByMatch[b.match_id] = s;
      });
      const nm = id => { const p = byId[id]; return p ? (p.first_name || p.handle) : 'Player'; };
      const av = id => ({ name: nm(id), avatar: byId[id] && byId[id].avatar_url });

      const out = ms.map(m => {
        const youAreA = m.player_a === userId || m.player_a2 === userId;
        const is2v2   = m.match_type === '2v2';
        const teamA = [m.player_a, m.player_a2].filter(Boolean).map(nm).join(' + ');
        const teamB = [m.player_b, m.player_b2].filter(Boolean).map(nm).join(' + ');
        const theirLabel = youAreA ? teamB : teamA;
        const yourLabel  = youAreA ? teamA : teamB;
        const won    = (m.result === 'A' && youAreA) || (m.result === 'B' && !youAreA);
        const halved = m.result === 'H';
        const margin = m.final_margin || '';
        const plain  = plainMargin ? plainMargin(margin) : margin;
        const headline = halved ? 'Halved' : won ? `W ${margin}` : `L ${margin}`;
        const summary  = halved ? 'All square — matched hole for hole.'
          : won ? `Beat ${theirLabel} · ${plain}` : `${theirLabel} took it · ${plain}`;
        const subline  = `${is2v2 ? `${yourLabel} vs ${theirLabel}` : `You vs ${theirLabel}`} · ${m.course_name || 'Sandbox'}`;
        const hs = (holesByMatch[m.id] || []).slice().sort((a, b) => a.hole_number - b.hole_number);
        const cells = hs.map(h => {
          const w = (h.result === 'A' && youAreA) || (h.result === 'B' && !youAreA);
          const l = (h.result === 'B' && youAreA) || (h.result === 'A' && !youAreA);
          return { n: h.hole_number, lab: h.result == null ? '' : w ? 'W' : l ? 'L' : 'H' };
        });
        const aIds = [m.player_a, m.player_a2].filter(Boolean);
        const bIds = [m.player_b, m.player_b2].filter(Boolean);
        const matchup = { yours: (youAreA ? aIds : bIds).map(av), theirs: (youAreA ? bIds : aIds).map(av) };
        const when = slotByMatch[m.id] || m.completed_at || m.started_at || m.created_at;
        return {
          matchId: m.id, headline, summary, subline, cells, totalHoles: m.total_holes,
          matchup, dateLine: formatTeeLine(when), completedAt: m.completed_at || m.created_at,
        };
      });
      if (on) setCards(out);
    })();
    return () => { on = false; };
  }, [userId, limit]);
  return cards;
}

// ─── Match card stack: the 5 most-recent matches as a tappable deck. ──
// Each card is the real ShareResultCard (static). Tap the top card to open
// the match; flick/swipe it aside to send it to the back and reveal the
// next. Mirrors the ImgStack pattern.
const STACK_DEPTH = [
  { ty: 0,  scale: 1,    rot: 0,    op: 1    },
  { ty: 16, scale: 0.96, rot: -2.5, op: 1    },
  { ty: 30, scale: 0.93, rot: 3,    op: 0.9  },
  { ty: 42, scale: 0.90, rot: -3.5, op: 0.72 },
  { ty: 52, scale: 0.88, rot: 3.5,  op: 0.52 },
];

function MatchCardStack({ cards, go }) {
  const deck = React.useMemo(() => (cards || []).slice(0, 5), [cards]);
  const [order, setOrder]       = React.useState(() => deck.map((_, i) => i));
  const [dragging, setDragging] = React.useState(false);
  const [flyOut, setFlyOut]     = React.useState(null); // { idx, dir }
  const [, force]               = React.useReducer(x => x + 1, 0);
  const startRef = React.useRef({ x: 0, y: 0, moved: 0 });
  const deltaRef = React.useRef({ dx: 0, dy: 0 });

  React.useEffect(() => { setOrder(deck.map((_, i) => i)); }, [deck.length]);

  const pointOf = (e) => {
    const t = e.touches && e.touches[0];
    return { x: (t || e).clientX, y: (t || e).clientY };
  };

  function beginDrag(e) {
    if (flyOut) return;
    const p = pointOf(e);
    startRef.current = { x: p.x, y: p.y, moved: 0 };
    deltaRef.current = { dx: 0, dy: 0 };
    setDragging(true);
  }

  React.useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const p = pointOf(e);
      const dx = p.x - startRef.current.x;
      const dy = p.y - startRef.current.y;
      startRef.current.moved = Math.max(startRef.current.moved, Math.abs(dx) + Math.abs(dy));
      deltaRef.current = { dx, dy };
      if (e.cancelable) e.preventDefault();
      force();
    };
    const end = () => {
      const { dx } = deltaRef.current;
      const moved = startRef.current.moved;
      setDragging(false);
      deltaRef.current = { dx: 0, dy: 0 };
      if (moved < 8) {
        // Treated as a tap → open the front match "regularly".
        const m = deck[order[0]];
        if (m) go({ screen: 'matchDetail', matchId: m.matchId });
        force();
        return;
      }
      if (order.length > 1 && Math.abs(dx) > 80) {
        setFlyOut({ idx: order[0], dir: dx < 0 ? -1 : 1 });
      } else {
        force();
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
  }, [dragging, order, deck]);

  // Once the flung card finishes its exit, drop it to the back of the deck.
  React.useEffect(() => {
    if (!flyOut) return;
    const t = setTimeout(() => {
      setOrder(o => [...o.slice(1), o[0]]);
      setFlyOut(null);
    }, 300);
    return () => clearTimeout(t);
  }, [flyOut]);

  if (!deck.length) return null;

  return (
    <div style={{ position: 'relative', height: 312, marginBottom: 14, touchAction: 'pan-y' }}>
      {order.map((cardIdx, pos) => {
        const m = deck[cardIdx];
        const d = STACK_DEPTH[Math.min(pos, STACK_DEPTH.length - 1)];
        const isFront  = pos === 0;
        const isFlying = flyOut && flyOut.idx === cardIdx;
        let transform;
        if (isFlying) {
          transform = `translate(${flyOut.dir * 520}px, 44px) rotate(${flyOut.dir * 22}deg)`;
        } else if (isFront && dragging) {
          const { dx, dy } = deltaRef.current;
          transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.04}deg)`;
        } else {
          transform = `translateY(${d.ty}px) scale(${d.scale}) rotate(${d.rot}deg)`;
        }
        return (
          <div
            key={m.matchId}
            onMouseDown={isFront ? beginDrag : undefined}
            onTouchStart={isFront ? beginDrag : undefined}
            style={{
              position: 'absolute', left: 0, right: 0, top: 0, margin: '0 auto',
              transform, transformOrigin: 'center top',
              transition: (isFront && dragging) ? 'none' : 'transform 0.32s cubic-bezier(0.32,1.12,0.35,1), opacity 0.3s',
              opacity: isFlying ? 0 : d.op,
              zIndex: isFlying ? 300 : 100 - pos,
              cursor: isFront ? 'grab' : 'default',
              pointerEvents: (isFront && !flyOut) ? 'auto' : 'none',
              willChange: 'transform',
            }}
          >
            <ShareResultCard
              plain
              headline={m.headline}
              summary={m.summary}
              subline={m.subline}
              cells={m.cells}
              totalHoles={m.totalHoles}
              matchup={m.matchup}
              dateLine={m.dateLine}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Match History Sheet ─────────────────────────────────────────────
function MatchHistorySheet({ history, ownerId, go, onClose }) {
  const [selectedMatch, setSelectedMatch] = React.useState(null);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}/>
      <div style={{ position: 'relative', background: 'var(--paper)', borderRadius: '24px 24px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(14,28,19,0.15)', margin: '14px auto 0' }}/>
        <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(14,28,19,0.07)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', lineHeight: 1 }}>Match history</div>
          <button onClick={onClose} style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(14,28,19,0.07)', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--forest)', cursor: 'pointer' }}>Done</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
          {history.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', opacity: 0.4 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)', marginBottom: 6 }}>No matches yet.</div>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {history.map((r, i) => (
                <MatchHistoryRow
                  key={r.id}
                  row={r}
                  last={i === history.length - 1}
                  onOpenProfile={(h) => { onClose(); go && go({ screen: 'profile', viewingHandle: h }); }}
                  onOpenCard={() => { onClose(); go && go({ screen: 'matchDetail', matchId: r.id }); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedMatch && (
        <MatchScorecardSheet
          match={selectedMatch}
          ownerId={ownerId}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}

// ─── Match Scorecard Sheet ────────────────────────────────────────────
function MatchScorecardSheet({ match, ownerId, onClose }) {
  const [detail, loading] = useCompletedMatchDetail(match.id);

  const isW = match.result === 'W';
  const isL = match.result === 'L';
  // Perspective = the profile being viewed (self or another player).
  const userId = ownerId || (MOCK.USER && MOCK.USER.id);

  // Determine the viewed player's side from detail (A or B) to translate
  // hole results. detail.player_a is only the primary; fall back to the
  // match row's team membership for 2v2 where the owner is player_a2/b2.
  const youSide = detail
    ? (detail.player_a === userId
        ? 'A'
        : ((match.ourTeam || []).some(m => m.id === detail.player_a) ? 'A' : 'B'))
    : null;

  // Map hole result (A/B/H) to user's perspective (W/L/H)
  function holeResult(h) {
    if (!h.result || h.result === 'H') return 'H';
    if (!youSide) return h.result;
    return h.result === youSide ? 'W' : 'L';
  }

  const margin = match.margin || '';
  const plain = plainMargin ? plainMargin(margin) : margin;
  const headline = isW ? `W ${margin}` : isL ? `L ${margin}` : 'Halved';
  const summary = isW ? `Beat ${match.opp} · ${plain}`
    : isL ? `${match.opp} took it · ${plain}`
    : 'All square — matched hole for hole.';
  const subline = `You vs ${match.opp}`;
  const cells = (detail && detail.holes) ? detail.holes.map(h => ({ n: h.hole_number, lab: h.result ? holeResult(h) : '' })) : [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(14,28,19,0.62)' }}/>
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '9% 20px 28px', overflowY: 'auto' }}>
        {loading ? (
          <SppLoader dark/>
        ) : (
          <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
            <ShareResultCard headline={headline} summary={summary} subline={subline} cells={cells} totalHoles={cells.length}/>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => shareResult && shareResult({ youWon: isW, halved: !isW && !isL, margin, theirLabel: match.opp })}
                style={{ flex: 1, padding: 15, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--cream)', color: 'var(--forest)', fontWeight: 800, fontSize: 14 }}>
                Share scorecard
              </button>
              <button onClick={onClose}
                style={{ flex: 1, padding: 15, borderRadius: 14, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(234,226,206,0.45)', color: 'var(--cream)', fontWeight: 800, fontSize: 14 }}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FollowListSheet({ userId, mode, viewerId, go, onClose }) {
  const [followerList, followerLoading] = useFollowers(mode === 'followers' ? userId : null);
  const [followingList, followingLoading] = useFollowing(mode === 'following' ? userId : null);
  const list = mode === 'followers' ? followerList : followingList;
  const loading = mode === 'followers' ? followerLoading : followingLoading;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}/>
      <div style={{ position: 'relative', background: 'var(--paper)', borderRadius: '24px 24px 0 0', maxHeight: '75vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(14,28,19,0.15)', margin: '14px auto 0' }}/>
        <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(14,28,19,0.07)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', lineHeight: 1 }}>
            {mode === 'followers' ? 'Followers' : 'Following'}
          </div>
          <button onClick={onClose} style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(14,28,19,0.07)', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--forest)', cursor: 'pointer' }}>Done</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <SppLoader/>
          ) : list.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)', marginBottom: 6 }}>
                {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
              </div>
            </div>
          ) : (
            list.map((p, i) => {
              const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.handle || '—';
              return (
                <button key={p.id} onClick={() => { onClose(); go({ screen: 'profile', viewingHandle: p.handle }); }} style={{
                  width: '100%', textAlign: 'left', padding: '12px 20px',
                  borderBottom: i < list.length - 1 ? '1px solid rgba(14,28,19,0.05)' : 'none',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <AvatarBy url={p.avatar_url} name={name} size={40}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--forest)' }}>{name}</div>
                    <div style={{ fontSize: 11, opacity: 0.55, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {p.handle ? `@${p.handle.replace(/^@/, '')}` : ''}
                      {p.sbx ? ` · SBX ${Number(p.sbx).toFixed(3)}` : ''}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Profile sheet ──────────────────────────────────────────────
function EditProfileSheet({ profile, onClose }) {
  const [firstName, setFirstName] = React.useState(profile.first_name || '');
  const [lastName,  setLastName]  = React.useState(profile.last_name  || '');
  const [handle,    setHandle]    = React.useState((profile.handle || '').replace(/^@/, ''));
  const [bio,       setBio]       = React.useState(profile.bio || '');
  const [home,      setHome]      = React.useState(profile.home_course || '');
  const [focused,   setFocused]   = React.useState(null);
  const [busy,      setBusy]      = React.useState(false);
  const [err,       setErr]       = React.useState('');

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function save() {
    setErr(''); setBusy(true);
    try {
      await updateProfile({
        userId: profile.id,
        first_name: firstName,
        last_name: lastName,
        handle, bio,
        home_course: home,
      });
      onClose();
    } catch (e) {
      setErr(e.message || 'Could not save.');
    }
    setBusy(false);
  }

  // ── Modern field styling: filled subtle background, no border by default,
  // ── thin forest border on focus.
  const fieldShell = (id) => ({
    background: focused === id ? '#FFFFFF' : '#F4EFE2',
    borderRadius: 14,
    padding: '12px 16px',
    border: focused === id ? '1.5px solid #1C492A' : '1.5px solid transparent',
    transition: 'border-color .15s, background .15s',
  });
  const inputBase = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    margin: 0, padding: 0,
    background: 'transparent',
    border: 'none',
    fontSize: 16, fontWeight: 500,
    color: '#0E1C13',
    fontFamily: 'inherit',
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    lineHeight: 1.3,
  };
  const inputLabel = {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(14,28,19,0.55)',
    marginBottom: 4,
    letterSpacing: '0.01em',
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(14,28,19,0.55)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 440,
        background: '#FFFFFF',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        boxShadow: '0 -24px 72px rgba(0,0,0,0.35)',
        maxHeight: '94vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Drag handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 999,
          background: 'rgba(14,28,19,0.16)',
          margin: '10px auto 0',
        }}/>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 22px 18px',
        }}>
          <button onClick={busy ? undefined : onClose} style={{
            background: 'transparent', border: 'none', color: '#1C492A',
            fontSize: 15, fontWeight: 500,
            opacity: busy ? 0.4 : 0.75, cursor: busy ? 'wait' : 'pointer',
            padding: 0,
          }}>Cancel</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0E1C13' }}>
            Edit profile
          </div>
          <button
            onClick={busy ? undefined : save}
            disabled={busy}
            style={{
              background: 'transparent', border: 'none',
              color: '#1C492A', fontSize: 15, fontWeight: 700,
              opacity: busy ? 0.4 : 1, cursor: busy ? 'wait' : 'pointer',
              padding: 0,
            }}>{busy ? 'Saving…' : 'Save'}</button>
        </div>

        {/* Body */}
        <div style={{
          padding: '4px 22px 24px',
          overflowY: 'auto', flex: 1,
        }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ ...fieldShell('first'), flex: 1, minWidth: 0 }}>
              <label style={inputLabel}>First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onFocus={() => setFocused('first')}
                onBlur={() => setFocused(null)}
                disabled={busy}
                autoFocus
                style={inputBase}
              />
            </div>
            <div style={{ ...fieldShell('last'), flex: 1, minWidth: 0 }}>
              <label style={inputLabel}>Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onFocus={() => setFocused('last')}
                onBlur={() => setFocused(null)}
                disabled={busy}
                style={inputBase}
              />
            </div>
          </div>

          <div style={{ ...fieldShell('handle'), marginBottom: 4 }}>
            <label style={inputLabel}>Username</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(14,28,19,0.4)', lineHeight: 1.3 }}>@</span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/^@/, '').toLowerCase())}
                onFocus={() => setFocused('handle')}
                onBlur={() => setFocused(null)}
                disabled={busy}
                placeholder="yourhandle"
                style={inputBase}
              />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(14,28,19,0.5)', padding: '6px 4px 16px' }}>
            Letters, numbers, _ and . — 2 to 24 characters.
          </div>

          <div style={{ ...fieldShell('home'), marginBottom: 12 }}>
            <label style={inputLabel}>Home course</label>
            <input
              type="text"
              value={home}
              onChange={(e) => setHome(e.target.value)}
              onFocus={() => setFocused('home')}
              onBlur={() => setFocused(null)}
              disabled={busy}
              placeholder="e.g. Melreese"
              style={inputBase}
            />
          </div>

          <div style={{ ...fieldShell('bio'), marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <label style={inputLabel}>Bio</label>
              <span style={{
                fontSize: 11,
                color: bio.length >= 200 ? '#C44536' : 'rgba(14,28,19,0.4)',
                fontVariantNumeric: 'tabular-nums',
              }}>{bio.length}/200</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onFocus={() => setFocused('bio')}
              onBlur={() => setFocused(null)}
              disabled={busy}
              maxLength={200}
              placeholder="A line about your game…"
              rows={3}
              style={{
                ...inputBase,
                minHeight: 64,
                resize: 'none',
                lineHeight: 1.4,
              }}
            />
          </div>

          {err && (
            <div style={{
              background: 'rgba(196,69,54,0.08)',
              color: '#9C2E22',
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 13, fontWeight: 500,
              marginTop: 16,
            }}>{err}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loyalty points card (self) ──────────────────────────────────────
function LoyaltyCard({ userId }) {
  const [balance, recent] = useLoyalty(userId);
  const lastBonus = (recent || []).find(r => r.reason === 'Detailed tracking bonus');
  return (
    <div style={{ padding: '22px 16px 0' }}>
      <div style={{
        borderRadius: 'var(--radius-card-lg)', padding: 18, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--clay) 0%, #C98A4E 100%)', color: 'var(--forest-deep)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700 }}>Sandbox Points</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, marginTop: 6 }}>{balance.toLocaleString()}</div>
          </div>
          <span style={{ fontSize: 34 }}>🎁</span>
        </div>
        <div style={{ fontSize: 12, marginTop: 10, opacity: 0.85, lineHeight: 1.4, fontWeight: 600 }}>
          Earn points every match — and <strong>bonus points</strong> for logging ball position while you score.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProfileScreen, RealSbxCard, sbxTier });
