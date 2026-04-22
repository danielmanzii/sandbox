# Sandbox Pitch & Putt — Webapp Prototype

Membership-based competitive pitch-and-putt league webapp (Miami-Dade). This is the **consumer-facing prototype** — 9 screens covering Home, Events, Stats, Profile, Social/Leaderboards, Membership, Live Scorecard, and Result Share.

> **Status:** prototype. React via CDN + Babel-in-browser with localStorage mock data. Designed for rapid iteration on flows, copy, and visual design. Will be ported to a production stack (Next.js + Postgres + Stripe + Clerk) once the design is settled.

---

## Run it locally

The app is a static set of files. Serve it with any HTTP server — can't open `index.html` directly via `file://` (the JSX imports won't load).

```bash
# from this folder
python -m http.server 5173
```

Then:
- **http://127.0.0.1:5173/** — version picker landing page
- **http://127.0.0.1:5173/v1/** — V1 (shipped editorial modern UI)
- **http://127.0.0.1:5173/v2/** — V2 (in-progress Pinterest-direction UI)

Each version has a floating `V1 / V2` pill in the top-right to swap between them at any time. Any static server works (`npx serve`, `caddy`, etc.).

---

## Two versions in parallel

- **V1** is the shipped design (white canvas, forest + cream accents, layered shadows, shape-based result states). Frozen — only bug fixes.
- **V2** starts as a clone of V1 and diverges as we build a new UI direction inspired by a Pinterest reference.

Both are fully-functioning prototypes with all 9 screens. Pick whichever matches the work you're doing.

---

## Dev loop

- Edit files under `v1/components/` or `v2/components/` (or the corresponding `styles.css`)
- Hard-refresh the browser (Ctrl/Cmd+Shift+R) to see changes
- No build step, no bundler — edits are live

State (current screen, selected membership tier, mascot intensity, live-mode toggle) persists to `localStorage`. Clear with:

```js
localStorage.clear()
```

…in the browser console.

---

## Tweaks panel (dev UI)

The app listens for a `postMessage({type: '__activate_edit_mode'})` to show a floating Tweaks panel. To toggle during local dev, paste in the browser console:

```js
window.postMessage({ type: '__activate_edit_mode' }, '*')
```

The panel lets you flip:
- Membership tier (Walk-up / Stats / League / Plus) — changes what's visible/gated
- Mascot intensity (Off / Subtle / Full)
- Live event mode (On / Off) — changes the Home hero card
- Jump-to-screen shortcuts
- View-profile-as (Self / Friend)

---

## Project structure

```
webapp/
├── index.html                      # Version picker landing page
├── v1/                             # Shipped UI — editorial modern (frozen)
│   ├── index.html                  # App shell, React root, routing, Tweaks panel, V1/V2 pill
│   ├── styles.css                  # Design system tokens + shared classes
│   ├── assets/                     # Brand SVGs (duplicated per version so each is self-contained)
│   └── components/
│       ├── data.jsx                # Mock data
│       ├── primitives.jsx          # Icon, Button, Chip, Eyebrow, Wordmark, Ostrich, etc.
│       ├── ios-frame.jsx           # iOS device chrome for desktop preview
│       └── screens/
│           ├── home.jsx
│           ├── events.jsx          # Events list + Event detail + Register sheet
│           ├── stats.jsx           # SBX Rating + Scramble Intel + Match History + H2H + Badges
│           ├── profile.jsx         # Self + public view (member-gated stats)
│           ├── social.jsx          # Live / Season / All-time leaderboards
│           └── membership-live-share.jsx  # Membership tiers + Live scorecard + Result share
├── v2/                             # Pinterest-direction UI (in progress)
│   └── … same structure as v1/; starts as a clone, diverges over time
├── web/                            # Production Next.js port (shared across versions)
├── docs/                           # Business context, cross-session handoff notes
└── assets/                         # Original brand SVGs (shared reference)
```

---

## Design system

### Palette

| Token | Hex | Role |
|---|---|---|
| `--forest` | `#1C492A` | Primary brand color (CTAs, headlines, tabs, brand moments) |
| `--forest-dark` | `#0E2818` | Deep forest for gradient shadows |
| `--moss` | `#2C6B43` | Mid-forest accent for gradients |
| `--cream` | `#EAE2CE` | Warm accent (cards, share card, halved/lost match states) |
| `--paper` / `--canvas` | `#FFFFFF` | Main canvas + neutral card backgrounds |
| `--ink` | `#0E1C13` | Body text on light backgrounds |
| `--loss` | `#9B3A2E` | Reserved for negative numerical deltas (rating drops) — not used on result badges |

### Typography

- **Display:** Bagel Fat One — groovy wordmark-style, big numbers, screen headlines
- **Body:** Archivo — UI text, buttons, captions
- **Serif:** Instrument Serif italic — taglines, quotes, editorial accents
- **Mono:** JetBrains Mono — eyebrows, data labels, metadata strips

### Result state system (wins / losses / halved matches)

Three distinct visual shapes, not three distinct colors:

- **W (won)** — filled forest, cream letter
- **L (lost)** — filled cream, forest letter
- **H (halved)** — white, forest outline, forest letter

Applied consistently across the match card, match history rows, hole-result cards, and summary legends.

### Shadows & surfaces

- `--shadow-sm` / `--shadow-md` / `--shadow-lg` / `--shadow-hero` — layered soft shadows
- `--hairline` — 1px low-opacity dividers (replaces old dashed-paper motif)
- `.card` / `.card-hero` — reusable modern surface classes

---

## Business & product context

**Start here → [docs/BUSINESS_CONTEXT.md](docs/BUSINESS_CONTEXT.md)**

That's the source-of-truth document for the business: positioning, revenue model, pricing principles, personas, and the full set of business rules the software must enforce. Every feature, copy decision, and data-model choice should be consistent with it. AI agents: there's also a [CLAUDE.md](CLAUDE.md) at the root with a shorter orientation.

A few rules worth surfacing:

1. **Walk-up ticket price > monthly League Membership price.** Configurable multiplier.
2. **Priority registration window** for members before public walk-ups.
3. **Member attendance cap** per event (protects walk-up revenue).
4. **Grandfather pricing** preserved per subscription regardless of future price changes.
5. **Stats-only members** cannot register for events without paying walk-up.
6. **Majors** are a separate event type with distinct pricing.
7. **Corporate events** never appear in public listings.

---

## Contributing

This is a shared iteration space — move fast, break nothing critical.

- Branch off `main` for non-trivial changes
- Hard-refresh the browser after each edit to sanity-check
- Check the Tweaks panel's "Jump to screen" shortcuts to test every screen after visual changes
- Don't touch the design-system tokens (the `:root` block in `v1/styles.css` or `v2/styles.css`) without a heads-up — they cascade across that entire version
- V1 is frozen — only bug fixes unless explicitly asked. Design exploration belongs in V2

---

## Next steps (not in this repo yet)

- Port to **Next.js + TypeScript** once design is settled
- Replace mock data with **Postgres + Prisma**
- **Stripe** for membership billing + event tickets
- **Clerk** or **Auth.js** for auth
- Admin surface (event creation, scorecard entry for ops staff)
- Corporate buyout flow
- Content hub (video episodes, highlight reels)
