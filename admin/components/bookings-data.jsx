/* global React, sbx */
// Admin data layer for bookings. Scoped to a course: bookings → tee_slots
// (filtered by course) + resolved player/partner profiles. Resolved in a few
// plain queries (no reliance on FK-constraint names).

function useBookings(courseId) {
  const [rows, setRows] = React.useState(null); // null = loading
  const load = React.useCallback(async () => {
    if (!courseId) { setRows([]); return; }
    const { data: slots } = await sbx.from('tee_slots').select('id, starts_at').eq('course_id', courseId);
    const slotIds = (slots || []).map(s => s.id);
    const slotById = Object.fromEntries((slots || []).map(s => [s.id, s]));
    if (slotIds.length === 0) { setRows([]); return; }

    const { data: bks } = await sbx
      .from('bookings')
      .select('*')
      .in('slot_id', slotIds)
      .order('created_at', { ascending: false });

    const ids = [...new Set([
      ...(bks || []).map(b => b.user_id),
      ...(bks || []).map(b => b.partner_id).filter(Boolean),
    ])];
    let pById = {};
    if (ids.length) {
      const { data: profs } = await sbx.from('profiles').select('id, handle, first_name, last_name').in('id', ids);
      pById = Object.fromEntries((profs || []).map(p => [p.id, p]));
    }

    setRows((bks || []).map(b => ({
      ...b,
      slot: slotById[b.slot_id] || null,
      user: pById[b.user_id] || null,
      partner: b.partner_id ? (pById[b.partner_id] || null) : null,
    })));
  }, [courseId]);
  React.useEffect(() => { load(); }, [load]);
  return [rows, load];
}

async function setBookingStatus(id, status) {
  const { error } = await sbx.from('bookings').update({ status }).eq('id', id);
  if (error) throw humanizeBooking(error);
}

async function deleteBooking(id) {
  const { error } = await sbx.from('bookings').delete().eq('id', id);
  if (error) throw humanizeBooking(error);
}

function humanizeBooking(error) {
  const msg = (error && error.message) || 'Something went wrong.';
  if (/row-level security|permission/i.test(msg)) return new Error('Not allowed — your account needs admin access.');
  return new Error(msg);
}

Object.assign(window, { useBookings, setBookingStatus, deleteBooking });
