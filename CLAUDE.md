# For AI coding agents (Claude Code, Cursor, etc.)

**Read [docs/BUSINESS_CONTEXT.md](docs/BUSINESS_CONTEXT.md) before writing any code.** It's the source-of-truth document for what Sandbox Pitch & Putt is, how it monetizes, the key business rules the software must enforce, and the target personas. Every feature, copy decision, and data-model choice should be consistent with that doc.

## What this project is

A web-first responsive consumer app prototype for **Sandbox Pitch & Putt** — a membership-based competitive 2-man scramble match-play pitch-and-putt league in Miami-Dade. The webapp is both the customer-facing product and the operational backbone.

## Current state

**Two codebases live side-by-side during the port:**

- **Root (`index.html`, `components/`, `styles.css`)** — legacy prototype. React via CDN + Babel-in-browser with localStorage-backed mock data. Static-served (`python -m http.server 5173`). No build step. Kept runnable for reference while the port is in progress.
- **`web/`** — production Next.js 16 app (TypeScript, Tailwind v4, App Router). This is where net-new work goes. Screens, components, and business logic are being ported here, with Postgres + Stripe + Clerk wired in over time.

When in doubt, make changes in `web/`. Only touch the prototype if you're updating it for reference or the port hasn't reached that screen yet.

## Non-obvious rules to respect when making changes

1. **Walk-up ticket price must always be greater than monthly League Membership price.** If membership price changes, walk-up minimum adjusts. Configurable ratio, never hardcoded.
2. **Stats-only members cannot register for events** without paying walk-up.
3. **Grandfather/founding-member pricing** is locked per subscription and preserved across future price changes.
4. **Majors are a separate event type** — different pricing, different capacity.
5. **Corporate events never appear in public listings.**
6. **Match play scoring is hole-by-hole (W/H/L)**, not stroke totals. Match status shown as "2 UP", "1 DN", "AS", "DORMIE", or final "W 3&2".
7. **Sandbox Rating™ (SBX)** is a match-play-native, Elo/Glicko-style rating on a 2.000–8.000 scale. Higher = better. Updates after every match. Not USGA/GHIN handicap.

See [docs/BUSINESS_CONTEXT.md](docs/BUSINESS_CONTEXT.md) for the full set of rules, personas, pricing principles, and product context.

## Design system

- **Palette:** Forest `#1C492A` + Cream `#EAE2CE` as accents on a **white canvas**. No orange.
- **Type:** Bagel Fat One (display), Archivo (body), Instrument Serif italic (editorial), JetBrains Mono (eyebrows/data).
- **Result states:** Shape, not color. W = filled forest, L = filled cream, H = white outlined — applied consistently across match card pills, match history badges, hole-result cards, and summary legends.

Don't edit the `:root` tokens in `styles.css` without checking how they cascade — they touch everything.

## How to run

**Production Next.js app (`web/`):**
```bash
cd web
npm install     # first time only
npm run dev
# open http://localhost:3000
```

**Legacy prototype (root):**
```bash
python -m http.server 5173
# open http://127.0.0.1:5173/
```

## Project map

**Production — `web/`** (where net-new work goes):
- `web/src/app/` — Next.js App Router pages/layouts
- `web/package.json` — dependencies (Next 16, React 19, Tailwind v4, TS 5)
- `web/.env.local` — local secrets (gitignored; template at root `.env.example`)

**Legacy prototype — root** (reference only during port):
- `index.html` — App shell, routing, Tweaks panel
- `styles.css` — Design tokens + shared classes
- `components/data.jsx` — Mock data (events, users, matches, SBX ratings, etc.)
- `components/primitives.jsx` — Icon, Button, Chip, Wordmark, Ostrich, etc.
- `components/ios-frame.jsx` — iOS device chrome for desktop preview
- `components/screens/*.jsx` — One file per screen; `membership-live-share.jsx` holds Membership + Live Scorecard + Result Share
- `assets/` — Brand SVGs (mascot, wordmark, full lockup)

**Docs:**
- `docs/BUSINESS_CONTEXT.md` — **Source of truth. Read this first.**
- `docs/handoff/` — cross-session handoff notes

## Collaboration conventions

This repo is worked on by multiple people, each using their own Claude Code account. To keep things sane:

### Secrets & env vars
- **Never commit secrets.** All API keys (Stripe, Clerk, Postgres URL, etc.) live in `.env.local`, which is gitignored.
- `.env.example` is the committed template — copy it to `.env.local` and fill in real values locally.
- If a new secret is introduced, add a placeholder line to `.env.example` in the same PR so teammates know to set it.
- Signing certificates (`.p12`, `.mobileprovision`, `.keystore`) are also gitignored — store them in a shared password manager (1Password/Bitwarden), not git.

### Branches & PRs
- Work on feature branches, not directly on `main`. Suggested naming: `feat/<short-description>`, `fix/<short-description>`.
- Open a PR into `main` when ready. `main` should always be in a runnable state.

### Handoff files
- When pausing mid-task or passing work to the other collaborator, drop a markdown file in `docs/handoff/` named `YYYY-MM-DD-<topic>.md`.
- Include: what was done, what's next, any gotchas, and the files touched. This becomes the next Claude's briefing.
