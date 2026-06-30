/* global React, Row, Field, Spinner, useUsers, setUserTier, setUserAdmin, useGuestPasses, grantGuestPass, revokeGuestPass, useCourses, useManagedCourses, useManagerIds, addCourseManager, removeCourseManager */
// Users module: search players, set membership tier, toggle admin, manage
// guest passes, and assign course-partner (manager) access.
// Needs v1/sql/membership.sql + v1/sql/course-managers.sql applied.

const TIERS = [
  ['walkup', 'Walk-up'],
  ['stats',  'Stats Add-On'],
  ['league', 'League'],
  ['plus',   'Plus'],
];
const tierLabel = (t) => (TIERS.find(x => x[0] === t) || [t, t || '—'])[1];

function userName(u) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || (u.handle ? `@${String(u.handle).replace(/^@/, '')}` : 'Unnamed');
}

// Role buckets for the segment filter. Admin wins over manager so the groups
// are mutually exclusive.
function roleOf(u, managerIds) {
  if (u.is_admin) return 'admin';
  if (managerIds && managerIds.has(u.id)) return 'manager';
  return 'regular';
}
const ROLE_TABS = [
  ['all', 'All'],
  ['admin', 'Admins'],
  ['manager', 'Managers'],
  ['regular', 'Regular'],
];

