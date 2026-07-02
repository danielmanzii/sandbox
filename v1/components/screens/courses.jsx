/* global React, Icon, Button, Chip, MOCK, formatHandle, useGeolocation, useAvailability, useCourse, useCourseSlots, useFriendsOnSlots, useMyBookings, useMatchup, useMatchDetail, createBooking, cancelBooking, startBookedMatch, confirmMatchResult, useUserSearch, invitePartner, ShareResultCard, shareResult, plainMargin */
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
function BookScreen({ go, profile, embedded }) {
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
    <div style={{ background: 'var(--canvas)', minHeight: embedded ? 'auto' : '100%', paddingBottom: embedded ? 0 : 120 }}>
      <div style={{ padding: embedded ? '4px 20px 12px' : '58px 20px 12px', color: 'var(--forest)' }}>
        {!embedded && (
          <button onClick={() => go({ screen: 'home' })} style={{
            width: 40, height: 40, borderRadius: 999, marginBottom: 12,
            background: 'var(--paper)', border: 'var(--hairline)', color: 'var(--forest)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.ArrowLeft size={16}/>
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {!embedded ? (
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Twilight tee times</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 0.92, marginTop: 8, letterSpacing: '-0.02em' }}>Book a round.</div>
            </div>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon.Pin size={12}/> {locLabel}
            </div>
          )}
          <button onClick={() => go({ screen: 'myRounds' })} style={{
            marginTop: embedded ? 0 : 6, padding: '8px 12px', borderRadius: 999,
            background: 'var(--paper)', border: 'var(--hairline)', color: 'var(--forest)',
            fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
          }}>
            <Icon.Calendar size={13}/> My rounds
          </button>
        </div>
        {!embedded && (
          <div style={{ fontSize: 12, marginTop: 8, opacity: 0.6, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon.Pin size={12}/> {locLabel}
          </div>
        )}
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
        backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden',
      }}>
        <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        {/* Clay course-hole diorama (when no custom render set) */}
        {!course.renderImg && (
          <img src="assets/clay-course-hole.png" alt="" style={{
            position: 'absolute', right: -10, bottom: -6, height: 150, opacity: 0.92,
            pointerEvents: 'none', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
          }}/>
        )}
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
      if (matchType === '2v2' && hasPartner && partner) {
        // Invite a chosen partner — they must accept (consent) to be booked.
        await invitePartner({ slotId: slot.id, partnerId: partner.id, price: slot.price });
      } else {
        await createBooking({
          slotId: slot.id, userId: profile.id, partnerId: null,
          needsPartner: matchType === '2v2' && hasPartner === false,
          matchType, price: slot.price,
        });
      }
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
                <img src="assets/clay-golfer.png" alt="" style={{ height: 120, margin: '0 auto 6px', display: 'block' }}/>
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
      {b.match_id && (
        <button onClick={() => go({ screen: past ? 'matchDetail' : 'matchup', matchId: b.match_id })} style={{
          marginTop: 10, background: 'transparent', border: 'none', color: 'var(--forest)',
          fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0,
        }}>
          {past ? 'View result' : 'View matchup'} <Icon.ArrowRight size={13}/>
        </button>
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

// ─── Matchup reveal (scout your foursome / opponent) ──────────────────
function MatchupScreen({ go, matchId, profile }) {
  const [data, loading] = useMatchup(matchId);
  const [starting, setStarting] = React.useState(false);
  const meId = profile && profile.id;

  async function checkIn(mid) {
    setStarting(true);
    try { await startBookedMatch(mid); go({ screen: 'match', matchId: mid }); }
    catch (_) { setStarting(false); }
  }

  if (loading) return <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--forest)', opacity: 0.5 }}>Loading…</div>;
  if (!data) return <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--forest)' }}>Matchup not found.</div>;

  const { match, teamA, teamB } = data;
  const is2v2 = (teamA.length + teamB.length) > 2;
  const mySide = teamA.some(p => p.id === meId) ? 'A' : teamB.some(p => p.id === meId) ? 'B' : null;

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{
        padding: '56px 20px 24px', color: 'var(--cream)', position: 'relative',
        background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      }}>
        <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
        <button onClick={() => go({ screen: 'myRounds' })} style={{
          position: 'absolute', top: 56, left: 16, width: 40, height: 40, borderRadius: 999,
          background: 'rgba(14,28,19,0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(234,226,206,0.22)',
        }}><Icon.ArrowLeft size={16}/></button>
        <div style={{ position: 'relative', textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.7, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{is2v2 ? '2v2 Scramble' : 'Head-to-head'} · {match.course_name}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginTop: 8, letterSpacing: '-0.01em' }}>The Matchup</div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        <TeamBlock label={mySide === 'A' ? 'Your team' : 'Team A'} players={teamA} meId={meId} go={go}/>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', opacity: 0.5, margin: '10px 0' }}>VS</div>
        <TeamBlock label={mySide === 'B' ? 'Your team' : (is2v2 ? 'Team B' : 'Opponent')} players={teamB} meId={meId} go={go}/>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        {match.status === 'completed' ? (
          <Button variant="forest" full size="md" onClick={() => go({ screen: 'match', matchId: match.id })}>
            View result
          </Button>
        ) : (
          <Button variant="forest" full size="md" onClick={() => checkIn(match.id)} disabled={starting}>
            {starting ? 'Starting…' : 'Check in & start match'}
          </Button>
        )}
        <Button variant="outline" full size="md" onClick={() => go({ screen: 'chat', matchId: match.id, title: 'Group chat' })} style={{ marginTop: 10 }}>
          💬 Group chat
        </Button>
        <div className="caption-serif" style={{ fontSize: 14, color: 'var(--ink)', opacity: 0.65, textAlign: 'center', lineHeight: 1.5, marginTop: 14 }}>
          Scout the field — know your SBX gap before the first tee.
        </div>
      </div>
    </div>
  );
}

function TeamBlock({ label, players, meId, go }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {players.map(p => <ScoutCard key={p.id} p={p} me={p.id === meId} go={go}/>)}
      </div>
    </div>
  );
}

