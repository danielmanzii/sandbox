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

    // On any reload/cold start, Supabase can momentarily report "no session"
    // while it reads/refreshes the persisted token — which flashes the login
    // screen before the real session loads. The authoritative signal that a
    // session SHOULD exist is Supabase's own stored token in localStorage
    // (key: sb-<ref>-auth-token). If that token is present we wait out a grace
    // window before committing to logged-out; if it's absent the user really
    // is signed out, so we show auth immediately (no delay for new visitors).
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

    const apply = (s) => {
      if (!mounted) return;
      if (s) {
        cancelNull();
        try { localStorage.setItem('spp_authed', '1'); } catch {}
        setSession(s);
        return;
      }
      // No session right now. If Supabase still has a stored token (or our
      // hint is set), this is a transient blip during init/refresh → wait.
      // signOut() clears both first, so a real sign-out drops to auth at once.
      if (!hasStoredSession()) { cancelNull(); setSession(null); return; }
      if (nullTimer.current) return; // already waiting out the grace window
      nullTimer.current = setTimeout(() => { nullTimer.current = null; if (mounted) setSession(null); }, 2000);
    };

    sbx.auth.getSession().then(({ data }) => apply(data.session || null));
    const { data: sub } = sbx.auth.onAuthStateChange((_event, s) => apply(s || null));
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
    if (!userId) { setProfile(null); return; }
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
