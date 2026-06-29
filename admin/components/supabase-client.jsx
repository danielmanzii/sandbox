/* global React */
// Supabase client + auth helpers for the Sandbox Admin portal.
// Same project + PUBLIC anon key as the golfer app (v1). Row-Level Security
// guards every table, and admin-only writes are gated by the `is_admin` flag
// on profiles — so this portal is safe as a static, anon-key-only site.

const SUPABASE_URL = 'https://rklxjcchgtwgxbeatsoc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbHhqY2NoZ3R3Z3hiZWF0c29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjY1NDAsImV4cCI6MjA5MjU0MjU0MH0.J9MlwdwG-DoqoGC6rqMC0DWz0d45nMwrdbexJD78Osc';

// eslint-disable-next-line no-undef
const sbx = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.sbx = sbx;

// ─── Session hook ──────────────────────────────────────────
//   undefined = loading · null = logged out · object = active session
function useSession() {
  const [session, setSession] = React.useState(undefined);
  React.useEffect(() => {
    let mounted = true;
    sbx.auth.getSession().then(({ data }) => {
      if (mounted) setSession((data && data.session) || null);
    });
    const { data: sub } = sbx.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s || null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);
  return session;
}

// ─── Profile hook ──────────────────────────────────────────
//   undefined = loading · null = no profile row · object = loaded
function useProfile(userId) {
  const [profile, setProfile] = React.useState(undefined);
  const load = React.useCallback(async () => {
    if (!userId) { setProfile(undefined); return; }
    const { data } = await sbx.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data || null);
  }, [userId]);
  React.useEffect(() => { load(); }, [load]);
  return [profile, setProfile, load];
}

async function signOut() {
  await sbx.auth.signOut();
}

Object.assign(window, { useSession, useProfile, signOut });
