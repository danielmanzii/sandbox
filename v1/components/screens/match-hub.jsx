/* global React, Button, Chip, Eyebrow, Wordmark, Icon, sbx, signOut */
// Post-auth home: Start a match, join a match, or open one of your recent matches.

function MatchHub({ profile, onOpenMatch, onExit, mode: matchType = '1v1', initialJoinCode }) {
  // If we received a deep-link ?join=CODE, jump straight to the join
  // view with the code pre-filled.
  const [mode, setMode] = React.useState(initialJoinCode ? 'join' : 'home'); // home | start | join | code | handle
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

  if (mode === 'start') return <StartMatchView profile={profile} matchType={matchType} onCancel={() => setMode('home')} onCreated={(m) => { setNewMatch(m); setMode('code'); }}/>;
  if (mode === 'join')  return <JoinMatchView  profile={profile} initialCode={initialJoinCode} onCancel={() => setMode('home')} onJoined={(id) => onOpenMatch(id)}/>;
  if (mode === 'code' && newMatch) return <WaitingForOpponentView match={newMatch} profile={profile} onCancel={() => { setNewMatch(null); setMode('home'); loadRecent(); }} onReady={(id) => onOpenMatch(id)}/>;
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
            Challenge · {matchType}
          </div>
          <button onClick={() => setMode('handle')} title="Change display name" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 13, fontWeight: 700,
            color: 'var(--forest)', opacity: 0.75,
            padding: '2px 4px', marginLeft: -4, marginTop: 2,
            borderRadius: 6,
          }}>
            {profile.handle}
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
function StartMatchView({ profile, matchType = '1v1', onCancel, onCreated }) {
  const [course, setCourse] = React.useState('Melreese');
  const [holes, setHoles]   = React.useState(9);
  const [busy, setBusy]     = React.useState(false);
  const [err, setErr]       = React.useState('');

  async function create() {
    if (busy) return;
    setBusy(true); setErr('');
    const join_code = randomJoinCode();
    const { data, error } = await sbx.from('matches').insert({
      join_code,
      course_name: course.trim() || null,
      total_holes: holes,
      match_type: matchType,
      player_a: profile.id,
      status: 'waiting',
    }).select().single();
    if (error) { setErr(error.message); setBusy(false); return; }

    // Seed empty hole rows so both players render a consistent list.
    const rows = Array.from({ length: holes }, (_, i) => ({
      match_id: data.id, hole_number: i + 1, par: 3,
    }));
    await sbx.from('match_holes').insert(rows);

    setBusy(false);
    onCreated(data);
  }

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '60px 24px 24px' }}>
      <button onClick={onCancel} style={{
        position: 'absolute', top: 20, left: 20,
        width: 38, height: 38, borderRadius: 999,
        background: 'var(--paper)', border: 'var(--hairline)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--forest)',
      }}>
        <Icon.ArrowLeft size={16} color="currentColor"/>
      </button>

      <Eyebrow color="var(--forest)">New {matchType} match</Eyebrow>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.95, marginTop: 10, letterSpacing: '-0.02em', color: 'var(--forest)' }}>
        Set it up.
      </div>
      {matchType === '2v2' && (
        <div className="caption-serif" style={{ fontSize: 15, color: 'var(--forest)', opacity: 0.7, marginTop: 10, lineHeight: 1.4 }}>
          Share the code with your partner first, then with your opponents. Match starts when 4 players are in.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, opacity: 0.65, marginBottom: 6, color: 'var(--forest)' }}>Course</div>
          <input value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. Melreese" style={{
            width: '100%', padding: '13px 14px', borderRadius: 12,
            background: 'var(--paper)', border: 'var(--hairline-strong)',
            color: 'var(--ink)', fontSize: 15, outline: 'none',
          }}/>
        </label>

        <label style={{ display: 'block' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, opacity: 0.65, marginBottom: 6, color: 'var(--forest)' }}>Holes</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[9, 18].map(n => (
              <button key={n} onClick={() => setHoles(n)} style={{
                flex: 1, padding: '14px', borderRadius: 12,
                background: holes === n ? 'var(--forest)' : 'var(--paper)',
                color: holes === n ? 'var(--cream)' : 'var(--forest)',
                border: holes === n ? 'none' : 'var(--hairline-strong)',
                fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
              }}>{n} HOLES</button>
            ))}
          </div>
        </label>
      </div>

      {err && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 12px', borderRadius: 12 }}>{err}</div>}

      <div style={{ flex: 1 }}/>

      <Button variant="forest" size="lg" full disabled={busy} onClick={create}>
        {busy ? 'Creating…' : 'Create match'}
        {!busy && <Icon.ArrowRight size={16}/>}
      </Button>
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

  React.useEffect(() => {
    const ch = sbx.channel(`match:${match.id}`)
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
      color: 'var(--cream)', display: 'flex', flexDirection: 'column', padding: '60px 24px 24px',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <button onClick={onCancel} style={{
        position: 'absolute', top: 20, left: 20,
        width: 38, height: 38, borderRadius: 999,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(234,226,206,0.2)',
        color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
      }}>
        <Icon.ArrowLeft size={16} color="currentColor"/>
      </button>

      <div style={{ position: 'relative', marginTop: 24 }}>
        <Eyebrow color="var(--cream)">Share this code</Eyebrow>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 0.95, marginTop: 10 }}>
          {is2v2 ? <>Waiting on<br/>the other three…</> : <>Waiting on<br/>your opponent…</>}
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
          {filled}/{required} PLAYERS IN
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.2em' }}>MATCH CODE</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 88, letterSpacing: '0.08em',
          marginTop: 4, color: 'var(--cream)',
        }}>{match.join_code}</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 12, textAlign: 'center', maxWidth: 280 }}>
          Players tap <b>Join match</b> on the Unranked tab and type this code. {is2v2 ? 'First to join becomes your partner; the next two are the opposing team.' : ''}
        </div>

        {/* Share via OS share sheet (text/whatsapp/etc); falls back to copy */}
        <ShareCodeButton code={match.join_code} mode={is2v2 ? '2v2' : '1v1'}/>
      </div>

      <Button variant="outlineCream" size="lg" full onClick={cancelMatch}>
        Cancel match
      </Button>
    </div>
  );
}

