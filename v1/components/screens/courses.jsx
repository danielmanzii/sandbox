/* global React, Icon, Button, Chip, MOCK, formatHandle, useGeolocation, useAvailability, useCourse, useCourseSlots, useFriendsOnSlots, useMyBookings, createBooking, cancelBooking, useUserSearch */
// Golfer booking flow (Phase B):
//   BookScreen        — date-first availability: near-you courses + open slots
//   CourseDetailScreen— hero + Sandbox 9 + the day's bookable slots
//   BookingSheet      — pick format (1v1/2v2) + partner, reserve a slot
//   MyRoundsScreen    — upcoming + past bookings, with cancel
//
// Reserve-only for now (no payment). Reads the courses-data.jsx hooks.

// ─── Shared: 7-day date strip ─────────────────────────────────────────
function nextDays(n) {
  const out = [];
  const base = new Date(); base.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base); d.setDate(base.getDate() + i);
    out.push(d);
  }
  return out;
}

function DateStrip({ selected, onSelect }) {
  const days = nextDays(7);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 2px' }} className="scroll-hide">
      {days.map((d, i) => {
        const active = sameDay(d, selected);
        const label = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' });
        return (
          <button key={d.toISOString()} onClick={() => onSelect(d)} style={{
            flex: '0 0 auto', minWidth: 56, padding: '10px 8px', borderRadius: 14,
            background: active ? 'var(--forest)' : 'var(--paper)',
            color: active ? 'var(--cream)' : 'var(--forest)',
            border: active ? 'none' : 'var(--hairline)',
            boxShadow: active ? 'var(--shadow-sm)' : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.75 }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1 }}>{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ─── Slot chip ────────────────────────────────────────────────────────
function SlotChip({ slot, onClick, friends }) {
  return (
    <button onClick={onClick} style={{
      flex: '0 0 auto', padding: '8px 12px', borderRadius: 999,
      background: 'var(--paper)', border: 'var(--hairline)',
      color: 'var(--forest)', display: 'inline-flex', alignItems: 'center', gap: 6,
      fontWeight: 700, fontSize: 13,
    }}>
      {fmtTime(slot.starts_at)}
      {friends && friends.length > 0 && (
        <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 700 }}>· {friends.length}🟢</span>
      )}
    </button>
  );
}

// ─── Book screen ──────────────────────────────────────────────────────
function BookScreen({ go, profile }) {
  const [coords, geoStatus] = useGeolocation();
  const [date, setDate] = React.useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [q, setQ] = React.useState('');
  const [list, loading] = useAvailability(date, coords);
  const [booking, setBooking] = React.useState(null); // { slot, course }

  const filtered = list.filter(({ course }) => {
    if (!q.trim()) return true;
    const s = q.trim().toLowerCase();
    return course.shortName.toLowerCase().includes(s) || course.city.toLowerCase().includes(s);
  });

  const locLabel = geoStatus === 'ok' ? 'Near you'
    : geoStatus === 'pending' ? 'Locating…'
    : 'Miami, FL';

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ padding: '58px 20px 12px', color: 'var(--forest)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Twilight tee times</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 0.92, marginTop: 8, letterSpacing: '-0.02em' }}>Book a round.</div>
          </div>
          <button onClick={() => go({ screen: 'myRounds' })} style={{
            marginTop: 6, padding: '8px 12px', borderRadius: 999,
            background: 'var(--paper)', border: 'var(--hairline)', color: 'var(--forest)',
            fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <Icon.Calendar size={13}/> My rounds
          </button>
        </div>
        <div style={{ fontSize: 12, marginTop: 8, opacity: 0.6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon.Pin size={12}/> {locLabel}
        </div>
      </div>

      <DateStrip selected={date} onSelect={setDate}/>

      {/* Search */}
      <div style={{ padding: '14px 16px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--paper)', borderRadius: 14, padding: '11px 14px', border: 'var(--hairline)' }}>
          <Icon.Search size={16} color="var(--forest)"/>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}/>
          {q && <button onClick={() => setQ('')} style={{ background: 'transparent', border: 'none', color: 'var(--forest)', fontSize: 12, opacity: 0.6 }}>Clear</button>}
        </div>
      </div>

      <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--forest)', opacity: 0.5 }}>Loading availability…</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)' }}>No courses found.</div>
            <div className="caption-serif" style={{ fontSize: 14, opacity: 0.7, marginTop: 6 }}>More courses are joining the Sandbox network soon.</div>
          </div>
        ) : (
          filtered.map(({ course, slots, distanceMi }) => (
            <CourseAvailabilityCard
              key={course.id}
              course={course}
              slots={slots}
              distanceMi={distanceMi}
              viewerId={profile && profile.id}
              onOpenCourse={() => go({ screen: 'courseDetail', courseId: course.id })}
              onPickSlot={(slot) => setBooking({ slot, course })}
            />
          ))
        )}
      </div>

      {booking && (
        <BookingSheet
          slot={booking.slot}
          course={booking.course}
          profile={profile}
          onClose={() => setBooking(null)}
          onBooked={() => { setBooking(null); go({ screen: 'myRounds' }); }}
        />
      )}
    </div>
  );
}

