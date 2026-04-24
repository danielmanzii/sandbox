/* global React, sbx */
// Real-data hooks for the events surface (Home / Play / Event Detail).
// Reads from `events_with_counts` (a view that joins events with a live
// filled-count from event_registrations) and subscribes to realtime
// changes on event_registrations so cards update as people register.
//
// Each event row is mapped from snake_case DB columns into the same
// camelCase shape the existing card components already consume
// (courseShort, dateFull, time, priceWalkup, isMajor, etc.) — so home.jsx
// and friends don't need a wholesale refactor.

// ─── DB row → legacy event shape used by the card components ─────────
function mapEvent(row) {
  if (!row) return null;
  const d = new Date(row.starts_at);
  // Derived display strings (Eastern Time — matches the user audience).
  const date = d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York',
  });
  const dateFull = d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
  });

  return {
    id:           row.id,
    courseShort:  row.course_short,
    courseName:   row.course_name,
    course:       row.course_short,
    date,
    dateFull,
    time,
    startsAt:     row.starts_at,
    field:        row.field,
    filled:       row.filled || 0,
    tagline:      row.tagline || '',
    description:  row.description || '',
    img:          row.img_url || '',
    isMajor:      !!row.is_major,
    type:         row.type,
    status:       row.status,
    priceWalkup:  row.price_walkup || 0,
    priceMember:  row.price_member || 0,
  };
}

// ─── Base: load all events + subscribe to live filled-count updates ──
// Returns [events, loading, error, reload].
//   events  = array of mapped event objects (oldest → newest)
//   loading = true on first load only
//   error   = Error instance, or null
function useEvents() {
  const [events, setEvents]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState(null);

  const load = React.useCallback(async () => {
    setError(null);
    const { data, error: err } = await sbx
      .from('events_with_counts')
      .select('*')
      .order('starts_at', { ascending: true });
    if (err) { setError(err); setLoading(false); return; }
    setEvents((data || []).map(mapEvent));
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  // Realtime: any registration change re-pulls the view (which recomputes
  // filled). Cheap — view is small and Supabase handles the broadcast.
  React.useEffect(() => {
    const ch = sbx
      .channel('event-regs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => {
        load();
      })
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [load]);

  return [events, loading, error, load];
}

// ─── Upcoming events (future, not closed/cancelled) ──────────────────
// Returns the next N events the user could potentially see.
function useUpcomingEvents(limit = 5) {
  const [events, loading, error, reload] = useEvents();
  const now = Date.now();
  const upcoming = events
    .filter(e => new Date(e.startsAt).getTime() >= now - 60 * 60 * 1000) // 1h grace
    .filter(e => e.status !== 'closed' && e.status !== 'cancelled')
    .slice(0, limit);
  return [upcoming, loading, error, reload];
}

// ─── Next live event (for the "live now" inline preview on Home) ─────
function useLiveEvent() {
  const [events, loading] = useEvents();
  const live = events.find(e => e.status === 'live') || null;
  return [live, loading];
}

// ─── Next Major (used by Major banner on Home) ───────────────────────
function useNextMajor() {
  const [events, loading] = useEvents();
  const now = Date.now();
  const major = events.find(e =>
    e.isMajor &&
    new Date(e.startsAt).getTime() >= now - 60 * 60 * 1000 &&
    e.status !== 'closed' && e.status !== 'cancelled'
  ) || null;
  return [major, loading];
}

// ─── Events the signed-in user is registered for ─────────────────────
// Returns mapped event rows (with display strings) ordered by starts_at.
function useUserRegistrations(userId) {
  const [registrations, setRegistrations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!userId) { setRegistrations([]); setLoading(false); return; }
    const { data } = await sbx
      .from('event_registrations')
      .select('event_id, is_guest, partner_id')
      .eq('user_id', userId);
    const ids = (data || []).map(r => r.event_id);
    if (ids.length === 0) { setRegistrations([]); setLoading(false); return; }
    const { data: rows } = await sbx
      .from('events_with_counts')
      .select('*')
      .in('id', ids)
      .order('starts_at', { ascending: true });
    setRegistrations((rows || []).map(mapEvent));
    setLoading(false);
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx
      .channel(`user-regs-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations', filter: `user_id=eq.${userId}` },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, load]);

  return [registrations, loading, load];
}

// ─── "Up Next for me" — closest registered event, else next open ─────
// Used by Home's NextUpCard. Returns null while loading.
function useNextEventForUser(userId) {
  const [registered, regLoading]   = useUserRegistrations(userId);
  const [upcoming,   upLoading]    = useUpcomingEvents(5);

  if (regLoading || upLoading) return [null, true];

  const now = Date.now();
  const myUpcoming = registered.filter(e =>
    new Date(e.startsAt).getTime() >= now - 60 * 60 * 1000 &&
    e.status !== 'closed' && e.status !== 'cancelled'
  );

  // Prefer the user's registered event if they have one upcoming.
  if (myUpcoming.length > 0) return [myUpcoming[0], false];

  // Otherwise show the next open event (skip member-only unless they're
  // a member — for now we just show open events to everyone).
  const nextOpen = upcoming.find(e => e.status === 'open') || upcoming[0] || null;
  return [nextOpen, false];
}

Object.assign(window, {
  useEvents, useUpcomingEvents, useLiveEvent, useNextMajor,
  useUserRegistrations, useNextEventForUser,
});
