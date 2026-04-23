/* global React, Button, Eyebrow, Wordmark, Ostrich, Icon, sbx */
// Welcome / Sign-up / Sign-in screens.
// Shown when there's no active Supabase session (handled by AuthGate in index.html).

function AuthScreens() {
  const [view, setView] = React.useState('welcome'); // welcome | signin | signup

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--cream)',
      overflow: 'auto',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Decorative grain + mascot */}
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <img src="assets/mascot-full-cream.svg" alt="" aria-hidden="true" style={{
        position: 'absolute', right: -30, bottom: -40, width: 220, opacity: 0.08,
        transform: 'rotate(-8deg)', pointerEvents: 'none',
      }}/>

      {view === 'welcome' && <WelcomeView onSignUp={() => setView('signup')} onSignIn={() => setView('signin')}/>}
      {view === 'signup'  && <SignUpView  onBack={() => setView('welcome')} onSignInInstead={() => setView('signin')}/>}
      {view === 'signin'  && <SignInView  onBack={() => setView('welcome')} onSignUpInstead={() => setView('signup')}/>}
    </div>
  );
}

// ─── Welcome ─────────────────────────────────────────────────
function WelcomeView({ onSignUp, onSignIn }) {
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '80px 28px 32px' }}>
      <Wordmark variant="cream" size={160}/>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.92, letterSpacing: '-0.02em', marginTop: 28 }}>
        Pitch &<br/>putt,<br/>rated.
      </div>
      <div className="caption-serif" style={{ fontSize: 18, marginTop: 18, opacity: 0.8, maxWidth: 320 }}>
        Miami's match-play league. Real matches, real ratings, bragging rights.
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
        <Button variant="primary" size="lg" full onClick={onSignUp}>
          Create account
          <Icon.ArrowRight size={16}/>
        </Button>
        <Button variant="outlineCream" size="lg" full onClick={onSignIn}>
          I already have an account
        </Button>
      </div>

      <div style={{ fontSize: 10, opacity: 0.55, textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        v1 prototype · real data · real matches
      </div>
    </div>
  );
}

// ─── Sign Up ─────────────────────────────────────────────────
function SignUpView({ onBack, onSignInInstead }) {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName]   = React.useState('');
  const [gender, setGender]       = React.useState('');
  const [dob, setDob]             = React.useState('');
  const [email, setEmail]         = React.useState('');
  const [password, setPassword]   = React.useState('');
  const [busy, setBusy]           = React.useState(false);
  const [err, setErr]             = React.useState('');

  const valid = firstName.trim() && lastName.trim() && email.trim() && password.length >= 6;

  async function submit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setErr('');

    // 1) Create auth user
    const { data: signUpData, error: signUpErr } = await sbx.auth.signUp({ email, password });
    if (signUpErr) {
      setErr(signUpErr.message);
      setBusy(false);
      return;
    }

    const user = signUpData.user;
    if (!user) {
      setErr('Sign-up did not return a user. Check your email confirmation settings.');
      setBusy(false);
      return;
    }

    // 2) Insert profile row. The session may not be live yet if email-confirm
    // is enabled in Supabase; in that case we'll prompt the user to confirm
    // and set up their profile on first sign-in.
    const sessionNow = signUpData.session;
    if (!sessionNow) {
      setErr('Account created. Check your email for a confirmation link, then sign in.');
      setBusy(false);
      return;
    }

    const handle = await generateHandle(firstName, lastName);
    const { error: profileErr } = await sbx.from('profiles').insert({
      id: user.id,
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      gender: gender || null,
      dob:    dob    || null,
      handle,
    });
    if (profileErr) {
      setErr('Account created but profile save failed: ' + profileErr.message);
      setBusy(false);
      return;
    }
    // AuthGate will now redirect into the app automatically.
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 24px 24px' }}>
      <BackButton onClick={onBack}/>

      <div style={{ marginTop: 12 }}>
        <Eyebrow color="var(--cream)">Create your account</Eyebrow>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.95, marginTop: 10, letterSpacing: '-0.02em' }}>
          Let's get you<br/>rated.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 22 }}>
        <Row>
          <Field label="First name" required>
            <Input value={firstName} onChange={setFirstName} autoComplete="given-name"/>
          </Field>
          <Field label="Last name" required>
            <Input value={lastName} onChange={setLastName} autoComplete="family-name"/>
          </Field>
        </Row>

        <Row>
          <Field label="Gender">
            <Select value={gender} onChange={setGender} options={[
              ['',   '—'],
              ['male',   'Male'],
              ['female', 'Female'],
              ['other',  'Other'],
              ['skip',   'Prefer not to say'],
            ]}/>
          </Field>
          <Field label="Date of birth">
            <Input value={dob} onChange={setDob} type="date"/>
          </Field>
        </Row>

        <Field label="Email" required>
          <Input value={email} onChange={setEmail} type="email" autoComplete="email" autoCapitalize="off"/>
        </Field>
        <Field label="Password" required hint="At least 6 characters">
          <Input value={password} onChange={setPassword} type="password" autoComplete="new-password"/>
        </Field>
      </div>

      {err && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--loss-soft)', background: 'rgba(155,58,46,0.2)', padding: '10px 12px', borderRadius: 12 }}>{err}</div>}

      <div style={{ flex: 1 }}/>

      <Button variant="primary" size="lg" full disabled={!valid || busy} onClick={submit} style={{ marginTop: 18 }}>
        {busy ? 'Creating…' : 'Create account'}
        {!busy && <Icon.ArrowRight size={16}/>}
      </Button>

      <button type="button" onClick={onSignInInstead} style={{
        marginTop: 14, fontSize: 13, fontFamily: 'var(--font-mono)',
        color: 'var(--cream)', opacity: 0.7, textAlign: 'center',
        letterSpacing: '0.06em',
      }}>
        Already have an account? <u>Sign in</u>
      </button>
    </form>
  );
}

