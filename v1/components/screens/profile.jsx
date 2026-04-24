/* global React, Icon, Button, Eyebrow, Chip, Dashed, MOCK, AvatarBy, useProfileByHandle, useFollowCounts, useIsFollowing, followUser, unfollowUser, uploadAvatar, updateProfile */
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
  const [editing, setEditing] = React.useState(false);

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

      {editing && isSelf && (
        <EditProfileSheet
          profile={signedInProfile}
          onClose={() => setEditing(false)}
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

// ─── Edit Profile sheet ──────────────────────────────────────────────
function EditProfileSheet({ profile, onClose }) {
  const [firstName, setFirstName] = React.useState(profile.first_name || '');
  const [lastName,  setLastName]  = React.useState(profile.last_name  || '');
  const [handle,    setHandle]    = React.useState((profile.handle || '').replace(/^@/, ''));
  const [bio,       setBio]       = React.useState(profile.bio || '');
  const [home,      setHome]      = React.useState(profile.home_course || '');
  const [busy,      setBusy]      = React.useState(false);
  const [err,       setErr]       = React.useState('');

  // Lock background scroll while sheet is open.
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function save() {
    setErr(''); setBusy(true);
    try {
      await updateProfile({
        userId:      profile.id,
        first_name:  firstName,
        last_name:   lastName,
        handle,
        bio,
        home_course: home,
      });
      onClose();
    } catch (e) {
      setErr(e.message || 'Could not save.');
    }
    setBusy(false);
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(14,28,19,0.65)', backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--canvas)',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        boxShadow: '0 -20px 60px rgba(0,0,0,0.3)',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header (sticky) */}
        <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid rgba(14,28,19,0.06)' }}>
          <div style={{
            width: 38, height: 4, borderRadius: 999,
            background: 'rgba(14,28,19,0.18)', margin: '0 auto 14px',
          }}/>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--forest)', lineHeight: 1 }}>
              Edit profile
            </div>
            <button onClick={busy ? undefined : onClose} style={{
              background: 'transparent', border: 'none', color: 'var(--forest)',
              fontSize: 13, fontWeight: 700, opacity: busy ? 0.4 : 0.7, cursor: busy ? 'wait' : 'pointer',
              padding: '4px 0',
            }}>Cancel</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '18px 20px 12px', overflowY: 'auto', flex: 1 }}>
          <SectionLabel>Identity</SectionLabel>
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="First name" value={firstName} onChange={setFirstName} disabled={busy} autoFocus/>
            <Field label="Last name"  value={lastName}  onChange={setLastName}  disabled={busy}/>
          </div>
          <Field
            label="Username"
            value={handle}
            onChange={(v) => setHandle(v.replace(/^@/, '').toLowerCase())}
            prefix="@"
            disabled={busy}
            hint="Letters, numbers, _ and . — 2 to 24 characters"
            placeholder="yourhandle"
          />

          <div style={{ height: 8 }}/>
          <SectionLabel>About</SectionLabel>
          <Field
            label="Home course"
            value={home}
            onChange={setHome}
            disabled={busy}
            placeholder="e.g. Melreese"
          />
          <Field
            label="Bio"
            value={bio}
            onChange={setBio}
            disabled={busy}
            multiline
            maxLength={200}
            placeholder="A line about your game…"
            counter
          />

          {err && (
            <div style={{
              background: 'rgba(196,69,54,0.08)',
              border: '1px solid rgba(196,69,54,0.25)',
              color: '#9C2E22',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13, fontWeight: 600,
              marginTop: 8,
            }}>{err}</div>
          )}
        </div>

        {/* Footer (sticky) */}
        <div style={{
          padding: '14px 20px 22px',
          borderTop: '1px solid rgba(14,28,19,0.06)',
          background: 'var(--canvas)',
        }}>
          <Button variant="forest" full size="md" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: 'var(--font-mono)',
      color: 'var(--forest)', opacity: 0.55,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      marginBottom: 10,
    }}>{children}</div>
  );
}

function Field({ label, value, onChange, prefix, disabled, multiline, maxLength, placeholder, hint, counter, autoFocus }) {
  const [focused, setFocused] = React.useState(false);
  const inputStyle = {
    width: '100%',
    display: 'block',
    background: focused ? '#FFFFFF' : '#F5F1E8',
    border: focused ? '1.5px solid var(--forest)' : '1.5px solid rgba(14,28,19,0.12)',
    borderRadius: 12,
    padding: prefix ? '13px 14px 13px 30px' : '13px 14px',
    fontSize: 15, fontWeight: 600, color: 'var(--ink)',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    resize: multiline ? 'vertical' : 'none',
    minHeight: multiline ? 88 : 'auto',
    lineHeight: 1.4,
    transition: 'border-color .12s, background .12s',
    boxSizing: 'border-box',
  };
  return (
    <div style={{ marginBottom: 14, flex: 1, minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 6,
      }}>
        <label style={{
          fontSize: 11, fontFamily: 'var(--font-mono)',
          color: 'var(--forest)', opacity: 0.7,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          fontWeight: 700,
        }}>{label}</label>
        {counter && maxLength && (
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-mono)',
            color: (value || '').length >= maxLength ? 'var(--clay)' : 'var(--forest)',
            opacity: 0.55,
          }}>{(value || '').length}/{maxLength}</span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: 14,
            top: multiline ? 14 : '50%',
            transform: multiline ? 'none' : 'translateY(-50%)',
            color: 'var(--forest)', opacity: 0.5, fontSize: 15, fontWeight: 700,
            pointerEvents: 'none', zIndex: 1,
          }}>{prefix}</span>
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            maxLength={maxLength}
            placeholder={placeholder}
            rows={3}
            style={inputStyle}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            maxLength={maxLength}
            placeholder={placeholder}
            autoFocus={autoFocus}
            style={inputStyle}
          />
        )}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: 'var(--ink)', opacity: 0.55, marginTop: 6, fontStyle: 'italic' }}>{hint}</div>
      )}
    </div>
  );
}

Object.assign(window, { ProfileScreen });
