/* global React, Row, Field, Spinner, useRcCourses, saveRcCourse, deleteRcCourse, useRcTees, saveRcTee, deleteRcTee, loadRcHoles, saveRcHoles */
// Scorecards module: manage REAL course tee data (tees, yardage, rating, slope
// + per-hole). This is the actual course data the golfer app shows when picking
// a course/tee — separate from the Sandbox-9 pitch-and-putt yardages in Courses.

function ScorecardsModule() {
  const [courses, reload] = useRcCourses();
  const [editing, setEditing] = React.useState(null); // null | 'new' | course

  if (editing) {
    return <RcEditor course={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }}/>;
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, opacity: 0.65 }}>{courses === null ? 'Loading…' : `${courses.length} ${courses.length === 1 ? 'course' : 'courses'}`}</div>
        <button className="btn btn-forest" onClick={() => setEditing('new')}>+ Add course</button>
      </div>

      {courses === null ? <Spinner/> : courses.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)' }}>No scorecards yet</div>
          <div style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>Add a real course with its tees, yardage, rating &amp; slope.</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {courses.map((c, i) => (
            <button key={c.id} onClick={() => setEditing(c)} style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
              padding: '14px 18px', background: 'transparent', cursor: 'pointer',
              border: 'none', borderBottom: i < courses.length - 1 ? 'var(--hairline)' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{c.name}</div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{[c.city, c.state].filter(Boolean).join(', ')} · {c.holes} holes</div>
              </div>
              <span style={{ fontSize: 18, opacity: 0.4 }}>→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RcEditor({ course, onClose, onSaved }) {
  const isNew = !course;
  const [form, setForm] = React.useState(() => ({
    id: course ? course.id : undefined,
    name: course ? course.name : '',
    city: course ? (course.city || '') : '',
    state: course ? (course.state || 'FL') : 'FL',
    holes: course ? (course.holes || 18) : 18,
  }));
  const [courseId, setCourseId] = React.useState(course ? course.id : null);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function saveCourse() {
    setSaving(true); setErr('');
    try {
      const id = await saveRcCourse(form);
      setCourseId(id);
      setForm(f => ({ ...f, id }));
    } catch (e) { setErr(e.message || 'Could not save.'); }
    setSaving(false);
  }
  async function remove() {
    if (!window.confirm(`Delete "${form.name}" and all its tees?`)) return;
    setSaving(true); setErr('');
    try { await deleteRcCourse(form.id); onSaved(); }
    catch (e) { setErr(e.message || 'Could not delete.'); setSaving(false); }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={onClose} style={{ marginBottom: 18 }}>← Back to scorecards</button>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--forest)', marginBottom: 16 }}>{isNew ? 'New course' : form.name}</div>

      {err && <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}

      <div className="card" style={{ padding: 22, marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Course</div>
        <Row>
          <Field label="Name" full><input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Killian Greens Golf Club"/></Field>
        </Row>
        <Row>
          <Field label="City"><input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Miami"/></Field>
          <Field label="State"><input className="input" value={form.state} onChange={e => set('state', e.target.value)}/></Field>
          <Field label="Holes"><input className="input" type="number" min="1" value={form.holes} onChange={e => set('holes', e.target.value)}/></Field>
        </Row>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
          <button className="btn btn-forest" onClick={saveCourse} disabled={saving}>{saving ? 'Saving…' : (courseId ? 'Save course' : 'Create course')}</button>
          {!isNew && <button className="btn btn-danger" onClick={remove} disabled={saving} style={{ marginLeft: 'auto' }}>Delete course</button>}
        </div>
      </div>

      {courseId ? (
        <TeesSection courseId={courseId} holes={Number(form.holes) || 18}/>
      ) : (
        <div className="card" style={{ padding: 20, textAlign: 'center', fontSize: 13, opacity: 0.7 }}>Create the course first, then add its tees.</div>
      )}
    </div>
  );
}

// ─── Tees section ────────────────────────────────────────────────────────────
function TeesSection({ courseId, holes }) {
  const [tees, reload] = useRcTees(courseId);
  const [err, setErr] = React.useState('');

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="eyebrow">Tees · yardage · rating · slope</div>
      </div>
      {err && <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}

      {tees === null ? <Spinner/> : (
        <div>
          {tees.map(t => <TeeRow key={t.id} tee={t} holes={holes} onSaved={reload} onError={setErr}/>)}
          <TeeRow key="new" tee={{ course_id: courseId, name: '', color: '', par: '', yards: '', rating: '', slope: '' }} holes={holes} isNew onSaved={reload} onError={setErr}/>
        </div>
      )}
    </div>
  );
}

function TeeRow({ tee, holes, isNew, onSaved, onError }) {
  const [f, setF] = React.useState({ ...tee });
  const [busy, setBusy] = React.useState(false);
  const [showHoles, setShowHoles] = React.useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const dirty = ['name', 'color', 'par', 'yards', 'rating', 'slope'].some(k => String(f[k] ?? '') !== String(tee[k] ?? ''));

  async function save() {
    setBusy(true); onError('');
    try { await saveRcTee(f); if (isNew) setF({ ...tee }); onSaved(); }
    catch (e) { onError(e.message || 'Could not save.'); }
    setBusy(false);
  }
  async function remove() {
    if (!window.confirm(`Delete the ${tee.name} tee?`)) return;
    setBusy(true); onError('');
    try { await deleteRcTee(tee.id); onSaved(); }
    catch (e) { onError(e.message || 'Could not delete.'); }
    setBusy(false);
  }

  const inp = { padding: '7px 9px' };
  return (
    <div style={{ borderTop: 'var(--hairline)', padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ width: 26, height: 26, borderRadius: 99, marginBottom: 4, background: f.color || '#ccc', border: '2px solid var(--paper)', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }}/>
        <Mini label="Tee" w={92}><input className="input" style={inp} value={f.name || ''} onChange={e => set('name', e.target.value)} placeholder="Blue"/></Mini>
        <Mini label="Color" w={92}><input className="input" style={inp} value={f.color || ''} onChange={e => set('color', e.target.value)} placeholder="#3b6fb3"/></Mini>
        <Mini label="Par" w={60}><input className="input" style={inp} type="number" value={f.par ?? ''} onChange={e => set('par', e.target.value)} placeholder="72"/></Mini>
        <Mini label="Yards" w={74}><input className="input" style={inp} type="number" value={f.yards ?? ''} onChange={e => set('yards', e.target.value)} placeholder="6449"/></Mini>
        <Mini label="Rating" w={70}><input className="input" style={inp} type="number" step="0.1" value={f.rating ?? ''} onChange={e => set('rating', e.target.value)} placeholder="70.1"/></Mini>
        <Mini label="Slope" w={64}><input className="input" style={inp} type="number" value={f.slope ?? ''} onChange={e => set('slope', e.target.value)} placeholder="124"/></Mini>
        <div style={{ display: 'flex', gap: 6, marginBottom: 1, marginLeft: 'auto' }}>
          {(dirty || isNew) && <button className="btn btn-forest" style={{ padding: '7px 12px' }} disabled={busy || !f.name} onClick={save}>{isNew ? 'Add' : 'Save'}</button>}
          {!isNew && <button className="btn btn-ghost" style={{ padding: '7px 10px' }} disabled={busy} onClick={() => setShowHoles(s => !s)}>{showHoles ? 'Hide holes' : 'Holes'}</button>}
          {!isNew && <button className="btn btn-danger" style={{ padding: '7px 10px' }} disabled={busy} onClick={remove}>✕</button>}
        </div>
      </div>
      {showHoles && !isNew && <HoleGrid teeId={tee.id} holes={holes} onError={onError}/>}
    </div>
  );
}

function Mini({ label, w, children }) {
  return (
    <div style={{ width: w }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--forest)', opacity: 0.7, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
      {children}
    </div>
  );
}

// Per-hole scorecard editor for one tee (loads on demand).
function HoleGrid({ teeId, holes, onError }) {
  const [rows, setRows] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  React.useEffect(() => {
    let on = true;
    loadRcHoles(teeId).then(existing => {
      if (!on) return;
      const byHole = {}; existing.forEach(h => { byHole[h.hole_number] = h; });
      setRows(Array.from({ length: holes }, (_, i) => {
        const n = i + 1, h = byHole[n] || {};
        return { hole_number: n, par: h.par ?? '', yards: h.yards ?? '', hcp: h.hcp ?? '' };
      }));
    });
    return () => { on = false; };
  }, [teeId, holes]);

  const setCell = (i, k, v) => setRows(r => r.map((h, j) => j === i ? { ...h, [k]: v } : h));

  async function save() {
    setBusy(true); setMsg(''); onError('');
    try { await saveRcHoles(teeId, rows); setMsg('Holes saved.'); }
    catch (e) { onError(e.message || 'Could not save holes.'); }
    setBusy(false);
  }

  if (rows === null) return <div style={{ padding: '10px 0' }}><Spinner/></div>;
  return (
    <div style={{ marginTop: 12, background: 'rgba(28,73,42,0.04)', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
        {rows.map((h, i) => (
          <div key={h.hole_number} style={{ border: 'var(--hairline)', borderRadius: 10, padding: '8px 10px', background: 'var(--paper)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--forest)' }}>Hole {h.hole_number}</div>
            <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
              <input className="input" style={{ padding: '5px 6px' }} type="number" value={h.par} onChange={e => setCell(i, 'par', e.target.value)} placeholder="par" title="Par"/>
              <input className="input" style={{ padding: '5px 6px' }} type="number" value={h.yards} onChange={e => setCell(i, 'yards', e.target.value)} placeholder="yds" title="Yards"/>
              <input className="input" style={{ padding: '5px 6px' }} type="number" value={h.hcp} onChange={e => setCell(i, 'hcp', e.target.value)} placeholder="hcp" title="Handicap"/>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <button className="btn btn-forest" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save holes'}</button>
        {msg && <span style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 600 }}>{msg}</span>}
      </div>
    </div>
  );
}

Object.assign(window, { ScorecardsModule });