function ScoutCard({ p, me, go }) {
  const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.handle;
  const initial = (name || '?').replace(/^@/, '').charAt(0).toUpperCase();
  return (
    <button onClick={() => go({ screen: 'profile', viewingHandle: p.handle })} className="card" style={{
      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, padding: 14,
      border: me ? '1.5px solid var(--forest)' : 'var(--hairline)',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 999, background: '#5A7B4A', color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 20, overflow: 'hidden', flexShrink: 0 }}>
        {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{name}{me && <span style={{ opacity: 0.5, fontWeight: 600 }}> · you</span>}</div>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{formatHandle(p.handle)}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--forest)', lineHeight: 1 }}>{(Number(p.sbx) || 4).toFixed(3)}</div>
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.1em', marginTop: 3 }}>SBX</div>
      </div>
    </button>
  );
}

// ─── Match detail / summary (+ confirm result) ────────────────────────
function MatchDetailScreen({ go, matchId, profile }) {
  const [data, loading] = useMatchDetail(matchId);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [showHoles, setShowHoles] = React.useState(false);
  const cardRef = React.useRef(null);
  const topRef = React.useRef(null);
  const innerRef = React.useRef(null);
  const exitRef = React.useRef(null);
  const meId = profile && profile.id;

  // Scroll so the Exit button sits above the bottom dock after opening.
  function scrollHolesUp() {
    const el = exitRef.current || innerRef.current;
    if (!el) return;
    const sc = el.closest && el.closest('.screen-enter');
    if (!sc) { el.scrollIntoView({ behavior: 'smooth', block: 'end' }); return; }
    const er = el.getBoundingClientRect(), sr = sc.getBoundingClientRect();
    const DOCK = 120; // room for the tab bar + a little breathing space
    const delta = er.bottom - (sr.bottom - DOCK);
    if (delta > 0) sc.scrollBy({ top: delta, behavior: 'smooth' });
  }

  function toggleHoles() {
    setShowHoles(prev => {
      const next = !prev;
      window.setTimeout(() => {
        if (next) scrollHolesUp();
        else if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, next ? 320 : 60);
      return next;
    });
  }

  if (loading) return <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--forest)', opacity: 0.5 }}>Loading…</div>;
  if (!data) return <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--forest)' }}>Match not found.</div>;

  const { match: m, holes, teamA, teamB } = data;
  const is2v2 = m.match_type === '2v2';
  const youAreA = m.player_a === meId || m.player_a2 === meId;
  const isParticipant = youAreA || m.player_b === meId || m.player_b2 === meId;
  const decided = m.status === 'completed' || m.result != null;

  // Result from your POV
  let verdict = 'In progress';
  if (m.result === 'H') verdict = 'Halved';
  else if (m.result === 'A') verdict = youAreA ? 'Won' : 'Lost';
  else if (m.result === 'B') verdict = youAreA ? 'Lost' : 'Won';
  const won = verdict === 'Won';

  const holesWon = holes.filter(h => (h.result === 'A' && youAreA) || (h.result === 'B' && !youAreA)).length;
  const holesLost = holes.filter(h => (h.result === 'B' && youAreA) || (h.result === 'A' && !youAreA)).length;
  const holesHalved = holes.filter(h => h.result === 'H').length;

  const mySide = youAreA ? 'a' : 'b';
  const iConfirmed = mySide === 'a' ? m.confirmed_a : m.confirmed_b;
  const theyConfirmed = mySide === 'a' ? m.confirmed_b : m.confirmed_a;
  const bothConfirmed = m.confirmed_a && m.confirmed_b;

  async function confirm() {
    setBusy(true); setErr('');
    try {
      await confirmMatchResult(matchId);
      // Rating + points just recomputed server-side — refresh our profile.
      try { if (typeof window.reloadProfile === 'function') window.reloadProfile(); } catch (_) {}
    } catch (e) { setErr(e.message || 'Could not confirm.'); }
    setBusy(false);
  }

  const teamLabel = (team) => team.map(p => p.first_name || p.handle).join(' + ') || '—';
  const theirLabel = youAreA ? teamLabel(teamB) : teamLabel(teamA);
  const yourLabel = youAreA ? teamLabel(teamA) : teamLabel(teamB);
  const halved = verdict === 'Halved';
  const margin = m.final_margin || '';
  const plain = plainMargin ? plainMargin(margin) : margin;
  const headline = !decided ? 'In progress' : halved ? 'Halved' : won ? `W ${margin}` : `L ${margin}`;
  const summary = !decided ? 'Not finished yet.'
    : halved ? 'All square — matched hole for hole.'
    : won ? `Beat ${theirLabel} · ${plain}` : `${theirLabel} took it · ${plain}`;
  const subline = `${is2v2 ? `${yourLabel} vs ${theirLabel}` : `You vs ${theirLabel}`} · ${m.course_name || 'Sandbox'}`;
  const cells = holes.map(h => {
    const w = (h.result === 'A' && youAreA) || (h.result === 'B' && !youAreA);
    const l = (h.result === 'B' && youAreA) || (h.result === 'A' && !youAreA);
    return { n: h.hole_number, lab: h.result == null ? '' : w ? 'W' : l ? 'L' : 'H' };
  });
  const toAv = (p) => ({ name: p.first_name || p.handle, avatar: p.avatar_url });
  const matchup = {
    yours: (youAreA ? teamA : teamB).map(toAv),
    theirs: (youAreA ? teamB : teamA).map(toAv),
  };

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div ref={topRef} style={{ padding: '50px 16px 6px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => go({ screen: 'stats' })} style={{
          width: 38, height: 38, borderRadius: 999, background: 'var(--paper)', border: 'var(--hairline)',
          color: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon.ArrowLeft size={16}/></button>
      </div>

      {/* 3D result card, centred a little lower */}
      <div style={{ flex: showHoles ? '0 0 auto' : 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2% 16px 0' }}>
        <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
          <ShareResultCard ref={cardRef} headline={headline} summary={summary} subline={subline} cells={cells} totalHoles={holes.length} matchup={matchup}/>

          {/* Still in progress → jump back in */}
          {!decided && isParticipant && (
            <Button variant="forest" full size="lg" onClick={() => go({ screen: 'match', matchId })} style={{ marginTop: 16 }}>
              Continue match <Icon.ArrowRight size={16}/>
            </Button>
          )}

          {/* Confirmation — only while it still needs confirming; once both
              sides agree, the hole-by-hole folder takes this spot. */}
          {isParticipant && decided && !bothConfirmed && (
            <div className="card" style={{ padding: 16, textAlign: 'center', marginTop: 16 }}>
              {iConfirmed ? (
                <>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Confirmed on your side</div>
                  <div className="caption-serif" style={{ fontSize: 14, opacity: 0.75, marginTop: 6 }}>Waiting for the other side to confirm…</div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--forest)' }}>Confirm the result</div>
                  <div className="caption-serif" style={{ fontSize: 13, opacity: 0.7, marginTop: 4, marginBottom: 12, lineHeight: 1.5 }}>
                    Both {is2v2 ? 'teams' : 'players'} confirm before it counts toward SBX.{theyConfirmed ? ' The other side already confirmed.' : ''}
                  </div>
                  {err && <div style={{ fontSize: 12, color: 'var(--loss, #C44536)', marginBottom: 8 }}>{err}</div>}
                  <Button variant="forest" full onClick={confirm} disabled={busy}>{busy ? 'Confirming…' : 'Confirm result'}</Button>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {decided && bothConfirmed && (
              <button onClick={() => shareCardImage(cardRef.current, { youWon: won, halved, margin, theirLabel })}
                style={{ width: '100%', padding: 15, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--forest)', color: 'var(--cream)', fontWeight: 800, fontSize: 14 }}>
                Share scorecard
              </button>
            )}
            <button onClick={toggleHoles}
              style={{ width: '100%', padding: 15, borderRadius: 14, cursor: 'pointer', background: 'transparent', border: '1px solid var(--forest)', color: 'var(--forest)', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {showHoles ? 'Hide hole details' : 'Hole by hole details'}
              <span style={{ transition: 'transform 0.3s ease', transform: showHoles ? 'rotate(180deg)' : 'none', display: 'inline-flex' }}><Icon.Chevron dir="down" size={14} color="var(--forest)"/></span>
            </button>
            {bothConfirmed && (
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, textAlign: 'center', letterSpacing: '0.06em' }}>
                ✓ Result confirmed by both sides — counts toward SBX
              </div>
            )}

            {/* Gooey folder: one tab per hole, full stroke-by-stroke detail */}
            {showHoles && (
              <div ref={innerRef} className="step-reveal" style={{ paddingTop: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <Stat label="Holes won" value={holesWon}/>
                  <Stat label="Lost" value={holesLost}/>
                  <Stat label="Halved" value={holesHalved}/>
                </div>
                <HoleFolder holes={holes} youAreA={youAreA} is2v2={is2v2} byId={data.byId}
                  playerStatsByHole={data.playerStatsByHole} meId={meId} isParticipant={isParticipant}/>
              </div>
            )}

            {/* Exit sits below whatever's expanded */}
            <button ref={exitRef} onClick={() => go({ screen: 'stats' })}
              style={{ width: '100%', padding: 13, borderRadius: 14, cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--forest)', opacity: 0.6, fontWeight: 800, fontSize: 13 }}>
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gooey hole-by-hole folder ────────────────────────────────────────
// Manila-folder UI: one tab per hole, the active tab "melts" into the panel
// via an SVG gooey filter. Panel shows the full stroke-by-stroke shot log
// (every player's outcome per stroke, whose ball the team took, caddie
// suggestion, putt rounds) when recorded; older matches fall back to the
// per-hole summary. 2v2 gets Only-your-shots / Team-shots pills.
function HoleFolder({ holes, youAreA, is2v2, byId, playerStatsByHole, meId, isParticipant }) {
  const [active, setActive] = React.useState(0);
  const [scope, setScope] = React.useState('mine'); // mine | team
  const TAB_H = 38;
  const n = holes.length || 1;
  const h = holes[Math.min(active, n - 1)] || {};
  const showPills = is2v2 && isParticipant;
  const teamScope = !showPills || scope === 'team';

  const name = (id) => { const p = byId[id]; return p ? (p.first_name || formatHandle(p.handle)) : 'Player'; };
  const isMe = (id) => id === meId;
  const FW = { hit: 'fairway hit', left: 'missed the fairway left', right: 'missed the fairway right', long: 'long of the fairway', short: 'short of the fairway' };

  const w = (h.result === 'A' && youAreA) || (h.result === 'B' && !youAreA);
  const l = (h.result === 'B' && youAreA) || (h.result === 'A' && !youAreA);
  const verdict = h.result == null ? 'Not played' : w ? 'Won' : l ? 'Lost' : 'Halved';
  const yourScore = youAreA ? h.player_a_score : h.player_b_score;
  const oppScore  = youAreA ? h.player_b_score : h.player_a_score;
  const log = (youAreA ? h.shot_log_a : h.shot_log_b) || null;
  const pStats = (playerStatsByHole || {})[h.hole_number] || [];

  // Which players' lines to show inside an event, honouring the pill scope.
  const visible = (ids) => teamScope ? ids : ids.filter(isMe);

  const cream = 'var(--cream)';
  const dim = { fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 };
  const line = { fontSize: 13, lineHeight: 1.45 };

  function ShotEvent({ ev }) {
    const ids = visible(Object.keys(ev.outcomes || {}));
    const pickedName = ev.picked ? name(ev.picked) : null;
    return (
      <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(234,226,206,0.14)' }}>
        <div style={dim}>Shot {ev.shot}</div>
        {ids.map(pid => {
          const o = ev.outcomes[pid] || {};
          const bits = [];
          if (o.fairway) bits.push(FW[o.fairway] || o.fairway);
          if (o.reached === 'holed') bits.push('holed out!');
          else if (o.reached === true) bits.push(`on the green${o.zone ? ` · ${o.zone}` : ''}`);
          else if (o.reached === false) bits.push('missed the green');
          if (o.ob) bits.push('OB / penalty');
          return (
            <div key={pid} style={{ ...line, marginTop: 5 }}>
              <b>{name(pid)}{isMe(pid) ? ' (you)' : ''}</b> — {bits.length ? bits.join(' · ') : 'logged'}
            </div>
          );
        })}
        {pickedName && (
          <div style={{ ...line, marginTop: 6, opacity: 0.85 }}>
            → Team took <b>{pickedName}{isMe(ev.picked) ? ' (you)' : ''}</b>'s ball
            {ev.suggested ? (ev.suggested === ev.picked ? ' · caddie agreed' : ` · caddie liked ${name(ev.suggested)}'s`) : ''}
          </div>
        )}
      </div>
    );
  }

  function PuttEvent({ ev }) {
    const all = Object.keys(ev.results || {});
    const ids = visible(all);
    // In "only your shots", still surface a partner's make — that's the story of the hole.
    const partnerMade = !teamScope ? all.find(pid => !isMe(pid) && ev.results[pid] === 'made') : null;
    return (
      <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(234,226,206,0.14)' }}>
        <div style={dim}>Putt · shot {ev.shot}{ev.round > 1 ? ` · round ${ev.round}` : ''}</div>
        {ids.map(pid => (
          <div key={pid} style={{ ...line, marginTop: 5 }}>
            <b>{name(pid)}{isMe(pid) ? ' (you)' : ''}</b> — {ev.results[pid] === 'made' ? 'made the putt' : 'missed'}
          </div>
        ))}
        {partnerMade && (
          <div style={{ ...line, marginTop: 5, opacity: 0.85 }}>
            <b>{name(partnerMade)}</b> (partner) made the putt
          </div>
        )}
      </div>
    );
  }

  // Older matches (no stroke log) — the per-hole summary we do have.
  function SummaryFallback() {
    const rows = [];
    if (is2v2) {
      if (h.ball_player) rows.push(['Ball played', `${name(h.ball_player)}${isMe(h.ball_player) ? ' (you)' : ''}`]);
      if (h.holed_by)    rows.push(['Holed by', `${name(h.holed_by)}${isMe(h.holed_by) ? ' (you)' : ''}`]);
      if (h.zone)        rows.push(['Ball position', h.zone]);
    } else {
      const fair = youAreA ? h.player_a_fairway : h.player_b_fairway;
      const gir  = youAreA ? h.player_a_gir : h.player_b_gir;
      const putts = youAreA ? h.player_a_putts : h.player_b_putts;
      if (fair) rows.push(['Fairway', FW[fair] || fair]);
      if (gir != null) rows.push(['Green in reg', gir ? 'Yes' : 'No']);
      if (putts != null) rows.push(['Putts', putts]);
    }
    const stats = visible(pStats.map(s => s.player_id)).map(pid => pStats.find(s => s.player_id === pid)).filter(Boolean);
    return (
      <div>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(234,226,206,0.14)' }}>
            <span style={dim}>{k}</span><span style={{ fontSize: 13, fontWeight: 700 }}>{v}</span>
          </div>
        ))}
        {is2v2 && stats.map(s => {
          const bits = [];
          if (s.fairway) bits.push(FW[s.fairway] || s.fairway);
          if (s.on_green === true || s.gir === true) bits.push('reached the green');
          else if (s.on_green === false) bits.push('missed the green');
          if (s.ob) bits.push('OB');
          if (s.zone) bits.push(s.zone);
          return (
            <div key={s.player_id} style={{ ...line, padding: '9px 0', borderBottom: '1px solid rgba(234,226,206,0.14)' }}>
              <b>{name(s.player_id)}{isMe(s.player_id) ? ' (you)' : ''}</b> — {bits.length ? bits.join(' · ') : 'no detail logged'}
            </div>
          );
        })}
        {rows.length === 0 && stats.length === 0 && (
          <div style={{ ...line, opacity: 0.7, padding: '9px 0' }}>No shot detail was recorded for this hole.</div>
        )}
      </div>
    );
  }

  const pill = (on) => ({
    flex: 1, padding: '8px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer',
    background: on ? cream : 'rgba(234,226,206,0.1)', color: on ? 'var(--forest)' : cream,
    border: on ? 'none' : '1px solid rgba(234,226,206,0.24)',
  });

  return (
    <div style={{ position: 'relative', marginTop: 4 }}>
      {/* Gooey filter (blur + contrast melts the tab into the panel) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="spp-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur"/>
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo"/>
            <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
          </filter>
        </defs>
      </svg>

      {/* Filtered background: sliding tab bump + folder body, merged gooey */}
      <div style={{ position: 'absolute', inset: 0, filter: 'url(#spp-goo)', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: 0, height: TAB_H + 12,
          left: `${(Math.min(active, n - 1)) * (100 / n)}%`, width: `${100 / n}%`,
          background: 'var(--forest)', borderRadius: '12px 12px 0 0',
          transition: 'left 0.4s cubic-bezier(0.3, 0.9, 0.3, 1)',
        }}/>
        <div style={{ position: 'absolute', top: TAB_H, left: 0, right: 0, bottom: 0, background: 'var(--forest)', borderRadius: 20 }}/>
      </div>

      {/* Crisp layer: tab hit-targets + panel content */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex' }}>
          {holes.map((hh, i) => (
            <button key={hh.hole_number} onClick={() => setActive(i)} style={{
              flex: 1, height: TAB_H, background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: n > 9 ? 10 : 12, fontWeight: 800,
              color: i === active ? cream : 'var(--forest)', opacity: i === active ? 1 : 0.6,
              transition: 'color 0.25s',
            }}>{hh.hole_number}</button>
          ))}
        </div>

        <div key={`${active}-${scope}`} className="step-reveal" style={{ padding: '16px 18px 18px', color: cream }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Hole {h.hole_number}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, opacity: 0.9 }}>{verdict}</div>
          </div>
          <div style={{ ...dim, marginTop: 4 }}>
            Par {h.par || 3}{h.distance_yards != null ? ` · ${h.distance_yards}y` : ''} · You {yourScore != null ? yourScore : '—'} — Them {oppScore != null ? oppScore : '—'}
          </div>

          {showPills && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setScope('mine')} style={pill(scope === 'mine')}>Only your shots</button>
              <button onClick={() => setScope('team')} style={pill(scope === 'team')}>Team shots</button>
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            {log && log.length
              ? log.map((ev, i) => ev.phase === 'putt' ? <PuttEvent key={i} ev={ev}/> : <ShotEvent key={i} ev={ev}/>)
              : <SummaryFallback/>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Per-hole stat popup ──────────────────────────────────────────────
function HoleStatSheet({ hole, youAreA, is2v2, byId, playerStats = [], onClose }) {
  const h = hole;
  const w = (h.result === 'A' && youAreA) || (h.result === 'B' && !youAreA);
  const l = (h.result === 'B' && youAreA) || (h.result === 'A' && !youAreA);
  const verdict = h.result == null ? 'Not played' : w ? 'Won' : l ? 'Lost' : 'Halved';
  const verdictColor = w ? 'var(--forest)' : l ? '#C44536' : 'var(--ink)';

  const yourScore = youAreA ? h.player_a_score : h.player_b_score;
  const oppScore  = youAreA ? h.player_b_score : h.player_a_score;
  const name = (id) => { const p = byId[id]; return p ? (p.first_name || p.handle) : '—'; };
  const yourGir   = youAreA ? h.player_a_gir : h.player_b_gir;
  const yourPutts = youAreA ? h.player_a_putts : h.player_b_putts;
  const yourFair  = youAreA ? h.player_a_fairway : h.player_b_fairway;
  const fairLabel = { hit: 'Hit', left: 'Missed left', right: 'Missed right', long: 'Long', short: 'Short' };

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid rgba(14,28,19,0.06)' }}>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
    </div>
  );

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, background: 'rgba(14,28,19,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '14px 20px 28px' }}>
        <div style={{ width: 38, height: 4, borderRadius: 999, background: 'rgba(14,28,19,0.16)', margin: '0 auto 16px' }}/>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--forest)' }}>Hole {h.hole_number}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: verdictColor }}>{verdict}</div>
        </div>

        <Row label="Par" value={h.par || 3}/>
        {h.distance_yards != null && <Row label="Yards" value={h.distance_yards}/>}
        <Row label="Your side" value={yourScore != null ? yourScore : '—'}/>
        <Row label="Opponent" value={oppScore != null ? oppScore : '—'}/>

        {is2v2 ? (
          <>
            <Row label="Ball played" value={h.ball_player ? name(h.ball_player) : '—'}/>
            <Row label="Holed by" value={h.holed_by ? name(h.holed_by) : '—'}/>
            <Row label="Ball position" value={h.zone || '—'}/>

            {/* Per-player breakdown (both teammates' own shots) */}
            {playerStats.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>By player</div>
                {playerStats.map(s => {
                  const p = byId[s.player_id]; if (!p) return null;
                  const pname = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.handle;
                  return (
                    <div key={s.player_id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(14,28,19,0.06)' }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{pname} <span style={{ opacity: 0.55, fontWeight: 600 }}>{formatHandle(p.handle)}</span></div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 3 }}>
                        {s.fairway ? `Fairway: ${fairLabel[s.fairway] || s.fairway} · ` : ''}
                        {s.gir != null ? `GIR: ${s.gir ? 'Yes' : 'No'}` : ''}
                        {s.zone ? ` · ${s.zone}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {(h.par || 3) >= 4 && <Row label="Fairway" value={yourFair ? (fairLabel[yourFair] || yourFair) : '—'}/>}
            <Row label="GIR" value={yourGir == null ? '—' : yourGir ? 'Yes' : 'No'}/>
            <Row label="Putts" value={yourPutts != null ? yourPutts : '—'}/>
          </>
        )}

        <Button variant="forest" full size="md" onClick={onClose} style={{ marginTop: 18 }}>Done</Button>
      </div>
    </div>
  );
}

Object.assign(window, { BookScreen, CourseDetailScreen, MyRoundsScreen, MatchupScreen, MatchDetailScreen });
