/* global React, Button, Chip, Eyebrow, Wordmark, Icon, sbx, signOut, useMatchInvitesForMatch, sendInviteByHandle, cancelInvite, formatHandle */
// Post-auth home: Start a match, join a match, or open one of your recent matches.

function MatchHub({ profile, onOpenMatch, onExit, format = 'regular', initialMode, initialJoinCode }) {
  // initialMode lets Challenge Friends drop you straight into Start or Join.
  const [mode, setMode] = React.useState(initialJoinCode ? 'join' : (initialMode || 'home')); // home | start | join | code | handle
  const [recent, setRecent] = React.useState([]);
  const [newMatch, setNewMatch] = React.useState(null);

  // Load recent matches for this user (includes 2v2 slots).
  const loadRecent = React.useCallback(async () => {
    const { data } = await sbx
      .from('matches')
      .select('id, join_code, course_name, status, result, final_margin, created_at, total_holes, match_type, player_a, player_a2, player_b, player_b2')
      .or(`player_a.eq.${profile.id},player_a2.eq.${profile.id},player_b.eq.${profile.id},player_b2.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(10);
    setRecent(data || []);
  }, [profile.id]);

  React.useEffect(() => { loadRecent(); }, [loadRecent]);

  // Coming straight from Challenge Friends (initialMode) → back exits to Play;
  // otherwise back returns to the hub home.
  const backFromSub = initialMode ? onExit : () => setMode('home');
  if (mode === 'start') return <StartMatchView profile={profile} format={format} onCancel={backFromSub} onCreated={(m) => { setNewMatch(m); setMode('code'); }}/>;
  if (mode === 'join')  return <JoinMatchView  profile={profile} initialCode={initialJoinCode} onCancel={backFromSub} onJoined={(id) => onOpenMatch(id)}/>;
  // Backing out of the match-code screen returns you where you came from
  // (Challenge Friends when entered via initialMode) — not the redundant hub.
  if (mode === 'code' && newMatch) return <WaitingForOpponentView match={newMatch} profile={profile} onCancel={() => { setNewMatch(null); loadRecent(); backFromSub(); }} onReady={(id) => onOpenMatch(id)}/>;
  if (mode === 'handle' && window.DisplayNameScreen) {
    const DNS = window.DisplayNameScreen;
    return <DNS profile={profile} onCancel={() => setMode('home')} onDone={() => setMode('home')}/>;
  }

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with back-to-home + handle edit + sign out */}
      <div style={{ padding: '50px 16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {onExit && (
          <button onClick={onExit} title="Back to home" style={{
            width: 38, height: 38, borderRadius: 999,
            background: 'var(--paper)', border: 'var(--hairline)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--forest)',
          }}>
            <Icon.ArrowLeft size={16} color="currentColor"/>
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Challenge a friend
          </div>
          <button onClick={() => setMode('handle')} title="Change display name" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 13, fontWeight: 700,
            color: 'var(--forest)', opacity: 0.75,
            padding: '2px 4px', marginLeft: -4, marginTop: 2,
            borderRadius: 6,
          }}>
            {formatHandle(profile.handle)}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.6 }}>
              <path d="M4 20h4l10-10-4-4L4 16v4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <button onClick={signOut} title="Sign out" style={{
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(14,28,19,0.06)',
          border: '1px solid rgba(14,28,19,0.1)',
          fontSize: 10, fontFamily: 'var(--font-mono)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--forest)', fontWeight: 700,
        }}>
          Sign out
        </button>
      </div>

      <div style={{ padding: '8px 20px 18px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 0.92, letterSpacing: '-0.02em', color: 'var(--forest)' }}>
          Ready to play?
        </div>
        <div className="caption-serif" style={{ fontSize: 16, opacity: 0.65, marginTop: 4, color: 'var(--forest)' }}>
          Start a match or jump back into one.
        </div>
      </div>

      {/* Big primary actions */}
      <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => setMode('start')} style={{
          borderRadius: 'var(--radius-card-lg)',
          background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 45%, var(--moss) 100%)',
          color: 'var(--cream)',
          padding: '28px 24px',
          textAlign: 'left',
          position: 'relative', overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          border: 'none',
        }}>
          <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
          <img src="assets/mascot-full-cream.svg" alt="" style={{ position: 'absolute', right: -20, bottom: -30, width: 140, opacity: 0.16, transform: 'rotate(-8deg)' }}/>
          <div style={{ position: 'relative' }}>
            <Eyebrow color="var(--cream)">1v1 Match Play</Eyebrow>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.92, marginTop: 10, letterSpacing: '-0.02em' }}>
              Start a match
            </div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>
              Create a match and share a 6-character code with your opponent.
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '9px 14px', borderRadius: 999, background: 'var(--cream)', color: 'var(--forest)', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', boxShadow: '0 6px 14px rgba(14,28,19,0.25)' }}>
              New match <Icon.ArrowRight size={14}/>
            </div>
          </div>
        </button>

        <button onClick={() => setMode('join')} className="card" style={{
          padding: '20px 22px', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'var(--forest)',
        }}>
          <div>
            <Eyebrow color="var(--forest)">Joining someone else?</Eyebrow>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.01em', marginTop: 6 }}>
              Enter a match code
            </div>
          </div>
          <Icon.ArrowRight size={18} color="var(--forest)"/>
        </button>
      </div>

      {/* Recent matches */}
      <div style={{ padding: '32px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Your matches
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--forest)', opacity: 0.6, fontSize: 13 }}>
            No matches yet. Start one above.
          </div>
        ) : (
          <div className="card" style={{ padding: '6px 4px' }}>
            {recent.map((m, i) => (
              <button key={m.id} onClick={() => onOpenMatch(m.id)} style={{
                width: '100%', textAlign: 'left',
                padding: '14px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < recent.length - 1 ? '1px solid rgba(14,28,19,0.05)' : 'none',
                color: 'var(--forest)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {m.course_name || 'Unnamed match'}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.6, marginTop: 2, letterSpacing: '0.04em' }}>
                    {m.status.toUpperCase()}{m.final_margin ? ` · ${m.final_margin}` : ''}
                  </div>
                </div>
                <StatusChip match={m} youAreA={m.player_a === profile.id}/>
                <Icon.Chevron size={14} color="var(--forest)"/>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ textAlign: 'center', padding: '32px 16px', opacity: 0.2 }}>
        <Wordmark variant="forest" size={100} style={{ margin: '0 auto' }}/>
      </div>
    </div>
  );
}

function StatusChip({ match, youAreA }) {
  if (match.status === 'waiting') return <Chip variant="cream">Waiting</Chip>;
  if (match.status === 'active')  return <Chip variant="forest">Live</Chip>;
  if (match.status === 'completed') {
    const youWon = (match.result === 'A' && youAreA) || (match.result === 'B' && !youAreA);
    const halved = match.result === 'H';
    return <Chip variant={youWon ? 'forest' : halved ? 'cream' : 'default'}>{youWon ? 'W' : halved ? 'H' : 'L'} {match.final_margin || ''}</Chip>;
  }
  return <Chip>{match.status}</Chip>;
}

// ─── Start Match view ────────────────────────────────────────
function StartMatchView({ profile, format = 'regular', onCancel, onCreated }) {
  const isRegular = format === 'regular';
  // Nothing pre-selected — the form reveals one step at a time as you choose.
  const [course, setCourse] = React.useState(''); // pp: free text
  const [holes, setHoles]   = React.useState(null);
  const [matchType, setMatchType] = React.useState(null);
  const [step, setStep]     = React.useState(0);
  const [busy, setBusy]     = React.useState(false);
  const [err, setErr]       = React.useState('');

  // Regular course: load real scorecards (rc_courses + tees).
  const [rcCourses, setRcCourses] = React.useState([]);
  const [courseId, setCourseId]   = React.useState(null);
  const [teeId, setTeeId]         = React.useState(null);
  const [q, setQ]                 = React.useState(''); // course search

  React.useEffect(() => {
    if (!isRegular) return;
    (async () => {
      const [{ data: cs }, { data: ts }] = await Promise.all([
        sbx.from('rc_courses').select('id, name, city').order('name'),
        sbx.from('rc_tees').select('id, course_id, name, color, par, yards, rating, slope'),
      ]);
      const list = (cs || []).map(c => ({ ...c, tees: (ts || []).filter(t => t.course_id === c.id) }));
      setRcCourses(list);
    })();
  }, [isRegular]);

  const selCourse = rcCourses.find(c => c.id === courseId);
  const selTee    = selCourse && selCourse.tees.find(t => t.id === teeId);

  // ── Step gating ──
  const courseDone = isRegular ? !!courseId : !!course.trim();
  const showTees   = isRegular && !!courseId && selCourse && selCourse.tees.length > 0;

  const filteredCourses = q.trim()
    ? rcCourses.filter(c => `${c.name} ${c.city || ''}`.toLowerCase().includes(q.trim().toLowerCase()))
    : rcCourses;

  async function create() {
    if (busy) return;
    setBusy(true); setErr('');
    const join_code = randomJoinCode();

    if (isRegular) {
      if (!selCourse || !selTee) { setErr('Pick a course and tee.'); setBusy(false); return; }
      const { data: rcHoles } = await sbx.from('rc_holes')
        .select('hole_number, par, yards').eq('tee_id', selTee.id).order('hole_number');
      const picked = (rcHoles || []).filter(h => holes === 18 ? true : h.hole_number <= 9);
      const { data, error } = await sbx.from('matches').insert({
        join_code, course_name: selCourse.name, total_holes: holes,
        match_type: matchType, format: 'regular', player_a: profile.id, status: 'waiting',
      }).select().single();
      if (error) { setErr(error.message); setBusy(false); return; }
      const rows = picked.map((h, i) => ({ match_id: data.id, hole_number: i + 1, par: h.par, distance_yards: h.yards }));
      await sbx.from('match_holes').insert(rows);
      setBusy(false); onCreated(data);
      return;
    }

    // Pitch & putt: free-text course, all par 3.
    const { data, error } = await sbx.from('matches').insert({
      join_code, course_name: course.trim() || null, total_holes: holes,
      match_type: matchType, format: 'pp', player_a: profile.id, status: 'waiting',
    }).select().single();
    if (error) { setErr(error.message); setBusy(false); return; }
    const rows = Array.from({ length: holes }, (_, i) => ({ match_id: data.id, hole_number: i + 1, par: 3 }));
    await sbx.from('match_holes').insert(rows);
    setBusy(false); onCreated(data);
  }

  // Selectable control on the forest gradient: cream when chosen, translucent otherwise.
  const pick = (on) => ({
    background: on ? 'var(--cream)' : 'rgba(255,255,255,0.08)',
    color: on ? 'var(--forest)' : 'var(--cream)',
    border: on ? 'none' : '1px solid rgba(234,226,206,0.18)',
  });

  // ── One question per screen (same format as Create account) ──
  // Tees only appear for a regular course that actually has tee sets.
  const courseField = isRegular ? (
    <div style={{ textAlign: 'left' }}>
      {rcCourses.length > 5 && (
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search courses…" className="on-forest-input" style={{
          width: '100%', padding: '12px 14px', borderRadius: 12, marginBottom: 10,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(234,226,206,0.18)',
          color: 'var(--cream)', fontSize: 15, outline: 'none',
        }}/>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
        {rcCourses.length === 0 && <SppLoader dark size={34} pad={14}/>}
        {rcCourses.length > 0 && filteredCourses.length === 0 && <div style={{ fontSize: 13, opacity: 0.7 }}>No courses match “{q}”.</div>}
        {filteredCourses.map(c => {
          const on = courseId === c.id;
          return (
            <button key={c.id} onClick={() => { setCourseId(c.id); setTeeId(c.tees[0] ? c.tees[0].id : null); }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left',
              padding: '13px 14px', borderRadius: 12, ...pick(on),
            }}>
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 800, lineHeight: 1.1 }}>{c.name}</span>
                {c.city && <span style={{ display: 'block', fontSize: 11, opacity: 0.7, marginTop: 2 }}>{c.city}</span>}
              </span>
              {on && <Icon.ArrowRight size={15} color="var(--forest)"/>}
            </button>
          );
        })}
      </div>
    </div>
  ) : (
    <input value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. Killian Greens" className="on-forest-input" style={{
      width: '100%', padding: '15px 14px', borderRadius: 14, textAlign: 'center',
      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(234,226,206,0.18)',
      color: 'var(--cream)', fontSize: 18, outline: 'none',
    }}/>
  );

  const steps = [
    { key: 'course', eyebrow: 'Where', title: 'Where are you playing?', valid: courseDone, field: courseField },
  ];
  if (showTees) {
    steps.push({ key: 'tees', eyebrow: 'Tees', title: 'Which tees?', valid: !!teeId, field: (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {selCourse.tees.map(t => {
          const on = teeId === t.id;
          return (
            <button key={t.id} onClick={() => setTeeId(t.id)} style={{
              flex: 1, minWidth: 90, padding: '14px 10px', borderRadius: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, ...pick(on),
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 800 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: t.color || '#999', display: 'inline-block' }}/>
                {t.name}
              </span>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.7 }}>{t.yards}y · {t.rating}/{t.slope}</span>
            </button>
          );
        })}
      </div>
    ) });
  }
  steps.push({ key: 'holes', eyebrow: 'Length', title: 'How many holes?', valid: !!holes, field: (
    <div style={{ display: 'flex', gap: 10 }}>
      {[9, 18].map(n => (
        <button key={n} onClick={() => setHoles(n)} style={{
          flex: 1, padding: '18px', borderRadius: 14, fontSize: 16, fontWeight: 800, lineHeight: 1.1, ...pick(holes === n),
        }}>{n}-hole{isRegular && n === 9 ? ' (front)' : ''}</button>
      ))}
    </div>
  ) });
  steps.push({ key: 'format', eyebrow: 'Format', title: '1v1 or 2v2?', valid: !!matchType, field: (
    <div style={{ display: 'flex', gap: 10 }}>
      {[['1v1', '1v1'], ['2v2', '2v2 · Scramble']].map(([v, l]) => (
        <button key={v} onClick={() => setMatchType(v)} style={{
          flex: 1, padding: '18px', borderRadius: 14, fontSize: 15, fontWeight: 800, lineHeight: 1.1, ...pick(matchType === v),
        }}>{l}</button>
      ))}
    </div>
  ) });

  const last = steps.length - 1;
  const safeStep = Math.min(step, last);
  const cur = steps[safeStep];
  // If the Tees step disappears (e.g. course swapped for one with no tees),
  // don't leave the pointer past the end.
  React.useEffect(() => { if (step > last) setStep(last); }, [step, last]);

  // Keyboard-aware lift (matches the sign-up flow): raise the centered content
  // by half the on-screen keyboard height when a field is focused.
  const inset = useMatchKbInset();
  function blur() { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
  function next() {
    if (!cur || !cur.valid || busy) return;
    blur();
    if (safeStep < last) { setErr(''); setStep(safeStep + 1); }
    else create();
  }
  function back() {
    blur();
    if (safeStep === 0) onCancel();
    else { setErr(''); setStep(safeStep - 1); }
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--cream)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <button onClick={back} style={{
        position: 'absolute', top: 52, left: 16, zIndex: 5, width: 38, height: 38, borderRadius: 999,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(234,226,206,0.2)', color: 'var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon.ArrowLeft size={16} color="currentColor"/>
      </button>

      {/* Centered content — lifts up by half the keyboard height when focused */}
      <div style={{
        position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', transform: `translateY(-${inset / 2}px)`, transition: 'transform 0.28s ease',
      }}>
        <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
          {/* Progress */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
            {steps.map((s, i) => (
              <div key={s.key} style={{
                width: i === safeStep ? 22 : 7, height: 7, borderRadius: 99,
                background: i <= safeStep ? 'var(--cream)' : 'rgba(234,226,206,0.28)',
                transition: 'width 0.35s ease, background 0.35s ease',
              }}/>
            ))}
          </div>

          {/* Sliding questions */}
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              display: 'flex', width: `${steps.length * 100}%`,
              transform: `translateX(-${safeStep * (100 / steps.length)}%)`,
              transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              {steps.map((s, i) => (
                <div key={s.key} aria-hidden={i !== safeStep} style={{ width: `${100 / steps.length}%`, flexShrink: 0, padding: '0 4px', opacity: i === safeStep ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: i === safeStep ? 'auto' : 'none' }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 12 }}>{s.eyebrow}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.08, letterSpacing: '-0.02em' }}>{s.title}</div>
                  <div style={{ marginTop: 22 }}>{s.field}</div>
                  <Button variant="paper" size="lg" full disabled={!s.valid || busy} onClick={next} style={{ marginTop: 22 }}>
                    {i < last ? 'Next' : (busy ? 'Creating…' : 'Create match')}
                    {!busy && <Icon.ArrowRight size={16}/>}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {err && <div style={{ marginTop: 16, fontSize: 13, color: '#E7B8A7', background: 'rgba(155,58,46,0.2)', padding: '10px 12px', borderRadius: 12 }}>{err}</div>}
        </div>
      </div>
    </div>
  );
}

// Keyboard inset (visual viewport) — lift centered content above the keyboard.
function useMatchKbInset() {
  const [inset, setInset] = React.useState(0);
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const onResize = () => setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();
    return () => { vv.removeEventListener('resize', onResize); vv.removeEventListener('scroll', onResize); };
  }, []);
  return inset;
}

// ─── Lobby roster (who's on each team) ───────────────────────────────
// Small circular avatar for a slot occupant (cream-on-forest).
function LobbyAvatar({ person, size = 32 }) {
  const initial = ((person && (person.name || person.handle)) || '?').replace(/^@/, '').charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, overflow: 'hidden', flexShrink: 0,
      background: 'rgba(234,226,206,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.44), fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--cream)',
    }}>
      {person && person.avatar
        ? <img src={person.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        : initial}
    </div>
  );
}

// Fetch handle/name/avatar for whoever currently fills the match's slots.
function useSlotPeople(match) {
  const key = [match.player_a, match.player_a2, match.player_b, match.player_b2].filter(Boolean).join(',');
  const [people, setPeople] = React.useState({});
  React.useEffect(() => {
    if (!key) { setPeople({}); return; }
    let alive = true;
    (async () => {
      const { data } = await sbx.from('profiles').select('id, handle, first_name, avatar_url').in('id', key.split(','));
      if (!alive) return;
      const map = {};
      (data || []).forEach(p => { map[p.id] = { id: p.id, handle: p.handle, name: p.first_name, avatar: p.avatar_url }; });
      setPeople(map);
    })();
    return () => { alive = false; };
  }, [key]);
  return people;
}

// Two team panels showing filled seats (avatar + handle) and open spots.
// When `onPick` is supplied and the viewer isn't seated yet, each team with a
// free spot gets a "Join Team X" button.
function LobbyRoster({ match, profile, people, onPick, busySide }) {
  const is2v2 = match.match_type === '2v2';
  const meIn = [match.player_a, match.player_a2, match.player_b, match.player_b2].includes(profile.id);

  const TeamPanel = ({ label, slots, side }) => {
    const hasOpen = slots.some(s => !s);
    return (
      <div style={{ flex: 1, padding: 14, borderRadius: 18, background: 'rgba(234,226,206,0.08)', border: '1px solid rgba(234,226,206,0.16)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.7, fontWeight: 700, marginBottom: 12 }}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {slots.map((sid, i) => {
            const p = sid ? people[sid] : null;
            const isMe = sid && sid === profile.id;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {sid
                  ? <LobbyAvatar person={p} size={32}/>
                  : <div style={{ width: 32, height: 32, borderRadius: 999, border: '1.5px dashed rgba(234,226,206,0.4)', flexShrink: 0 }}/>}
                <div style={{ minWidth: 0 }}>
                  {sid ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(p && p.name) || (p && formatHandle(p.handle)) || 'Player'}{isMe && <span style={{ opacity: 0.6, fontWeight: 600 }}> · you</span>}
                      </div>
                      {p && p.handle && <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'var(--font-mono)' }}>{formatHandle(p.handle)}</div>}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.65 }}>Open spot</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {onPick && !meIn && hasOpen && (
          <button onClick={() => onPick(side)} disabled={!!busySide} style={{
            marginTop: 12, width: '100%', padding: '11px', borderRadius: 12,
            background: 'var(--cream)', color: 'var(--forest)', border: 'none',
            fontWeight: 800, fontSize: 13, opacity: busySide && busySide !== side ? 0.5 : 1,
          }}>{busySide === side ? 'Joining…' : `Join ${label}`}</button>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
      <TeamPanel label="Team A" slots={is2v2 ? [match.player_a, match.player_a2] : [match.player_a]} side="a"/>
      <TeamPanel label="Team B" slots={is2v2 ? [match.player_b, match.player_b2] : [match.player_b]} side="b"/>
    </div>
  );
}

// 2v2 join: choose a side. Live-updates as others claim seats.
function JoinTeamPicker({ match: initial, profile, onClaimed, onBack }) {
  const [match, setMatch] = React.useState(initial);
  const [busySide, setBusySide] = React.useState('');
  const [err, setErr] = React.useState('');
  const people = useSlotPeople(match);

  React.useEffect(() => {
    const ch = sbx.channel(`lobby:${match.id}:${Math.random().toString(36).slice(2, 10)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${match.id}` }, (payload) => {
        if (payload.new) setMatch(payload.new);
      })
      .subscribe();
    const poll = setInterval(async () => {
      const { data } = await sbx.from('matches').select('*').eq('id', match.id).maybeSingle();
      if (data) setMatch(data);
    }, 4000);
    return () => { sbx.removeChannel(ch); clearInterval(poll); };
  }, [match.id]);

  const full = match.player_a && match.player_a2 && match.player_b && match.player_b2;

  async function pick(side) {
    if (busySide) return;
    setBusySide(side); setErr('');
    const { data, error } = await sbx.rpc('join_match_slot', { p_match: match.id, p_side: side });
    if (error) { setErr(error.message); setBusySide(''); return; }
    onClaimed(data);
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--cream)', display: 'flex', flexDirection: 'column', padding: '92px 24px 24px', overflowY: 'auto',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <button onClick={onBack} style={{
        position: 'absolute', top: 52, left: 16, zIndex: 5, width: 38, height: 38, borderRadius: 999,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(234,226,206,0.2)', color: 'var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon.ArrowLeft size={16} color="currentColor"/>
      </button>

      <div style={{ position: 'relative' }}>
        <Eyebrow color="var(--cream)">Pick your team</Eyebrow>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 0.95, marginTop: 10 }}>Which side?</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 10 }}>Tap a team with an open spot — you’ll see everyone as they join.</div>
      </div>

      <div style={{ position: 'relative', marginTop: 24 }}>
        <LobbyRoster match={match} profile={profile} people={people} onPick={pick} busySide={busySide}/>
      </div>

      {full && <div style={{ position: 'relative', marginTop: 16, fontSize: 13, opacity: 0.85 }}>This match is already full.</div>}
      {err && <div style={{ position: 'relative', marginTop: 14, fontSize: 13, color: '#E7B8A7' }}>{err}</div>}
      <div style={{ flex: 1 }}/>
    </div>
  );
}

// ─── Waiting lobby (works for both 1v1 and 2v2) ──────────────
// Subscribes to updates on the match row. Whenever a slot fills we re-render
// to show progress; when the match goes 'active' (all required slots filled)
// we push the user into the live match.
function WaitingForOpponentView({ match: initial, profile, onCancel, onReady }) {
  const [match, setMatch] = React.useState(initial);
  const is2v2 = match.match_type === '2v2';
  const required = is2v2 ? 4 : 2;
  const filled = [match.player_a, match.player_a2, match.player_b, match.player_b2].filter(Boolean).length;
  const people = useSlotPeople(match);

  React.useEffect(() => {
    const ch = sbx.channel(`match:${match.id}:${Math.random().toString(36).slice(2, 10)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${match.id}` }, (payload) => {
        if (payload.new) setMatch(payload.new);
      })
      .subscribe();

    // Poll as a fallback every 4s in case the channel hiccups.
    const poll = setInterval(async () => {
      const { data } = await sbx.from('matches').select('*').eq('id', match.id).maybeSingle();
      if (data) setMatch(data);
    }, 4000);

    return () => { sbx.removeChannel(ch); clearInterval(poll); };
  }, [match.id]);

  React.useEffect(() => {
    if (match.status === 'active') onReady(match.id);
    if (match.status === 'abandoned') onCancel();
  }, [match.status, match.id, onReady, onCancel]);

  async function cancelMatch() {
    if (!window.confirm('Cancel this match? It will disappear from your list.')) return;
    await sbx.from('matches').update({ status: 'abandoned' }).eq('id', match.id);
    onCancel();
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--cream)', display: 'flex', flexDirection: 'column', padding: '92px 24px 24px', overflowY: 'auto',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <button onClick={onCancel} style={{
        position: 'absolute', top: 52, left: 16, zIndex: 5,
        width: 38, height: 38, borderRadius: 999,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(234,226,206,0.2)',
        color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
      }}>
        <Icon.ArrowLeft size={16} color="currentColor"/>
      </button>

      {/* Centered column — same formatting as the setup wizard */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 380, margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 12 }}>Share this code</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1.02 }}>
          {is2v2 ? <>Waiting on<br/>the other three…</> : <>Waiting on<br/>your opponent…</>}
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
          {filled}/{required} PLAYERS IN
        </div>

        {/* Live roster — who's on each side as seats fill */}
        {is2v2 && (
          <div style={{ width: '100%', marginTop: 18 }}>
            <LobbyRoster match={match} profile={profile} people={people}/>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.2em' }}>MATCH CODE</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 56, letterSpacing: '0.04em',
            marginTop: 4, color: 'var(--cream)', whiteSpace: 'nowrap', maxWidth: '100%',
          }}>{match.join_code}</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 12, textAlign: 'center', maxWidth: 280 }}>
            Players tap <b>Joining someone else?</b> under Challenge Friends and type this code. {is2v2 ? 'Each player picks a team as they join.' : ''}
          </div>

          {/* Share via OS share sheet (text/whatsapp/etc); falls back to copy */}
          <ShareCodeButton code={match.join_code} mode={is2v2 ? '2v2' : '1v1'}/>

          {/* Invite by username — pushes a notification to that player */}
          <InviteByHandle matchId={match.id} profile={profile}/>
        </div>

        <Button variant="outlineCream" size="lg" full onClick={cancelMatch}>
          Cancel match
        </Button>
      </div>
    </div>
  );
}

// ─── Invite-by-username panel ────────────────────────────────────────
function InviteByHandle({ matchId, profile }) {
  const [handle, setHandle]   = React.useState('');
  const [busy, setBusy]       = React.useState(false);
  const [err, setErr]         = React.useState('');
  const [okMsg, setOkMsg]     = React.useState('');
  const [invites]             = useMatchInvitesForMatch(matchId);

  async function send() {
    setErr(''); setOkMsg('');
    if (!handle.trim() || busy) return;
    setBusy(true);
    try {
      await sendInviteByHandle({ matchId, invitedBy: profile.id, handle });
      setOkMsg(`Invited ${handle.startsWith('@') ? handle : '@' + handle}.`);
      setHandle('');
      setTimeout(() => setOkMsg(''), 2200);
    } catch (e) {
      setErr(e.message || 'Could not send invite.');
    }
    setBusy(false);
  }

  return (
    <div style={{
      width: '100%', maxWidth: 360, marginTop: 22,
      padding: 14, borderRadius: 18,
      background: 'rgba(234,226,206,0.08)',
      border: '1px solid rgba(234,226,206,0.16)',
    }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.7, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
        Or invite by username
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={handle}
          onChange={e => setHandle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder="@handle"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 999,
            border: '1px solid rgba(234,226,206,0.22)',
            background: 'rgba(234,226,206,0.06)',
            color: 'var(--cream)', fontSize: 14, outline: 'none',
            fontFamily: 'var(--font-body)',
          }}
        />
        <button onClick={send} disabled={busy || !handle.trim()} style={{
          padding: '10px 16px', borderRadius: 999,
          background: 'var(--paper)', color: 'var(--forest)',
          border: 'none', fontWeight: 700, fontSize: 13,
          opacity: busy || !handle.trim() ? 0.5 : 1,
        }}>
          {busy ? '…' : 'Invite'}
        </button>
      </div>
      {err && <div style={{ marginTop: 8, fontSize: 12, color: '#E7B8A7' }}>{err}</div>}
      {okMsg && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--cream)', opacity: 0.85 }}>{okMsg}</div>}

      {invites.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {invites.map(inv => {
            const label = inv.invitee_handle || inv.invitee_first_name || '@unknown';
            const statusColor = inv.status === 'accepted' ? '#B8E0A4'
                              : inv.status === 'declined' ? '#E7B8A7'
                              : 'rgba(234,226,206,0.7)';
            const statusText  = inv.status === 'pending' ? 'pending'
                              : inv.status === 'accepted' ? 'accepted ✓'
                              : inv.status === 'declined' ? 'declined'
                              : 'cancelled';
            return (
              <div key={inv.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 8px', borderRadius: 10,
                background: 'rgba(234,226,206,0.04)',
                fontSize: 12,
              }}>
                <span style={{ fontWeight: 700 }}>{label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: statusColor, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                    {statusText}
                  </span>
                  {inv.status === 'pending' && (
                    <button
                      onClick={() => cancelInvite({ invite: inv })}
                      title="Cancel this invite"
                      style={{
                        background: 'transparent', color: 'rgba(234,226,206,0.55)',
                        border: 'none', padding: 0, fontSize: 14, lineHeight: 1,
                      }}
                    >×</button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Share button: native share sheet → text/WhatsApp/etc., or copy ──
function ShareCodeButton({ code, mode }) {
  const [copied, setCopied] = React.useState(false);
  // Deep-link so the recipient lands directly in the Join flow with
  // the code pre-filled. The URL handler is in App (root) below.
  const url = `${window.location.origin}/?join=${encodeURIComponent(code)}`;
  const text = `Match me at Sandbox Pitch & Putt (${mode}). Code: ${code}`;

  async function onShare() {
    try {
      if (navigator.share) {
        // `url` MUST be its own field — if the link is only inside `text`,
        // AirDrop treats the whole thing as plain text and drops it into Notes
        // instead of opening the link. With `url` set, AirDrop shares a tappable
        // link that opens the app.
        await navigator.share({ title: 'Sandbox Pitch & Putt', text, url });
        return;
      }
    } catch (_) { /* user cancelled — no-op */ }
    // Fallback: copy link + message to clipboard
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (_) {
      window.prompt('Copy this:', `${text}\n${url}`);
    }
  }

  return (
    <button onClick={onShare} style={{
      marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '10px 18px', borderRadius: 999,
      background: 'var(--paper)', color: 'var(--forest)',
      border: 'none', boxShadow: 'var(--shadow-sm)',
      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
      letterSpacing: '0.02em',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>
      </svg>
      {copied ? 'Copied!' : 'Share code'}
    </button>
  );
}

// ─── Join Match view ─────────────────────────────────────────
function JoinMatchView({ profile, onCancel, onJoined, initialCode }) {
  const [code, setCode] = React.useState((initialCode || '').toUpperCase());
  const [busy, setBusy] = React.useState(false);
  const [err, setErr]   = React.useState('');
  const [stage, setStage] = React.useState('code');  // code | pick | waiting
  const [lobbyMatch, setLobbyMatch] = React.useState(null);
  const inset = useMatchKbInset();

  async function submit() {
    const c = code.trim().toUpperCase();
    if (c.length < 4 || busy) return;
    setBusy(true); setErr('');

    const { data: m, error } = await sbx.from('matches').select('*').eq('join_code', c).maybeSingle();
    if (error) { setErr(error.message); setBusy(false); return; }
    if (!m)    { setErr('No match with that code.'); setBusy(false); return; }
    if (m.status === 'completed' || m.status === 'abandoned') { setErr('That match is over.'); setBusy(false); return; }

    // If the current user is already a slot in this match, just reopen it.
    if ([m.player_a, m.player_a2, m.player_b, m.player_b2].includes(profile.id)) {
      setBusy(false); onJoined(m.id); return;
    }

    // 2v2 → let them choose a side. 1v1 → claim the opponent seat and go.
    if (m.match_type === '2v2') {
      setBusy(false); setLobbyMatch(m); setStage('pick'); return;
    }
    const { data, error: rpcErr } = await sbx.rpc('join_match_slot', { p_match: m.id, p_side: 'b' });
    if (rpcErr) { setErr(rpcErr.message); setBusy(false); return; }
    setBusy(false); onJoined(data.id);
  }

  // 2v2: pick a team, then sit in the waiting lobby until the foursome fills.
  if (stage === 'pick' && lobbyMatch) {
    return <JoinTeamPicker
      match={lobbyMatch} profile={profile}
      onBack={() => { setStage('code'); setLobbyMatch(null); }}
      onClaimed={(m2) => {
        const full = m2.player_a && m2.player_a2 && m2.player_b && m2.player_b2;
        if (full || m2.status === 'active') { onJoined(m2.id); }
        else { setLobbyMatch(m2); setStage('waiting'); }
      }}/>;
  }
  if (stage === 'waiting' && lobbyMatch) {
    return <WaitingForOpponentView match={lobbyMatch} profile={profile} onCancel={onCancel} onReady={(id) => onJoined(id)}/>;
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(160deg, var(--forest-dark) 0%, var(--forest) 55%, var(--moss) 100%)',
      color: 'var(--cream)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <button onClick={onCancel} style={{
        position: 'absolute', top: 52, left: 16, zIndex: 5,
        width: 38, height: 38, borderRadius: 999,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(234,226,206,0.2)',
        color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon.ArrowLeft size={16} color="currentColor"/>
      </button>

      {/* Centered — lifts above the keyboard when the field is focused */}
      <div style={{
        position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', transform: `translateY(-${inset / 2}px)`, transition: 'transform 0.28s ease',
      }}>
        <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 12 }}>Join a match</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.08, letterSpacing: '-0.02em' }}>Enter the code.</div>

          <div style={{ marginTop: 22 }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect="off"
              className="on-forest-input"
              style={{
                width: '100%', padding: '22px 14px', borderRadius: 16,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(234,226,206,0.18)',
                color: 'var(--cream)', fontSize: 40,
                textAlign: 'center', letterSpacing: '0.2em',
                fontFamily: 'var(--font-display)',
                outline: 'none', textTransform: 'uppercase',
              }}
            />
          </div>

          {err && <div style={{ marginTop: 16, fontSize: 13, color: '#E7B8A7', background: 'rgba(155,58,46,0.2)', padding: '10px 12px', borderRadius: 12 }}>{err}</div>}

          <Button variant="paper" size="lg" full disabled={code.trim().length < 4 || busy} onClick={submit} style={{ marginTop: 22 }}>
            {busy ? 'Joining…' : 'Join match'}
            {!busy && <Icon.ArrowRight size={16}/>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Utilities ───────────────────────────────────────────────
function randomJoinCode() {
  // Avoids ambiguous characters (0/O, 1/I). 6 chars = 32^6 ≈ 1B combos.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

Object.assign(window, { MatchHub });
