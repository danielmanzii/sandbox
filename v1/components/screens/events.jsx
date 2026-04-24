/* global React, Icon, LiveDot, Button, Eyebrow, Chip, Dashed, Ostrich, MOCK, AvatarBy, useEvent, useIsRegistered, registerForEvent, cancelRegistration */
// Events list + detail + register

function EventsScreen({ go, tier }) {
  const [filter, setFilter] = React.useState('all');
  const filtered = MOCK.EVENTS.filter(e => {
    if (filter === 'all') return e.status !== 'live';
    if (filter === 'weekly') return e.type === 'weekly' && e.status !== 'live';
    if (filter === 'majors') return e.isMajor;
    return true;
  });

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 120 }}>
      <div style={{ padding: '58px 20px 20px', background: 'var(--canvas)', color: 'var(--forest)' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase' }}>The Schedule</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, marginTop: 8, letterSpacing: '-0.02em' }}>
          Play.
        </div>
        <div className="caption-serif" style={{ fontSize: 16, opacity: 0.65, marginTop: 6 }}>
          9 holes. 1 hour. Miami.
        </div>
      </div>

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
        {filtered.map(e => <FullEventCard key={e.id} event={e} go={go} tier={tier}/>)}
      </div>
    </div>
  );
}

function FullEventCard({ event, go, tier }) {
  const isMember = tier === 'league' || tier === 'leaguePlus';
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
          {event.isMajor && (
            <div style={{
              padding: '4px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.22)',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>⛳ Major</div>
          )}
          {event.status === 'member-only' && (
            <div style={{
              padding: '4px 10px', borderRadius: 999,
              background: 'rgba(14,28,19,0.7)', backdropFilter: 'blur(10px)',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}><Icon.Lock size={10} color="currentColor"/> Member</div>
          )}
          {!event.isMajor && event.status === 'open' && (
            <div style={{
              padding: '4px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.22)',
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
  const [event, eventLoading] = useEvent(eventId);
  const isRegistered = useIsRegistered(eventId, profile && profile.id);

  const isMember = tier === 'league' || tier === 'leaguePlus';
  const [registering, setRegistering] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [partner, setPartner] = React.useState('@jaybird');
  const [guest, setGuest] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [actionErr, setActionErr] = React.useState('');

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
    <div style={{ background: 'var(--canvas)', minHeight: '100%', paddingBottom: 140 }}>
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
                background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.22)',
                fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
              }}>⛳ Major</div>
            )}
            <div style={{
              padding: '5px 10px', borderRadius: 999,
              background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.22)',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>{event.tagline}</div>
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
              sub={isMember ? `via your ${tier === 'leaguePlus' ? 'Plus' : 'League'} plan` : 'League members'}
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

      {/* Sticky CTA — switches to "Cancel registration" if user is in */}
      <div style={{
        position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 20,
      }}>
        {actionErr && (
          <div style={{ background: 'rgba(155,58,46,0.12)', color: 'var(--loss)', fontSize: 12, padding: '8px 12px', borderRadius: 10, marginBottom: 8, textAlign: 'center' }}>
            {actionErr}
          </div>
        )}
        {isRegistered === null ? (
          <Button variant="forest" size="lg" full disabled>Loading…</Button>
        ) : isRegistered ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="forest" size="lg" full disabled style={{ opacity: 0.85 }}>
              ✓ You're in
            </Button>
            <Button variant="outline" size="lg" onClick={onCancel} disabled={cancelling}>
              {cancelling ? '…' : 'Cancel'}
            </Button>
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
  return (
    <div>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Step 2 of 3</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: '10px 0 6px', lineHeight: 0.95, color: 'var(--forest)', letterSpacing: '-0.02em' }}>
        Who's your ride-or-die?
      </h2>
      <p className="caption-serif" style={{ fontSize: 15, opacity: 0.7, marginTop: 0, color: 'var(--ink)' }}>
        Scramble partner. Pick from the roster or use a guest pass.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
        {MOCK.FRIENDS.slice(0, 4).map(f => (
          <button key={f.id} onClick={() => { setPartner(f.handle); setGuest(false); }} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 10, borderRadius: 14,
            background: partner === f.handle && !guest ? 'var(--forest)' : 'var(--paper)',
            color: partner === f.handle && !guest ? 'var(--cream)' : 'var(--ink)',
            border: '1px solid rgba(14,28,19,0.08)',
            width: '100%', textAlign: 'left',
          }}>
            <AvatarBy handle={f.handle} size={36}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{f.handle}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{f.name} · SBX {f.sbx?.toFixed(3) ?? '—'}</div>
            </div>
            {partner === f.handle && !guest && <Icon.Chevron dir="right" size={14} color="var(--cream)"/>}
          </button>
        ))}
        <button onClick={() => { setGuest(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 10, borderRadius: 14,
          background: guest ? 'var(--clay)' : 'transparent',
          color: guest ? 'var(--forest-deep)' : 'var(--forest)',
          border: '1px dashed rgba(14,28,19,0.2)',
          width: '100%', textAlign: 'left',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, border: '1.5px dashed currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.Plus size={16}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Use a guest pass</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>2 left this month · they tee free</div>
          </div>
        </button>
      </div>

      <Button variant="forest" full size="lg" onClick={onNext} style={{ marginTop: 22 }}>
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
        <Button variant="outline" full onClick={onClose}>Add to calendar</Button>
        <Button variant="forest" full onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}

Object.assign(window, { EventsScreen, EventDetailScreen, FullEventCard });
