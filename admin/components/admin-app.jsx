/* global React, ReactDOM, sbx, useSession, useProfile, signOut, Mascot, CoursesModule, TeeSlotsModule, BookingsModule, EventsModule, UsersModule, useManagedCourses, ManagerPortal */
// Sandbox Admin — app shell: login → role gate → dashboard.
//   • is_admin            → full Sandbox admin dashboard (all courses)
//   • manages a course    → scoped course-partner portal (their course only)
//   • neither             → not authorised
// Later phases fill each module's content in.

// ─── Module registry (content fills in over later phases) ────────────
const MODULES = [
  { id: 'courses',   label: 'Courses',    icon: '⛳', hint: 'Courses, holes & tee boxes' },
  { id: 'teeSlots',  label: 'Tee slots',  icon: '🕒', hint: 'Availability & pricing' },
  { id: 'users',     label: 'Users',      icon: '👤', hint: 'Membership & guest passes' },
  { id: 'bookings',  label: 'Bookings',   icon: '📋', hint: 'Reservations' },
  { id: 'events',    label: 'Events',     icon: '🏆', hint: 'Tournaments & league nights' },
];

// ─── Root: session → admin gate ──────────────────────────────────────
function Root() {
  const session = useSession();
  if (session === undefined) return <Splash/>;
  if (!session) return <LoginScreen/>;
  return <Authed session={session}/>;
}

function Authed({ session }) {
  const [profile] = useProfile(session.user.id);
  if (profile === undefined) return <Splash/>;
  if (profile && profile.is_admin) return <Dashboard profile={profile}/>;
  // Not an admin — they might still be a course partner.
  return <ManagerGate session={session} profile={profile}/>;
}

// Non-admins: if they manage a course, show the scoped partner portal; else block.
function ManagerGate({ session, profile }) {
  const [courses] = useManagedCourses(session.user.id);
  if (courses === undefined) return <Splash/>;
  if (!courses.length) return <NotAuthorised email={session.user.email}/>;
  return <ManagerPortal session={session} profile={profile} courses={courses}/>;
}

function Splash() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', justifyContent: 'center' }}>
      <Mascot size={114}/>
      <div className="spin"/>
    </div>
  );
}

// ─── Login ───────────────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const { error } = await sbx.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setErr(error.message || 'Could not sign in.'); setBusy(false); }
    // success → useSession picks up the new session and re-renders Root
  }

  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--cream)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, opacity: 0.85 };
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form onSubmit={submit} className="card" style={{ width: '100%', maxWidth: 380, padding: 36, background: 'var(--forest)', border: 'none', textAlign: 'center' }}>
        <Mascot size={168} style={{ margin: '0 auto 18px' }}/>
        <img src="assets/wordmark-cream.svg" alt="Sandbox" style={{ height: 42, display: 'block', margin: '0 auto' }}/>
        <div className="eyebrow" style={{ marginTop: 10, color: 'var(--cream)', opacity: 0.65 }}>Admin &amp; course portal</div>

        <div style={{ marginTop: 26, textAlign: 'left' }}>
          <label style={labelStyle}>Email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus placeholder="you@sbx.golf"/>
        </div>
        <div style={{ marginTop: 14, textAlign: 'left' }}>
          <label style={labelStyle}>Password</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"/>
        </div>

        {err && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--forest)', background: 'var(--cream)', padding: '10px 12px', borderRadius: 10, fontWeight: 600 }}>{err}</div>}

        <button type="submit" disabled={busy || !email || !password} style={{
          width: '100%', marginTop: 22, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'var(--cream)', color: 'var(--forest)', fontWeight: 800, fontSize: 15,
          opacity: (busy || !email || !password) ? 0.55 : 1,
        }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <div style={{ fontSize: 12, color: 'var(--cream)', opacity: 0.6, marginTop: 16, lineHeight: 1.5 }}>
          Use your Sandbox account. Admin access only.
        </div>
      </form>
    </div>
  );
}

function NotAuthorised({ email }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 32, textAlign: 'center' }}>
        <Mascot size={150} style={{ margin: '0 auto' }}/>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--forest)', marginTop: 14 }}>Not authorised</div>
        <div style={{ fontSize: 14, opacity: 0.7, marginTop: 8, lineHeight: 1.5 }}>
          <strong>{email}</strong> isn't an admin account. Ask Daniel or Rob to grant access.
        </div>
        <button className="btn btn-ghost" onClick={signOut} style={{ marginTop: 22 }}>Sign out</button>
      </div>
    </div>
  );
}

// ─── Dashboard shell ─────────────────────────────────────────────────
function Dashboard({ profile }) {
  const [view, setView] = React.useState('courses');
  const active = MODULES.find(m => m.id === view) || MODULES[0];
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Admin';

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{
        width: 248, flexShrink: 0, background: 'var(--forest-dark)', color: 'var(--cream)',
        display: 'flex', flexDirection: 'column', padding: '22px 14px',
      }}>
        <div style={{ padding: '0 10px 18px' }}>
          <img src="assets/wordmark-cream.svg" alt="Sandbox" style={{ height: 33, display: 'block' }}/>
          <div className="eyebrow" style={{ color: 'var(--cream)', opacity: 0.6, marginTop: 6 }}>Admin</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {MODULES.map(m => {
            const on = m.id === view;
            return (
              <button key={m.id} onClick={() => setView(m.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                padding: '11px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: on ? 'rgba(234,226,206,0.14)' : 'transparent',
                color: 'var(--cream)', opacity: on ? 1 : 0.72, fontSize: 14, fontWeight: 700,
              }}>
                <span style={{ fontSize: 16 }}>{m.icon}</span>
                {m.label}
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: '1px solid rgba(234,226,206,0.15)', paddingTop: 14, marginTop: 14 }}>
          <div style={{ fontSize: 12, opacity: 0.7, padding: '0 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <button onClick={signOut} style={{
            marginTop: 8, width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8,
            background: 'transparent', border: '1px solid rgba(234,226,206,0.2)', color: 'var(--cream)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: 0.8,
          }}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '22px 28px 16px', borderBottom: 'var(--hairline)', background: 'var(--paper)' }}>
          <div className="eyebrow">{active.hint}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--forest)', lineHeight: 1, marginTop: 4 }}>{active.label}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          <ModuleView id={view} profile={profile}/>
        </div>
      </div>
    </div>
  );
}

// ─── Module content ──────────────────────────────────────────────────
function ModuleView({ id, profile }) {
  if (id === 'courses') return <CoursesModule/>;
  if (id === 'teeSlots') return <TeeSlotsModule/>;
  if (id === 'bookings') return <BookingsModule/>;
  if (id === 'events') return <EventsModule/>;
  if (id === 'users') return <UsersModule adminId={profile && profile.id}/>;
  return (
    <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
      <div style={{ fontSize: 36 }}>{(MODULES.find(m => m.id === id) || {}).icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', marginTop: 10 }}>Coming next</div>
      <div style={{ fontSize: 14, opacity: 0.7, marginTop: 8, lineHeight: 1.5 }}>
        This module is scaffolded and will be filled in next.
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
