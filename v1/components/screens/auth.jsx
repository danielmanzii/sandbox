/* global React, Button, Eyebrow, Wordmark, Ostrich, Icon, sbx */
// Welcome / Sign-up / Sign-in screens.
// Shown when there's no active Supabase session (handled by AuthGate in index.html).

function AuthScreens() {
  const [view, setView] = React.useState('welcome'); // welcome | signin | signup | forgot

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--paper)',
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
      {view === 'signin'  && <SignInView  onBack={() => setView('welcome')} onSignUpInstead={() => setView('signup')} onForgot={() => setView('forgot')}/>}
      {view === 'forgot'  && <ForgotPasswordView onBack={() => setView('signin')}/>}
    </div>
  );
}

// ─── Welcome ─────────────────────────────────────────────────
function WelcomeView({ onSignUp, onSignIn }) {
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '80px 28px 32px', color: 'var(--paper)' }}>
      <Wordmark variant="white" size={160}/>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 28, whiteSpace: 'nowrap', color: 'var(--paper)' }}>
        Pitch & Putt, Rated.
      </div>
      <div className="caption-serif" style={{ fontSize: 18, marginTop: 18, opacity: 0.85, maxWidth: 340, color: 'var(--paper)', lineHeight: 1.4 }}>
        Miami's pitch &amp; putt, match play league.<br/>
        Real matches, real ratings, real bragging rights.
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
        <Button variant="primary" size="lg" full onClick={onSignUp}>
          Create account
          <Icon.ArrowRight size={16}/>
        </Button>
        <Button variant="outlineWhite" size="lg" full onClick={onSignIn}>
          I already have an account
        </Button>
      </div>

      <div style={{ fontSize: 10, opacity: 0.6, textAlign: 'center', marginTop: 20, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--paper)' }}>
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

    // Profile is saved without a handle — the next step (DisplayNameScreen)
    // will prompt for one. Keeps the two screens doing one job each.
    const { error: profileErr } = await sbx.from('profiles').insert({
      id: user.id,
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      gender: gender || null,
      dob:    dob    || null,
    });
    if (profileErr) {
      setErr('Account created but profile save failed: ' + profileErr.message);
      setBusy(false);
      return;
    }
    // Tell Root to re-fetch the profile so the AuthGate routes us to the
    // display-name step immediately (avoids a race where useProfile queried
    // before this insert landed and cached a null result).
    if (window.reloadProfile) await window.reloadProfile();
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 24px 24px' }}>
      <BackButton onClick={onBack}/>

      <div style={{ marginTop: 12 }}>
        <Eyebrow color="var(--paper)">Create your account</Eyebrow>
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
        color: 'var(--paper)', opacity: 0.7, textAlign: 'center',
        letterSpacing: '0.06em',
      }}>
        Already have an account? <u>Sign in</u>
      </button>
    </form>
  );
}

// ─── Sign In ─────────────────────────────────────────────────
function SignInView({ onBack, onSignUpInstead, onForgot }) {
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
        <Eyebrow color="var(--paper)">Welcome back</Eyebrow>
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

      <button type="button" onClick={onForgot} style={{
        marginTop: 14, fontSize: 13, fontFamily: 'var(--font-mono)',
        color: 'var(--paper)', opacity: 0.7, textAlign: 'center',
        letterSpacing: '0.06em',
      }}>
        Forgot your password?
      </button>

      <button type="button" onClick={onSignUpInstead} style={{
        marginTop: 8, fontSize: 13, fontFamily: 'var(--font-mono)',
        color: 'var(--paper)', opacity: 0.7, textAlign: 'center',
        letterSpacing: '0.06em',
      }}>
        New here? <u>Create an account</u>
      </button>
    </form>
  );
}

// ─── Forgot password (request reset email) ──────────────────
function ForgotPasswordView({ onBack }) {
  const [email, setEmail] = React.useState('');
  const [busy, setBusy]   = React.useState(false);
  const [err, setErr]     = React.useState('');
  const [sent, setSent]   = React.useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true); setErr('');
    const { error } = await sbx.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.redirectOrigin ? window.redirectOrigin() : (window.location.origin + window.location.pathname),
    });
    if (error) { setErr(error.message); setBusy(false); return; }
    setSent(true);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 24px 24px' }}>
      <BackButton onClick={onBack}/>

      <div style={{ marginTop: 12 }}>
        <Eyebrow color="var(--paper)">Password reset</Eyebrow>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.95, marginTop: 10, letterSpacing: '-0.02em' }}>
          {sent ? 'Check your email.' : 'Reset it.'}
        </div>
        <div className="caption-serif" style={{ fontSize: 15, marginTop: 10, opacity: 0.8, maxWidth: 340 }}>
          {sent
            ? `We sent a reset link to ${email}. Tap it on your phone — it'll drop you back here to set a new password.`
            : 'Enter the email you signed up with. We\'ll send a link to set a new password.'}
        </div>
      </div>

      {!sent && (
        <>
          <div style={{ marginTop: 28 }}>
            <Field label="Email">
              <Input value={email} onChange={setEmail} type="email" autoComplete="email" autoCapitalize="off"/>
            </Field>
          </div>
          {err && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--loss-soft)', background: 'rgba(155,58,46,0.2)', padding: '10px 12px', borderRadius: 12 }}>{err}</div>}
          <div style={{ flex: 1 }}/>
          <Button variant="primary" size="lg" full disabled={!email.trim() || busy} onClick={submit}>
            {busy ? 'Sending…' : 'Send reset link'}
            {!busy && <Icon.ArrowRight size={16}/>}
          </Button>
        </>
      )}

      {sent && (
        <>
          <div style={{ flex: 1 }}/>
          <Button variant="outlineWhite" size="lg" full onClick={onBack}>
            Back to sign in
          </Button>
        </>
      )}
    </form>
  );
}

