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
  // filled). Channel names are GLOBAL in Supabase — calling
  // sbx.channel('foo') twice returns the SAME channel, so the second
  // .on() call after .subscribe() throws. We generate a unique name per
  // hook instance so multiple consumers (useUpcomingEvents,
  // useLiveEvent, useNextMajor — all wrap useEvents) don't collide.
  const channelName = React.useRef(`event-regs-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    const ch = sbx
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => {
        load();
      })
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [channelName, load]);

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

  // Same global-channel-name caveat as useEvents — generate a unique
  // suffix per hook instance so multiple consumers don't collide.
  const userChannelName = React.useRef(`user-regs-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx
      .channel(userChannelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations', filter: `user_id=eq.${userId}` },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, userChannelName, load]);

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

// ─── Single event by id (for EventDetailScreen) ──────────────────────
// Reads from events_with_counts so filled is included. Subscribes to
// registration changes scoped to this event so the field count stays
// fresh while the user is on the page.
function useEvent(eventId) {
  const [event, setEvent]     = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!eventId) { setEvent(null); setLoading(false); return; }
    const { data } = await sbx
      .from('events_with_counts')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();
    setEvent(data ? mapEvent(data) : null);
    setLoading(false);
  }, [eventId]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`event-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!eventId) return;
    const ch = sbx
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations', filter: `event_id=eq.${eventId}` },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [eventId, channelName, load]);

  return [event, loading, load];
}

// ─── Is the signed-in user registered for this event? ────────────────
// Returns null while loading, then true/false. Subscribes so it flips
// instantly when the user registers or cancels.
function useIsRegistered(eventId, userId) {
  const [registered, setRegistered] = React.useState(null);

  const load = React.useCallback(async () => {
    if (!eventId || !userId) { setRegistered(false); return; }
    const { data } = await sbx
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
    setRegistered(!!data);
  }, [eventId, userId]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`is-reg-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!eventId || !userId) return;
    const ch = sbx
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations',
          filter: `event_id=eq.${eventId}` },
        () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [eventId, userId, channelName, load]);

  return registered;
}

// ─── Mutations ───────────────────────────────────────────────────────
// Throws on error so the caller can show the message in the UI.
// Capacity-full errors come back from the enforce_event_capacity()
// trigger as Postgres exceptions; surface them human-readably.
async function registerForEvent({ eventId, userId, partnerHandle, isGuest }) {
  if (!eventId || !userId) throw new Error('Missing event or user.');

  // Try to resolve partner by handle (strips leading @, case-insensitive).
  // If we can't find the handle as a real profile (e.g. it's still a
  // mock friend), just register without a partner — the UI keeps the
  // visual choice but partner_id stays null until the friends table lands.
  let partnerId = null;
  if (partnerHandle && !isGuest) {
    const h = String(partnerHandle).replace(/^@/, '').toLowerCase();
    const { data } = await sbx.from('profiles').select('id').ilike('handle', h).maybeSingle();
    if (data) partnerId = data.id;
  }

  const { error } = await sbx.from('event_registrations').insert({
    event_id:   eventId,
    user_id:    userId,
    partner_id: partnerId,
    is_guest:   !!isGuest,
  });
  if (error) {
    if (error.message && error.message.toLowerCase().includes('full')) {
      throw new Error('This event just filled up. Try another or join the waitlist.');
    }
    if (error.code === '23505') {
      throw new Error("You're already registered for this event.");
    }
    throw error;
  }
}

async function cancelRegistration({ eventId, userId }) {
  if (!eventId || !userId) throw new Error('Missing event or user.');
  const { error } = await sbx
    .from('event_registrations')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) throw error;
}

Object.assign(window, {
  useEvents, useUpcomingEvents, useLiveEvent, useNextMajor,
  useUserRegistrations, useNextEventForUser,
  useEvent, useIsRegistered,
  registerForEvent, cancelRegistration,
});
