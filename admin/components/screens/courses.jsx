/* global React, Row, Field, Spinner, useCourses, loadCourseHoles, saveCourse, deleteCourse, useRcCourses, RcEditor, QuickScorecard */
// SBX courses module: one list of every golf course. Each row opens either the
// FULL COURSE data (real tees/yardage/rating/slope → rc_courses) or the SBX
// COURSE data (Sandbox-9 pitch-and-putt yardages → courses). Merges what used
// to be the separate Courses + Scorecards modules.

function CoursesModule() {
  const [sbxCourses, reloadSbx] = useCourses();
  const [rcCourses, reloadRc] = useRcCourses();
  const [view, setView] = React.useState(null);
  const reloadAll = () => { reloadSbx(); reloadRc(); };
  const close = () => setView(null);
  const saved = () => { setView(null); reloadAll(); };

  if (view) {
    if (view.kind === 'quick') return <QuickScorecard onClose={close} onSaved={saved}/>;
    if (view.kind === 'sbx') return <CourseEditor course={view.course} prefill={view.prefill} onClose={close} onSaved={saved}/>;
    if (view.kind === 'full') return <RcEditor course={view.course} prefill={view.prefill} onClose={close} onSaved={saved}/>;
  }

  const loading = sbxCourses === null || rcCourses === null;
  // Merge the two tables by course name into one list.
  const byKey = {};
  (sbxCourses || []).forEach(c => { const k = c.name.trim().toLowerCase(); byKey[k] = { ...(byKey[k] || { key: k }), name: c.name, city: c.city, state: c.state, sbx: c }; });
  (rcCourses || []).forEach(c => { const k = c.name.trim().toLowerCase(); const e = byKey[k] || { key: k }; byKey[k] = { ...e, name: e.name || c.name, city: e.city || c.city, full: c }; });
  const list = Object.values(byKey).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, opacity: 0.65 }}>{loading ? 'Loading…' : `${list.length} ${list.length === 1 ? 'course' : 'courses'}`}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setView({ kind: 'sbx', course: null })}>+ Add SBX course</button>
          <button className="btn btn-forest" onClick={() => setView({ kind: 'quick' })}>＋ Enter a scorecard</button>
        </div>
      </div>

      {loading ? <Spinner/> : list.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)' }}>No courses yet</div>
          <div style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>Add a course to get started.</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {list.map((e, i) => (
            <div key={e.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < list.length - 1 ? 'var(--hairline)' : 'none', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{e.name}</div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{[e.city, e.state].filter(Boolean).join(', ')}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <CourseTab label="Full course" has={!!e.full}
                  onClick={() => setView({ kind: 'full', course: e.full || null, prefill: e.full ? null : { name: e.name, city: e.city, state: e.state } })}/>
                <CourseTab label="SBX course" has={!!e.sbx}
                  onClick={() => setView({ kind: 'sbx', course: e.sbx || null, prefill: e.sbx ? null : { name: e.name, short_name: e.name, city: e.city, state: e.state } })}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// A per-course entry tab. Filled (forest) when that data exists, outlined "+" when it doesn't.
function CourseTab({ label, has, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
      border: has ? '1px solid var(--forest)' : '1px dashed rgba(14,28,19,0.3)',
      background: has ? 'var(--forest)' : 'transparent', color: has ? 'var(--cream)' : 'var(--ink-soft)',
    }}>{has ? label : `+ ${label}`}</button>
  );
}

function blankHoles() {
  return Array.from({ length: 9 }, (_, i) => ({ hole_number: i + 1, par: 3, sandbox_yards: '' }));
}

function CourseEditor({ course, prefill, onClose, onSaved }) {
  const isNew = !course;
  const p = prefill || {};
  const [form, setForm] = React.useState(() => ({
    id:               course ? course.id : undefined,
    name:             course ? course.name : (p.name || ''),
    short_name:       course ? course.short_name : (p.short_name || ''),
    city:             course ? course.city : (p.city || ''),
    state:            course ? (course.state || 'FL') : (p.state || 'FL'),
    address:          course ? (course.address || '') : '',
    phone:            course ? (course.phone || '') : '',
    description:      course ? (course.description || '') : '',
    hero_img:         course ? (course.hero_img || '') : '',
    render_img:       course ? (course.render_img || '') : '',
    suggested_price:  course ? (course.suggested_price ?? 0) : 0,
    sandbox_take_pct: course ? (course.sandbox_take_pct ?? 15) : 15,
    status:           course ? (course.status || 'active') : 'active',
  }));
  const [holes, setHoles] = React.useState(blankHoles());
  const [loadingHoles, setLoadingHoles] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    if (isNew) return;
    (async () => {
      const rows = await loadCourseHoles(course.id);
      if (cancelled) return;
      const base = blankHoles();
      for (const r of rows) {
        const idx = r.hole_number - 1;
        if (idx >= 0 && idx < 9) base[idx] = { hole_number: r.hole_number, par: r.par ?? 3, sandbox_yards: r.sandbox_yards ?? '' };
      }
      setHoles(base);
      setLoadingHoles(false);
    })();
    return () => { cancelled = true; };
  }, [course, isNew]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setHole = (i, k, v) => setHoles(hs => hs.map((h, j) => j === i ? { ...h, [k]: v } : h));
  const totalPar = holes.reduce((s, h) => s + (Number(h.par) || 0), 0);

  async function save() {
    setSaving(true); setErr('');
    try {
      await saveCourse(form, holes);
      onSaved();
    } catch (e) {
      setErr(e.message || 'Could not save.');
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${form.name}"? This removes the course and its holes. Bookings/tee slots referencing it may be affected.`)) return;
    setSaving(true); setErr('');
    try {
      await deleteCourse(form.id);
      onSaved();
    } catch (e) {
      setErr(e.message || 'Could not delete.');
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={onClose} style={{ marginBottom: 18 }}>← Back to courses</button>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--forest)', marginBottom: 18 }}>
        {isNew ? 'New course' : form.name}
      </div>

      {/* Course details */}
      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Course</div>
        <Row>
          <Field label="Course name" full><input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="International Links Melreese"/></Field>
        </Row>
        <Row>
          <Field label="Short name"><input className="input" value={form.short_name} onChange={e => set('short_name', e.target.value)} placeholder="Melreese"/></Field>
          <Field label="Phone"><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(305) 555-0100"/></Field>
        </Row>
        <Row>
          <Field label="City"><input className="input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Miami"/></Field>
          <Field label="State"><input className="input" value={form.state} onChange={e => set('state', e.target.value)} placeholder="FL"/></Field>
        </Row>
        <Row>
          <Field label="Address" full><input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="1802 NW 37th Ave, Miami, FL"/></Field>
        </Row>
        <Row>
          <Field label="Description" full><textarea className="input" style={{ minHeight: 64, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short editorial blurb shown in the app."/></Field>
        </Row>
        <Row>
          <Field label="Hero image URL"><input className="input" value={form.hero_img} onChange={e => set('hero_img', e.target.value)} placeholder="https://…"/></Field>
          <Field label="Render image URL"><input className="input" value={form.render_img} onChange={e => set('render_img', e.target.value)} placeholder="https://…"/></Field>
        </Row>
      </div>

      {/* Pricing & status */}
      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Pricing & status</div>
        <Row>
          <Field label="Suggested price ($)"><input className="input" type="number" min="0" value={form.suggested_price} onChange={e => set('suggested_price', e.target.value)}/></Field>
          <Field label="Sandbox take (%)"><input className="input" type="number" min="0" max="100" value={form.sandbox_take_pct} onChange={e => set('sandbox_take_pct', e.target.value)}/></Field>
          <Field label="Status">
            <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="coming_soon">coming_soon</option>
            </select>
          </Field>
        </Row>
      </div>

      {/* The 9 holes (tee data) */}
      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div className="eyebrow">Tee data · the {holes.length} holes</div>
          <div style={{ fontSize: 12, opacity: 0.65, fontFamily: 'var(--font-mono)' }}>Total par {totalPar}</div>
        </div>
        {loadingHoles ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><div className="spin"/></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {holes.map((h, i) => (
              <div key={h.hole_number} style={{ border: 'var(--hairline)', borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--forest)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>HOLE {h.hole_number}</div>
                <label className="label" style={{ marginTop: 0 }}>Par</label>
                <input className="input" type="number" min="1" max="6" value={h.par} onChange={e => setHole(i, 'par', e.target.value)}/>
                <label className="label" style={{ marginTop: 10 }}>Yards</label>
                <input className="input" type="number" min="0" max="120" value={h.sandbox_yards} onChange={e => setHole(i, 'sandbox_yards', e.target.value)} placeholder="—"/>
              </div>
            ))}
          </div>
        )}
      </div>

      {err && <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="btn btn-forest" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : (isNew ? 'Create course' : 'Save changes')}
        </button>
        <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        {!isNew && <button className="btn btn-danger" onClick={remove} disabled={saving} style={{ marginLeft: 'auto' }}>Delete course</button>}
      </div>
    </div>
  );
}

Object.assign(window, { CoursesModule });