// ─── Reset password (set new password after clicking email link) ────
// Rendered when the app is opened via a password-recovery link: Supabase
// fires a PASSWORD_RECOVERY auth event, which Root detects via useRecovering.
function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm]   = React.useState('');
  const [busy, setBusy]         = React.useState(false);
  const [err, setErr]           = React.useState('');

  const valid = password.length >= 6 && password === confirm;

  async function submit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setErr('');
    const { error } = await sbx.auth.updateUser({ password });
    if (error) { setErr(error.message); setBusy(false); return; }
    setBusy(false);
    onDone && onDone();
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--paper)', display: 'flex', flexDirection: 'column',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <form onSubmit={submit} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '80px 24px 24px' }}>
        <Eyebrow color="var(--paper)">New password</Eyebrow>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.95, marginTop: 10, letterSpacing: '-0.02em' }}>
          Set a new<br/>password.
        </div>
        <div className="caption-serif" style={{ fontSize: 15, marginTop: 10, opacity: 0.75 }}>
          You're signed in from the reset link. Pick a new password to keep using the app.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
          <Field label="New password" hint="At least 6 characters">
            <Input value={password} onChange={setPassword} type="password" autoComplete="new-password"/>
          </Field>
          <Field label="Confirm password">
            <Input value={confirm} onChange={setConfirm} type="password" autoComplete="new-password"/>
          </Field>
        </div>

        {password && confirm && password !== confirm && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--loss-soft)' }}>Passwords don't match.</div>
        )}
        {err && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--loss-soft)', background: 'rgba(155,58,46,0.2)', padding: '10px 12px', borderRadius: 12 }}>{err}</div>}

        <div style={{ flex: 1 }}/>

        <Button variant="primary" size="lg" full disabled={!valid || busy} onClick={submit}>
          {busy ? 'Saving…' : 'Save & continue'}
          {!busy && <Icon.ArrowRight size={16}/>}
        </Button>
      </form>
    </div>
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
    // No handle here — DisplayNameScreen picks it up next.
    const { error } = await sbx.from('profiles').insert({
      id: session.user.id,
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      gender: gender || null,
      dob:    dob    || null,
    });
    if (error) { setErr(error.message); setBusy(false); return; }
    setBusy(false);
    onDone && onDone();
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--paper)', display: 'flex', flexDirection: 'column',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <form onSubmit={submit} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '80px 24px 24px' }}>
        <Eyebrow color="var(--paper)">One more step</Eyebrow>
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
        {label} {required && <span style={{ color: 'var(--paper)' }}>*</span>}
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
        color: 'var(--paper)',
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
        color: 'var(--paper)',
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
      color: 'var(--paper)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon.ArrowLeft size={16} color="currentColor"/>
    </button>
  );
}

