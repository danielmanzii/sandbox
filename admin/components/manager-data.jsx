/* global React, sbx */
// Data layer for the course-partner portal + the admin "course access" panel.
// Everything here is scoped to a single course and relies on the RLS added in
// v1/sql/course-managers.sql (managers can only touch their own course's rows).

// ─── Who does this user manage? (drives the gate + admin panel) ─────────────
//   undefined = loading · [] = none · [{ id, course_id, role, course }] = managed
function useManagedCourses(userId) {
  const [rows, setRows] = React.useState(undefined);
  const load = React.useCallback(async () => {
    if (!userId) { setRows(undefined); return; }
    const { data, error } = await sbx
      .from('course_managers')
      .select('id, course_id, role, course:courses(*)')
      .eq('user_id', userId);
    if (error) { setRows([]); return; }
    setRows((data || []).filter(r => r.course)); // drop any orphaned links
  }, [userId]);
  React.useEffect(() => { load(); }, [load]);
  return [rows, load];
}

// ─── Admin: assign / remove a course manager ────────────────────────────────
async function addCourseManager({ userId, courseId, createdBy }) {
  const { error } = await sbx.from('course_managers')
    .insert({ user_id: userId, course_id: courseId, created_by: createdBy });
  if (error) {
    if (error.code === '23505') throw new Error('They already manage that course.');
    if (/row-level security|permission/i.test(error.message || '')) throw new Error('Only admins can assign course managers.');
    throw new Error(error.message || 'Could not assign.');
  }
}
async function removeCourseManager(id) {
  const { error } = await sbx.from('course_managers').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Could not remove.');
}

// ─── Tee slots for one course (manager-editable window) ─────────────────────
//   Loads slots from `from` (a Date) forward, soonest first.
function useCourseSlots(courseId, fromISO) {
  const [rows, setRows] = React.useState(null);
  const load = React.useCallback(async () => {
    if (!courseId) { setRows([]); return; }
    let q = sbx.from('tee_slots').select('*').eq('course_id', courseId).order('starts_at');
    if (fromISO) q = q.gte('starts_at', fromISO);
    const { data } = await q;
    setRows(data || []);
  }, [courseId, fromISO]);
  React.useEffect(() => { load(); }, [load]);
  return [rows, load];
}

async function saveSlot(slot) {
  const payload = {
    course_id:     slot.course_id,
    starts_at:     slot.starts_at,
    capacity:      4, // a tee time is always a foursome
    price:         Number(slot.price) || 0,
    type:          slot.type || 'open',
    title:         slot.title ? slot.title.trim() : null,
    status:        slot.status || 'open',
    includes_cart: !!slot.includes_cart,
  };
  if (slot.id) {
    const { error } = await sbx.from('tee_slots').update(payload).eq('id', slot.id);
    if (error) throw slotError(error);
  } else {
    const { error } = await sbx.from('tee_slots').insert(payload);
    if (error) throw slotError(error);
  }
}
async function deleteSlot(id) {
  const { error } = await sbx.from('tee_slots').delete().eq('id', id);
  if (error) throw slotError(error);
}

// Publish a day's tee times: make every time in `times` (['16:30',…]) a public,
// bookable open slot at the given price + cart flag. Nothing is public until
// this runs (it's the manager's "Save changes" action). Upsert UPDATES existing
// slots at those times (so the price/cart edits apply) and inserts new ones.
// Returns the number of public times after saving.
async function publishDayTimes({ courseId, dateStr, times, price, includesCart }) {
  if (!times.length) return 0;
  const rows = times.map(t => ({
    course_id:     courseId,
    starts_at:     new Date(`${dateStr}T${t}:00`).toISOString(),
    capacity:      4,
    price:         Number(price) || 0,
    type:          'open',
    status:        'open',
    includes_cart: !!includesCart,
  }));
  const { data, error } = await sbx.from('tee_slots')
    .upsert(rows, { onConflict: 'course_id,starts_at' })
    .select('id');
  if (error) throw slotError(error);
  return (data || []).length;
}

// All tee slots on one calendar day (local), soonest first.
function useDaySlots(courseId, dateStr) {
  const [rows, setRows] = React.useState(null);
  const load = React.useCallback(async () => {
    if (!courseId || !dateStr) { setRows([]); return; }
    const start = new Date(`${dateStr}T00:00:00`);
    const end = new Date(start.getTime() + 864e5);
    const { data } = await sbx.from('tee_slots').select('*')
      .eq('course_id', courseId)
      .gte('starts_at', start.toISOString())
      .lt('starts_at', end.toISOString())
      .order('starts_at');
    setRows(data || []);
  }, [courseId, dateStr]);
  React.useEffect(() => { load(); }, [load]);
  return [rows, load];
}

