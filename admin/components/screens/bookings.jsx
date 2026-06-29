/* global React, Row, Field, Spinner, useCourses, useBookings, setBookingStatus, deleteBooking */
// Bookings module: pick a course, see its reservations, adjust status or remove.

const BOOKING_STATUSES = ['reserved', 'checked_in', 'playing', 'completed', 'cancelled', 'no_show'];

function nameOf(p) {
  if (!p) return '—';
  const full = [p.first_name, p.last_name].filter(Boolean).join(' ');
  return full || (p.handle ? `@${String(p.handle).replace(/^@/, '')}` : '—');
}
function fmtWhen(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function BookingsModule() {
  const [courses] = useCourses();
  const [courseId, setCourseId] = React.useState(null);
  React.useEffect(() => {
    if (courseId == null && courses && courses.length) setCourseId(courses[0].id);
  }, [courses, courseId]);

  const [bookings, reload] = useBookings(courseId);
  const [busyId, setBusyId] = React.useState(null);
  const [err, setErr] = React.useState('');

  if (courses === null) return <Spinner/>;
  if (courses.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)' }}>No courses yet</div>
        <div style={{ fontSize: 14, opacity: 0.7, marginTop: 8 }}>Bookings appear once a course has tee slots people can book.</div>
      </div>
    );
  }

  async function changeStatus(id, status) {
    setBusyId(id); setErr('');
    try { await setBookingStatus(id, status); await reload(); }
    catch (e) { setErr(e.message || 'Could not update.'); }
    setBusyId(null);
  }
  async function remove(id) {
    if (!window.confirm('Delete this booking? This frees the spot.')) return;
    setBusyId(id); setErr('');
    try { await deleteBooking(id); await reload(); }
    catch (e) { setErr(e.message || 'Could not delete.'); }
    setBusyId(null);
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <Row>
        <Field label="Course" full>
          <select className="select" value={courseId || ''} onChange={e => setCourseId(e.target.value)}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </Row>

      {err && <div style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 14px', borderRadius: 10 }}>{err}</div>}

      <div style={{ fontSize: 13, opacity: 0.65, margin: '4px 0 12px' }}>
        {bookings === null ? 'Loading…' : `${bookings.length} ${bookings.length === 1 ? 'booking' : 'bookings'}`}
      </div>

      {bookings === null ? <Spinner/> : bookings.length === 0 ? (
        <div className="card" style={{ padding: 30, textAlign: 'center', opacity: 0.7, fontSize: 14 }}>No bookings for this course yet.</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {bookings.map((b, i) => (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 16px', borderBottom: i < bookings.length - 1 ? 'var(--hairline)' : 'none',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                  {nameOf(b.user)}
                  {b.match_type === '2v2' && <span style={{ opacity: 0.6, fontWeight: 400 }}> + {b.partner ? nameOf(b.partner) : (b.needs_partner ? 'needs partner' : '—')}</span>}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{fmtWhen(b.slot && b.slot.starts_at)} · {b.match_type}</div>
              </div>
              <select
                className="select"
                style={{ width: 150, padding: '7px 10px' }}
                value={b.status}
                disabled={busyId === b.id}
                onChange={e => changeStatus(b.id, e.target.value)}
              >
                {BOOKING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="btn btn-danger" style={{ padding: '7px 12px' }} disabled={busyId === b.id} onClick={() => remove(b.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { BookingsModule });
