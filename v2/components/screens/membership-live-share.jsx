/* global React, MOCK, Icon, Wordmark, Button, Chip, Eyebrow, Dashed, LiveDot, Divider, AvatarBy */

// ─── Membership tiers ─────────────────────────────────
function MembershipScreen({ go, tier }) {
  const tiers = [
    { id: 'walkup', name: 'Walk-up', price: 'Free', tag: 'No card needed',
      perks: ['Book any open event', 'Mats + balls included', 'Order from the bar'],
      missing: ['Sandbox Rating™', 'Match history', 'Member-only events'] },
    { id: 'stats', name: 'Stats', price: '$0 / mo', tag: 'Open beta',
      perks: ['Sandbox Rating™', 'Full match history', 'Shareable result cards'],
      missing: ['Season league', 'Member pricing', 'Guest passes'] },
    { id: 'league', name: 'Sandbox League', price: '$89 / mo', tag: 'Most popular', highlight: true,
      perks: ['Weekly league slot', '$10 off all events', '2 guest passes / mo', 'Partner pairings', 'Members lounge'],
      missing: ['Plus perks'] },
    { id: 'plus', name: 'Sandbox Plus', price: '$189 / mo', tag: 'Inner circle',
      perks: ['Everything in League', 'Unlimited guest passes', 'Free coaching monthly', 'Priority event booking', 'Season championship'],
      missing: [] },
  ];

  return (
    <div style={{
      background: `linear-gradient(180deg, var(--forest-dark) 0%, var(--forest) 60%, var(--forest-deep) 100%)`,
      minHeight: '100%', color: 'var(--cream)', paddingBottom: 100, position: 'relative',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ padding: '58px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <button onClick={() => go({ screen: 'profile' })} style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'rgba(234,226,206,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--cream)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(234,226,206,0.22)',
        }}>
          <Icon.Close size={14}/>
        </button>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Membership</div>
        <div style={{ width: 40 }}/>
      </div>

      <div style={{ padding: '22px 24px 24px', position: 'relative' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.88, letterSpacing: '-0.03em' }}>
          Join the<br/>Sandbox.
        </div>
        <div className="caption-serif" style={{ fontSize: 17, opacity: 0.75, marginTop: 14, maxWidth: 320 }}>
          Anyone can play walk-up. Members get ratings, a weekly league slot, and everybody knows their @handle.
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
        {tiers.map(t => (
          <div key={t.id} style={{
            background: t.highlight ? 'var(--cream)' : 'rgba(234,226,206,0.06)',
            color: t.highlight ? 'var(--ink)' : 'var(--cream)',
            borderRadius: 'var(--radius-card-lg)', padding: 22,
            border: t.highlight ? 'none' : '1px solid rgba(234,226,206,0.14)',
            position: 'relative',
            boxShadow: t.highlight ? 'var(--shadow-hero)' : 'none',
            backdropFilter: t.highlight ? 'none' : 'blur(8px)',
            WebkitBackdropFilter: t.highlight ? 'none' : 'blur(8px)',
          }}>
            {t.highlight && (
              <div style={{
                position: 'absolute', top: -12, left: 22,
                background: 'var(--forest)', color: 'var(--cream)',
                padding: '5px 12px', borderRadius: 999,
                fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
                boxShadow: 'var(--shadow-sm)',
              }}>
                {t.tag}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 0.95, letterSpacing: '-0.01em', color: t.highlight ? 'var(--forest)' : 'var(--cream)' }}>{t.name}</div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, marginTop: 6, letterSpacing: '0.04em' }}>{t.tag}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="display-num" style={{ fontSize: 28, color: t.highlight ? 'var(--forest)' : 'var(--cream)' }}>
                  {t.price}
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: t.highlight ? 'rgba(14,28,19,0.1)' : 'rgba(234,226,206,0.14)', margin: '16px 0' }}/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {t.perks.map(p => (
                <div key={p} style={{ display: 'flex', gap: 10, fontSize: 13, alignItems: 'center' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 999,
                    background: t.highlight ? 'var(--forest)' : 'rgba(234,226,206,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon.Check size={11} color={t.highlight ? 'var(--cream)' : 'var(--cream)'}/>
                  </span>
                  <span>{p}</span>
                </div>
              ))}
              {t.missing.map(p => (
                <div key={p} style={{ display: 'flex', gap: 10, fontSize: 13, opacity: 0.35, alignItems: 'center' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 999,
                    background: 'transparent', border: '1px solid currentColor',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon.Close size={9} color="currentColor"/>
                  </span>
                  <span style={{ textDecoration: 'line-through' }}>{p}</span>
                </div>
              ))}
            </div>
            <Button
              variant={t.highlight ? 'forest' : 'outlineCream'}
              size="md" full style={{ marginTop: 18 }}
              onClick={() => go({ screen: 'profile' })}
              disabled={tier === t.id}
            >
              {tier === t.id ? 'Current plan' : t.id === 'walkup' ? 'Stay walk-up' : `Choose ${t.name}`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Live / Hole-by-hole screen (V2) ────────────────────────────────
// Per-hole full-screen layout inspired by the Pinterest reference.
// Swipe horizontally between holes 1–9; tap a stroke pill (1/2/3/4)
// to log YOUR team's strokes on this hole. Opponent score + putts +
// proximity get captured via the bottom sheet (shot-by-shot mode).
// Floating FAB opens the full scorecard overlay (all 9 holes).
function LiveScorecardScreen({ go }) {
  const card = MOCK.YOUR_CARD;
  const holes = card.holes;

  const firstUnplayed = React.useMemo(() => {
    const i = holes.findIndex(h => !h.result);
    return i === -1 ? holes.length - 1 : i;
  }, [holes]);

  const [holeIdx, setHoleIdx] = React.useState(firstUnplayed);
  const [showOverlay, setShowOverlay] = React.useState(false);
  const [showLogSheet, setShowLogSheet] = React.useState(false);
  // Transient per-hole stroke selection (pre-commit)
  const [strokes, setStrokes] = React.useState(null);

  const hole = holes[holeIdx];

  // Live-computed match state across all played holes
  const played = holes.filter(h => h.result);
  const state = played.reduce((s, h) => s + (h.result === 'W' ? 1 : h.result === 'L' ? -1 : 0), 0);
  const thru = played.length;
  const remaining = holes.length - thru;
  const matchLabel = state > 0 ? `${state} UP` : state < 0 ? `${-state} DN` : 'AS';

  // Demo wind/tip — admin-editable + weather-API-sourced in production
  const windByHole = {
    1: { mph: '4-6',  dir: 'ENE' },
    2: { mph: '6-8',  dir: 'E'   },
    3: { mph: '5-7',  dir: 'SE'  },
    4: { mph: '8-10', dir: 'SE'  },
    5: { mph: '5-8',  dir: 'SE'  },
    6: { mph: '3-5',  dir: 'S'   },
    7: { mph: '4-7',  dir: 'SSW' },
    8: { mph: '6-9',  dir: 'SW'  },
    9: { mph: '5-7',  dir: 'W'   },
  };
  const tipsByHole = {
    1: 'Easy opener — aim center green, two-putt for a comfy halve.',
    2: 'Pin tucked front-left. Short is fine; long leaves a slippery downhiller.',
    3: 'Wind usually helps — club down and let the ball breathe.',
    4: 'Longest hole on the loop. A clean strike from mat 3 holds the green.',
    5: 'Slight dog-leg uphill, tough hole. Favor the left side of the fairway.',
    6: 'Short and stock — the pin is the whole strategy here.',
    7: 'False front eats short shots. One extra club minimum.',
    8: 'Easiest birdie of the day. Commit to the line, swing through.',
    9: 'Breeze picks up into the ninth green. Start it at the right edge.',
  };
  const wind = windByHole[hole.hole] || { mph: '5-7', dir: 'SE' };
  const tip = tipsByHole[hole.hole] || 'Trust the yardage. Make an athletic swing.';

  // Stroke commit: open the sheet to finalize opponent score / shot stats
  const onPickStrokes = (n) => {
    setStrokes(n);
    setShowLogSheet(true);
  };

  return (
    <div style={{
      background: 'var(--canvas)', minHeight: '100%', color: 'var(--ink)',
      paddingBottom: 140, position: 'relative', overflow: 'hidden',
    }}>
      {/* Soft top-right wash to echo the home screen's airy feel */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, right: 0, width: '85%', height: '44%',
        background: 'radial-gradient(ellipse at 80% 10%, rgba(28,73,42,0.07), transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* Top bar */}
      <div style={{
        position: 'relative',
        padding: '58px 22px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => go({ screen: 'home' })}
          style={{
            width: 44, height: 44, borderRadius: 999,
            background: 'var(--paper)',
            border: 'var(--hairline)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--forest)',
          }}
          aria-label="Back"
        >
          <Icon.ArrowLeft size={16}/>
        </button>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 26,
          color: 'var(--forest)', letterSpacing: '-0.02em',
        }}>
          Hole {hole.hole}
        </div>
        <button style={{
          width: 44, height: 44, borderRadius: 999,
          background: 'var(--paper)',
          border: 'var(--hairline)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--forest)',
        }} aria-label="More">
          <svg width="4" height="18" viewBox="0 0 4 18" fill="currentColor">
            <circle cx="2" cy="2"  r="2"/>
            <circle cx="2" cy="9"  r="2"/>
            <circle cx="2" cy="16" r="2"/>
          </svg>
        </button>
      </div>

      {/* Stroke input pills (repurposed par selector) */}
      <div style={{ padding: '16px 22px 0', position: 'relative' }}>
        <div style={{
          fontSize: 11, fontFamily: 'var(--font-mono)',
          color: 'var(--forest)', opacity: 0.55,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          Strokes {hole.you != null && <span style={{ opacity: 0.8 }}>· logged {hole.you}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 999,
            background: hole.you != null ? 'var(--forest)' : 'transparent',
            border: hole.you != null ? 'none' : '1.5px solid rgba(14,28,19,0.12)',
            color: hole.you != null ? 'var(--cream)' : 'rgba(14,28,19,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7.5l3.2 3L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {[1, 2, 3, 4].map(n => {
            const isSelected = (hole.you ?? strokes) === n;
            return (
              <button
                key={n}
                onClick={() => onPickStrokes(n)}
                style={{
                  flex: 1, height: 38, borderRadius: 999,
                  background: isSelected ? 'var(--forest)' : 'var(--paper)',
                  color: isSelected ? 'var(--cream)' : 'var(--forest)',
                  border: isSelected ? 'none' : 'var(--hairline)',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                  fontFamily: 'var(--font-display)', fontSize: 16,
                  letterSpacing: '-0.01em',
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics + hole map — the main two-column block */}
      <div style={{
        position: 'relative',
        padding: '20px 22px 0',
        display: 'grid',
        gridTemplateColumns: '112px 1fr',
        gap: 12,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Yardage — dark card */}
          <div style={{
            background: '#0E1C13', color: 'var(--paper)',
            borderRadius: 20, padding: '14px 14px 16px',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginBottom: 4 }}>
              <path d="M3 12V3l7 3.5L3 10" stroke="var(--forest)" strokeWidth="1.6" strokeLinejoin="round" fill="var(--forest)" fillOpacity="0.35"/>
            </svg>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 0.9,
              letterSpacing: '-0.03em',
            }}>{hole.distance}<span style={{ fontSize: 16, opacity: 0.7 }}>y</span></div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.6, marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Remain
            </div>
          </div>

          {/* Wind — light card */}
          <div style={{
            background: 'var(--paper)', color: 'var(--ink)',
            borderRadius: 20, padding: '14px 14px 16px',
            border: 'var(--hairline)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <svg width="16" height="14" viewBox="0 0 18 14" fill="none" style={{ marginBottom: 6, color: 'var(--forest)' }}>
              <path d="M2 4h11a2 2 0 1 0-2-2M2 10h7a2 2 0 1 1-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M2 7h15a2.5 2.5 0 1 0-2.5-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1,
              letterSpacing: '-0.02em', color: 'var(--forest)',
            }}>{wind.mph}</div>
            <div style={{
              fontSize: 10, fontFamily: 'var(--font-mono)',
              opacity: 0.6, marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              MPH · {wind.dir}
            </div>
          </div>
        </div>

        {/* Hole map */}
        <HoleMap hole={hole}/>
      </div>

      {/* Tip card */}
      <div style={{ padding: '18px 22px 0', position: 'relative' }}>
        <div style={{
          display: 'flex', gap: 12,
          background: 'var(--paper)', border: 'var(--hairline)',
          borderRadius: 20, padding: '14px 16px',
          boxShadow: 'var(--shadow-sm)',
          alignItems: 'stretch',
        }}>
          <div style={{ width: 3, background: 'var(--forest)', borderRadius: 999, flexShrink: 0 }}/>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 15,
              color: 'var(--forest)', letterSpacing: '-0.01em',
            }}>Tip</div>
            <div className="caption-serif" style={{
              fontSize: 13.5, color: 'var(--ink)', opacity: 0.75,
              marginTop: 2, lineHeight: 1.45,
            }}>
              {tip}
            </div>
          </div>
        </div>
      </div>

      {/* Previous / Next hole navigation */}
      <div style={{
        padding: '14px 22px 0', position: 'relative',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button
          disabled={holeIdx === 0}
          onClick={() => setHoleIdx(i => Math.max(0, i - 1))}
          style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: 'var(--forest)', opacity: holeIdx === 0 ? 0.3 : 0.7,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          <Icon.ArrowLeft size={12}/> Prev
        </button>
        <div style={{ display: 'flex', gap: 5 }}>
          {holes.map((_, i) => (
            <button
              key={i}
              onClick={() => setHoleIdx(i)}
              style={{
                width: i === holeIdx ? 20 : 6,
                height: 6, borderRadius: 999,
                background: i === holeIdx ? 'var(--forest)' : 'rgba(14,28,19,0.14)',
                transition: 'width 0.2s, background 0.2s',
                border: 'none',
              }}
              aria-label={`Hole ${i + 1}`}
            />
          ))}
        </div>
        <button
          disabled={holeIdx === holes.length - 1}
          onClick={() => setHoleIdx(i => Math.min(holes.length - 1, i + 1))}
          style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: 'var(--forest)', opacity: holeIdx === holes.length - 1 ? 0.3 : 0.7,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          Next <Icon.ArrowRight size={12}/>
        </button>
      </div>

      {/* Bottom identity card — match-play data */}
      <div style={{ padding: '22px 22px 0', position: 'relative' }}>
        <div style={{
          background: '#0E1C13', color: 'var(--paper)',
          borderRadius: 22, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: 'var(--shadow-md)',
        }}>
          {/* Avatar with founder star */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 999,
              background: 'var(--forest)', color: 'var(--cream)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 19,
              border: '2px solid var(--paper)',
            }}>
              {(MOCK.USER.name || 'A')[0]}
            </div>
            {MOCK.USER.foundingMember && (
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 18, height: 18, borderRadius: 999,
                background: 'var(--cream)', color: 'var(--forest)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 900, border: '2px solid #0E1C13',
              }}>★</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '-0.01em' }}>
              {MOCK.USER.handle}
            </div>
            <div style={{
              fontSize: 10, fontFamily: 'var(--font-mono)',
              opacity: 0.55, marginTop: 3, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              vs {card.opponent} · thru {thru}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22,
              lineHeight: 1, letterSpacing: '-0.02em',
              color: state > 0 ? 'var(--cream)' : state < 0 ? '#E7B8A7' : 'var(--cream)',
            }}>{matchLabel}</div>
            <div style={{
              fontSize: 9, fontFamily: 'var(--font-mono)',
              opacity: 0.55, marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>Match</div>
          </div>
          <div style={{ width: 1, background: 'rgba(234,226,206,0.14)', alignSelf: 'stretch' }}/>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22,
              lineHeight: 1, letterSpacing: '-0.02em',
            }}>{MOCK.USER.sbx.toFixed(3)}</div>
            <div style={{
              fontSize: 9, fontFamily: 'var(--font-mono)',
              opacity: 0.55, marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>SBX</div>
          </div>
        </div>
      </div>

      {/* Floating FAB — open full scorecard overlay */}
      <button
        onClick={() => setShowOverlay(true)}
        aria-label="Full scorecard"
        style={{
          position: 'absolute', bottom: 110, right: 22, zIndex: 30,
          width: 52, height: 52, borderRadius: 999,
          background: '#0E1C13', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 14px 28px rgba(14,28,19,0.32), 0 4px 10px rgba(14,28,19,0.18)',
          border: 'none',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {showOverlay && (
        <FullScorecardOverlay
          holes={holes}
          activeHole={hole.hole}
          onJump={(i) => { setHoleIdx(i); setShowOverlay(false); }}
          onClose={() => setShowOverlay(false)}
        />
      )}
      {showLogSheet && (
        <HoleResultSheet
          hole={hole.hole}
          onClose={() => { setShowLogSheet(false); setStrokes(null); }}
          onDone={() => { setShowLogSheet(false); setStrokes(null); setHoleIdx(i => Math.min(holes.length - 1, i + 1)); }}
        />
      )}
    </div>
  );
}

// ─── Hole map — stylized satellite placeholder ──────────────────────
// Uses an Unsplash aerial placeholder as the base image and layers
// the flight arc, yardage markers, and the SPP monogram "ball" on top.
// Real data will come from admin-uploaded satellite screenshots keyed
// to each hole, with tee mats + pin positions pinned in an admin tool.
function HoleMap({ hole }) {
  const bgUrl = 'https://images.unsplash.com/photo-1587174486073-ae5e5cec4cdf?w=600&q=80&auto=format&fit=crop';

  return (
    <div style={{
      position: 'relative',
      minHeight: 320,
      borderRadius: 24, overflow: 'hidden',
      background: `linear-gradient(180deg, rgba(14,28,19,0.08), rgba(14,28,19,0.25)), url('${bgUrl}')`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      boxShadow: 'var(--shadow-md)',
    }}>
      {/* SVG overlay: flight arc + yardage pills + ball radar */}
      <svg viewBox="0 0 200 320" preserveAspectRatio="none" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
      }}>
        <defs>
          <filter id="softblur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8"/>
          </filter>
        </defs>
        {/* Flight arc — forest green with low-opacity haze */}
        <path
          d="M 150 270 Q 90 210 70 80"
          fill="none"
          stroke="var(--forest)"
          strokeWidth="1.6"
          strokeDasharray="1 4"
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* Pin marker at top */}
        <circle cx="70" cy="80" r="4" fill="var(--forest)"/>
        <circle cx="70" cy="80" r="10" fill="var(--forest)" opacity="0.18"/>
      </svg>

      {/* Distance pills (HTML for crisp text) */}
      <div style={{
        position: 'absolute', top: '26%', left: '38%',
        padding: '4px 10px', borderRadius: 999,
        background: 'rgba(14,28,19,0.78)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        color: 'var(--paper)',
        fontSize: 10, fontFamily: 'var(--font-mono)',
        fontWeight: 700, letterSpacing: '0.04em',
      }}>
        {hole.distance}y
      </div>
      <div style={{
        position: 'absolute', bottom: '14%', right: '12%',
        padding: '3px 9px', borderRadius: 999,
        background: 'rgba(14,28,19,0.6)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        color: 'var(--paper)',
        fontSize: 9, fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em', opacity: 0.85,
      }}>
        {Math.round(hole.distance * 1.3)}y
      </div>

      {/* SPP monogram "ball" with radar rings */}
      <div style={{
        position: 'absolute', right: '22%', top: '54%',
        width: 72, height: 72, borderRadius: 999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          position: 'absolute', inset: -14, borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.45)', opacity: 0.7,
        }}/>
        <span style={{
          position: 'absolute', inset: -26, borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.28)', opacity: 0.5,
        }}/>
        <div style={{
          width: 48, height: 48, borderRadius: 999,
          background: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 24px rgba(14,28,19,0.35)',
          border: '2px solid var(--cream)',
        }}>
          <Ostrich kind="S" variant="forest" size={34}/>
        </div>
      </div>
    </div>
  );
}

// ─── Full scorecard overlay (opened from FAB) ───────────────────────
function FullScorecardOverlay({ holes, activeHole, onJump, onClose }) {
  const played = holes.filter(h => h.result);
  const state = played.reduce((s, h) => s + (h.result === 'W' ? 1 : h.result === 'L' ? -1 : 0), 0);
  const thru = played.length;
  const remaining = holes.length - thru;
  const wonH = played.filter(h => h.result === 'W').length;
  const halvedH = played.filter(h => h.result === 'H').length;
  const lostH = played.filter(h => h.result === 'L').length;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'rgba(14,28,19,0.5)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'var(--paper)', color: 'var(--ink)',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: '14px 20px 28px',
          animation: 'sheet-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          maxHeight: '88%', overflowY: 'auto',
        }}
      >
        <style>{`@keyframes sheet-up { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div style={{ width: 36, height: 4, borderRadius: 3, background: 'rgba(14,28,19,0.18)', margin: '0 auto 14px' }}/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{
              fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)',
              opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>Match card</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--forest)',
              letterSpacing: '-0.02em', lineHeight: 0.9, marginTop: 6,
            }}>
              {state > 0 ? `${state} UP` : state < 0 ? `${-state} DN` : 'All square'}
            </div>
          </div>
          <div style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.5,
            letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right',
          }}>
            THRU {thru}<br/>{remaining} LEFT
          </div>
        </div>

        {/* Hole strip */}
        <div style={{ display: 'flex', gap: 5 }}>
          {holes.map((h, i) => {
            const r = h.result;
            const isActive = h.hole === activeHole;
            let bg, fg, border;
            if (r === 'W') { bg = 'var(--forest)'; fg = 'var(--cream)'; border = 'none'; }
            else if (r === 'L') { bg = 'var(--cream)'; fg = 'var(--forest)'; border = 'none'; }
            else if (r === 'H') { bg = 'var(--paper)'; fg = 'var(--forest)'; border = '1px solid rgba(28,73,42,0.25)'; }
            else if (isActive) { bg = 'transparent'; fg = 'var(--forest)'; border = '1.5px solid var(--forest)'; }
            else { bg = 'transparent'; fg = 'rgba(14,28,19,0.3)'; border = '1px solid rgba(14,28,19,0.08)'; }
            return (
              <button
                key={h.hole}
                onClick={() => onJump(i)}
                style={{
                  flex: 1, aspectRatio: '0.78',
                  borderRadius: 12,
                  background: bg, color: fg, border,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2,
                  padding: 0,
                }}
              >
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', opacity: 0.65, letterSpacing: '0.04em' }}>{h.hole}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, lineHeight: 1 }}>
                  {isActive && !r ? '·' : r || ''}
                </span>
                {h.you != null && h.opp != null && (
                  <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', opacity: 0.6, letterSpacing: '-0.02em' }}>
                    {h.you}·{h.opp}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ height: 1, background: 'rgba(14,28,19,0.06)', margin: '18px 0 14px' }}/>

        {/* Legend + summary */}
        <div style={{ display: 'flex', gap: 14, fontSize: 10, fontFamily: 'var(--font-mono)', justifyContent: 'space-between', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--forest)' }}/>
            <strong style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>{wonH}</strong> won
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--paper)', border: '1px solid rgba(28,73,42,0.3)' }}/>
            <strong style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>{halvedH}</strong> halved
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--cream)' }}/>
            <strong style={{ fontSize: 13, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>{lostH}</strong> lost
          </span>
        </div>

        <div style={{ marginTop: 18 }}>
          <Button variant="forest" full onClick={onClose}>
            Back to hole {activeHole} <Icon.ArrowRight size={14}/>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, holes, field }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(9, 1fr)', gap: 3, alignItems: 'center', marginTop: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--forest)', opacity: 0.75 }}>{label}</span>
      {holes.map((h, i) => {
        const val = h[field];
        const other = h[field === 'you' ? 'opp' : 'you'];
        const best = val != null && other != null && val < other;
        return (
          <div key={i} style={{
            padding: '8px 0',
            borderRadius: 8,
            background: h.current ? 'rgba(200,100,40,0.12)' : val != null ? 'rgba(14,28,19,0.04)' : 'transparent',
            border: val == null && !h.current ? '1px dashed rgba(14,28,19,0.15)' : 'none',
            textAlign: 'center',
            fontFamily: 'var(--font-display)', fontSize: 14,
            color: best ? 'var(--forest)' : 'var(--ink)',
            fontWeight: best ? 800 : 600,
          }}>
            {val != null ? val : h.current ? '…' : ''}
          </div>
        );
      })}
    </div>
  );
}

function ResultCell({ h }) {
  if (!h.result) {
    return <div style={{ textAlign: 'center', fontSize: 9, opacity: 0.35, fontWeight: 700 }}>·</div>;
  }
  const cfg = {
    W: { bg: 'var(--forest)', fg: 'var(--cream)' },
    L: { bg: 'var(--clay-deep)', fg: 'var(--cream)' },
    H: { bg: 'transparent', fg: '#8A6A4A', border: '1.5px solid #8A6A4A' },
  }[h.result];
  return (
    <div style={{
      margin: '0 auto', width: 22, height: 22, borderRadius: 6,
      background: cfg.bg, color: cfg.fg, border: cfg.border || 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontSize: 12, lineHeight: 1,
    }}>{h.result}</div>
  );
}

// ─── Hole-entry sheet: quick (W/H/L) OR shot-level (scramble intel) ───
function HoleResultSheet({ hole, onClose, onDone }) {
  const [mode, setMode] = React.useState('detailed'); // 'quick' | 'detailed'

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(14,28,19,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: 'var(--cream)', color: 'var(--ink)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: '16px 20px 24px',
        maxHeight: '88%', overflowY: 'auto',
        animation: 'sheet-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 3, background: 'rgba(14,28,19,0.2)', margin: '0 auto 14px' }}/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Eyebrow color="var(--forest)">Hole {hole} · par 3 · 72 yd</Eyebrow>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, marginTop: 4, color: 'var(--forest)' }}>
              Log the hole
            </div>
          </div>
          {/* mode toggle */}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(14,28,19,0.06)', padding: 2, borderRadius: 10 }}>
            {['quick', 'detailed'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '7px 11px', borderRadius: 8,
                background: mode === m ? 'var(--paper)' : 'transparent',
                color: 'var(--forest)', fontWeight: 700, fontSize: 10,
                boxShadow: mode === m ? '0 1px 3px rgba(14,28,19,0.1)' : 'none',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>{m === 'detailed' ? 'Shot-by-shot' : 'Quick'}</button>
            ))}
          </div>
        </div>

        {mode === 'quick' ? <QuickHoleLog onDone={onDone} onClose={onClose}/> : <DetailedHoleLog onDone={onDone} onClose={onClose}/>}
      </div>
    </div>
  );
}

function QuickHoleLog({ onDone, onClose }) {
  const [you, setYou] = React.useState(null);
  const [opp, setOpp] = React.useState(null);
  const result = you != null && opp != null
    ? (you < opp ? 'HOLE WIN' : you > opp ? 'HOLE LOSS' : 'HALVED')
    : null;
  const isWin = result === 'HOLE WIN';
  const isLoss = result === 'HOLE LOSS';
  return (
    <>
      <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(14,28,19,0.04)', borderRadius: 10, fontSize: 11, color: 'var(--ink)', opacity: 0.7, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
        Quick mode · just score, no shot tracking. Stats won't update for this hole.
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 6 }}>Your best ball</div>
          <ScorePicker value={you} onPick={setYou}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 6 }}>Opponent</div>
          <ScorePicker value={opp} onPick={setOpp} muted/>
        </div>
      </div>
      {result && (
        <div style={{
          marginTop: 14, padding: 12, borderRadius: 12,
          background: isWin ? 'var(--forest)' : isLoss ? 'var(--cream)' : 'var(--paper)',
          color: isWin ? 'var(--cream)' : 'var(--forest)',
          border: !isWin && !isLoss ? '1.5px solid rgba(28,73,42,0.25)' : 'none',
          textAlign: 'center',
          fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.01em',
        }}>{result}</div>
      )}
      <SheetActions onClose={onClose} onDone={onDone} disabled={!result}/>
    </>
  );
}

// Proximity buckets (18Birdies-style pin tracker)
const PROX = [
  { key: 'tap',    label: 'Tap in',  ft: 2,  color: 'var(--forest)', tone: 'green' },
  { key: '10',     label: "< 10'",   ft: 8,  color: 'var(--forest)', tone: 'green' },
  { key: '20',     label: "< 20'",   ft: 16, color: '#3E8A57',        tone: 'green' },
  { key: '30',     label: "< 30'",   ft: 26, color: '#C57B48',        tone: 'green' },
  { key: 'fringe', label: 'Fringe',  ft: 38, color: '#8A6A4A',        tone: 'fringe' },
  { key: 'miss',   label: 'Off',     ft: 60, color: 'var(--clay-deep)', tone: 'off' },
];

function DetailedHoleLog({ onDone, onClose }) {
  // First-tee shots
  const [youProx, setYouProx] = React.useState(null);
  const [partnerProx, setPartnerProx] = React.useState(null);
  const [pickedBall, setPickedBall] = React.useState(null); // 'you' | 'partner'
  const [putts, setPutts] = React.useState(null);
  const [teamScore, setTeamScore] = React.useState(null); // auto
  const [oppScore, setOppScore] = React.useState(null);

  // Auto-compute team score: if GIR (either on green), 1 + putts; else 2 + putts approx
  React.useEffect(() => {
    const gir = (youProx && youProx !== 'miss' && youProx !== 'fringe') ||
                (partnerProx && partnerProx !== 'miss' && partnerProx !== 'fringe');
    if (pickedBall && putts != null) {
      setTeamScore(gir ? 1 + putts : 2 + putts);
    }
  }, [youProx, partnerProx, pickedBall, putts]);

  const result = teamScore != null && oppScore != null
    ? (teamScore < oppScore ? 'HOLE WIN' : teamScore > oppScore ? 'HOLE LOSS' : 'HALVED')
    : null;
  const isWin = result === 'HOLE WIN';
  const isLoss = result === 'HOLE LOSS';

  const pickedOn = pickedBall === 'you' ? youProx : partnerProx;
  const pickedGIR = pickedOn && pickedOn !== 'miss' && pickedOn !== 'fringe';

  // Clutch flag: partner missed first, you rescued
  const clutch = partnerProx === 'miss' && pickedBall === 'you';

  return (
    <>
      {/* Step 1: Tee shots · proximity per player */}
      <div style={{ marginTop: 14 }}>
        <StepLabel n={1} label="Tee shots · tap where each ball finished"/>
        <PlayerShotRow name="You" handle="@alex.miami" accent="var(--clay)"
          value={youProx} onPick={setYouProx}/>
        <PlayerShotRow name="Jay Soto" handle="@jaybird" accent="var(--forest)"
          value={partnerProx} onPick={setPartnerProx} style={{ marginTop: 8 }}/>

        {/* Visual green — shows both balls */}
        {(youProx || partnerProx) && (
          <GreenViz youProx={youProx} partnerProx={partnerProx} picked={pickedBall}/>
        )}
      </div>

      {/* Step 2: pick which ball */}
      {youProx && partnerProx && (
        <div style={{ marginTop: 18 }}>
          <StepLabel n={2} label="Which ball did the team play?"/>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {[
              { k: 'you', label: 'Your ball', sub: PROX.find(p => p.key === youProx)?.label, color: 'var(--clay)' },
              { k: 'partner', label: "Jay's ball", sub: PROX.find(p => p.key === partnerProx)?.label, color: 'var(--forest)' },
            ].map(b => (
              <button key={b.k} onClick={() => setPickedBall(b.k)} style={{
                flex: 1, padding: '12px 10px', borderRadius: 12,
                background: pickedBall === b.k ? b.color : 'var(--paper)',
                color: pickedBall === b.k ? (b.k === 'you' ? 'var(--forest-deep)' : 'var(--cream)') : 'var(--ink)',
                border: pickedBall === b.k ? 'none' : '1px solid rgba(14,28,19,0.08)',
                textAlign: 'left',
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.75 }}>{b.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginTop: 3, lineHeight: 1 }}>{b.sub}</div>
              </button>
            ))}
          </div>
          {clutch && pickedBall === 'you' && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(200,100,40,0.12)', color: 'var(--clay-deep)', borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon.Bolt size={11} color="var(--clay-deep)"/> CLUTCH · partner missed, your shot saved the team
            </div>
          )}
        </div>
      )}

      {/* Step 3: putts to hole out */}
      {pickedBall && (
        <div style={{ marginTop: 18 }}>
          <StepLabel n={3} label={pickedGIR ? 'Putts to hole out' : 'Chip + putts to hole out'}/>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => setPutts(n)} style={{
                flex: 1, padding: '14px 0', borderRadius: 12,
                background: putts === n ? 'var(--forest)' : 'var(--paper)',
                color: putts === n ? 'var(--cream)' : 'var(--forest)',
                border: '1px solid rgba(14,28,19,0.08)',
                fontFamily: 'var(--font-display)', fontSize: 20,
              }}>{n === 4 ? '4+' : n}</button>
            ))}
          </div>
          <div style={{ fontSize: 10, opacity: 0.55, marginTop: 5, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
            {pickedGIR ? 'From the green.' : "Include chip-on + putts."}
          </div>
        </div>
      )}

      {/* Step 4: team score computed, opponent score picker */}
      {putts != null && teamScore != null && (
        <div style={{ marginTop: 18 }}>
          <StepLabel n={4} label="Opponent score"/>
          <div style={{
            marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          }}>
            <div style={{
              padding: '12px 14px', borderRadius: 12,
              background: 'rgba(62,138,87,0.08)', border: '1px solid rgba(62,138,87,0.25)',
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', opacity: 0.6 }}>YOUR TEAM</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--forest)', lineHeight: 1, marginTop: 3 }}>
                {teamScore}
              </div>
              <div style={{ fontSize: 10, opacity: 0.65, marginTop: 3 }}>
                {pickedGIR ? 'GIR · ' : 'no GIR · '}{putts} putt{putts !== 1 ? 's' : ''}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', opacity: 0.6, marginBottom: 6 }}>OPPONENT</div>
              <ScorePicker value={oppScore} onPick={setOppScore} muted/>
            </div>
          </div>
        </div>
      )}

      {/* Result banner */}
      {result && (
        <div style={{
          marginTop: 14, padding: '14px 12px', borderRadius: 12,
          background: isWin ? 'var(--forest)' : isLoss ? 'var(--cream)' : 'var(--paper)',
          color: isWin ? 'var(--cream)' : 'var(--forest)',
          border: !isWin && !isLoss ? '1.5px solid rgba(28,73,42,0.25)' : 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', opacity: isWin ? 0.75 : 0.6 }}>RESULT</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, marginTop: 2 }}>{result}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, opacity: isWin ? 0.85 : 0.7, letterSpacing: '0.06em' }}>
            <div>Team {teamScore} · Opp {oppScore}</div>
            <div style={{ marginTop: 2 }}>
              GIR {pickedGIR ? '✓' : '✗'} · {putts}P · usage: {pickedBall === 'you' ? 'YOU' : 'JAY'}
            </div>
          </div>
        </div>
      )}

      <SheetActions onClose={onClose} onDone={onDone} disabled={!result} label="Save · next hole"/>
    </>
  );
}

function StepLabel({ n, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 18, height: 18, borderRadius: 999,
        background: 'var(--forest)', color: 'var(--cream)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-display)',
      }}>{n}</div>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--forest)' }}>{label}</span>
    </div>
  );
}

function PlayerShotRow({ name, handle, accent, value, onPick, style }) {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid rgba(14,28,19,0.06)',
      borderRadius: 14, padding: 10, marginTop: 8, ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 999, background: accent,
          color: accent === 'var(--clay)' ? 'var(--forest-deep)' : 'var(--cream)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-display)',
        }}>{name[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>{name}</div>
          <div style={{ fontSize: 9, opacity: 0.55, fontWeight: 600 }}>{handle}</div>
        </div>
        {value && (
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
            padding: '3px 8px', borderRadius: 999,
            background: PROX.find(p => p.key === value)?.color, color: 'var(--cream)',
          }}>{PROX.find(p => p.key === value)?.label.toUpperCase()}</div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
        {PROX.map(p => (
          <button key={p.key} onClick={() => onPick(p.key)} style={{
            padding: '9px 4px', borderRadius: 9,
            background: value === p.key ? p.color : 'transparent',
            color: value === p.key ? 'var(--cream)' : 'var(--ink)',
            border: value === p.key ? 'none' : '1px solid rgba(14,28,19,0.1)',
            fontSize: 10, fontWeight: 700,
          }}>{p.label}</button>
        ))}
      </div>
    </div>
  );
}

// Visual: green with two ball positions
function GreenViz({ youProx, partnerProx, picked }) {
  // Map prox key → (radius from pin in viewport units)
  const r = { tap: 4, '10': 12, '20': 22, '30': 32, fringe: 44, miss: 54 };
  // Deterministic angles per player so it feels consistent
  const ballPos = (key, angle) => {
    if (!key) return null;
    const dist = r[key];
    return [50 + Math.cos(angle) * dist, 50 + Math.sin(angle) * dist];
  };
  const yPos = ballPos(youProx, -Math.PI / 3);
  const pPos = ballPos(partnerProx, Math.PI * 0.7);

  return (
    <div style={{
      marginTop: 10, background: 'var(--forest)', borderRadius: 14,
      padding: 12, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--cream)', opacity: 0.6, textTransform: 'uppercase' }}>
        The green · top-down
      </div>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: 160, marginTop: 4, display: 'block' }}>
        {/* fringe ring */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(234,226,206,0.12)" strokeWidth="0.4" strokeDasharray="2 2"/>
        {/* green */}
        <circle cx="50" cy="50" r="40" fill="rgba(180,210,150,0.14)" stroke="rgba(234,226,206,0.3)" strokeWidth="0.4"/>
        {/* distance rings */}
        {[30, 20, 10].map(rr => (
          <circle key={rr} cx="50" cy="50" r={rr * 0.9} fill="none" stroke="rgba(234,226,206,0.15)" strokeWidth="0.3" strokeDasharray="1 2"/>
        ))}
        {/* pin */}
        <line x1="50" y1="50" x2="50" y2="30" stroke="var(--cream)" strokeWidth="0.6"/>
        <polygon points="50,30 58,32 50,35" fill="var(--clay)"/>
        <circle cx="50" cy="50" r="1.2" fill="var(--clay)"/>

        {/* your ball */}
        {yPos && (
          <g>
            <circle cx={yPos[0]} cy={yPos[1]} r={picked === 'you' ? 3.5 : 2.5}
              fill="var(--clay)" stroke="var(--cream)" strokeWidth="0.6"/>
            {picked === 'you' && <circle cx={yPos[0]} cy={yPos[1]} r="5" fill="none" stroke="var(--clay)" strokeWidth="0.5" strokeDasharray="1 1"/>}
            <text x={yPos[0]} y={yPos[1] - 5} fontSize="3.5" fill="var(--cream)" textAnchor="middle" fontWeight="800">YOU</text>
          </g>
        )}
        {/* partner ball */}
        {pPos && (
          <g>
            <circle cx={pPos[0]} cy={pPos[1]} r={picked === 'partner' ? 3.5 : 2.5}
              fill="#B8E0A4" stroke="var(--cream)" strokeWidth="0.6"/>
            {picked === 'partner' && <circle cx={pPos[0]} cy={pPos[1]} r="5" fill="none" stroke="#B8E0A4" strokeWidth="0.5" strokeDasharray="1 1"/>}
            <text x={pPos[0]} y={pPos[1] - 5} fontSize="3.5" fill="var(--cream)" textAnchor="middle" fontWeight="800">JAY</text>
          </g>
        )}
      </svg>
    </div>
  );
}

function SheetActions({ onClose, onDone, disabled, label = 'Save · next hole' }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
      <button onClick={onClose} style={{
        flex: 1, padding: '14px 0', borderRadius: 14,
        background: 'transparent', border: '1px dashed rgba(14,28,19,0.2)',
        fontWeight: 700, fontSize: 14, color: 'var(--ink)',
      }}>Cancel</button>
      <Button variant="forest" full onClick={onDone} disabled={disabled}>
        {label}
      </Button>
    </div>
  );
}

function ScorePicker({ value, onPick, muted }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
      {[1,2,3,4,5,6].map(v => (
        <button key={v} onClick={() => onPick(v)} style={{
          padding: '12px 0', borderRadius: 10,
          background: value === v ? (muted ? '#8A6A4A' : 'var(--forest)') : 'var(--paper)',
          color: value === v ? 'var(--cream)' : 'var(--forest)',
          border: '1px solid rgba(14,28,19,0.08)',
          fontFamily: 'var(--font-display)', fontSize: 18,
        }}>{v}</button>
      ))}
    </div>
  );
}

// ─── Share card (match result) ──────────────────────────
function ResultShareScreen({ go }) {
  return (
    <div style={{
      background: `linear-gradient(180deg, var(--forest-dark) 0%, var(--forest-deep) 100%)`,
      minHeight: '100%', color: 'var(--cream)', paddingBottom: 120, position: 'relative',
    }}>
      <div className="grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}/>
      <div style={{ padding: '58px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <button onClick={() => go({ screen: 'home' })} style={{
          width: 40, height: 40, borderRadius: 999,
          background: 'rgba(234,226,206,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--cream)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(234,226,206,0.22)',
        }}>
          <Icon.Close size={14}/>
        </button>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Match result · Week 11</div>
        <div style={{ width: 40 }}/>
      </div>

      <div style={{ padding: '24px 20px 0', textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.55, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Swipe to pick a card style</div>
      </div>

      <div style={{ padding: '20px 24px 0', position: 'relative' }}>
        <div style={{
          background: 'var(--cream)', color: 'var(--ink)',
          borderRadius: 28, padding: 24,
          aspectRatio: '4/5',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 20px 40px rgba(0,0,0,0.3)',
        }}>
          <img src="assets/mascot-full-forest.svg" alt="" style={{
            position: 'absolute', right: -32, bottom: -28, width: 240, opacity: 0.92,
          }}/>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <Wordmark variant="forest" size={110}/>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.6, marginTop: 6, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Pitch & Putt · Miami</div>
            </div>
            <div style={{
              padding: '5px 11px', borderRadius: 999,
              background: 'var(--forest)', color: 'var(--cream)',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
              boxShadow: 'var(--shadow-sm)',
            }}>Week 11</div>
          </div>
          <div style={{ marginTop: 24, position: 'relative' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.55, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Final</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 108, color: 'var(--forest)', lineHeight: 0.82, letterSpacing: '-0.04em', marginTop: 4 }}>
              2 & 1
            </div>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--forest)', marginTop: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>WIN vs Riv + Theo</div>
            <div style={{ height: 1, background: 'rgba(14,28,19,0.12)', margin: '16px 0' }}/>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--forest)', opacity: 0.85, letterSpacing: '0.04em' }}>
              <span><strong style={{ fontSize: 14 }}>5</strong> WON</span>
              <span><strong style={{ fontSize: 14 }}>1</strong> HALVED</span>
              <span><strong style={{ fontSize: 14 }}>2</strong> LOST</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <div style={{ display: 'flex' }}>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--forest)', color: 'var(--cream)', border: '2px solid var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'var(--font-display)' }}>A</div>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--moss)', color: 'var(--cream)', border: '2px solid var(--cream)', marginLeft: -10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'var(--font-display)' }}>J</div>
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--forest)', letterSpacing: '0.04em' }}>@alex.miami + @jaybird · SBX +0.043</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 24px 0', display: 'flex', gap: 10, position: 'relative' }}>
        <Button variant="primary" full size="lg">
          <Icon.Share size={14}/> Share to IG
        </Button>
        <Button variant="ghost" size="lg">
          Save
        </Button>
      </div>
    </div>
  );
}

Object.assign(window, { MembershipScreen, LiveScorecardScreen, ResultShareScreen });
