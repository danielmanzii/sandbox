/* global React, Icon, LiveDot, Button, Eyebrow, Chip, Dashed, Ostrich, MOCK, AvatarBy, useEvent, useIsRegistered, useUpcomingEvents, registerForEvent, cancelRegistration, formatHandle, useFriendsRegisteredForEvents, FriendsHere, sendEventInvite, createEvent, updateEvent, useUserSearch */
// Events list + detail + register

// ─── Calendar download ────────────────────────────────────────────────
function downloadCalendar(event) {
  const start = new Date(event.startsAt);
  const end   = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
  const fmt   = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sandbox Pitch & Putt//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@sbx.golf`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Sandbox P&P @ ${event.courseShort}`,
    `DESCRIPTION:${(event.description || '9 holes. 2-man scramble. Sandbox Pitch & Putt.').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.courseName}, Miami, FL`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `sandbox-${event.courseShort.toLowerCase().replace(/\s+/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function EventsScreen({ go, tier, profile }) {
  const [filter, setFilter]   = React.useState('all');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [allEvents, loading, , reloadEvents] = useUpcomingEvents(50);
  const isAdmin = profile && profile.is_admin;

  const filtered = allEvents.filter(e => {
    if (filter === 'all')    return true;
    if (filter === 'weekly') return e.type === 'weekly';
    if (filter === 'majors') return e.isMajor;
    return true;
  }).sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    return 0;
  });

  const filteredIds = React.useMemo(() => filtered.map(e => e.id), [filtered]);
  const [friendsByEvent] = useFriendsRegisteredForEvents(profile && profile.id, filteredIds);

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ padding: '58px 20px 20px', background: 'var(--canvas)', color: 'var(--forest)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase' }}>The Schedule</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, marginTop: 8, letterSpacing: '-0.02em' }}>
            Play.
          </div>
          <div className="caption-serif" style={{ fontSize: 16, opacity: 0.65, marginTop: 6 }}>
            9 holes. 1 hour. Miami.
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setCreateOpen(true)} style={{
            marginTop: 8,
            width: 42, height: 42, borderRadius: 999,
            background: 'var(--forest)', color: 'var(--cream)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)', flexShrink: 0,
          }}>
            <Icon.Plus size={18}/>
          </button>
        )}
      </div>

      {createOpen && (
        <CreateEventSheet
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); reloadEvents && reloadEvents(); }}
        />
      )}

      <div style={{ display: 'flex', gap: 8, padding: '4px 16px 0', overflowX: 'auto' }} className="scroll-hide">
        {[['all', 'All'], ['weekly', 'Weekly'], ['majors', 'Majors']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: '9px 16px', borderRadius: 999,
            background: filter === k ? 'var(--forest)' : 'var(--paper)',
            color: filter === k ? 'var(--cream)' : 'var(--forest)',
            border: filter === k ? 'none' : 'var(--hairline)',
            fontWeight: 700, fontSize: 12, letterSpacing: '0.02em',
            boxShadow: filter === k ? 'var(--shadow-sm)' : 'none',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div style={{ padding: '20px 4px', fontSize: 13, color: 'var(--forest)', opacity: 0.5, textAlign: 'center' }}>
            Loading events…
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 22, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--forest)', lineHeight: 1 }}>
              No {filter === 'all' ? 'events' : filter === 'majors' ? 'Majors' : 'weekly events'} on the schedule.
            </div>
            <div className="caption-serif" style={{ fontSize: 14, color: 'var(--ink)', opacity: 0.7, marginTop: 8 }}>
              Check back soon — the schedule updates weekly.
            </div>
          </div>
        ) : (
          filtered.map(e => <FullEventCard key={e.id} event={e} go={go} tier={tier} friendsHere={friendsByEvent[e.id] || []}/>)
        )}
      </div>
    </div>
  );
}

function FullEventCard({ event, go, tier, friendsHere }) {
  const isMember = tier === 'league' || tier === 'plus';
  const isLive = event.status === 'live';
  const pct = event.filled / event.field;
  const nearFull = pct > 0.85;
  return (
    <button onClick={() => go({ screen: 'eventDetail', eventId: event.id })} className="card" style={{
      width: '100%', textAlign: 'left',
      overflow: 'hidden',
      padding: 0,
      display: 'block',
      borderRadius: 22,
    }}>
      <div style={{
        height: 140,
        backgroundImage: `linear-gradient(180deg, rgba(14,28,19,0) 0%, rgba(14,28,19,0.2) 55%, rgba(14,28,19,0.85) 100%), url('${event.img}')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', color: 'var(--cream)',
        padding: 14,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {isLive && (
            <div style={{
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--forest)', color: 'var(--cream)',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}><LiveDot/> LIVE NOW</div>
          )}
          {event.isMajor && (
            <div style={{
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--forest)', color: 'var(--cream)',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>⛳ Major</div>
          )}
          {event.status === 'member-only' && (
            <div style={{
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--forest)', color: 'var(--cream)',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}><Icon.Lock size={10} color="var(--cream)"/> Member</div>
          )}
          {!event.isMajor && !isLive && event.status === 'open' && event.tagline && (
            <div style={{
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--forest)', color: 'var(--cream)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>{event.tagline}</div>
          )}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 0.92, letterSpacing: '-0.02em' }}>
            {event.courseShort}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.85, marginTop: 6, letterSpacing: '0.06em' }}>
            {event.date.toUpperCase()} · {event.time}
          </div>
          {friendsHere && friendsHere.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <FriendsHere friends={friendsHere} size={20} max={4} light/>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              height: 4, borderRadius: 999,
              background: 'rgba(14,28,19,0.06)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                width: `${pct * 100}%`, height: '100%',
                background: nearFull ? 'var(--forest)' : 'var(--moss)',
                borderRadius: 999,
              }}/>
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, marginTop: 6, letterSpacing: '0.06em' }}>
              {event.filled}/{event.field} REGISTERED{nearFull ? ' · ALMOST FULL' : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--forest)', fontFamily: 'var(--font-mono)' }}>
              {isMember ? 'INCLUDED' : `$${event.priceMember}`}
            </div>
            {!isMember && (
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.5, color: 'var(--forest)', marginTop: 2 }}>
                ${event.priceWalkup} walk-up
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function EventDetailScreen({ go, eventId, tier, setScreenState, profile }) {
  // Real event + registration data
  const [event, eventLoading, reloadEvent] = useEvent(eventId);
  const isRegistered = useIsRegistered(eventId, profile && profile.id);

  const isMember = tier === 'league' || tier === 'plus';
  const isAdmin  = profile && profile.is_admin;
  const [registering, setRegistering] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [partner, setPartner] = React.useState('');
  const [guest, setGuest] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [actionErr, setActionErr] = React.useState('');
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [editOpen, setEditOpen]   = React.useState(false);

  async function onCancel() {
    if (!confirm('Cancel your registration for this event?')) return;
    setCancelling(true); setActionErr('');
    try {
      await cancelRegistration({ eventId, userId: profile.id });
    } catch (e) {
      setActionErr(e.message || 'Could not cancel.');
    }
    setCancelling(false);
  }

  // Loading state
  if (eventLoading) {
    return (
      <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--forest)', fontSize: 14, opacity: 0.6 }}>
        Loading event…
      </div>
    );
  }

  // Event not found (link to deleted/invalid event)
  if (!event) {
    return (
      <div style={{ background: 'var(--canvas)', minHeight: '100%', padding: '80px 24px', textAlign: 'center', color: 'var(--forest)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>Event not found.</div>
        <div className="caption-serif" style={{ fontSize: 15, opacity: 0.7, marginBottom: 24 }}>It may have been removed or the link is wrong.</div>
        <Button variant="forest" onClick={() => go({ screen: 'events' })}>Back to events</Button>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      {/* Hero */}
      <div style={{
        height: 280,
        backgroundImage: `linear-gradient(180deg, rgba(14,28,19,0.25), rgba(14,28,19,0.85)), url('${event.img}')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', color: 'var(--cream)',
      }}>
        <button onClick={() => go({ screen: 'events' })} style={{
          position: 'absolute', top: 58, left: 16,
          width: 40, height: 40, borderRadius: 999,
          background: 'rgba(14,28,19,0.6)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--cream)',
          border: '1px solid rgba(234,226,206,0.2)',
        }}>
          <Icon.ArrowLeft size={16}/>
        </button>
        {isAdmin && (
          <button onClick={() => setEditOpen(true)} style={{
            position: 'absolute', top: 58, right: 64,
            width: 40, height: 40, borderRadius: 999,
            background: 'rgba(14,28,19,0.6)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--cream)',
            border: '1px solid rgba(234,226,206,0.2)',
            fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
          }}>Edit</button>
        )}
        <button style={{
          position: 'absolute', top: 58, right: 16,
          width: 40, height: 40, borderRadius: 999,
          background: 'rgba(14,28,19,0.6)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--cream)',
          border: '1px solid rgba(234,226,206,0.2)',
        }}>
          <Icon.Share size={16}/>
        </button>

        <div style={{ position: 'absolute', bottom: 22, left: 20, right: 20 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {event.isMajor && (
              <div style={{
                padding: '5px 10px', borderRadius: 999,
                background: 'var(--forest)', color: 'var(--cream)',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
              }}>⛳ Major</div>
            )}
            {event.tagline && (
              <div style={{
                padding: '5px 10px', borderRadius: 999,
                background: 'var(--forest)', color: 'var(--cream)',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>{event.tagline}</div>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, lineHeight: 0.9, letterSpacing: '-0.02em' }}>
            {event.courseShort}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.85, marginTop: 8, letterSpacing: '0.08em' }}>
            {event.courseName.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Details block */}
      <div style={{ padding: '16px' }}>
        <div className="card" style={{ padding: '4px 18px' }}>
          <DetailRow label="Date" value={event.dateFull}/>
          <div className="hairline"/>
          <DetailRow label="Tee off" value={event.time}/>
          <div className="hairline"/>
          <DetailRow label="Format" value="2-man scramble · 9 holes"/>
          <div className="hairline"/>
          <DetailRow label="Field" value={`${event.filled} / ${event.field} · ${event.field - event.filled} left`}/>
          <div className="hairline"/>
          <DetailRow label="Distances" value="50 – 120 yards"/>
          <div className="hairline"/>
          <DetailRow label="Duration" value="~1 hour"/>
        </div>

        {/* Description */}
        <div style={{ padding: '16px 4px 8px' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.4, color: 'var(--ink)', margin: 0, fontStyle: 'italic' }}>
            "{event.description}"
          </p>
        </div>

        {/* Pricing */}
        <div className="card" style={{ padding: 16, marginTop: 10 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Entry</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <PriceTile
              primary={isMember}
              label={isMember ? 'You' : 'Member'}
              price={isMember ? 'Included' : `$${event.priceMember}`}
              sub={isMember ? `via your ${tier === 'plus' ? 'Plus' : 'League'} plan` : 'League members'}
            />
            <PriceTile
              primary={!isMember}
              label="Walk-up"
              price={`$${event.priceWalkup}`}
              sub="Single entry"
            />
          </div>
          {!isMember && (
            <button onClick={() => go({ screen: 'membership' })} style={{
              marginTop: 14, width: '100%',
              padding: '12px 14px', borderRadius: 12,
              background: 'var(--forest)',
              color: 'var(--cream)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 12, fontWeight: 700,
              boxShadow: 'var(--shadow-sm)',
            }}>
              Go member — save ${event.priceWalkup - event.priceMember}
              <Icon.ArrowRight size={12}/>
            </button>
          )}
        </div>

        {/* What's included */}
        <div style={{ padding: '20px 4px 0' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Included</div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['Custom turf mats', 'Live match tracking', 'Highlight reel', 'Sandbox Rating update', 'Prize pool', 'Coffee/agua'].map(x => (
              <div key={x} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
                <span style={{ width: 16, height: 16, borderRadius: 999, background: 'var(--forest)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon.Check size={10} color="var(--cream)"/>
                </span>
                {x}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA — inline at the bottom of content (was absolutely positioned
          and floating over content mid-scroll). */}
      <div style={{ padding: '24px 16px 0' }}>
        {actionErr && (
          <div style={{ background: 'rgba(155,58,46,0.12)', color: 'var(--loss)', fontSize: 12, padding: '8px 12px', borderRadius: 10, marginBottom: 8, textAlign: 'center' }}>
            {actionErr}
          </div>
        )}
        {isRegistered === null ? (
          <Button variant="forest" size="lg" full disabled>Loading…</Button>
        ) : isRegistered ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--forest)', color: 'var(--cream)',
                padding: '12px 20px', borderRadius: 999,
                fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em', textTransform: 'uppercase', flex: 1,
                justifyContent: 'center',
              }}>
                ✓ Coming Up
              </div>
              <Button variant="outline" size="lg" onClick={onCancel} disabled={cancelling}>
                {cancelling ? '…' : 'Cancel'}
              </Button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" full onClick={() => downloadCalendar(event)}>
                Add to calendar
              </Button>
              <Button variant="outline" full onClick={() => setInviteOpen(true)}>
                Invite a friend
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="forest" size="lg" full onClick={() => setRegistering(true)}>
            {isMember ? 'Claim your spot' : `Register · $${event.priceWalkup}`}
            <Icon.ArrowRight size={16}/>
          </Button>
        )}
      </div>

      {/* Register bottom-sheet */}
      {registering && (
        <RegisterSheet
          event={event}
          isMember={isMember}
          profile={profile}
          step={step}
          setStep={setStep}
          partner={partner}
          setPartner={setPartner}
          guest={guest}
          setGuest={setGuest}
          done={done}
          setDone={setDone}
          onClose={() => { setRegistering(false); setStep(0); setDone(false); }}
        />
      )}

      {/* Invite-a-friend bottom-sheet */}
      {inviteOpen && event && (
        <InviteToEventSheet
          event={event}
          profile={profile}
          onClose={() => setInviteOpen(false)}
        />
      )}

      {/* Edit event sheet (admin only) */}
      {editOpen && event && (
        <CreateEventSheet
          editEvent={event}
          onClose={() => setEditOpen(false)}
          onCreated={() => { setEditOpen(false); reloadEvent && reloadEvent(); }}
        />
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, padding: '14px 0' }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5, color: 'var(--forest)' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', color: 'var(--ink)' }}>{value}</div>
    </div>
  );
}

function PriceTile({ label, price, sub, primary }) {
  return (
    <div style={{
      flex: 1,
      background: primary ? 'var(--forest)' : 'var(--paper)',
      color: primary ? 'var(--cream)' : 'var(--ink)',
      border: primary ? 'none' : 'var(--hairline)',
      borderRadius: 16, padding: 14,
      boxShadow: primary ? 'var(--shadow-md)' : 'none',
    }}>
      <div style={{
        fontSize: 10, fontFamily: 'var(--font-mono)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        opacity: primary ? 0.7 : 0.55,
      }}>{label}</div>
      <div className="display-num" style={{ fontSize: 26, marginTop: 8 }}>{price}</div>
      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function RegisterSheet({ event, isMember, profile, step, setStep, partner, setPartner, guest, setGuest, done, setDone, onClose }) {
  const [submitting, setSubmitting] = React.useState(false);
  const [submitErr, setSubmitErr]   = React.useState('');

  async function submitRegistration() {
    if (!profile || !profile.id) { setSubmitErr('Sign in required.'); return; }
    setSubmitting(true); setSubmitErr('');
    try {
      await registerForEvent({
        eventId:       event.id,
        userId:        profile.id,
        partnerHandle: guest ? null : partner,
        isGuest:       guest,
      });
      // If a named partner was picked, send them a partner invite +
      // auto-register them. Errors here are swallowed — registration
      // already succeeded and partner can be invited manually later.
      if (!guest && partner) {
        try {
          await sendEventInvite({
            eventId:       event.id,
            invitedBy:     profile.id,
            inviteeHandle: partner,
            inviteType:    'partner',
          });
        } catch (_) {}
      }
      setDone(true);
    } catch (e) {
      setSubmitErr(e.message || 'Could not register.');
    }
    setSubmitting(false);
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(14,28,19,0.5)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        background: 'var(--cream)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '18px 20px 30px',
        animation: 'sheet-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        minHeight: 420,
        position: 'relative',
      }}>
        <style>{`@keyframes sheet-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div style={{ width: 36, height: 4, borderRadius: 3, background: 'rgba(14,28,19,0.2)', margin: '0 auto 18px' }}/>

        {done ? <DoneState event={event} onClose={onClose}/> :
         step === 0 ? <Step0 event={event} isMember={isMember} onNext={() => setStep(1)}/> :
         step === 1 ? <Step1 partner={partner} setPartner={setPartner} guest={guest} setGuest={setGuest} onNext={() => setStep(2)}/> :
         <Step2 event={event} isMember={isMember} partner={partner} guest={guest} submitting={submitting} submitErr={submitErr} onConfirm={submitRegistration}/>
        }
      </div>
    </div>
  );
}

function Step0({ event, isMember, onNext }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Step 1 of 3</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '10px 0 6px', lineHeight: 0.95, color: 'var(--forest)', letterSpacing: '-0.02em' }}>
        Confirm the event
      </h2>
      <p className="caption-serif" style={{ fontSize: 15, opacity: 0.7, marginTop: 0, color: 'var(--ink)' }}>
        Double-check this is the one you want.
      </p>

      <div style={{ background: 'var(--paper)', borderRadius: 14, padding: 14, marginTop: 14, border: '1px solid rgba(14,28,19,0.08)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1, color: 'var(--forest)' }}>{event.courseShort}</div>
        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>{event.dateFull} · {event.time}</div>
      </div>

      <Button variant="forest" full size="lg" onClick={onNext} style={{ marginTop: 22 }}>
        Continue <Icon.ArrowRight size={14}/>
      </Button>
    </div>
  );
}

function Step1({ partner, setPartner, guest, setGuest, onNext }) {
  const [query, setQuery]       = React.useState('');
  const [results, searching]    = useUserSearch(query, 8);

  const selectedName = partner ? partner.replace(/^@/, '') : '';

  return (
    <div>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Step 2 of 3</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '10px 0 6px', lineHeight: 0.95, color: 'var(--forest)', letterSpacing: '-0.02em' }}>
        Who's your ride-or-die?
      </h2>
      <p className="caption-serif" style={{ fontSize: 15, opacity: 0.7, marginTop: 0, color: 'var(--ink)' }}>
        Search the roster or use a guest pass.
      </p>

      {/* Search input */}
      <div style={{ position: 'relative', marginTop: 14 }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 14, color: 'var(--forest)', opacity: 0.4, pointerEvents: 'none',
        }}>@</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setGuest(false); }}
          placeholder="search by name or handle"
          style={{
            width: '100%', padding: '11px 12px 11px 26px',
            borderRadius: 12, background: 'var(--paper)',
            border: '1px solid rgba(14,28,19,0.12)',
            fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--forest)',
            boxSizing: 'border-box',
          }}
        />
        {searching && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--forest)', opacity: 0.4 }}>…</span>
        )}
      </div>

      {/* Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, maxHeight: 220, overflowY: 'auto' }}>
        {results.length === 0 && query.trim().length > 0 && !searching && (
          <div style={{ fontSize: 13, color: 'var(--forest)', opacity: 0.5, padding: '10px 4px', textAlign: 'center' }}>
            No players found for "{query}"
          </div>
        )}
        {results.map(r => {
          const handle  = r.handle ? `@${String(r.handle).replace(/^@/, '')}` : '';
          const display = [r.first_name, r.last_name].filter(Boolean).join(' ') || handle;
          const selected = partner === handle && !guest;
          return (
            <button key={r.id} onClick={() => { setPartner(handle); setGuest(false); setQuery(''); }} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 10, borderRadius: 14,
              background: selected ? 'var(--forest)' : 'var(--paper)',
              color: selected ? 'var(--cream)' : 'var(--ink)',
              border: '1px solid rgba(14,28,19,0.08)',
              width: '100%', textAlign: 'left',
            }}>
              <AvatarBy url={r.avatar_url} name={display} size={36} zoomable/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{display}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{handle}</div>
              </div>
              {selected && <Icon.Check size={14} color="var(--cream)"/>}
            </button>
          );
        })}
      </div>

      {/* Selected partner chip */}
      {partner && !guest && (
        <div style={{
          marginTop: 10, padding: '8px 14px', borderRadius: 10,
          background: 'var(--forest)', color: 'var(--cream)',
          fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <Icon.Check size={12} color="var(--cream)"/>
          {partner} selected
          <button onClick={() => setPartner('')} style={{ background: 'none', border: 'none', color: 'var(--cream)', opacity: 0.7, cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Guest pass option */}
      <button onClick={() => { setGuest(true); setPartner(''); setQuery(''); }} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 10, borderRadius: 14, marginTop: 8,
        background: guest ? 'var(--clay)' : 'transparent',
        color: guest ? 'var(--forest-deep)' : 'var(--forest)',
        border: '1px dashed rgba(14,28,19,0.2)',
        width: '100%', textAlign: 'left',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, border: '1.5px dashed currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon.Plus size={16}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Use a guest pass</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>2 left this month · they tee free</div>
        </div>
      </button>

      <Button variant="forest" full size="lg" onClick={onNext} disabled={!partner && !guest} style={{ marginTop: 18 }}>
        Lock it in <Icon.ArrowRight size={14}/>
      </Button>
    </div>
  );
}

function Step2({ event, isMember, partner, guest, submitting, submitErr, onConfirm }) {
  const price = isMember ? 0 : event.priceMember;
  return (
    <div>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Step 3 of 3</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '10px 0 6px', lineHeight: 0.95, color: 'var(--forest)', letterSpacing: '-0.02em' }}>
        Review & tee off.
      </h2>

      <div style={{ background: 'var(--paper)', borderRadius: 14, padding: 14, marginTop: 14, border: '1px solid rgba(14,28,19,0.08)' }}>
        <DetailRow label="Event" value={`${event.courseShort} · ${event.date}`}/>
        <div className="hairline"/>
        <DetailRow label="Partner" value={guest ? 'Guest pass' : partner}/>
        <div className="hairline"/>
        <DetailRow label="Total" value={price === 0 ? 'Free · included' : `$${price}.00`}/>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, opacity: 0.6, lineHeight: 1.4, padding: '0 4px' }}>
        By registering you grant Sandbox the right to use photos/video of you in content. Weather credit auto-applies for cancellations.
      </div>

      {submitErr && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.12)', padding: '10px 12px', borderRadius: 12 }}>
          {submitErr}
        </div>
      )}

      <Button variant="forest" full size="lg" onClick={onConfirm} disabled={submitting} style={{ marginTop: 18 }}>
        {submitting ? 'Submitting…' : (price === 0 ? 'Confirm spot' : `Pay $${price}.00`)}
        {!submitting && <Icon.ArrowRight size={14}/>}
      </Button>
    </div>
  );
}

