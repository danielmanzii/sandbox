# For AI coding agents (Claude Code, Cursor, etc.)

**Read [docs/BUSINESS_CONTEXT.md](docs/BUSINESS_CONTEXT.md) before writing any code.** It's the source-of-truth document for what Sandbox Pitch & Putt is, how it monetizes, the key business rules the software must enforce, and the target personas. Every feature, copy decision, and data-model choice should be consistent with that doc.

## What this project is

A web-first responsive consumer app prototype for **Sandbox Pitch & Putt** — a membership-based competitive 2-man scramble match-play pitch-and-putt league in Miami-Dade. The webapp is both the customer-facing product and the operational backbone.

## Current state

**Two surfaces:**

- **`v1/`** — The prototype. All screens built (Home, Events, Live Scorecard, Stats, Profile, Social, Membership). React via CDN + Babel-in-browser, mock data, no build step. This is the design reference and the basis for the production port.
- **`web/`** — Production Next.js 16 app (TypeScript, Tailwind v4, App Router). Home screen ported. Postgres + Stripe + Clerk wired in over time.

The root `index.html` redirects straight to `v1/`. Run via `python -m http.server 5173` from the repo root.

When in doubt: visual/design changes go in `v1/`; production code goes in `web/`.

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

Each version has its own `styles.css` (in `v1/styles.css` and `v2/styles.css`). Don't edit the `:root` tokens there without checking how they cascade — they touch everything in that version.

## How to run

**V1 / V2 prototypes (root):**
```bash
python -m http.server 5173
# open http://127.0.0.1:5173/          — version picker
# open http://127.0.0.1:5173/v1/       — V1 direct
# open http://127.0.0.1:5173/v2/       — V2 direct
```

**Production Next.js app (`web/`):**
```bash
cd web
npm install     # first time only
npm run dev
# open http://localhost:3000
```

## Project map

**Design exploration — `v1/` and `v2/`:**
Both folders have the same structure. `v1/` is the shipped/frozen UI; `v2/` is where the Pinterest-direction redesign happens.
- `vN/index.html` — App shell, routing, Tweaks panel, floating V1/V2 switcher
- `vN/styles.css` — Design tokens + shared classes for that version
- `vN/components/data.jsx` — Mock data (events, users, matches, SBX ratings, etc.)
- `vN/components/primitives.jsx` — Icon, Button, Chip, Wordmark, Ostrich, etc.
- `vN/components/ios-frame.jsx` — iOS device chrome for desktop preview
- `vN/components/screens/*.jsx` — One file per screen; `membership-live-share.jsx` holds Membership + Live Scorecard + Result Share
- `vN/assets/` — Brand SVGs (mascot, wordmark, full lockup) — duplicated per version so each is self-contained

**Root-level shell:**
- `index.html` — Landing/picker with links into `v1/` and `v2/`

**Production — `web/`** (where net-new work goes once a UI version is settled):
- `web/src/app/` — Next.js App Router pages/layouts
- `web/package.json` — dependencies (Next 16, React 19, Tailwind v4, TS 5)
- `web/.env.local` — local secrets (gitignored; template at root `.env.example`)

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
