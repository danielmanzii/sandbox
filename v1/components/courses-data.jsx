/* global React, sbx */
// Courses + tee-slot availability + bookings (Phase B data layer).
//
// Powers the new golfer booking flow:
//   - Book tab: date-first availability list (near-you courses + open slots)
//   - Course detail: hero + Sandbox 9 + bookable slots
//   - Booking flow: reserve a slot for a 1v1/2v2 match
//   - My Rounds: a golfer's upcoming + past bookings
//
// Realtime on tee_slots + bookings so availability and "friends here"
// update live. Mirrors the conventions in events-data.jsx / social-data.jsx
// (unique channel name per hook instance, Object.assign(window, ...) export).

// ─── Geo helpers ──────────────────────────────────────────────────────
function haversineMiles(aLat, aLng, bLat, bLng) {
  if ([aLat, aLng, bLat, bLng].some(v => v == null)) return null;
  const toRad = d => (d * Math.PI) / 180;
  const R = 3958.8; // miles
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat), lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Browser geolocation with a graceful fallback to a fixed Miami center.
// Returns [coords, status]: status is 'pending' | 'ok' | 'denied' | 'unsupported'.
const MIAMI_FALLBACK = { lat: 25.7617, lng: -80.1918, fallback: true };
function useGeolocation() {
  const [coords, setCoords] = React.useState(null);
  const [status, setStatus] = React.useState('pending');

  React.useEffect(() => {
    if (!('geolocation' in navigator)) {
      setCoords(MIAMI_FALLBACK); setStatus('unsupported'); return;
    }
    let done = false;
    const ok = (pos) => {
      if (done) return; done = true;
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, fallback: false });
      setStatus('ok');
    };
    const fail = () => {
      if (done) return; done = true;
      setCoords(MIAMI_FALLBACK); setStatus('denied');
    };
    navigator.geolocation.getCurrentPosition(ok, fail, { timeout: 8000, maximumAge: 600000 });
    // Hard fallback if the prompt is ignored.
    const t = setTimeout(fail, 9000);
    return () => clearTimeout(t);
  }, []);

  return [coords, status];
}

// ─── Date helpers ─────────────────────────────────────────────────────
// Local-day [start, end) ISO bounds for a Date.
function dayBounds(date) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return [start.toISOString(), end.toISOString()];
}

// ─── Map a raw course row → camelCase course shape ────────────────────
function mapCourse(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    shortName: r.short_name,
    city: r.city,
    state: r.state,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    phone: r.phone,
    heroImg: r.hero_img,
    renderImg: r.render_img,
    description: r.description,
    holes: r.holes,
    par: r.par,
    realPar: r.real_par,
    realYardage: r.real_yardage,
    realRating: r.real_rating,
    realSlope: r.real_slope,
    realHoles: r.real_holes,
    status: r.status,
    suggestedPrice: r.suggested_price,
    sandboxTakePct: r.sandbox_take_pct,
  };
}

