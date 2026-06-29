/* global React, Row, Field, Spinner, signOut,
   useCourseSlots, saveSlot, deleteSlot, openDay,
   useDailyYardages, saveDailyYardages, clearDailyYardages,
   useLiveOnCourse, useCourseFinancials */
// Course-partner portal — what a course manager sees when they sign in.
// Locked to the course(s) they manage. RLS (course-managers.sql) enforces it;
// this UI just never offers anything outside their course.

function todayStr() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function dayLabel(iso) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
const DEFAULT_TIMES = ['16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];

const M_SECTIONS = [
  { id: 'live',    label: 'Live on course', icon: '📍', hint: 'Who’s out playing right now' },
  { id: 'times',   label: 'Tee times',      icon: '🕒', hint: 'Open times & set pricing' },
  { id: 'yards',   label: 'Daily yardages', icon: '🚩', hint: 'Set today’s pin distances' },
  { id: 'money',   label: 'Financials',     icon: '💰', hint: 'Revenue & fill rate' },
];

// ─── Shell ───────────────────────────────────────────────────────────────────
function ManagerPortal({ session, profile, courses }) {
  const [courseId, setCourseId] = React.useState(courses[0].course.id);
  const [view, setView] = React.useState('live');
  const link = courses.find(c => c.course.id === courseId) || courses[0];
  const course = link.course;
  const active = M_SECTIONS.find(s => s.id === view) || M_SECTIONS[0];
  const name = profile ? ([profile.first_name, profile.last_name].filter(Boolean).join(' ') || session.user.email) : session.user.email;

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{
        width: 248, flexShrink: 0, background: 'var(--forest-dark)', color: 'var(--cream)',
        display: 'flex', flexDirection: 'column', padding: '22px 14px',
      }}>
        <div style={{ padding: '0 10px 16px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1 }}>Sandbox</div>
          <div className="eyebrow" style={{ color: 'var(--cream)', opacity: 0.6 }}>Course Partner</div>
        </div>

        {/* Course switcher (only if they manage more than one) */}
        {courses.length > 1 ? (
          <select className="select" value={courseId} onChange={e => setCourseId(e.target.value)}
            style={{ margin: '0 6px 14px', background: 'rgba(234,226,206,0.1)', color: 'var(--cream)', borderColor: 'rgba(234,226,206,0.2)' }}>
            {courses.map(c => <option key={c.course.id} value={c.course.id} style={{ color: '#111' }}>{c.course.short_name}</option>)}
          </select>
        ) : (
          <div style={{ margin: '0 10px 14px', fontSize: 13, fontWeight: 700, opacity: 0.9 }}>{course.short_name}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {M_SECTIONS.map(s => {
            const on = s.id === view;
            return (
              <button key={s.id} onClick={() => setView(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                padding: '11px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: on ? 'rgba(234,226,206,0.14)' : 'transparent',
                color: 'var(--cream)', opacity: on ? 1 : 0.72, fontSize: 14, fontWeight: 700,
              }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>{s.label}
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: '1px solid rgba(234,226,206,0.15)', paddingTop: 14, marginTop: 14 }}>
          <div style={{ fontSize: 12, opacity: 0.7, padding: '0 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <button onClick={signOut} style={{
            marginTop: 8, width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8,
            background: 'transparent', border: '1px solid rgba(234,226,206,0.2)', color: 'var(--cream)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: 0.8,
          }}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '22px 28px 16px', borderBottom: 'var(--hairline)', background: 'var(--paper)' }}>
          <div className="eyebrow">{course.short_name} · {active.hint}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--forest)', lineHeight: 1, marginTop: 4 }}>{active.label}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {view === 'live'  && <LiveBoard course={course}/>}
          {view === 'times' && <TeeTimesPanel course={course}/>}
          {view === 'yards' && <YardagesPanel course={course}/>}
          {view === 'money' && <FinancialsPanel course={course}/>}
        </div>
      </div>
    </div>
  );
}

// ─── Live on course ──────────────────────────────────────────────────────────
function LiveBoard({ course }) {
  const [groups, reload] = useLiveOnCourse(course.id);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.7 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: '#2ecc71', display: 'inline-block', boxShadow: '0 0 0 4px rgba(46,204,113,0.18)' }}/>
          Live · updates automatically
        </div>
        <button className="btn btn-ghost" onClick={reload}>Refresh</button>
      </div>

      {groups === null ? <Spinner/> : groups.length === 0 ? (
        <div className="card" style={{ padding: 44, textAlign: 'center' }}>
          <div style={{ fontSize: 34 }}>🌙</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)', marginTop: 8 }}>Nobody on the course</div>
          <div style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>Groups appear here the moment they check in and start scoring.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 14 }}>
          {groups.map(g => <LiveCard key={g.id} g={g}/>)}
        </div>
      )}
    </div>
  );
}