function UsersModule({ adminId }) {
  const [query, setQuery] = React.useState('');
  const [role, setRole] = React.useState('all');
  const [users, error, reload] = useUsers(query);
  const managerIds = useManagerIds();
  const [selected, setSelected] = React.useState(null);

  if (error === 'MIGRATION') return <MigrationNeeded/>;

  if (selected) {
    return (
      <UserDetail
        user={selected}
        adminId={adminId}
        onBack={() => { setSelected(null); reload(); }}
      />
    );
  }

  const counts = { all: (users || []).length, admin: 0, manager: 0, regular: 0 };
  (users || []).forEach(u => { counts[roleOf(u, managerIds)] += 1; });
  const shown = (users || []).filter(u => role === 'all' || roleOf(u, managerIds) === role);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Row>
        <Field label="Search players" full>
          <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="name or @handle"/>
        </Field>
      </Row>

      {/* Role segment */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {ROLE_TABS.map(([key, label]) => {
          const on = role === key;
          return (
            <button key={key} onClick={() => setRole(key)} style={{
              padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700,
              border: on ? '1px solid var(--forest)' : '1px solid rgba(14,28,19,0.15)',
              background: on ? 'var(--forest)' : 'transparent', color: on ? 'var(--cream)' : 'var(--ink-soft)',
            }}>{label} <span style={{ opacity: 0.7, fontFamily: 'var(--font-mono)' }}>{counts[key]}</span></button>
          );
        })}
      </div>

      {error && <div style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{error}</div>}

      {users === null ? <Spinner/> : shown.length === 0 ? (
        <div className="card" style={{ padding: 30, textAlign: 'center', opacity: 0.7, fontSize: 14 }}>No {role === 'all' ? 'players' : ROLE_TABS.find(t => t[0] === role)[1].toLowerCase()} found.</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {shown.map((u, i) => (
            <button key={u.id} onClick={() => setSelected(u)} style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
              padding: '13px 16px', background: 'transparent', cursor: 'pointer',
              border: 'none', borderBottom: i < shown.length - 1 ? 'var(--hairline)' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                  {userName(u)}
                  {u.is_admin && <span style={{ marginLeft: 8, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.7 }}>ADMIN</span>}
                  {!u.is_admin && managerIds && managerIds.has(u.id) && <span style={{ marginLeft: 8, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.7 }}>MANAGER</span>}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                  {u.handle ? `@${String(u.handle).replace(/^@/, '')}` : '—'} · SBX {u.sbx != null ? Number(u.sbx).toFixed(3) : '—'}
                </div>
              </div>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 999, background: 'rgba(28,73,42,0.1)', color: 'var(--forest)',
              }}>{tierLabel(u.tier)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserDetail({ user, adminId, onBack }) {
  const [tier, setTier] = React.useState(user.tier || 'walkup');
  const [isAdmin, setIsAdmin] = React.useState(!!user.is_admin);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [note, setNote] = React.useState('');
  const [passes, reloadPasses] = useGuestPasses(user.id);
  const isSelf = adminId === user.id;

  async function changeTier(next) {
    setBusy(true); setErr('');
    try { await setUserTier(user.id, next); setTier(next); }
    catch (e) { setErr(e.message || 'Could not update tier.'); }
    setBusy(false);
  }
  async function toggleAdmin() {
    if (isSelf) return; // never let an admin remove their own access here
    setBusy(true); setErr('');
    try { await setUserAdmin(user.id, !isAdmin); setIsAdmin(!isAdmin); }
    catch (e) { setErr(e.message || 'Could not update admin.'); }
    setBusy(false);
  }
  async function grant() {
    setBusy(true); setErr('');
    try { await grantGuestPass({ userId: user.id, grantedBy: adminId, note }); setNote(''); await reloadPasses(); }
    catch (e) { setErr(e.message || 'Could not grant pass.'); }
    setBusy(false);
  }
  async function revoke(id) {
    setBusy(true); setErr('');
    try { await revokeGuestPass(id); await reloadPasses(); }
    catch (e) { setErr(e.message || 'Could not revoke pass.'); }
    setBusy(false);
  }

  // Tier entitlement summary: League = 2 / month, Plus = unlimited, plus any
  // admin-comped ('available') passes on top.
  const monthStart = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
  const isThisMonth = (iso) => iso && new Date(iso) >= monthStart;
  const usedTierThisMonth = (passes || []).filter(p => (p.source || 'grant') === 'tier' && p.status === 'used' && isThisMonth(p.used_at)).length;
  const bonusAvailable = (passes || []).filter(p => p.status === 'available').length;
  const allowanceText =
      tier === 'plus'   ? 'Unlimited · Plus'
    : tier === 'league' ? `${Math.max(0, 2 - usedTierThisMonth)} of 2 left this month`
    :                     'No monthly passes';
  const summaryRight = allowanceText + (bonusAvailable ? ` · ${bonusAvailable} comped` : '');

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 18 }}>← Back to users</button>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--forest)' }}>{userName(user)}</div>
      <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2, marginBottom: 18 }}>
        {user.handle ? `@${String(user.handle).replace(/^@/, '')}` : '—'} · SBX {user.sbx != null ? Number(user.sbx).toFixed(3) : '—'}
      </div>

      {err && <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}

      {/* Membership + admin */}
      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Membership & access</div>
        <Row>
          <Field label="Membership tier">
            <select className="select" value={tier} disabled={busy} onChange={e => changeTier(e.target.value)}>
              {TIERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Admin access">
            <button className={isAdmin ? 'btn btn-forest' : 'btn btn-ghost'} onClick={toggleAdmin} disabled={busy || isSelf} style={{ width: '100%' }}>
              {isAdmin ? 'Admin ✓' : 'Not admin'}
            </button>
          </Field>
        </Row>
        {isSelf && <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>You can't change your own admin access here.</div>}
      </div>

      {/* Course-partner access */}
      <CourseAccess user={user} adminId={adminId}/>

      {/* Guest passes */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div className="eyebrow">Guest passes</div>
          <div style={{ fontSize: 12, opacity: 0.7, fontFamily: 'var(--font-mono)', color: 'var(--forest)' }}>{summaryRight}</div>
        </div>
        <Row>
          <Field label="Grant a pass — note (optional)"><input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. comped for the launch"/></Field>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-forest" onClick={grant} disabled={busy}>+ Grant pass</button>
          </div>
        </Row>
        {passes === null ? <Spinner/> : passes.length === 0 ? (
          <div style={{ fontSize: 13, opacity: 0.6, padding: '8px 0' }}>No guest passes yet.</div>
        ) : (
          <div style={{ marginTop: 6 }}>
            {passes.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: 'var(--hairline)' }}>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '3px 9px', borderRadius: 999,
                  background: p.status === 'available' ? 'rgba(28,73,42,0.1)' : 'rgba(14,28,19,0.06)',
                  color: p.status === 'available' ? 'var(--forest)' : 'var(--ink-soft)',
                }}>{p.status}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{p.note || (p.source === 'tier' ? 'Monthly pass' : 'Comped')}</div>
                  {p.status === 'used' && p.used_at && (
                    <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                      used {new Date(p.used_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
                <button className="btn btn-danger" style={{ padding: '6px 10px' }} disabled={busy} onClick={() => revoke(p.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Assign this user as a manager of one or more courses. Gives them the scoped
// course-partner portal (live play, tee times, yardages, financials) for those
// courses only — enforced by RLS in course-managers.sql.
function CourseAccess({ user, adminId }) {
  const [managed, reloadManaged] = useManagedCourses(user.id);
  const [courses] = useCourses();
  const [pick, setPick] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  async function add() {
    if (!pick) return;
    setBusy(true); setErr('');
    try { await addCourseManager({ userId: user.id, courseId: pick, createdBy: adminId }); setPick(''); await reloadManaged(); }
    catch (e) { setErr(e.message || 'Could not assign.'); }
    setBusy(false);
  }
  async function remove(id) {
    setBusy(true); setErr('');
    try { await removeCourseManager(id); await reloadManaged(); }
    catch (e) { setErr(e.message || 'Could not remove.'); }
    setBusy(false);
  }

  const managedIds = new Set((managed || []).map(m => m.course_id));
  const available = (courses || []).filter(c => !managedIds.has(c.id));

  return (
    <div className="card" style={{ padding: 22, marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 4 }}>Course access · partner portal</div>
      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 14 }}>
        Managers sign in at admin.sbx.golf and see only their course — live play, tee times, yardages, and financials.
      </div>

      {err && <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}

      {managed === undefined ? <Spinner/> : (managed.length === 0 ? (
        <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 12 }}>Not a manager of any course yet.</div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          {managed.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: 'var(--hairline)' }}>
              <span style={{ fontSize: 16 }}>⛳</span>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{m.course ? m.course.short_name : 'Course'}</div>
              <button className="btn btn-danger" style={{ padding: '6px 10px' }} disabled={busy} onClick={() => remove(m.id)}>Remove</button>
            </div>
          ))}
        </div>
      ))}

      <Row>
        <Field label="Grant access to a course">
          <select className="select" value={pick} onChange={e => setPick(e.target.value)} disabled={busy || !available.length}>
            <option value="">{available.length ? 'Select a course…' : 'Manages every course'}</option>
            {available.map(c => <option key={c.id} value={c.id}>{c.short_name}</option>)}
          </select>
        </Field>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-forest" onClick={add} disabled={busy || !pick}>+ Add course</button>
        </div>
      </Row>
    </div>
  );
}

function MigrationNeeded() {
  return (
    <div className="card" style={{ padding: 36, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 34 }}>🗄️</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', marginTop: 10 }}>One setup step needed</div>
      <div style={{ fontSize: 14, opacity: 0.75, marginTop: 8, lineHeight: 1.5 }}>
        The Users module needs the membership data in the database. Run
        <strong> v1/sql/membership.sql</strong> in Supabase (SQL Editor), then reload this page.
      </div>
    </div>
  );
}

Object.assign(window, { UsersModule });