function DoneState({ event, onClose }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 20 }}>
      <img src="assets/mascot-full-forest.svg" alt="" style={{ width: 140, margin: '0 auto' }}/>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 34, margin: '14px 0 4px', lineHeight: 1, color: 'var(--forest)' }}>
        You're in.
      </h2>
      <p className="caption-serif" style={{ fontSize: 16, opacity: 0.8, marginTop: 0, color: 'var(--ink)' }}>
        See you at {event.courseShort}. Bring water.
      </p>
      <div style={{ background: 'var(--paper)', borderRadius: 14, padding: 14, marginTop: 18, border: '1px solid rgba(14,28,19,0.08)', textAlign: 'left' }}>
        <DetailRow label="When" value={`${event.date} · ${event.time}`}/>
        <div className="hairline"/>
        <DetailRow label="Where" value={event.courseName}/>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <Button variant="outline" full onClick={() => downloadCalendar(event)}>Add to calendar</Button>
        <Button variant="forest" full onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}

// ─── Invite-a-friend bottom-sheet ─────────────────────────────────────
function InviteToEventSheet({ event, profile, onClose }) {
  const [handle, setHandle]   = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [err, setErr]         = React.useState('');
  const [done, setDone]       = React.useState(false);

  async function sendInvite() {
    if (!handle.trim()) return;
    setSending(true); setErr('');
    try {
      await sendEventInvite({
        eventId:       event.id,
        invitedBy:     profile.id,
        inviteeHandle: handle,
        inviteType:    'general',
      });
      setDone(true);
    } catch (e) {
      setErr(e.message || 'Could not send invite.');
    }
    setSending(false);
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(14,28,19,0.5)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        background: 'var(--cream)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '18px 20px 30px',
        animation: 'sheet-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}>
        <style>{`@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div style={{ width: 36, height: 4, borderRadius: 3, background: 'rgba(14,28,19,0.2)', margin: '0 auto 18px' }}/>

        {done ? (
          <div style={{ textAlign: 'center', paddingBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--forest)', marginBottom: 8 }}>Invite sent.</div>
            <p className="caption-serif" style={{ fontSize: 15, opacity: 0.7, marginBottom: 22, color: 'var(--ink)' }}>
              They'll get a notification to join you at {event.courseShort}.
            </p>
            <Button variant="forest" full onClick={onClose}>Done</Button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Invite to event</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, margin: '10px 0 6px', lineHeight: 0.95, color: 'var(--forest)', letterSpacing: '-0.02em' }}>
              Bring someone to<br/>{event.courseShort}.
            </h2>
            <p className="caption-serif" style={{ fontSize: 14, opacity: 0.7, marginTop: 0, marginBottom: 18, color: 'var(--ink)' }}>
              Enter their @handle and they'll get a notification to join.
            </p>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 15, color: 'var(--forest)', opacity: 0.5,
                fontFamily: 'var(--font-mono)', pointerEvents: 'none',
              }}>@</span>
              <input
                value={handle}
                onChange={e => setHandle(e.target.value.replace(/^@/, ''))}
                placeholder="username"
                style={{
                  width: '100%', padding: '14px 14px 14px 28px',
                  borderRadius: 14, background: 'var(--paper)',
                  border: '1px solid rgba(14,28,19,0.12)',
                  fontSize: 16, fontFamily: 'var(--font-mono)', color: 'var(--forest)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {err && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--loss)' }}>{err}</div>}
            <Button variant="forest" full size="lg" onClick={sendInvite} disabled={sending || !handle.trim()} style={{ marginTop: 18 }}>
              {sending ? 'Sending…' : 'Send invite'}
              {!sending && <Icon.ArrowRight size={14}/>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Admin: create / edit event bottom-sheet ─────────────────────────
function CreateEventSheet({ onClose, onCreated, editEvent }) {
  const today = new Date().toISOString().slice(0, 10);

  const toLocalDate = (iso) => {
    const d = new Date(iso), pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  };
  const toLocalTime = (iso) => {
    const d = new Date(iso), pad = n => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [form, setForm] = React.useState(() => editEvent ? {
    courseShort:  editEvent.courseShort || '',
    courseName:   editEvent.courseName  || '',
    date:         editEvent.startsAt ? toLocalDate(editEvent.startsAt) : today,
    time:         editEvent.startsAt ? toLocalTime(editEvent.startsAt) : '18:00',
    field:        String(editEvent.field        || 24),
    type:         editEvent.type                || 'weekly',
    tagline:      editEvent.tagline             || '',
    description:  editEvent.description         || '',
    imgUrl:       editEvent.img                 || '',
    priceWalkup:  String(editEvent.priceWalkup  || 20),
    priceMember:  String(editEvent.priceMember  || 0),
    recurring:    false,
    repeatWeeks:  '8',
  } : {
    courseShort: '', courseName: '', date: today, time: '18:00',
    field: '24', type: 'weekly', tagline: '', description: '',
    imgUrl: '', priceWalkup: '20', priceMember: '0',
    recurring: false, repeatWeeks: '8',
  });

  const [saving, setSaving] = React.useState(false);
  const [err, setErr]       = React.useState('');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function submit() {
    if (!form.courseShort.trim() || !form.courseName.trim() || !form.date || !form.time || !form.field) {
      setErr('Course name, date, time, and field size are required.'); return;
    }
    const wu = Number(form.priceWalkup), mem = Number(form.priceMember);
    if (wu <= mem) { setErr('Walk-up price must be greater than member price.'); return; }
    setSaving(true); setErr('');
    try {
      const baseDate = new Date(`${form.date}T${form.time}:00`);
      if (editEvent) {
        await updateEvent(editEvent.id, { ...form, startsAt: baseDate.toISOString(), priceWalkup: wu, priceMember: mem });
      } else {
        const weeksToCreate = form.recurring ? Math.max(1, Math.min(52, Number(form.repeatWeeks) || 8)) : 1;
        for (let i = 0; i < weeksToCreate; i++) {
          const d = new Date(baseDate.getTime() + i * 7 * 24 * 60 * 60 * 1000);
          await createEvent({ ...form, startsAt: d.toISOString(), priceWalkup: wu, priceMember: mem });
        }
      }
      onCreated();
    } catch (e) {
      setErr(e.message || (editEvent ? 'Could not save changes.' : 'Could not create event.'));
    }
    setSaving(false);
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    background: 'var(--paper)', border: '1px solid rgba(14,28,19,0.12)',
    fontSize: 15, fontFamily: 'inherit', color: 'var(--forest)',
    boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)',
    opacity: 0.55, letterSpacing: '0.1em', textTransform: 'uppercase',
    display: 'block', marginBottom: 6, marginTop: 16,
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(14,28,19,0.5)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxHeight: '92%', overflowY: 'auto',
        background: 'var(--cream)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '18px 20px 36px',
        animation: 'sheet-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}>
        <style>{`@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        <div style={{ width: 36, height: 4, borderRadius: 3, background: 'rgba(14,28,19,0.2)', margin: '0 auto 18px' }}/>

        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Admin</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, margin: '8px 0 4px', lineHeight: 0.95, color: 'var(--forest)', letterSpacing: '-0.02em' }}>
          {editEvent ? 'Edit Event.' : 'New Event.'}
        </h2>

        <label style={labelStyle}>Course short name</label>
        <input style={inputStyle} placeholder="Melreese" value={form.courseShort} onChange={e => set('courseShort', e.target.value)}/>

        <label style={labelStyle}>Course full name</label>
        <input style={inputStyle} placeholder="International Links Melreese" value={form.courseName} onChange={e => set('courseName', e.target.value)}/>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Date</label>
            <input type="date" style={inputStyle} value={form.date} onChange={e => set('date', e.target.value)}/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Tee time</label>
            <input type="time" style={inputStyle} value={form.time} onChange={e => set('time', e.target.value)}/>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Field size</label>
            <input type="number" min="2" style={inputStyle} value={form.field} onChange={e => set('field', e.target.value)}/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Type</label>
            <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="major">Major</option>
              <option value="social">Social</option>
              <option value="member-only">Member-only</option>
            </select>
          </div>
        </div>

        <label style={labelStyle}>Tagline</label>
        <input style={inputStyle} placeholder="Weekly Match Night" value={form.tagline} onChange={e => set('tagline', e.target.value)}/>

        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} placeholder="Short editorial blurb shown on the event detail." value={form.description} onChange={e => set('description', e.target.value)}/>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Walk-up price ($)</label>
            <input type="number" min="0" style={inputStyle} value={form.priceWalkup} onChange={e => set('priceWalkup', e.target.value)}/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Member price ($)</label>
            <input type="number" min="0" style={inputStyle} value={form.priceMember} onChange={e => set('priceMember', e.target.value)}/>
          </div>
        </div>

        <label style={labelStyle}>Hero image URL (optional)</label>
        <input style={inputStyle} placeholder="https://images.unsplash.com/..." value={form.imgUrl} onChange={e => set('imgUrl', e.target.value)}/>

        {!editEvent && (
          <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(14,28,19,0.04)', borderRadius: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.recurring} onChange={e => set('recurring', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--forest)' }}/>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--forest)' }}>Recurring weekly series</span>
            </label>
            {form.recurring && (
              <div style={{ marginTop: 10 }}>
                <label style={labelStyle}>Number of weeks to create</label>
                <input type="number" min="2" max="52" style={inputStyle} value={form.repeatWeeks} onChange={e => set('repeatWeeks', e.target.value)}/>
                <div style={{ fontSize: 11, color: 'var(--forest)', opacity: 0.55, marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  Creates {form.repeatWeeks} events starting {form.date}, spaced 7 days apart.
                </div>
              </div>
            )}
          </div>
        )}

        {err && (
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.1)', padding: '10px 14px', borderRadius: 12 }}>
            {err}
          </div>
        )}

        <Button variant="forest" full size="lg" onClick={submit} disabled={saving} style={{ marginTop: 20 }}>
          {saving ? (editEvent ? 'Saving…' : 'Creating…') : (editEvent ? 'Save changes' : 'Create event')}
          {!saving && <Icon.ArrowRight size={14}/>}
        </Button>
      </div>
    </div>
  );
}

Object.assign(window, { EventsScreen, EventDetailScreen, FullEventCard });
