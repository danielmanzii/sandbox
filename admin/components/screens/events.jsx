/* global React, Row, Field, Spinner, useEventsAdmin, saveEvent, deleteEvent */
// Events module: list + add/edit/delete events (tournaments, league nights).

function evToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function evFromLocalInput(s) { return s ? new Date(s).toISOString() : null; }
function evWhen(iso) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function EventsModule() {
  const [events, reload] = useEventsAdmin();
  const [editing, setEditing] = React.useState(null); // null | 'new' | eventRow

  if (editing) {
    return <EventEditor event={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }}/>;
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 13, opacity: 0.65 }}>{events === null ? 'Loading…' : `${events.length} ${events.length === 1 ? 'event' : 'events'}`}</div>
        <button className="btn btn-forest" onClick={() => setEditing('new')}>+ Add event</button>
      </div>

      {events === null ? <Spinner/> : events.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)' }}>No events yet</div>
          <div style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>Add a tournament or league night.</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {events.map((e, i) => (
            <button key={e.id} onClick={() => setEditing(e)} style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
              padding: '14px 18px', background: 'transparent', cursor: 'pointer',
              border: 'none', borderBottom: i < events.length - 1 ? 'var(--hairline)' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{e.course_short}{e.is_major ? ' ⛳' : ''}</div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{evWhen(e.starts_at)} · {e.type} · field {e.field}</div>
              </div>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 999,
                background: e.status === 'open' || e.status === 'live' ? 'rgba(28,73,42,0.1)' : 'rgba(14,28,19,0.06)',
                color: e.status === 'open' || e.status === 'live' ? 'var(--forest)' : 'var(--ink-soft)',
              }}>{e.status}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)', fontFamily: 'var(--font-mono)' }}>${e.price_member}/${e.price_walkup}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EventEditor({ event, onClose, onSaved }) {
  const isNew = !event;
  const [form, setForm] = React.useState(() => ({
    id:           event ? event.id : undefined,
    course_short: event ? event.course_short : '',
    course_name:  event ? event.course_name : '',
    startsLocal:  event ? evToLocalInput(event.starts_at) : '',
    field:        event ? event.field : 24,
    type:         event ? (event.type || 'weekly') : 'weekly',
    tagline:      event ? (event.tagline || '') : '',
    description:  event ? (event.description || '') : '',
    img_url:      event ? (event.img_url || '') : '',
    price_walkup: event ? (event.price_walkup ?? 20) : 20,
    price_member: event ? (event.price_member ?? 0) : 0,
    status:       event ? (event.status || 'open') : 'open',
  }));
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true); setErr('');
    try {
      await saveEvent({
        id: form.id, course_short: form.course_short, course_name: form.course_name,
        starts_at: evFromLocalInput(form.startsLocal), field: form.field, type: form.type,
        tagline: form.tagline, description: form.description, img_url: form.img_url,
        price_walkup: form.price_walkup, price_member: form.price_member, status: form.status,
      });
      onSaved();
    } catch (e) { setErr(e.message || 'Could not save.'); setSaving(false); }
  }
  async function remove() {
    if (!window.confirm(`Delete "${form.course_short}"? Registrations may be affected.`)) return;
    setSaving(true); setErr('');
    try { await deleteEvent(form.id); onSaved(); }
    catch (e) { setErr(e.message || 'Could not delete.'); setSaving(false); }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={onClose} style={{ marginBottom: 18 }}>← Back to events</button>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--forest)', marginBottom: 18 }}>{isNew ? 'New event' : form.course_short}</div>

      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <Row>
          <Field label="Course short name"><input className="input" value={form.course_short} onChange={e => set('course_short', e.target.value)} placeholder="Melreese"/></Field>
          <Field label="Course full name"><input className="input" value={form.course_name} onChange={e => set('course_name', e.target.value)} placeholder="International Links Melreese"/></Field>
        </Row>
        <Row>
          <Field label="Date & time"><input className="input" type="datetime-local" value={form.startsLocal} onChange={e => set('startsLocal', e.target.value)}/></Field>
          <Field label="Field size"><input className="input" type="number" min="1" value={form.field} onChange={e => set('field', e.target.value)}/></Field>
        </Row>
        <Row>
          <Field label="Type">
            <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="weekly">weekly</option>
              <option value="major">major</option>
              <option value="social">social</option>
              <option value="member-only">member-only</option>
              <option value="corporate">corporate</option>
            </select>
          </Field>
          <Field label="Status">
            <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="open">open</option>
              <option value="live">live</option>
              <option value="member-only">member-only</option>
              <option value="closed">closed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="Member price ($)"><input className="input" type="number" min="0" value={form.price_member} onChange={e => set('price_member', e.target.value)}/></Field>
          <Field label="Walk-up price ($)"><input className="input" type="number" min="0" value={form.price_walkup} onChange={e => set('price_walkup', e.target.value)}/></Field>
        </Row>
        <Row>
          <Field label="Tagline" full><input className="input" value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Weekly Match Night"/></Field>
        </Row>
        <Row>
          <Field label="Description" full><textarea className="input" style={{ minHeight: 64, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)}/></Field>
        </Row>
        <Row>
          <Field label="Hero image URL" full><input className="input" value={form.img_url} onChange={e => set('img_url', e.target.value)} placeholder="https://…"/></Field>
        </Row>
      </div>

      {err && <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn btn-forest" onClick={save} disabled={saving}>{saving ? 'Saving…' : (isNew ? 'Create event' : 'Save changes')}</button>
        <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        {!isNew && <button className="btn btn-danger" onClick={remove} disabled={saving} style={{ marginLeft: 'auto' }}>Delete event</button>}
      </div>
    </div>
  );
}

Object.assign(window, { EventsModule });