// ─── All active courses ───────────────────────────────────────────────
function useCourses() {
  const [courses, setCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await sbx.from('courses')
        .select('*')
        .neq('status', 'inactive')
        .order('short_name');
      if (!cancelled) { setCourses((data || []).map(mapCourse)); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  return [courses, loading];
}

// ─── Availability for a given day: courses + their open slots ─────────
// Returns [list, loading], where each list item is:
//   { course, slots: [openSlot...], distanceMi }
// sorted by distance (nulls last). `slots` are future, open, type='open'.
function useAvailability(date, viewer) {
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const dayKey = date ? new Date(date).toDateString() : '';
  const vlat = viewer && viewer.lat, vlng = viewer && viewer.lng;

  const load = React.useCallback(async () => {
    setLoading(true);
    const [startISO, endISO] = dayBounds(date || new Date());
    const nowISO = new Date().toISOString();
    const lowerBound = startISO > nowISO ? startISO : nowISO; // hide past slots today

    const [{ data: courses }, { data: slots }] = await Promise.all([
      sbx.from('courses').select('*').eq('status', 'active').order('short_name'),
      sbx.from('tee_slots')
        .select('*')
        .eq('type', 'open')
        .eq('status', 'open')
        .gte('starts_at', lowerBound)
        .lt('starts_at', endISO)
        .order('starts_at'),
    ]);

    const slotsByCourse = {};
    (slots || []).forEach(s => { (slotsByCourse[s.course_id] = slotsByCourse[s.course_id] || []).push(s); });

    const out = (courses || []).map(c => {
      const course = mapCourse(c);
      const distanceMi = haversineMiles(vlat, vlng, course.lat, course.lng);
      return { course, slots: slotsByCourse[c.id] || [], distanceMi };
    });

    out.sort((a, b) => {
      if (a.distanceMi == null) return 1;
      if (b.distanceMi == null) return -1;
      return a.distanceMi - b.distanceMi;
    });

    setList(out);
    setLoading(false);
  }, [dayKey, vlat, vlng]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`availability-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    const ch = sbx.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tee_slots' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [channelName, load]);

  return [list, loading];
}

// ─── Single course + its Sandbox 9 holes ──────────────────────────────
function useCourse(courseId) {
  const [course, setCourse] = React.useState(null);
  const [holes, setHoles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    if (!courseId) { setCourse(null); setHoles([]); setLoading(false); return; }
    (async () => {
      const [{ data: c }, { data: h }] = await Promise.all([
        sbx.from('courses').select('*').eq('id', courseId).maybeSingle(),
        sbx.from('course_holes').select('*').eq('course_id', courseId).order('hole_number'),
      ]);
      if (!cancelled) { setCourse(mapCourse(c)); setHoles(h || []); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [courseId]);

  return [course, holes, loading];
}

// ─── Open slots for one course on a given day (course detail) ─────────
function useCourseSlots(courseId, date) {
  const [slots, setSlots] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const dayKey = date ? new Date(date).toDateString() : '';

  const load = React.useCallback(async () => {
    if (!courseId) { setSlots([]); setLoading(false); return; }
    const [startISO, endISO] = dayBounds(date || new Date());
    const nowISO = new Date().toISOString();
    const lowerBound = startISO > nowISO ? startISO : nowISO;
    const { data } = await sbx.from('tee_slots')
      .select('*')
      .eq('course_id', courseId)
      .gte('starts_at', lowerBound)
      .lt('starts_at', endISO)
      .order('starts_at');
    setSlots(data || []);
    setLoading(false);
  }, [courseId, dayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`course-slots-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!courseId) return;
    const ch = sbx.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tee_slots', filter: `course_id=eq.${courseId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [courseId, channelName, load]);

  return [slots, loading];
}

// ─── Friends booked, keyed by slot_id (for "friends here" on slots) ───
// Given a viewer + a list of slot ids, returns { slot_id: [friendProfile] }.
function useFriendsOnSlots(viewerId, slotIds) {
  const [bySlot, setBySlot] = React.useState({});
  const slotKey = (slotIds || []).slice().sort().join(',');

  const load = React.useCallback(async () => {
    if (!viewerId || !slotIds || slotIds.length === 0) { setBySlot({}); return; }
    const { data: follows } = await sbx.from('follows').select('following_id').eq('follower_id', viewerId);
    const friendIds = (follows || []).map(r => r.following_id);
    if (friendIds.length === 0) { setBySlot({}); return; }
    const { data: bks } = await sbx.from('bookings')
      .select(`slot_id, user_id, actor:profiles!bookings_user_id_fkey(id, handle, first_name, last_name, avatar_url)`)
      .in('slot_id', slotIds)
      .in('user_id', friendIds);
    const out = {};
    (bks || []).forEach(b => { if (b.actor) (out[b.slot_id] = out[b.slot_id] || []).push(b.actor); });
    setBySlot(out);
  }, [viewerId, slotKey]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { load(); }, [load]);
  return bySlot;
}

// ─── My bookings (upcoming + past) ────────────────────────────────────
function useMyBookings(userId) {
  const [upcoming, setUpcoming] = React.useState([]);
  const [past, setPast] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!userId) { setUpcoming([]); setPast([]); setLoading(false); return; }
    const { data } = await sbx.from('bookings')
      .select(`
        *,
        partner:profiles!bookings_partner_id_fkey(id, handle, first_name, last_name, avatar_url),
        slot:tee_slots!bookings_slot_id_fkey(
          id, starts_at, price, type, title,
          course:courses!tee_slots_course_id_fkey(id, short_name, name, city, hero_img, render_img)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const now = Date.now();
    const up = [], pa = [];
    (data || []).forEach(b => {
      const t = b.slot && b.slot.starts_at ? new Date(b.slot.starts_at).getTime() : 0;
      if (b.status === 'cancelled') return;
      if (t >= now && b.status !== 'completed') up.push(b); else pa.push(b);
    });
    up.sort((a, b) => new Date(a.slot.starts_at) - new Date(b.slot.starts_at)); // soonest first
    setUpcoming(up); setPast(pa); setLoading(false);
  }, [userId]);

  React.useEffect(() => { load(); }, [load]);

  const channelName = React.useRef(`my-bookings-${Math.random().toString(36).slice(2, 10)}`).current;
  React.useEffect(() => {
    if (!userId) return;
    const ch = sbx.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { sbx.removeChannel(ch); };
  }, [userId, channelName, load]);

  return [upcoming, past, loading, load];
}

// ─── Mutations ────────────────────────────────────────────────────────
// Reserve a slot. Snapshots the slot price (reserve-only; no charge yet).
// Throws a friendly Error on the common failures.
async function createBooking({ slotId, userId, partnerId, matchType, price }) {
  if (!slotId || !userId) throw new Error('Missing slot or user.');
  const { data, error } = await sbx.from('bookings').insert({
    slot_id: slotId,
    user_id: userId,
    partner_id: partnerId || null,
    match_type: matchType === '2v2' ? '2v2' : '1v1',
    status: 'reserved',
    price_charged: price != null ? price : null,
  }).select('id').maybeSingle();
  if (error) {
    if (error.code === '23505') throw new Error("You've already booked this slot.");
    throw new Error(error.message || 'Could not complete booking.');
  }
  return data && data.id;
}

async function cancelBooking({ bookingId }) {
  if (!bookingId) return;
  const { error } = await sbx.from('bookings').delete().eq('id', bookingId);
  if (error) throw new Error(error.message || 'Could not cancel.');
}

Object.assign(window, {
  haversineMiles, useGeolocation,
  useCourses, useAvailability, useCourse, useCourseSlots,
  useFriendsOnSlots, useMyBookings,
  createBooking, cancelBooking,
});
