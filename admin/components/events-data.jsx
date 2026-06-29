/* global React, sbx */
// Admin data layer for events (tournaments / league nights). Mirrors the
// in-app admin create/update in v1/components/events-data.jsx, plus delete.

function useEventsAdmin() {
  const [rows, setRows] = React.useState(null); // null = loading
  const load = React.useCallback(async () => {
    const { data } = await sbx.from('events').select('*').order('starts_at', { ascending: false });
    setRows(data || []);
  }, []);
  React.useEffect(() => { load(); }, [load]);
  return [rows, load];
}

// ev: { id?, course_short, course_name, starts_at (ISO), field, type,
//       tagline, description, img_url, price_walkup, price_member, status }
async function saveEvent(ev) {
  const walkup = Number(ev.price_walkup) || 0;
  const member = Number(ev.price_member) || 0;
  if (!ev.course_short || !ev.course_name) throw new Error('Course short + full name are required.');
  if (!ev.starts_at) throw new Error('Pick a date and time.');
  if (!Number(ev.field) || Number(ev.field) <= 0) throw new Error('Field size must be at least 1.');
  // Business rule: walk-up price must exceed member price.
  if (walkup <= member) throw new Error('Walk-up price must be greater than the member price.');

  const payload = {
    course_short: ev.course_short.trim(),
    course_name:  ev.course_name.trim(),
    starts_at:    ev.starts_at,
    field:        Number(ev.field),
    type:         ev.type || 'weekly',
    is_major:     ev.type === 'major',
    tagline:      ev.tagline ? ev.tagline.trim() : null,
    description:  ev.description ? ev.description.trim() : null,
    img_url:      ev.img_url ? ev.img_url.trim() : null,
    price_walkup: walkup,
    price_member: member,
    status:       ev.status || 'open',
  };

  const res = ev.id
    ? await sbx.from('events').update(payload).eq('id', ev.id)
    : await sbx.from('events').insert({ ...payload, status: payload.status || 'open' });
  if (res.error) throw humanizeEvent(res.error);
}

async function deleteEvent(id) {
  const { error } = await sbx.from('events').delete().eq('id', id);
  if (error) throw humanizeEvent(error);
}

function humanizeEvent(error) {
  const msg = (error && error.message) || 'Something went wrong.';
  if (/row-level security|permission/i.test(msg)) return new Error('Not allowed — your account needs admin access.');
  return new Error(msg);
}

Object.assign(window, { useEventsAdmin, saveEvent, deleteEvent });