// ─── Display name (handle) step ──────────────────────────────
// Shown right after sign-up for new accounts, or from MatchHub when an
// existing user wants to change their @handle. Validates format + uniqueness
// as the user types, with a 400ms debounce.
//   onDone:   optional — if provided, called after save instead of relying on Root's gate
//   onCancel: optional — shows a back button and calls this when pressed
function DisplayNameScreen({ profile, onDone, onCancel }) {
  const currentClean = profile.handle ? profile.handle.replace(/^@/, '') : '';
  const [raw, setRaw] = React.useState(currentClean);
  const [status, setStatus] = React.useState(currentClean ? 'available' : 'idle'); // idle | checking | available | taken | invalid
  const [busy, setBusy] = React.useState(false);
  const [err, setErr]   = React.useState('');

  const clean = sanitizeHandle(raw);
  const validFormat = isValidHandle(clean);

  // Debounced uniqueness check. If the typed name matches the user's current
  // handle, treat as available (so re-opening the screen with the existing
  // handle doesn't show as "taken by yourself").
  React.useEffect(() => {
    if (!raw) { setStatus('idle'); return; }
    if (!validFormat) { setStatus('invalid'); return; }
    if (clean === currentClean) { setStatus('available'); return; }
    setStatus('checking');
    const t = setTimeout(async () => {
      const { data } = await sbx.from('profiles').select('id').eq('handle', '@' + clean).maybeSingle();
      if (!data || data.id === profile.id) setStatus('available');
      else setStatus('taken');
    }, 400);
    return () => clearTimeout(t);
  }, [raw, clean, validFormat, profile.id, currentClean]);

  const isChange = Boolean(profile.handle);
  const noChangeFromCurrent = clean === currentClean;

  async function submit(e) {
    e.preventDefault();
    if (status !== 'available' || busy) return;
    // No-op save when opening the change screen and pressing continue without edits.
    if (noChangeFromCurrent) { onDone ? onDone() : null; return; }
    setBusy(true); setErr('');
    const { error } = await sbx.from('profiles').update({ handle: '@' + clean }).eq('id', profile.id);
    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        setStatus('taken');
        setErr('That name was just taken. Try another.');
      } else {
        setErr(error.message);
      }
      setBusy(false);
      return;
    }
    if (window.reloadProfile) await window.reloadProfile();
    setBusy(false);
    if (onDone) onDone();
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--paper)', display: 'flex', flexDirection: 'column',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <form onSubmit={submit} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 24px 24px' }}>
        {onCancel && <BackButton onClick={onCancel}/>}
        <div style={{ marginTop: onCancel ? 20 : 20 }}>
          <Eyebrow color="var(--paper)">{isChange ? 'Display name' : 'Last step'}</Eyebrow>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 0.95, marginTop: 10, letterSpacing: '-0.02em' }}>
            {isChange ? <>Change your<br/>display name.</> : <>Pick a display<br/>name.</>}
          </div>
          <div className="caption-serif" style={{ fontSize: 16, marginTop: 12, opacity: 0.75, maxWidth: 340 }}>
            This is how other players will find you on the board.
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.08)',
            border: `1px solid ${borderFor(status)}`,
            borderRadius: 14,
            padding: '0 14px',
            transition: 'border-color 0.15s',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 22,
              color: 'rgba(234,226,206,0.5)', paddingRight: 2,
            }}>@</span>
            <input
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder="yourname"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
              style={{
                flex: 1, padding: '16px 0',
                background: 'transparent', border: 'none',
                color: 'var(--paper)',
                fontSize: 22, fontFamily: 'var(--font-display)',
                letterSpacing: '-0.01em', outline: 'none',
              }}
            />
            <StatusIcon status={status}/>
          </div>

          <div style={{
            marginTop: 8, fontSize: 12, fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em', opacity: 0.85,
            color: statusTextColor(status),
            minHeight: 18,
          }}>
            {statusText(status, clean)}
          </div>
        </div>

        {err && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--loss-soft)', background: 'rgba(155,58,46,0.2)', padding: '10px 12px', borderRadius: 12 }}>{err}</div>}

        <div style={{ flex: 1 }}/>

        <Button variant="primary" size="lg" full disabled={status !== 'available' || busy} onClick={submit}>
          {busy ? 'Saving…' : 'Continue'}
          {!busy && <Icon.ArrowRight size={16}/>}
        </Button>
      </form>
    </div>
  );
}

// ─── Handle validation + UI helpers ──────────────────────────
// Handle rules: 3–20 chars; lowercase letters, digits, underscore.
// Stripping happens live (uppercase is lowercased, other chars dropped).
function sanitizeHandle(raw) {
  return (raw || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
}
function isValidHandle(clean) {
  return /^[a-z0-9_]{3,20}$/.test(clean);
}
function borderFor(status) {
  if (status === 'available') return 'rgba(62,138,87,0.9)';
  if (status === 'taken' || status === 'invalid') return 'rgba(231,184,167,0.6)';
  return 'rgba(234,226,206,0.2)';
}
function statusTextColor(status) {
  if (status === 'available') return 'rgba(201,216,190,1)';
  if (status === 'taken' || status === 'invalid') return 'var(--loss-soft)';
  return 'rgba(234,226,206,0.6)';
}
function statusText(status, clean) {
  switch (status) {
    case 'idle':      return '3–20 characters. Letters, numbers, underscores.';
    case 'checking':  return 'Checking…';
    case 'available': return `✓ @${clean} is yours.`;
    case 'taken':     return `✗ @${clean} is taken.`;
    case 'invalid':   return clean.length < 3
      ? 'Too short — at least 3 characters.'
      : 'Only letters, numbers, and underscores.';
    default: return '';
  }
}
function StatusIcon({ status }) {
  const size = 22;
  if (status === 'available') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="rgba(62,138,87,0.18)"/>
        <path d="M7 12.5l3.5 3.5L17 9" stroke="#3E8A57" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (status === 'taken' || status === 'invalid') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="rgba(155,58,46,0.2)"/>
        <path d="M8 8l8 8M16 8l-8 8" stroke="var(--loss-soft)" strokeWidth="2.4" strokeLinecap="round"/>
      </svg>
    );
  }
  if (status === 'checking') {
    return (
      <div style={{
        width: size, height: size, borderRadius: 999,
        border: '2px solid rgba(234,226,206,0.2)',
        borderTopColor: 'rgba(234,226,206,0.8)',
        animation: 'spin 0.8s linear infinite',
      }}/>
    );
  }
  return <div style={{ width: size, height: size }}/>;
}

Object.assign(window, { AuthScreens, ProfileSetupScreen, DisplayNameScreen, ResetPasswordScreen });