// Historical fill rate for this course → drives the live revenue projection.
//   Looks at past slots (last 90d) and what share of their seats got booked.
//   { rate: 0..1|null, seats, booked, sampleSlots }
function useCourseFillRate(courseId) {
  const [info, setInfo] = React.useState(null);
  const load = React.useCallback(async () => {
    if (!courseId) { setInfo(null); return; }
    const since = new Date(Date.now() - 90 * 864e5).toISOString();
    const nowISO = new Date().toISOString();
    const { data: slots } = await sbx.from('tee_slots')
      .select('id, capacity').eq('course_id', courseId)
      .gte('starts_at', since).lt('starts_at', nowISO);
    const ids = (slots || []).map(s => s.id);
    let booked = 0;
    if (ids.length) {
      const { data: bk } = await sbx.from('bookings').select('status').in('slot_id', ids);
      booked = (bk || []).filter(b => b.status !== 'cancelled' && b.status !== 'no_show').length;
    }
    const seats = (slots || []).reduce((s, x) => s + (x.capacity || 4), 0);
    setInfo({ rate: seats ? Math.min(1, booked / seats) : null, seats, booked, sampleSlots: (slots || []).length });
  }, [courseId]);
  React.useEffect(() => { load(); }, [load]);
  return [info, load];
}

function slotError(error) {
  const msg = (error && error.message) || 'Could not save the tee time.';
  if (error && error.code === '23505') return new Error('A slot already exists at that time.');
  if (/row-level security|permission/i.test(msg)) return new Error('Not allowed — you can only manage your own course.');
  return new Error(msg);
}

// ─── Daily yardages: base layout merged with a date's overrides ─────────────
//   Returns [{ hole_number, par, base_yards, yards, override }] for 9 holes.
function useDailyYardages(courseId, dateStr) {
  const [holes, setHoles] = React.useState(null);
  const load = React.useCallback(async () => {
    if (!courseId || !dateStr) { setHoles([]); return; }
    const [{ data: base }, { data: day }] = await Promise.all([
      sbx.from('course_holes').select('hole_number, par, sandbox_yards').eq('course_id', courseId).order('hole_number'),
      sbx.from('course_hole_days').select('hole_number, sandbox_yards').eq('course_id', courseId).eq('play_date', dateStr),
    ]);
    const byHole = {};
    (day || []).forEach(d => { byHole[d.hole_number] = d.sandbox_yards; });
    setHoles((base || []).map(h => {
      const has = Object.prototype.hasOwnProperty.call(byHole, h.hole_number);
      return {
        hole_number: h.hole_number,
        par: h.par,
        base_yards: h.sandbox_yards,
        yards: has ? byHole[h.hole_number] : h.sandbox_yards,
        override: has,
      };
    }));
  }, [courseId, dateStr]);
  React.useEffect(() => { load(); }, [load]);
  return [holes, load];
}

// Save a day's yardages (array of { hole_number, yards }). Upserts overrides.
async function saveDailyYardages(courseId, dateStr, holes) {
  const rows = holes.map(h => ({
    course_id: courseId,
    play_date: dateStr,
    hole_number: Number(h.hole_number),
    sandbox_yards: (h.yards === '' || h.yards == null) ? null : Number(h.yards),
    updated_at: new Date().toISOString(),
  }));
  const { error } = await sbx.from('course_hole_days')
    .upsert(rows, { onConflict: 'course_id,play_date,hole_number' });
  if (error) {
    if (/row-level security|permission/i.test(error.message || '')) throw new Error('Not allowed — you can only manage your own course.');
    throw new Error(error.message || 'Could not save yardages.');
  }
}

// Reset a day back to the base layout (delete its overrides).
async function clearDailyYardages(courseId, dateStr) {
  const { error } = await sbx.from('course_hole_days').delete()
    .eq('course_id', courseId).eq('play_date', dateStr);
  if (error) throw new Error(error.message || 'Could not reset.');
}