// ─── Share button: native share sheet → text/WhatsApp/etc., or copy ──
function ShareCodeButton({ code, mode }) {
  const [copied, setCopied] = React.useState(false);
  // Deep-link so the recipient lands directly in the Join flow with
  // the code pre-filled. The URL handler is in App (root) below.
  const url = `${window.location.origin}/?join=${encodeURIComponent(code)}`;
  const text = `Match me at Sandbox Pitch & Putt (${mode}). Code: ${code}\n${url}`;

  async function onShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Sandbox Pitch & Putt', text });
        return;
      }
    } catch (_) { /* user cancelled — no-op */ }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (_) {
      // Last-resort fallback: prompt
      window.prompt('Copy this:', text);
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
      onJoined(m.id);
      return;
    }

    // Figure out which slot the joiner fills, based on match_type.
    const is2v2 = m.match_type === '2v2';
    let update = null;
    if (is2v2) {
      if (!m.player_a2)      update = { player_a2: profile.id };
      else if (!m.player_b)  update = { player_b:  profile.id };
      else if (!m.player_b2) update = { player_b2: profile.id, status: 'active', started_at: new Date().toISOString() };
      else { setErr('That match already has four players.'); setBusy(false); return; }
    } else {
      if (!m.player_b) update = { player_b: profile.id, status: 'active', started_at: new Date().toISOString() };
      else { setErr('That match already has two players.'); setBusy(false); return; }
    }

    const { error: updErr } = await sbx.from('matches').update(update).eq('id', m.id);
    if (updErr) { setErr(updErr.message); setBusy(false); return; }

    setBusy(false);
    onJoined(m.id);
  }

  return (
    <div style={{ background: 'var(--canvas)', minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '60px 24px 24px' }}>
      <button onClick={onCancel} style={{
        position: 'absolute', top: 20, left: 20,
        width: 38, height: 38, borderRadius: 999,
        background: 'var(--paper)', border: 'var(--hairline)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--forest)',
      }}>
        <Icon.ArrowLeft size={16} color="currentColor"/>
      </button>

      <Eyebrow color="var(--forest)">Join a match</Eyebrow>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 0.95, marginTop: 10, letterSpacing: '-0.02em', color: 'var(--forest)' }}>
        Enter the code.
      </div>

      <div style={{ marginTop: 32 }}>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={8}
          autoCapitalize="characters"
          autoCorrect="off"
          style={{
            width: '100%', padding: '24px 14px', borderRadius: 16,
            background: 'var(--paper)', border: 'var(--hairline-strong)',
            color: 'var(--forest)', fontSize: 40,
            textAlign: 'center', letterSpacing: '0.2em',
            fontFamily: 'var(--font-display)',
            outline: 'none', textTransform: 'uppercase',
          }}
        />
      </div>

      {err && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--loss)', background: 'rgba(155,58,46,0.08)', padding: '10px 12px', borderRadius: 12 }}>{err}</div>}

      <div style={{ flex: 1 }}/>

      <Button variant="forest" size="lg" full disabled={code.trim().length < 4 || busy} onClick={submit}>
        {busy ? 'Joining…' : 'Join match'}
        {!busy && <Icon.ArrowRight size={16}/>}
      </Button>
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
