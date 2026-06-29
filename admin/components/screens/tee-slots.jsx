/* global React, Row, Field, Spinner, useCourses, useTeeSlots, saveTeeSlot, deleteTeeSlot */
// Tee slots module: pick a course, manage its availability windows (time,
// capacity, price, type, status).

function slotToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function slotFromLocalInput(s) {
  return s ? new Date(s).toISOString() : null;
}
function fmtSlot(iso) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function TeeSlotsModule() {
  const [courses] = useCourses();
  const [courseId, setCourseId] = React.useState(null);
  React.useEffect(() => {
    if (courseId == null && courses && courses.length) setCourseId(courses[0].id);
  }, [courses, courseId]);

  const [slots, reload] = useTeeSlots(courseId);
  const [editing, setEditing] = React.useState(null); // null | 'new' | slot

  if (courses === null) return <Spinner/>;
  if (courses.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)' }}>Add a course first</div>
        <div style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>Tee slots belong to a course — create one in the Courses module.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Row>
        <Field label="Course" full>
          <select className="select" value={courseId || ''} onChange={e => { setCourseId(e.target.value); setEditing(null); }}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </Row>

      {editing ? (
        <TeeSlotEditor
          courseId={courseId}
          slot={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 14px' }}>
            <div style={{ fontSize: 13, opacity: 0.65 }}>{slots === null ? 'Loading…' : `${slots.length} ${slots.length === 1 ? 'slot' : 'slots'}`}</div>
            <button className="btn btn-forest" onClick={() => setEditing('new')}>+ Add tee slot</button>
          </div>

          {slots === null ? <Spinner/> : slots.length === 0 ? (
            <div className="card" style={{ padding: 30, textAlign: 'center', opacity: 0.7, fontSize: 14 }}>No tee slots yet for this course.</div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {slots.map((s, i) => (
                <button key={s.id} onClick={() => setEditing(s)} style={{
                  display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
                  padding: '13px 16px', background: 'transparent', cursor: 'pointer',
                  border: 'none', borderBottom: i < slots.length - 1 ? 'var(--hairline)' : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{fmtSlot(s.starts_at)}</div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                      {s.title ? s.title + ' · ' : ''}{s.type} · capacity {s.capacity}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: 999,
                    background: s.status === 'open' ? 'rgba(28,73,42,0.1)' : 'rgba(14,28,19,0.06)',
                    color: s.status === 'open' ? 'var(--forest)' : 'var(--ink-soft)',
                  }}>{s.status}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)', fontFamily: 'var(--font-mono)' }}>${s.price}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TeeSlotEditor({ courseId, slot, onClose, onSaved }) {
  const isNew = !slot;
  const [form, setForm] = React.useState(() => ({
    id:        slot ? slot.id : undefined,
    startsLocal: slot ? slotToLocalInput(slot.starts_at) : '',
    capacity:  slot ? slot.capacity : 8,
    price:     slot ? slot.price : 0,
    type:      slot ? (slot.type || 'open') : 'open',
    title:     slot ? (slot.title || '') : '',
    status:    slot ? (slot.status || 'open') : 'open',
  }));
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true); setErr('');
    try {
      await saveTeeSlot({
        id: form.id, course_id: courseId,
        starts_at: slotFromLocalInput(form.startsLocal),
        capacity: form.capacity, price: form.price,
        type: form.type, title: form.title, status: form.status,
      });
      onSaved();
    } catch (e) { setErr(e.message || 'Could not save.'); setSaving(false); }
  }

  async function remove() {
    if (!window.confirm('Delete this tee slot?')) return;
    setSaving(true); setErr('');
    try { await deleteTeeSlot(form.id); onSaved(); }
    catch (e) { setErr(e.message || 'Could not delete.'); setSaving(false); }
  }

  return (
    <div className="card" style={{ padding: 22 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>{isNew ? 'New tee slot' : 'Edit tee slot'}</div>
      <Row>
        <Field label="Date & time" full>
          <input className="input" type="datetime-local" value={form.startsLocal} onChange={e => set('startsLocal', e.target.value)}/>
        </Field>
      </Row>
      <Row>
        <Field label="Capacity"><input className="input" type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)}/></Field>
        <Field label="Price ($)"><input className="input" type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)}/></Field>
      </Row>
      <Row>
        <Field label="Type">
          <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="open">open</option>
            <option value="event">event</option>
            <option value="major">major</option>
          </select>
        </Field>
        <Field label="Status">
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="open">open</option>
            <option value="full">full</option>
            <option value="closed">closed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </Field>
      </Row>
      <Row>
        <Field label="Title (for event / major)" full>
          <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Friday Night Major"/>
        </Field>
      </Row>

      {err && <div style={{ margin: '4px 0 14px', fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn btn-forest" onClick={save} disabled={saving}>{saving ? 'Saving…' : (isNew ? 'Create slot' : 'Save changes')}</button>
        <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        {!isNew && <button className="btn btn-danger" onClick={remove} disabled={saving} style={{ marginLeft: 'auto' }}>Delete</button>}
      </div>
    </div>
  );
}

Object.assign(window, { TeeSlotsModule });