// ─── Sign In ─────────────────────────────────────────────────
function SignInView({ onBack, onSignUpInstead }) {
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy]         = React.useState(false);
  const [err, setErr]           = React.useState('');

  async function submit(e) {
    e.preventDefault();
    if (!email || !password || busy) return;
    setBusy(true); setErr('');
    const { error } = await sbx.auth.signInWithPassword({ email, password });
    if (error) { setErr(error.message); setBusy(false); return; }
    setBusy(false);
    // AuthGate picks up the new session automatically.
  }

  return (
    <form onSubmit={submit} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 24px 24px' }}>
      <BackButton onClick={onBack}/>

      <div style={{ marginTop: 12 }}>
        <Eyebrow color="var(--cream)">Welcome back</Eyebrow>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.95, marginTop: 10, letterSpacing: '-0.02em' }}>
          Sign in.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
        <Field label="Email">
          <Input value={email} onChange={setEmail} type="email" autoComplete="email" autoCapitalize="off"/>
        </Field>
        <Field label="Password">
          <Input value={password} onChange={setPassword} type="password" autoComplete="current-password"/>
        </Field>
      </div>

      {err && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--loss-soft)', background: 'rgba(155,58,46,0.2)', padding: '10px 12px', borderRadius: 12 }}>{err}</div>}

      <div style={{ flex: 1 }}/>

      <Button variant="primary" size="lg" full disabled={!email || !password || busy} onClick={submit} style={{ marginTop: 18 }}>
        {busy ? 'Signing in…' : 'Sign in'}
        {!busy && <Icon.ArrowRight size={16}/>}
      </Button>

      <button type="button" onClick={onSignUpInstead} style={{
        marginTop: 14, fontSize: 13, fontFamily: 'var(--font-mono)',
        color: 'var(--cream)', opacity: 0.7, textAlign: 'center',
        letterSpacing: '0.06em',
      }}>
        New here? <u>Create an account</u>
      </button>
    </form>
  );
}

