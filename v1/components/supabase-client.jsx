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
  React.useEffect(() => {
    sbx.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = sbx.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
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
  await sbx.auth.signOut();
  try { localStorage.removeItem('spp_active_match'); } catch {}
}

Object.assign(window, { useSession, useProfile, signOut });
