/* global React, sbx */
// Admin data layer for courses + their Sandbox-9 hole/tee data.
// Reads/writes `courses` and `course_holes` (RLS allows admins). Column names
// mirror v1/sql/courses.sql so the golfer app reads the same rows.

function useCourses() {
  const [rows, setRows] = React.useState(null); // null = loading
  const load = React.useCallback(async () => {
    const { data } = await sbx.from('courses').select('*').order('name');
    setRows(data || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);
  return [rows, load];
}

async function loadCourseHoles(courseId) {
  if (!courseId) return [];
  const { data } = await sbx
    .from('course_holes')
    .select('*')
    .eq('course_id', courseId)
    .order('hole_number');
  return data || [];
}

// course: field object (id present = update). holes: array of
// { hole_number, par, sandbox_yards }. Course `par`/`holes` are derived from
// the hole rows so they always stay consistent.
async function saveCourse(course, holes) {
  const cleanHoles = holes.map(h => ({
    hole_number: Number(h.hole_number),
    par: Number(h.par) || 3,
    sandbox_yards: (h.sandbox_yards === '' || h.sandbox_yards == null) ? null : Number(h.sandbox_yards),
  }));

  const payload = {
    name:             (course.name || '').trim(),
    short_name:       (course.short_name || '').trim(),
    city:             (course.city || '').trim(),
    state:            (course.state || 'FL').trim(),
    address:          course.address ? course.address.trim() : null,
    phone:            course.phone ? course.phone.trim() : null,
    description:      course.description ? course.description.trim() : null,
    hero_img:         course.hero_img ? course.hero_img.trim() : null,
    render_img:       course.render_img ? course.render_img.trim() : null,
    holes:            cleanHoles.length,
    par:              cleanHoles.reduce((s, h) => s + h.par, 0),
    suggested_price:  Number(course.suggested_price) || 0,
    sandbox_take_pct: Number(course.sandbox_take_pct) || 15,
    status:           course.status || 'active',
  };

  if (!payload.name || !payload.short_name || !payload.city) {
    throw new Error('Name, short name and city are required.');
  }

  let courseId = course.id;
  if (courseId) {
    const { error } = await sbx.from('courses').update(payload).eq('id', courseId);
    if (error) throw humanize(error);
  } else {
    const { data, error } = await sbx.from('courses').insert(payload).select('id').single();
    if (error) throw humanize(error);
    courseId = data.id;
  }

  const holeRows = cleanHoles.map(h => ({ course_id: courseId, ...h }));
  const { error: hErr } = await sbx
    .from('course_holes')
    .upsert(holeRows, { onConflict: 'course_id,hole_number' });
  if (hErr) throw humanize(hErr);

  return courseId;
}

async function deleteCourse(courseId) {
  const { error } = await sbx.from('courses').delete().eq('id', courseId);
  if (error) throw humanize(error);
}

function humanize(error) {
  const msg = (error && error.message) || 'Something went wrong.';
  if (error && error.code === '23505') return new Error('That short name is already taken — pick a unique one.');
  if (/row-level security|permission/i.test(msg)) return new Error('Not allowed — your account needs admin access.');
  return new Error(msg);
}

Object.assign(window, { useCourses, loadCourseHoles, saveCourse, deleteCourse });