function LiveCard({ g }) {
  const pct = Math.round((g.holesDone / g.total) * 100);
  const waiting = g.status === 'waiting';
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{g.teamA.join(' & ')}</div>
          <div style={{ fontSize: 12, opacity: 0.5, margin: '2px 0' }}>vs</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{g.teamB.join(' & ')}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          {waiting ? (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: 'rgba(14,28,19,0.06)', color: 'var(--ink-soft)' }}>Not started</span>
          ) : (
            <>
              <div style={{ fontSize: 11, opacity: 0.55, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hole</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--forest)', lineHeight: 1 }}>{g.currentHole}</div>
            </>
          )}
        </div>
      </div>

      {!waiting && (
        <>
          <div style={{ height: 7, borderRadius: 99, background: 'rgba(28,73,42,0.12)', marginTop: 14, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--forest)', borderRadius: 99, transition: 'width 0.5s ease' }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
            <span style={{ opacity: 0.6, fontFamily: 'var(--font-mono)' }}>{g.holesDone}/{g.total} holes</span>
            <span style={{ fontWeight: 700, color: 'var(--forest)' }}>{g.leader}</span>
          </div>
        </>
      )}
      <div style={{ marginTop: 10, fontSize: 11, opacity: 0.45, fontFamily: 'var(--font-mono)' }}>
        {g.match_type.toUpperCase()}{g.startedAt ? ` · started ${timeLabel(g.startedAt)}` : ''}
      </div>
    </div>
  );
}