// ─── Profile completion (for users signed up elsewhere w/o profile row) ───
function ProfileSetupScreen({ session, onDone }) {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName]   = React.useState('');
  const [gender, setGender]       = React.useState('');
  const [dob, setDob]             = React.useState('');
  const [busy, setBusy]           = React.useState(false);
  const [err, setErr]             = React.useState('');

  const valid = firstName.trim() && lastName.trim();

  async function submit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setErr('');
    const handle = await generateHandle(firstName, lastName);
    const { error } = await sbx.from('profiles').insert({
      id: session.user.id,
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      gender: gender || null,
      dob:    dob    || null,
      handle,
    });
    if (error) { setErr(error.message); setBusy(false); return; }
    setBusy(false);
    onDone && onDone();
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--cream)', display: 'flex', flexDirection: 'column',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <form onSubmit={submit} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '80px 24px 24px' }}>
        <Eyebrow color="var(--cream)">One more step</Eyebrow>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.95, marginTop: 10, letterSpacing: '-0.02em' }}>
          Finish your<br/>profile.
        </div>
        <div className="caption-serif" style={{ fontSize: 15, marginTop: 10, opacity: 0.75 }}>
          This is how other players will find you on the board.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <Row>
            <Field label="First name" required>
              <Input value={firstName} onChange={setFirstName} autoComplete="given-name"/>
            </Field>
            <Field label="Last name" required>
              <Input value={lastName} onChange={setLastName} autoComplete="family-name"/>
            </Field>
          </Row>
          <Row>
            <Field label="Gender">
              <Select value={gender} onChange={setGender} options={[
                ['',   '—'],
                ['male',   'Male'],
                ['female', 'Female'],
                ['other',  'Other'],
                ['skip',   'Prefer not to say'],
              ]}/>
            </Field>
            <Field label="Date of birth">
              <Input value={dob} onChange={setDob} type="date"/>
            </Field>
          </Row>
        </div>

        {err && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--loss-soft)', background: 'rgba(155,58,46,0.2)', padding: '10px 12px', borderRadius: 12 }}>{err}</div>}

        <div style={{ flex: 1 }}/>

        <Button variant="primary" size="lg" full disabled={!valid || busy} onClick={submit}>
          {busy ? 'Saving…' : 'Continue'}
          {!busy && <Icon.ArrowRight size={16}/>}
        </Button>
      </form>
    </div>
  );
}

// ─── Small form primitives ───────────────────────────────────
function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>;
}

function Field({ label, required, hint, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{
        fontSize: 10, fontFamily: 'var(--font-mono)',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        fontWeight: 700, opacity: 0.65, marginBottom: 6,
      }}>
        {label} {required && <span style={{ color: 'var(--cream)' }}>*</span>}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

function Input({ value, onChange, type = 'text', ...rest }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type={type}
      {...rest}
      style={{
        width: '100%', padding: '13px 14px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(234,226,206,0.2)',
        color: 'var(--cream)',
        fontSize: 15, fontFamily: 'var(--font-body)',
        outline: 'none',
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', padding: '13px 14px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(234,226,206,0.2)',
        color: 'var(--cream)',
        fontSize: 15, fontFamily: 'var(--font-body)',
        outline: 'none',
        appearance: 'none',
      }}
    >
      {options.map(([v, l]) => <option key={v} value={v} style={{ color: 'var(--ink)' }}>{l}</option>)}
    </select>
  );
}

function BackButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      position: 'absolute', top: 20, left: 20,
      width: 38, height: 38, borderRadius: 999,
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(234,226,206,0.2)',
      color: 'var(--cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon.ArrowLeft size={16} color="currentColor"/>
    </button>
  );
}

// ─── Handle generator ────────────────────────────────────────
// Builds "@firstl" from first + last name; appends a 2-digit suffix if taken.
async function generateHandle(first, last) {
  const base = ('@' + (first || 'player').toLowerCase().replace(/[^a-z0-9]/g, '') +
                     (last  ? last.trim()[0].toLowerCase() : '')).slice(0, 20);
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${Math.floor(Math.random() * 90 + 10)}`;
    const { data } = await sbx.from('profiles').select('id').eq('handle', candidate).maybeSingle();
    if (!data) return candidate;
  }
  // Fallback: deeply random
  return base + Math.random().toString(36).slice(2, 6);
}

Object.assign(window, { AuthScreens, ProfileSetupScreen });
