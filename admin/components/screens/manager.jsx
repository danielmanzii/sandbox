/* global React, Row, Field, Spinner, signOut,
   useDaySlots, saveSlot, deleteSlot, publishDayTimes, useCourseFillRate,
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
// Viewing windows (minutes-of-day) so the manager isn't buried under a full
// midnight-to-midnight grid. The default is Twilight — Sandbox's core slot.
const TIME_WINDOWS = [
  { key: 'all',      label: 'All day',  start: 0,    end: 1440 },
  { key: 'morning',  label: 'Morning',  start: 360,  end: 720  }, // 6a–12p
  { key: 'midday',   label: 'Midday',   start: 720,  end: 960  }, // 12–4p
  { key: 'twilight', label: 'Twilight', start: 960,  end: 1200 }, // 4–8p
  { key: 'night',    label: 'Night',    start: 1200, end: 1440 }, // 8p–12a
];
const hmLabel = (mins) => {
  const h = Math.floor(mins / 60), m = mins % 60;
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
// Generate 'HH:MM' times across [start,end) at `intervalMin` minutes.
function genTimes(start, end, intervalMin) {
  const out = [];
  for (let m = start; m < end; m += intervalMin) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return out;
}
// 'HH:MM' of a slot's local start time, for matching against generated times.
function slotHM(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function minutesOfDay(iso) { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); }

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
// Top → bottom: date strip · intervalMin slider + cart + live revenue · window
// filter · the tee-time grid. Nothing is public until "Save changes".
function TeeTimesPanel({ course }) {
  const [dateStr, setDateStr] = React.useState(todayStr());
  const [intervalMin, setIntervalMin] = React.useState(5);
  const [includesCart, setIncludesCart] = React.useState(false);
  const [price, setPrice] = React.useState(course.suggested_price || 22);
  const [windowKey, setWindowKey] = React.useState('twilight');
  const [excluded, setExcluded] = React.useState(() => new Set()); // 'HH:MM' the manager removed
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [msg, setMsg] = React.useState('');

  const [slots, reload] = useDaySlots(course.id, dateStr);
  const [fill] = useCourseFillRate(course.id);

  const win = TIME_WINDOWS.find(w => w.key === windowKey) || TIME_WINDOWS[0];
  const candidates = React.useMemo(() => genTimes(win.start, win.end, intervalMin), [win, intervalMin]);

  // Map existing slots by their 'HH:MM' (only 'open' ones count as public).
  const openByHM = React.useMemo(() => {
    const m = {};
    (slots || []).forEach(s => { if (s.status === 'open') m[slotHM(s.starts_at)] = s; });
    return m;
  }, [slots]);

  const toOpen = candidates.filter(t => !excluded.has(t));
  const newCount = toOpen.filter(t => !openByHM[t]).length;

  // Live revenue projection from this course's real fill rate.
  const rate = (fill && fill.rate != null && fill.sampleSlots >= 4) ? fill.rate : null;
  const seats = toOpen.length * 4;
  const full = seats * (Number(price) || 0);
  const expected = rate != null ? Math.round(seats * rate * (Number(price) || 0)) : null;

  function toggleTime(t) {
    setExcluded(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  }

  async function saveChanges() {
    if (!toOpen.length) { setErr('No times selected. Add at least one tee time.'); return; }
    setBusy(true); setErr(''); setMsg('');
    try {
      await publishDayTimes({ courseId: course.id, dateStr, times: toOpen, price, includesCart });
      setMsg(`Saved — ${toOpen.length} tee time${toOpen.length === 1 ? '' : 's'} live for golfers.`);
      reload();
    } catch (e) { setErr(e.message || 'Could not save.'); }
    setBusy(false);
  }

  const slotsInWindow = (slots || []).filter(s => {
    const m = minutesOfDay(s.starts_at);
    return m >= win.start && m < win.end;
  });

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      {err && <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}

      {/* Date strip */}
      <DateStrip value={dateStr} onChange={d => { setDateStr(d); setExcluded(new Set()); setMsg(''); }}/>

      {/* Controls: intervalMin slider · cart + price · live revenue */}
      <div className="card" style={{ padding: 22, marginTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'stretch' }}>
        {/* Interval */}
        <div style={{ flex: '2 1 280px', minWidth: 260 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>What do you want your tee time intervals to be?</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '10px 0 6px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--forest)', lineHeight: 1 }}>{intervalMin}</span>
            <span style={{ fontSize: 14, opacity: 0.6 }}>minutes apart</span>
          </div>
          <input type="range" min="3" max="15" step="1" value={intervalMin}
            onChange={e => setIntervalMin(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--forest)' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.5, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            <span>3 min</span><span>15 min</span>
          </div>
        </div>

        {/* Cart + price */}
        <div style={{ flex: '1 1 200px', minWidth: 190, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Golf cart</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['Includes cart', true], ['No cart', false]].map(([lbl, val]) => {
                const on = includesCart === val;
                return (
                  <button key={lbl} onClick={() => setIncludesCart(val)} style={{
                    flex: 1, padding: '9px 8px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    border: on ? '1px solid var(--forest)' : '1px solid rgba(14,28,19,0.15)',
                    background: on ? 'var(--forest)' : 'transparent', color: on ? 'var(--cream)' : 'var(--ink-soft)',
                  }}>{lbl}</button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Price per golfer</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 18, opacity: 0.6 }}>$</span>
              <input className="input" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)}/>
            </div>
          </div>
        </div>

        {/* Live revenue */}
        <div style={{ flex: '1 1 200px', minWidth: 190, background: 'rgba(28,73,42,0.06)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="eyebrow">$ based on average booking rate</div>
          {expected != null ? (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--forest)', lineHeight: 1.05, marginTop: 6 }}>${expected.toLocaleString('en-US')}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>expected · {Math.round(rate * 100)}% avg booking</div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2, fontFamily: 'var(--font-mono)' }}>of ${full.toLocaleString('en-US')} at full · {toOpen.length} times × 4</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--forest)', lineHeight: 1.05, marginTop: 6 }}>${full.toLocaleString('en-US')}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>potential at full booking</div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{toOpen.length} times × 4 players · live rate kicks in once Killian has booking history</div>
            </>
          )}
        </div>
      </div>

      {/* Window filter — above the cards */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '22px 0 12px' }}>
        <span className="eyebrow" style={{ marginRight: 4 }}>View</span>
        {TIME_WINDOWS.map(w => {
          const on = w.key === windowKey;
          return (
            <button key={w.key} onClick={() => setWindowKey(w.key)} style={{
              padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700,
              border: on ? '1px solid var(--forest)' : '1px solid rgba(14,28,19,0.15)',
              background: on ? 'var(--forest)' : 'transparent', color: on ? 'var(--cream)' : 'var(--ink-soft)',
            }}>{w.label}</button>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.55, fontFamily: 'var(--font-mono)' }}>{hmLabel(win.start)}–{hmLabel(win.end === 1440 ? 1439 : win.end)}</span>
      </div>

      {/* Draft notice + grid */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {newCount > 0
              ? <><strong>{newCount}</strong> new time{newCount === 1 ? '' : 's'} to publish — tap any to remove it.</>
              : <>These times are set. Tap a faded one to add it back.</>}
          </div>
          <div style={{ fontSize: 12, opacity: 0.55 }}>Nothing is bookable until you press <strong>Save changes</strong>.</div>
        </div>

        {slots === null ? <Spinner/> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {candidates.map(t => {
              const isOpen = !!openByHM[t];       // already public — managed in the list below
              const isOff = !isOpen && excluded.has(t);
              const base = { padding: '7px 11px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-mono)' };
              let st;
              if (isOpen)      st = { ...base, cursor: 'default', border: '1px solid var(--forest)', background: 'var(--forest)', color: 'var(--cream)' };
              else if (isOff)  st = { ...base, cursor: 'pointer', border: '1px dashed rgba(14,28,19,0.25)', background: 'transparent', color: 'var(--ink-soft)', opacity: 0.5, textDecoration: 'line-through' };
              else             st = { ...base, cursor: 'pointer', border: '1px solid var(--forest)', background: 'rgba(28,73,42,0.08)', color: 'var(--forest)' };
              return (
                <button key={t} onClick={isOpen ? undefined : () => toggleTime(t)} style={st}
                  title={isOpen ? 'Already live — manage in the list below' : (isOff ? 'Tap to add back' : 'New time — tap to remove')}>
                  {hmLabel(parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3), 10))}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
          <button className="btn btn-forest" onClick={saveChanges} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
          <span style={{ fontSize: 12, opacity: 0.6 }}>{includesCart ? '🛒 cart included' : 'cart not included'} · 4 players per time</span>
          {msg && <span style={{ fontSize: 13, color: 'var(--forest)', fontWeight: 600, marginLeft: 'auto' }}>{msg}</span>}
        </div>
      </div>

      {/* Manage already-live times in this window */}
      {slotsInWindow.length > 0 && (
        <>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)', margin: '24px 0 10px' }}>Live times · {dayLabel(`${dateStr}T12:00`)}</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {slotsInWindow.map((s, i) => (
              <SlotRow key={s.id} slot={s} last={i === slotsInWindow.length - 1} onSaved={reload} onError={setErr}/>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Horizontal date picker, mirroring the golfer app's Play date strip.
function DateStrip({ value, onChange }) {
  const days = React.useMemo(() => {
    const out = [], today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 21; i++) {
      const d = new Date(today.getTime() + i * 864e5);
      const p = n => String(n).padStart(2, '0');
      out.push({ str: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, d, i });
    }
    return out;
  }, []);

  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
      {days.map(({ str, d, i }) => {
        const on = str === value;
        return (
          <button key={str} onClick={() => onChange(str)} style={{
            flex: '0 0 auto', width: 62, padding: '10px 0', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
            border: on ? '1px solid var(--forest)' : '1px solid rgba(14,28,19,0.12)',
            background: on ? 'var(--forest)' : 'var(--paper)', color: on ? 'var(--cream)' : 'var(--ink)',
          }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', opacity: on ? 0.85 : 0.5 }}>
              {i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1.1 }}>{d.getDate()}</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', opacity: on ? 0.85 : 0.5 }}>{d.toLocaleDateString('en-US', { month: 'short' })}</div>
          </button>
        );
      })}
    </div>
  );
}

function SlotRow({ slot, last, onSaved, onError }) {
  const [price, setPrice] = React.useState(slot.price);
  const [status, setStatus] = React.useState(slot.status);
  const [cart, setCart] = React.useState(!!slot.includes_cart);
  const [busy, setBusy] = React.useState(false);
  const dirty = String(price) !== String(slot.price) || status !== slot.status || cart !== !!slot.includes_cart;

  async function save() {
    setBusy(true); onError('');
    try { await saveSlot({ ...slot, price, status, includes_cart: cart }); onSaved(); }
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
      <button onClick={() => setCart(c => !c)} style={{
        padding: '7px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
        border: cart ? '1px solid var(--forest)' : '1px solid rgba(14,28,19,0.15)',
        background: cart ? 'var(--forest)' : 'transparent', color: cart ? 'var(--cream)' : 'var(--ink-soft)',
      }}>{cart ? '🛒 cart' : 'no cart'}</button>
      <select className="select" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 120 }}>
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
