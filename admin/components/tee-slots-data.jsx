/* global React, sbx */
// Admin data layer for tee-time slots (availability + pricing per course).
// Reads/writes `tee_slots` (RLS allows admins). Mirrors v1/sql/courses.sql.

function useTeeSlots(courseId) {
  const [rows, setRows] = React.useState(null); // null = loading
  const load = React.useCallback(async () => {
    if (!courseId) { setRows([]); return; }
    const { data } = await sbx
      .from('tee_slots')
      .select('*')
      .eq('course_id', courseId)
      .order('starts_at');
    setRows(data || []);
  }, [courseId]);
  React.useEffect(() => { load(); }, [load]);
  return [rows, load];
}

// slot: { id?, course_id, starts_at (ISO), capacity, price, type, title, status }
async function saveTeeSlot(slot) {
  const payload = {
    course_id: slot.course_id,
    starts_at: slot.starts_at,
    capacity:  Number(slot.capacity) || 8,
    price:     Number(slot.price) || 0,
    type:      slot.type || 'open',
    title:     slot.title ? slot.title.trim() : null,
    status:    slot.status || 'open',
  };
  if (!payload.course_id) throw new Error('Pick a course first.');
  if (!payload.starts_at) throw new Error('Pick a date and time.');
  if (payload.capacity <= 0) throw new Error('Capacity must be at least 1.');

  const res = slot.id
    ? await sbx.from('tee_slots').update(payload).eq('id', slot.id)
    : await sbx.from('tee_slots').insert(payload);
  if (res.error) throw humanizeSlot(res.error);
}

async function deleteTeeSlot(id) {
  const { error } = await sbx.from('tee_slots').delete().eq('id', id);
  if (error) throw humanizeSlot(error);
}

function humanizeSlot(error) {
  const msg = (error && error.message) || 'Something went wrong.';
  if (error && error.code === '23505') return new Error('A slot already exists at that exact time for this course.');
  if (/row-level security|permission/i.test(msg)) return new Error('Not allowed — your account needs admin access.');
  return new Error(msg);
}

Object.assign(window, { useTeeSlots, saveTeeSlot, deleteTeeSlot });
