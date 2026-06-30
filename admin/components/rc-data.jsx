/* global React, sbx */
// Admin data layer for REAL course scorecards — the actual golf course tees,
// yardage, rating & slope (rc_courses / rc_tees / rc_holes). Separate from the
// Sandbox-9 pitch-and-putt data on `courses` / `course_holes`. The golfer app's
// Challenge / match setup reads these, so adding a course here makes its tees
// selectable in the app. Admin RLS already allows writes (v1/sql/rc-courses.sql).

function numOrNull(v) { return (v === '' || v == null) ? null : Number(v); }

// Tee colour straight from the tee's name — no hex picker needed.
const TEE_COLORS = {
  black: '#111111', championship: '#111111', back: '#111111',
  blue: '#2f6fb3', white: '#9aa0a6', gold: '#caa53d', yellow: '#e1c340',
  red: '#c0392b', green: '#2e7d32', forest: '#1c492a', silver: '#b8bcc2',
  orange: '#cc7a2b', purple: '#6b4ea0', pink: '#d46a9f', teal: '#2a9d8f',
};
function teeColor(name) {
  const k = (name || '').trim().toLowerCase();
  return TEE_COLORS[k] || '#9aa0a6';
}
function rcErr(error) {
  const msg = (error && error.message) || 'Something went wrong.';
  if (error && error.code === '23505') return new Error('That name already exists for this course.');
  if (/row-level security|permission/i.test(msg)) return new Error('Not allowed — your account needs admin access.');
  return new Error(msg);
}

// ─── Real courses ────────────────────────────────────────────────────────────
function useRcCourses() {
  const [rows, setRows] = React.useState(null);
  const load = React.useCallback(async () => {
    const { data } = await sbx.from('rc_courses').select('*').order('name');
    setRows(data || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);
  return [rows, load];
}

async function saveRcCourse(c) {
  const payload = {
    name:  (c.name || '').trim(),
    city:  c.city ? c.city.trim() : null,
    state: (c.state || 'FL').trim(),
    holes: Number(c.holes) || 18,
  };
  if (!payload.name) throw new Error('Course name is required.');
  if (c.id) {
    const { error } = await sbx.from('rc_courses').update(payload).eq('id', c.id);
    if (error) throw rcErr(error);
    return c.id;
  }
  const { data, error } = await sbx.from('rc_courses').insert(payload).select('id').single();
  if (error) throw rcErr(error);
  return data.id;
}

async function deleteRcCourse(id) {
  const { error } = await sbx.from('rc_courses').delete().eq('id', id);
  if (error) throw rcErr(error);
}

// ─── Tees (Blue / White / Red …) ─────────────────────────────────────────────
function useRcTees(courseId) {
  const [rows, setRows] = React.useState(null);
  const load = React.useCallback(async () => {
    if (!courseId) { setRows([]); return; }
    const { data } = await sbx.from('rc_tees').select('*').eq('course_id', courseId).order('yards', { ascending: false });
    setRows(data || []);
  }, [courseId]);
  React.useEffect(() => { load(); }, [load]);
  return [rows, load];
}

async function saveRcTee(t) {
  const payload = {
    course_id: t.course_id,
    name:   (t.name || '').trim(),
    color:  teeColor(t.name),
    par:    numOrNull(t.par),
    yards:  numOrNull(t.yards),
    rating: numOrNull(t.rating),
    slope:  numOrNull(t.slope),
  };
  if (!payload.course_id) throw new Error('Pick a course first.');
  if (!payload.name) throw new Error('Tee name is required (e.g. Blue).');
  if (t.id) {
    const { error } = await sbx.from('rc_tees').update(payload).eq('id', t.id);
    if (error) throw rcErr(error);
  } else {
    const { error } = await sbx.from('rc_tees').insert(payload);
    if (error) throw rcErr(error);
  }
}

async function deleteRcTee(id) {
  const { error } = await sbx.from('rc_tees').delete().eq('id', id);
  if (error) throw rcErr(error);
}

// ─── Per-hole scorecard for one tee ──────────────────────────────────────────
async function loadRcHoles(teeId) {
  if (!teeId) return [];
  const { data } = await sbx.from('rc_holes').select('*').eq('tee_id', teeId).order('hole_number');
  return data || [];
}

async function saveRcHoles(teeId, holes) {
  const rows = holes.map(h => ({
    tee_id: teeId,
    hole_number: Number(h.hole_number),
    par: numOrNull(h.par),
    yards: numOrNull(h.yards),
    hcp: numOrNull(h.hcp),
  }));
  const { error } = await sbx.from('rc_holes').upsert(rows, { onConflict: 'tee_id,hole_number' });
  if (error) throw rcErr(error);
}

// Save a whole scorecard at once (the Quick-entry tool).
//   course: { name, city, state, holes }
//   tees:   [{ name, color, rating, slope, yards: [perHole…] }]
//   par:    [perHole…]   hcp: [perHole…]
async function saveFullScorecard({ course, tees, par, hcp }) {
  const holes = Number(course.holes) || 18;
  const courseId = await saveRcCourse(course);
  const parTotal = par.reduce((s, p) => s + (Number(p) || 0), 0) || null;

  for (const t of tees) {
    if (!t.name || !t.name.trim()) continue;
    const total = (t.yards || []).reduce((s, y) => s + (Number(y) || 0), 0) || null;
    const { data, error } = await sbx.from('rc_tees').upsert({
      course_id: courseId,
      name: t.name.trim(),
      color: teeColor(t.name),
      par: parTotal,
      yards: total,
      rating: numOrNull(t.rating),
      slope: numOrNull(t.slope),
    }, { onConflict: 'course_id,name' }).select('id').single();
    if (error) throw rcErr(error);

    const holeRows = [];
    for (let i = 0; i < holes; i++) {
      holeRows.push({
        tee_id: data.id,
        hole_number: i + 1,
        par: numOrNull(par[i]),
        yards: numOrNull((t.yards || [])[i]),
        hcp: numOrNull(hcp[i]),
      });
    }
    const { error: hErr } = await sbx.from('rc_holes').upsert(holeRows, { onConflict: 'tee_id,hole_number' });
    if (hErr) throw rcErr(hErr);
  }
  return courseId;
}

Object.assign(window, {
  useRcCourses, saveRcCourse, deleteRcCourse,
  useRcTees, saveRcTee, deleteRcTee,
  loadRcHoles, saveRcHoles, saveFullScorecard, teeColor,
});
