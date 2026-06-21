/* global React */
// Supabase client + auth helpers for v1.
// Exposes: window.sbx, window.useSession, window.useProfile, window.signOut.
//
// The anon key below is PUBLIC by design — Supabase's Row Level Security
// policies (see v1/sql/setup.sql) guard every table. Safe to commit.

const SUPABASE_URL = 'https://rklxjcchgtwgxbeatsoc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbHhqY2NoZ3R3Z3hiZWF0c29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjY1NDAsImV4cCI6MjA5MjU0MjU0MH0.J9MlwdwG-DoqoGC6rqMC0DWz0d45nMwrdbexJD78Osc';

// `supabase` is the global exposed by the UMD bundle loaded in index.html.
// eslint-disable-next-line no-undef
const sbx = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.sbx = sbx;

// ─── Session hook ──────────────────────────────────────────
// Returns:
//   undefined = still loading initial session
//   null      = not logged in
//   object    = active Supabase session
function useSession() {
  const [session, setSession] = React.useState(undefined);
  const nullTimer = React.useRef(null);
  React.useEffect(() => {
    let mounted = true;

    // The login screen must only appear when we're SURE there's no session.
    // We go "logged out" from exactly two authoritative places: the initial
    // getSession() returning null, and an explicit SIGNED_OUT event. Every
    // other null an auth event might emit during init/token-refresh is a
    // transient blip and is IGNORED, so it can never flash the login screen.
    const cancelNull = () => { if (nullTimer.current) { clearTimeout(nullTimer.current); nullTimer.current = null; } };
    const hasStoredSession = () => {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('sb-') && k.endsWith('-auth-token') && localStorage.getItem(k)) return true;
        }
      } catch {}
      return localStorage.getItem('spp_authed') === '1';
    };
    const goLoggedIn = (s) => {
      if (!mounted) return;
      cancelNull();
      try { localStorage.setItem('spp_authed', '1'); } catch {}
      setSession(s);
    };
    const goLoggedOut = () => {
      if (!mounted) return;
      cancelNull();
      try { localStorage.removeItem('spp_authed'); } catch {}
      setSession(null);
    };

    sbx.auth.getSession().then(({ data }) => {
      if (data && data.session) { goLoggedIn(data.session); return; }
      // No session at startup. If Supabase still has a stored token, it's
      // mid-init/refresh — wait for the session event before showing auth.
      if (!hasStoredSession()) { goLoggedOut(); return; }
      // If no session event arrives within the grace window (token gone or
      // unrefreshable), fall back to the login screen.
      nullTimer.current = setTimeout(() => { nullTimer.current = null; goLoggedOut(); }, 2500);
    });

    const { data: sub } = sbx.auth.onAuthStateChange((event, s) => {
      if (s) { goLoggedIn(s); return; }       // any real session wins immediately
      if (event === 'SIGNED_OUT') goLoggedOut(); // explicit sign-out only
      // ignore every other transient null (INITIAL_SESSION/TOKEN_REFRESHED/etc.)
    });
    return () => { mounted = false; cancelNull(); sub.subscription.unsubscribe(); };
  }, []);
  return session;
}

// ─── Profile hook ──────────────────────────────────────────
// Loads the profiles row for a given userId.
// Returns [profile, setProfile, reload]:
//   undefined = loading
//   null      = logged in but no profile row yet (needs profile-setup)
//   object    = loaded profile
function useProfile(userId) {
  const [profile, setProfile] = React.useState(undefined);
  const load = React.useCallback(async () => {
    // No user yet (session still resolving) = still LOADING, not "no profile
    // row". Returning null here flashed the ProfileSetup screen for one render
    // the instant the session resolved, before the real profile loaded.
    if (!userId) { setProfile(undefined); return; }
    const { data } = await sbx
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data || null);
  }, [userId]);
  React.useEffect(() => { load(); }, [load]);
  return [profile, setProfile, load];
}

// ─── Sign out helper ───────────────────────────────────────
async function signOut() {
  // Clear the "authed" hint first so the resulting SIGNED_OUT drops straight
  // to the login screen (no grace-window delay reserved for cold-start blips).
  try { localStorage.removeItem('spp_authed'); } catch {}
  try { localStorage.removeItem('spp_active_match'); } catch {}
  await sbx.auth.signOut();
}

// ─── Recovery-mode hook ────────────────────────────────────
// When a user clicks the password-reset email link they land back on our
// origin with a recovery session. Supabase fires an auth event of type
// 'PASSWORD_RECOVERY' as it picks up the URL fragment. We latch onto that so
// the app can route them to a "set a new password" screen instead of into
// the app itself.
let __sbxRecovering = false;
sbx.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') __sbxRecovering = true;
});

function useRecovering() {
  const [r, setR] = React.useState(__sbxRecovering);
  React.useEffect(() => {
    const { data: sub } = sbx.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        __sbxRecovering = true;
        setR(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  const clear = React.useCallback(() => {
    __sbxRecovering = false;
    setR(false);
  }, []);
  return [r, clear];
}

// The URL the reset-password email link should return the user to. We use
// the currently-running page so it works both on GitHub Pages and locally.
function redirectOrigin() {
  return window.location.origin + window.location.pathname;
}

Object.assign(window, { useSession, useProfile, useRecovering, signOut, redirectOrigin });