// ─── Live on course: active matches + per-group current hole ─────────────────
//   Returns [{ id, match_type, players:[names], holesDone, currentHole, total,
//              status, startedAt, leader }]. Subscribes to realtime so it moves
//   as golfers score.
function useLiveOnCourse(courseId) {
  const [groups, setGroups] = React.useState(null);
  const load = React.useCallback(async () => {
    if (!courseId) { setGroups([]); return; }
    const { data: matches } = await sbx
      .from('matches')
      .select('id, match_type, status, started_at, total_holes, player_a, player_a2, player_b, player_b2')
      .eq('course_id', courseId)
      .in('status', ['waiting', 'active'])
      .order('started_at', { ascending: true });

    const ms = matches || [];
    if (!ms.length) { setGroups([]); return; }

    // Resolve player names.
    const ids = [...new Set(ms.flatMap(m => [m.player_a, m.player_a2, m.player_b, m.player_b2]).filter(Boolean))];
    const { data: profs } = await sbx.from('profiles').select('id, first_name, last_name, handle').in('id', ids);
    const nameOf = {};
    (profs || []).forEach(p => {
      nameOf[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ')
        || (p.handle ? '@' + String(p.handle).replace(/^@/, '') : 'Player');
    });

    // Per-match hole progress.
    const { data: holes } = await sbx.from('match_holes')
      .select('match_id, hole_number, result')
      .in('match_id', ms.map(m => m.id));
    const prog = {};
    (holes || []).forEach(h => {
      const p = prog[h.match_id] || { done: 0, a: 0, b: 0 };
      if (h.result) {
        p.done += 1;
        if (h.result === 'A') p.a += 1;
        else if (h.result === 'B') p.b += 1;
      }
      prog[h.match_id] = p;
    });

    setGroups(ms.map(m => {
      const total = m.total_holes || 9;
      const p = prog[m.id] || { done: 0, a: 0, b: 0 };
      const teamA = [m.player_a, m.player_a2].filter(Boolean).map(id => nameOf[id] || 'Player');
      const teamB = [m.player_b, m.player_b2].filter(Boolean).map(id => nameOf[id] || 'Player');
      const diff = p.a - p.b;
      const leader = diff === 0 ? 'All square'
        : `${diff > 0 ? teamA[0] : teamB[0]} ${Math.abs(diff)} up`;
      return {
        id: m.id,
        match_type: m.match_type,
        status: m.status,
        startedAt: m.started_at,
        teamA, teamB,
        holesDone: p.done,
        currentHole: m.status === 'active' ? Math.min(p.done + 1, total) : null,
        total,
        leader: m.status === 'active' ? leader : null,
      };
    }));
  }, [courseId]);

  React.useEffect(() => { load(); }, [load]);

  // Realtime + 30s backstop so the board stays fresh without manual refresh.
  React.useEffect(() => {
    if (!courseId) return;
    const ch = sbx.channel(`live-${courseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_holes' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => load())
      .subscribe();
    const iv = setInterval(load, 30000);
    return () => { sbx.removeChannel(ch); clearInterval(iv); };
  }, [courseId, load]);

  return [groups, load];
}

// ─── Financials: roll up bookings → revenue / take / net + fill metrics ──────
function useCourseFinancials(courseId, course) {
  const [data, setData] = React.useState(null);
  const load = React.useCallback(async () => {
    if (!courseId) { setData(null); return; }
    // Slots (capacity + price) and their bookings, last 30d → next 14d window.
    const from = new Date(Date.now() - 30 * 864e5).toISOString();
    const { data: slots } = await sbx.from('tee_slots')
      .select('id, starts_at, capacity, price, status').eq('course_id', courseId).gte('starts_at', from);
    const slotIds = (slots || []).map(s => s.id);
    let bookings = [];
    if (slotIds.length) {
      const { data: bk } = await sbx.from('bookings')
        .select('id, slot_id, status, price_charged, created_at').in('slot_id', slotIds);
      bookings = bk || [];
    }
    const priceOf = {}; (slots || []).forEach(s => { priceOf[s.id] = s.price; });
    const live = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'no_show');
    const revenue = live.reduce((s, b) => s + (b.price_charged != null ? b.price_charged : (priceOf[b.slot_id] || 0)), 0);
    const takePct = (course && course.sandbox_take_pct != null) ? course.sandbox_take_pct : 15;
    const sandboxTake = Math.round(revenue * takePct / 100);

    const now = Date.now();
    const upcoming = (slots || []).filter(s => new Date(s.starts_at).getTime() >= now && s.status === 'open');
    const capacityAhead = upcoming.reduce((s, x) => s + (x.capacity || 0), 0);
    const bookedAhead = live.filter(b => {
      const s = (slots || []).find(z => z.id === b.slot_id);
      return s && new Date(s.starts_at).getTime() >= now;
    }).length;

    setData({
      revenue,
      sandboxTake,
      courseNet: revenue - sandboxTake,
      takePct,
      bookingsCount: live.length,
      rounds: Math.round(live.length / 2), // ~2 golfers per match
      upcomingSlots: upcoming.length,
      capacityAhead,
      bookedAhead,
      fillRate: capacityAhead ? Math.round(bookedAhead / capacityAhead * 100) : 0,
    });
  }, [courseId, course]);
  React.useEffect(() => { load(); }, [load]);
  return [data, load];
}

Object.assign(window, {
  useManagedCourses, addCourseManager, removeCourseManager,
  useCourseSlots, useDaySlots, saveSlot, deleteSlot, publishDayTimes, useCourseFillRate,
  useDailyYardages, saveDailyYardages, clearDailyYardages,
  useLiveOnCourse, useCourseFinancials,
});