// ─── Tee times & pricing ─────────────────────────────────────────────────────
function TeeTimesPanel({ course }) {
  const fromISO = React.useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); }, []);
  const [slots, reload] = useCourseSlots(course.id, fromISO);
  const [err, setErr] = React.useState('');

  // Group upcoming slots by calendar day.
  const byDay = React.useMemo(() => {
    const m = {};
    (slots || []).forEach(s => {
      const k = new Date(s.starts_at).toDateString();
      (m[k] = m[k] || []).push(s);
    });
    return m;
  }, [slots]);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      {err && <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}

      <OpenDayForm course={course} onDone={reload} onError={setErr}/>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)', margin: '26px 0 12px' }}>Upcoming times</div>
      {slots === null ? <Spinner/> : slots.length === 0 ? (
        <div className="card" style={{ padding: 30, textAlign: 'center', opacity: 0.7, fontSize: 14 }}>No upcoming tee times. Open a day above to let golfers book.</div>
      ) : (
        Object.keys(byDay).map(day => (
          <div key={day} style={{ marginBottom: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{dayLabel(byDay[day][0].starts_at)}</div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {byDay[day].map((s, i) => (
                <SlotRow key={s.id} slot={s} last={i === byDay[day].length - 1} onSaved={reload} onError={setErr}/>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function OpenDayForm({ course, onDone, onError }) {
  const [dateStr, setDateStr] = React.useState(todayStr());
  const [times, setTimes] = React.useState(DEFAULT_TIMES.slice());
  const [price, setPrice] = React.useState(course.suggested_price || 22);
  const [capacity, setCapacity] = React.useState(8);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  function toggle(t) { setTimes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t].sort()); }

  async function open() {
    if (!times.length) { onError('Pick at least one time.'); return; }
    setBusy(true); setMsg(''); onError('');
    try {
      const n = await openDay({ courseId: course.id, dateStr, times, capacity, price });
      setMsg(n === 0 ? 'Those times were already open.' : `Opened ${n} tee time${n === 1 ? '' : 's'}.`);
      onDone();
    } catch (e) { onError(e.message || 'Could not open the day.'); }
    setBusy(false);
  }

  return (
    <div className="card" style={{ padding: 22 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>Open a day for booking</div>
      <Row>
        <Field label="Date"><input className="input" type="date" value={dateStr} onChange={e => setDateStr(e.target.value)}/></Field>
        <Field label="Price ($)"><input className="input" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)}/></Field>
        <Field label="Players per time"><input className="input" type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)}/></Field>
      </Row>
      <div className="label" style={{ marginBottom: 8 }}>Times</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {DEFAULT_TIMES.map(t => {
          const on = times.includes(t);
          return (
            <button key={t} onClick={() => toggle(t)} style={{
              padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              border: on ? '1px solid var(--forest)' : '1px solid var(--line, rgba(14,28,19,0.15))',
              background: on ? 'var(--forest)' : 'transparent', color: on ? 'var(--cream)' : 'var(--ink-soft)',
            }}>{new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</button>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-forest" onClick={open} disabled={busy}>{busy ? 'Opening…' : 'Open these times'}</button>
        {msg && <span style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 600 }}>{msg}</span>}
      </div>
    </div>
  );
}

function SlotRow({ slot, last, onSaved, onError }) {
  const [price, setPrice] = React.useState(slot.price);
  const [capacity, setCapacity] = React.useState(slot.capacity);
  const [status, setStatus] = React.useState(slot.status);
  const [busy, setBusy] = React.useState(false);
  const dirty = String(price) !== String(slot.price) || String(capacity) !== String(slot.capacity) || status !== slot.status;

  async function save() {
    setBusy(true); onError('');
    try { await saveSlot({ ...slot, price, capacity, status }); onSaved(); }
    catch (e) { onError(e.message || 'Could not save.'); }
    setBusy(false);
  }
  async function remove() {
    if (!window.confirm(`Remove the ${timeLabel(slot.starts_at)} tee time? Any bookings on it are cancelled.`)) return;
    setBusy(true); onError('');
    try { await deleteSlot(slot.id); onSaved(); }
    catch (e) { onError(e.message || 'Could not remove.'); }
    setBusy(false);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: last ? 'none' : 'var(--hairline)', flexWrap: 'wrap' }}>
      <div style={{ width: 78, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{timeLabel(slot.starts_at)}</div>
      <label style={{ fontSize: 12, opacity: 0.6 }}>$<input className="input" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} style={{ width: 72, display: 'inline-block', marginLeft: 4 }}/></label>
      <label style={{ fontSize: 12, opacity: 0.6 }}>cap<input className="input" type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} style={{ width: 60, display: 'inline-block', marginLeft: 4 }}/></label>
      <select className="select" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 130 }}>
        <option value="open">open</option>
        <option value="closed">closed</option>
        <option value="full">full</option>
        <option value="cancelled">cancelled</option>
      </select>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {dirty && <button className="btn btn-forest" style={{ padding: '7px 12px' }} disabled={busy} onClick={save}>Save</button>}
        <button className="btn btn-danger" style={{ padding: '7px 10px' }} disabled={busy} onClick={remove}>✕</button>
      </div>
    </div>
  );
}

// ─── Daily yardages ──────────────────────────────────────────────────────────
function YardagesPanel({ course }) {
  const [dateStr, setDateStr] = React.useState(todayStr());
  const [holes, reload] = useDailyYardages(course.id, dateStr);
  const [draft, setDraft] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [msg, setMsg] = React.useState('');

  // Sync local editable copy when the loaded holes change.
  React.useEffect(() => { setDraft(holes ? holes.map(h => ({ ...h })) : null); }, [holes]);

  const setYard = (i, v) => setDraft(d => d.map((h, j) => j === i ? { ...h, yards: v } : h));

  async function save() {
    setBusy(true); setErr(''); setMsg('');
    try { await saveDailyYardages(course.id, dateStr, draft); setMsg('Saved — golfers starting today play these.'); reload(); }
    catch (e) { setErr(e.message || 'Could not save.'); }
    setBusy(false);
  }
  async function reset() {
    if (!window.confirm('Reset this day back to the standard layout?')) return;
    setBusy(true); setErr(''); setMsg('');
    try { await clearDailyYardages(course.id, dateStr); reload(); }
    catch (e) { setErr(e.message || 'Could not reset.'); }
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="card" style={{ padding: 22 }}>
        <Row>
          <Field label="Day"><input className="input" type="date" value={dateStr} onChange={e => setDateStr(e.target.value)}/></Field>
        </Row>
        <div style={{ fontSize: 13, opacity: 0.65, marginTop: -4, marginBottom: 16 }}>
          Set where the pins are for this day. Blank = use the standard distance. A match picks these up when the group starts play.
        </div>

        {err && <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}

        {draft === null ? <Spinner/> : draft.length === 0 ? (
          <div style={{ fontSize: 14, opacity: 0.7, padding: '8px 0' }}>This course has no hole layout yet. Ask an admin to add the Sandbox 9 in Courses.</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {draft.map((h, i) => (
                <div key={h.hole_number} style={{ border: 'var(--hairline)', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)' }}>{h.hole_number}</span>
                    <span style={{ fontSize: 11, opacity: 0.5, fontFamily: 'var(--font-mono)' }}>par {h.par}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <input className="input" type="number" min="0" max="120" value={h.yards == null ? '' : h.yards}
                      onChange={e => setYard(i, e.target.value)} style={{ padding: '6px 8px' }}/>
                    <span style={{ fontSize: 12, opacity: 0.5 }}>yds</span>
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.45, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    std {h.base_yards != null ? `${h.base_yards}y` : '—'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
              <button className="btn btn-forest" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save yardages'}</button>
              <button className="btn btn-ghost" onClick={reset} disabled={busy}>Reset to standard</button>
              {msg && <span style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 600 }}>{msg}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Financials ──────────────────────────────────────────────────────────────
function money(n) { return '$' + (n || 0).toLocaleString('en-US'); }

function FinancialsPanel({ course }) {
  const [data, reload] = useCourseFinancials(course.id, course);
  if (!data) return <Spinner/>;

  const cards = [
    { label: 'Booked revenue', value: money(data.revenue), sub: 'last 30 days', big: true },
    { label: 'Your net', value: money(data.courseNet), sub: `after Sandbox ${data.takePct}%` },
    { label: 'Sandbox fee', value: money(data.sandboxTake), sub: `${data.takePct}% rev-share` },
    { label: 'Rounds played', value: data.rounds, sub: `${data.bookingsCount} bookings` },
    { label: 'Fill rate ahead', value: `${data.fillRate}%`, sub: `${data.bookedAhead}/${data.capacityAhead} seats` },
    { label: 'Open times ahead', value: data.upcomingSlots, sub: 'bookable now' },
  ];

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, opacity: 0.65 }}>Reserve-only for now — revenue is booked value, not yet captured payment.</div>
        <button className="btn btn-ghost" onClick={reload}>Refresh</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
        {cards.map(c => (
          <div key={c.label} className="card" style={{ padding: 20 }}>
            <div className="eyebrow">{c.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: c.big ? 38 : 30, color: 'var(--forest)', lineHeight: 1.1, marginTop: 6 }}>{c.value}</div>
            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ManagerPortal });