function CourseAvailabilityCard({ course, slots, distanceMi, viewerId, onOpenCourse, onPickSlot }) {
  const slotIds = React.useMemo(() => slots.map(s => s.id), [slots]);
  const friendsBySlot = useFriendsOnSlots(viewerId, slotIds);
  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <button onClick={onOpenCourse} style={{
        width: '100%', textAlign: 'left', border: 'none', padding: 0, display: 'block',
        height: 96, position: 'relative',
        background: course.heroImg
          ? `linear-gradient(180deg, rgba(14,28,19,0) 30%, rgba(14,28,19,0.7) 100%), url('${course.heroImg}')`
          : 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
        backgroundSize: 'cover', backgroundPosition: 'center', color: 'var(--cream)',
      }}>
        <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', left: 14, bottom: 10, right: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, letterSpacing: '-0.01em' }}>{course.shortName}</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.85, marginTop: 4, letterSpacing: '0.04em' }}>
            {course.city.toUpperCase()}{distanceMi != null ? ` · ${distanceMi.toFixed(1)} MI` : ''} · 9 HOLES · PAR {course.par}
          </div>
        </div>
      </button>
      <div style={{ padding: '12px 12px 14px' }}>
        {slots.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.55, padding: '2px 2px' }}>No open times this day.</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="scroll-hide">
            {slots.map(s => <SlotChip key={s.id} slot={s} friends={friendsBySlot[s.id]} onClick={() => onPickSlot(s)}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Course detail ────────────────────────────────────────────────────
function CourseDetailScreen({ go, courseId, profile }) {
  const [course, holes, loading] = useCourse(courseId);
  const [date, setDate] = React.useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [slots, slotsLoading] = useCourseSlots(courseId, date);
  const [booking, setBooking] = React.useState(null);

  if (loading) return <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--forest)', opacity: 0.5 }}>Loading…</div>;
  if (!course) return <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--forest)' }}>Course not found.</div>;

  const totalYards = holes.reduce((s, h) => s + (h.sandbox_yards || 0), 0);

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 130 }}>
      {/* Hero */}
      <div style={{
        height: 220, position: 'relative', color: 'var(--cream)',
        background: course.renderImg
          ? `linear-gradient(180deg, rgba(14,28,19,0.1) 0%, rgba(14,28,19,0.7) 100%), url('${course.renderImg}')`
          : 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        <button onClick={() => go({ screen: 'book' })} style={{
          position: 'absolute', top: 56, left: 16, width: 40, height: 40, borderRadius: 999,
          background: 'rgba(14,28,19,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(234,226,206,0.22)',
        }}><Icon.ArrowLeft size={16}/></button>
        <div style={{ position: 'absolute', left: 20, bottom: 16, right: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.95, letterSpacing: '-0.02em' }}>{course.shortName}</div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', opacity: 0.85, marginTop: 6, letterSpacing: '0.04em' }}>
            {course.city.toUpperCase()}, {course.state}
          </div>
        </div>
      </div>

      {/* Sandbox 9 summary */}
      <div style={{ padding: '16px 16px 0' }}>
        <div className="card" style={{ padding: 16, display: 'flex', gap: 16 }}>
          <Stat label="Holes" value={course.holes}/>
          <Divider/>
          <Stat label="Par" value={course.par}/>
          <Divider/>
          <Stat label="Yards" value={totalYards || '—'}/>
          <Divider/>
          <Stat label="Longest" value={holes.length ? `${Math.max(...holes.map(h => h.sandbox_yards || 0))}y` : '—'}/>
        </div>
        {course.description && (
          <div className="caption-serif" style={{ fontSize: 15, color: 'var(--ink)', opacity: 0.8, marginTop: 14, lineHeight: 1.5 }}>
            {course.description}
          </div>
        )}
        {course.realPar && (
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.5, marginTop: 10, letterSpacing: '0.03em' }}>
            PLAYS OVER {course.name.toUpperCase()} · REAL COURSE PAR {course.realPar} · {course.realYardage?.toLocaleString()} YDS
          </div>
        )}

        {holes.length > 0 && <Scorecard holes={holes}/>}
      </div>

      {/* Booking */}
      <div style={{ padding: '22px 0 0' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 20px 12px' }}>Pick a tee time</div>
        <DateStrip selected={date} onSelect={setDate}/>
        <div style={{ padding: '16px 16px 0' }}>
          {slotsLoading ? (
            <div style={{ fontSize: 13, opacity: 0.5, padding: 12, textAlign: 'center' }}>Loading times…</div>
          ) : slots.length === 0 ? (
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)' }}>No open times this day.</div>
              <div className="caption-serif" style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>Try another day on the strip above.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {slots.map(s => (
                <button key={s.id} onClick={() => setBooking(s)} style={{
                  padding: '12px 16px', borderRadius: 14, background: 'var(--paper)', border: 'var(--hairline)',
                  color: 'var(--forest)', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 80,
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>{fmtTime(s.starts_at)}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.6 }}>${s.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {booking && (
        <BookingSheet
          slot={booking}
          course={course}
          profile={profile}
          onClose={() => setBooking(null)}
          onBooked={() => { setBooking(null); go({ screen: 'myRounds' }); }}
        />
      )}
    </div>
  );
}

// Per-hole Sandbox scorecard (yardages set by course / Sandbox admins).
function Scorecard({ holes }) {
  const totYards = holes.reduce((s, h) => s + (h.sandbox_yards || 0), 0);
  const totPar   = holes.reduce((s, h) => s + (h.par || 0), 0);
  const cell = { padding: '8px 6px', textAlign: 'center', fontSize: 12, minWidth: 30 };
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
        Sandbox 9 · scorecard
      </div>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 360 }}>
          <tbody>
            <tr style={{ background: 'var(--forest)', color: 'var(--cream)' }}>
              <td style={{ ...cell, textAlign: 'left', paddingLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.85 }}>Hole</td>
              {holes.map(h => <td key={h.hole_number} style={{ ...cell, fontFamily: 'var(--font-display)', fontSize: 14 }}>{h.hole_number}</td>)}
              <td style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.06em', opacity: 0.85 }}>TOT</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(14,28,19,0.06)' }}>
              <td style={{ ...cell, textAlign: 'left', paddingLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--forest)', opacity: 0.6 }}>Yards</td>
              {holes.map(h => <td key={h.hole_number} style={{ ...cell, fontWeight: 700, color: 'var(--ink)' }}>{h.sandbox_yards ?? '—'}</td>)}
              <td style={{ ...cell, fontWeight: 800, color: 'var(--forest)' }}>{totYards || '—'}</td>
            </tr>
            <tr>
              <td style={{ ...cell, textAlign: 'left', paddingLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--forest)', opacity: 0.6 }}>Par</td>
              {holes.map(h => <td key={h.hole_number} style={{ ...cell, color: 'var(--ink)', opacity: 0.75 }}>{h.par}</td>)}
              <td style={{ ...cell, fontWeight: 800, color: 'var(--forest)' }}>{totPar}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  );
}
function Divider() { return <div style={{ width: 1, background: 'rgba(14,28,19,0.08)' }}/>; }

// ─── Booking sheet ────────────────────────────────────────────────────
function BookingSheet({ slot, course, profile, onClose, onBooked }) {
  const [matchType, setMatchType] = React.useState('1v1');
  const [hasPartner, setHasPartner] = React.useState(null); // null | true | false (2v2 only)
  const [partner, setPartner] = React.useState(null); // profile row
  const [q, setQ] = React.useState('');
  const [results] = useUserSearch(q, 6);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  function pickFormat(k) {
    setMatchType(k);
    setHasPartner(null); setPartner(null); setQ(''); setErr('');
  }

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function reserve() {
    if (matchType === '2v2') {
      if (hasPartner === null) { setErr('Do you have a partner? Pick Yes or No.'); return; }
      if (hasPartner === true && !partner) { setErr('Search and pick your partner, or choose No.'); return; }
    }
    setErr(''); setBusy(true);
    try {
      await createBooking({
        slotId: slot.id, userId: profile.id,
        partnerId: matchType === '2v2' && hasPartner && partner ? partner.id : null,
        needsPartner: matchType === '2v2' && hasPartner === false,
        matchType, price: slot.price,
      });
      onBooked();
    } catch (e) { setErr(e.message || 'Could not reserve.'); setBusy(false); }
  }

  const when = new Date(slot.starts_at);
  const dateLabel = when.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }} style={{
      position: 'fixed', inset: 0, background: 'rgba(14,28,19,0.6)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ width: 38, height: 4, borderRadius: 999, background: 'rgba(14,28,19,0.16)', margin: '10px auto 0' }}/>
        <div style={{ padding: '14px 20px 18px', overflowY: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--forest)' }}>Reserve your round</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
            {course.shortName} · {dateLabel} · {fmtTime(slot.starts_at)}
          </div>

          {/* Format toggle */}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, background: 'rgba(14,28,19,0.05)', borderRadius: 12, padding: 4 }}>
            {[['1v1', 'Head-to-head'], ['2v2', '2v2 Scramble']].map(([k, l]) => (
              <button key={k} onClick={() => pickFormat(k)} style={{
                flex: 1, padding: '10px', borderRadius: 9,
                background: matchType === k ? 'var(--forest)' : 'transparent',
                color: matchType === k ? 'var(--cream)' : 'var(--forest)',
                fontWeight: 700, fontSize: 13,
              }}>{l}</button>
            ))}
          </div>

          {/* 2v2: do you have a partner? */}
          {matchType === '2v2' && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Do you have a partner?</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: hasPartner !== null ? 14 : 0 }}>
                {[['yes', 'Yes — invite them', true], ['no', "No — pair me up", false]].map(([k, l, v]) => (
                  <button key={k} onClick={() => { setHasPartner(v); setPartner(null); setQ(''); setErr(''); }} style={{
                    flex: 1, padding: '12px 10px', borderRadius: 12,
                    background: hasPartner === v ? 'var(--forest)' : 'var(--paper)',
                    color: hasPartner === v ? 'var(--cream)' : 'var(--forest)',
                    border: hasPartner === v ? 'none' : 'var(--hairline)',
                    fontWeight: 700, fontSize: 13,
                  }}>{l}</button>
                ))}
              </div>

              {hasPartner === false && (
                <div style={{ background: 'rgba(28,73,42,0.06)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: 'var(--ink)', opacity: 0.85, lineHeight: 1.4 }}>
                  We'll pair you with another solo at this tee time. Your match locks only once a full foursome is set — you'll never be left in a 2-on-1.
                </div>
              )}
            </div>
          )}

          {/* Partner picker — only when "Yes" */}
          {matchType === '2v2' && hasPartner === true && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Your partner</div>
              {partner ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--paper)', borderRadius: 12, padding: '10px 12px', border: 'var(--hairline)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: '#5A7B4A', color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 15, overflow: 'hidden' }}>
                    {partner.avatar_url ? <img src={partner.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (partner.first_name || partner.handle || '?').replace(/^@/, '').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{[partner.first_name, partner.last_name].filter(Boolean).join(' ') || partner.handle}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{formatHandle(partner.handle)}</div>
                  </div>
                  <button onClick={() => { setPartner(null); setQ(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--forest)', fontSize: 12, fontWeight: 700, opacity: 0.7 }}>Change</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--paper)', borderRadius: 12, padding: '10px 12px', border: 'var(--hairline)' }}>
                    <Icon.Search size={15} color="var(--forest)"/>
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a partner by @handle…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}/>
                  </div>
                  {q.trim() && results.length > 0 && (
                    <div className="card" style={{ marginTop: 8, overflow: 'hidden' }}>
                      {results.filter(r => r.id !== profile.id).map((r, i, arr) => (
                        <button key={r.id} onClick={() => { setPartner(r); }} style={{
                          width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                          padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                          borderBottom: i < arr.length - 1 ? '1px solid rgba(14,28,19,0.05)' : 'none', cursor: 'pointer',
                        }}>
                          <div style={{ width: 28, height: 28, borderRadius: 999, background: '#5A7B4A', color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 13, overflow: 'hidden' }}>
                            {r.avatar_url ? <img src={r.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (r.first_name || r.handle || '?').replace(/^@/, '').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{[r.first_name, r.last_name].filter(Boolean).join(' ') || r.handle}</div>
                            <div style={{ fontSize: 11, opacity: 0.55 }}>{formatHandle(r.handle)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Price + reserve */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, padding: '14px 0 4px' }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Price (set by course)</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--forest)', marginTop: 2 }}>${slot.price}</div>
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, textAlign: 'right', maxWidth: 150 }}>Reserve now, pay at the course. No charge yet.</div>
          </div>

          {err && <div style={{ background: 'rgba(196,69,54,0.08)', color: '#9C2E22', borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 600, marginTop: 8 }}>{err}</div>}

          <Button variant="forest" full size="md" onClick={reserve} disabled={busy} style={{ marginTop: 16 }}>
            {busy ? 'Reserving…' : 'Reserve tee time'}
          </Button>
          <Button variant="outline" full size="md" onClick={onClose} disabled={busy} style={{ marginTop: 10 }}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ─── My Rounds ────────────────────────────────────────────────────────
function MyRoundsScreen({ go, profile }) {
  const [upcoming, past, loading] = useMyBookings(profile && profile.id);
  const [busyId, setBusyId] = React.useState(null);

  async function cancel(b) {
    setBusyId(b.id);
    try { await cancelBooking({ bookingId: b.id }); } catch (_) {}
    setBusyId(null);
  }

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ padding: '58px 22px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => go({ screen: 'book' })} style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--paper)', border: 'var(--hairline)', color: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.ArrowLeft size={16}/>
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--forest)', letterSpacing: '-0.02em' }}>My Rounds</div>
      </div>

      <div style={{ padding: '4px 16px 0' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, opacity: 0.5 }}>Loading…</div>
        ) : (
          <>
            <Section label="Upcoming"/>
            {upcoming.length === 0 ? (
              <div className="card" style={{ padding: 22, textAlign: 'center', marginBottom: 18 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)' }}>No rounds booked.</div>
                <div className="caption-serif" style={{ fontSize: 14, opacity: 0.7, marginTop: 4, marginBottom: 14 }}>Find a twilight tee time near you.</div>
                <Button variant="forest" size="sm" onClick={() => go({ screen: 'book' })}>Book a round</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
                {upcoming.map(b => <RoundCard key={b.id} b={b} onCancel={() => cancel(b)} busy={busyId === b.id} go={go}/>)}
              </div>
            )}

            {past.length > 0 && (
              <>
                <Section label="Past"/>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {past.map(b => <RoundCard key={b.id} b={b} past go={go}/>)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ label }) {
  return <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '6px 4px 10px' }}>{label}</div>;
}

function RoundCard({ b, onCancel, busy, past, go }) {
  const slot = b.slot || {};
  const course = slot.course || {};
  const when = slot.starts_at ? new Date(slot.starts_at) : null;
  const within24h = when && (when.getTime() - Date.now() < 24 * 3600 * 1000);
  return (
    <div className="card" style={{ padding: 14, opacity: past ? 0.7 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button onClick={() => course.id && go({ screen: 'courseDetail', courseId: course.id })} style={{ background: 'transparent', border: 'none', padding: 0, textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--forest)', lineHeight: 1 }}>{course.short_name || 'Course'}</div>
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 5 }}>
            {when ? when.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''} · {when ? fmtTime(slot.starts_at) : ''}
          </div>
        </button>
        <Chip variant={b.match_type === '2v2' ? 'forest' : 'default'} style={{ fontSize: 10 }}>{b.match_type === '2v2' ? '2v2' : '1v1'}</Chip>
      </div>
      {b.partner && (
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Partner: {formatHandle(b.partner.handle)}</div>
      )}
      {!past && !within24h && (
        <button onClick={onCancel} disabled={busy} style={{ marginTop: 12, background: 'transparent', border: 'none', color: 'var(--loss, #C44536)', fontSize: 12, fontWeight: 700, opacity: busy ? 0.5 : 0.85 }}>
          {busy ? 'Cancelling…' : 'Cancel reservation'}
        </button>
      )}
      {!past && within24h && (
        <div style={{ marginTop: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.04em' }}>
          Locked in — within 24h of tee time.
        </div>
      )}
    </div>
  );
}

Object.assign(window, { BookScreen, CourseDetailScreen, MyRoundsScreen });
