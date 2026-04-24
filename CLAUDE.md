# For AI coding agents (Claude Code, Cursor, etc.)

**Read [docs/BUSINESS_CONTEXT.md](docs/BUSINESS_CONTEXT.md) before writing any code.** It's the source-of-truth document for what Sandbox Pitch & Putt is, how it monetizes, the key business rules the software must enforce, and the target personas. Every feature, copy decision, and data-model choice should be consistent with that doc.

## What this project is

A web-first responsive consumer app for **Sandbox Pitch & Putt** — a membership-based competitive 2-man scramble match-play pitch-and-putt league in Miami-Dade. The webapp is both the customer-facing product and the operational backbone.

## Current state

**Two surfaces:**

- **`v1/`** — The live app. All screens built (Home, Play, Live Scorecard, Stats, Profile, Social, Membership, Match Hub, Match Live). React via CDN + Babel-in-browser, **Supabase-backed** for auth + matches + per-hole stats, no build step. This is what users see in production today.
- **`web/`** — Production Next.js 16 app (TypeScript, Tailwind v4, App Router). Home screen ported as scaffold. Will become the long-term codebase as features port over from `v1/`.

The root `index.html` redirects straight to `v1/`. When in doubt: shipping new features goes in `v1/`; the long-game production rewrite goes in `web/`.

## Production

- **Live URL:** [https://sbx.golf](https://sbx.golf) — apex is the canonical. `www.sbx.golf` 307-redirects here.
- **Host:** Vercel (project `sandbox` under team `sbxgolf-3133`). Framework Preset = **Other** (no build step). **Root Directory = `v1`** so the app is served from the repo root URL with no `/v1/` path prefix in the address bar. Auto-deploys on push to `main`.
- **Vercel preview URL:** `sandbox-beryl-seven.vercel.app` (always points at the latest production build)
- **DNS:** GoDaddy. `A @ → 76.76.21.21` and `CNAME www → cname.vercel-dns.com`. TLS auto-provisioned by Vercel via Let's Encrypt.

## Backend (Supabase)

- **Project URL:** `https://rklxjcchgtwgxbeatsoc.supabase.co` — wired in [v1/components/supabase-client.jsx](v1/components/supabase-client.jsx).
- **Anon key is committed intentionally.** Supabase `anon` is designed for the browser; Row-Level Security (defined in [v1/sql/setup.sql](v1/sql/setup.sql)) is what guards every table. **Never paste the `service_role` key anywhere near the client.**
- **Schema** lives in `v1/sql/setup.sql`. Re-run after any schema change — it uses `if not exists` / `drop policy if exists` so it's safe to apply multiple times.
- **Realtime** is enabled on `matches` and `match_holes` so opposing players see each other's scoring live.
- **Auth URLs** in Supabase → Authentication → URL Configuration must list:
  - Site URL: `https://sbx.golf/`
  - Redirect allowlist: `https://sbx.golf/**`, `https://www.sbx.golf/**`, `https://sandbox-beryl-seven.vercel.app/**` (the `**` wildcard covers any path — including any future routing changes).

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

The design tokens live in [v1/styles.css](v1/styles.css) (`:root` block at the top). Don't edit those without checking how they cascade — they touch everything.

## How to run

**v1 prototype (root):**
```bash
python -m http.server 5173
# open http://127.0.0.1:5173/    — auto-redirects to /v1/
```

**Production Next.js app (`web/`):**
```bash
cd web
npm install     # first time only
npm run dev
# open http://localhost:3000
```

## Project map

**v1 — the live app (root `v1/` folder):**
- `v1/index.html` — Auth gate (Root) wrapping the App; routing; ErrorBoundary at the root that resets `localStorage.spp_route` on render crashes
- `v1/styles.css` — Design tokens + shared classes
- `v1/sql/setup.sql` — Postgres schema, RLS policies, realtime publications. **Re-run after schema changes.**
- `v1/components/data.jsx` — Mock data (still used for events/friends/badges; real user data swaps in via `useRealUserSync`)
- `v1/components/primitives.jsx` — Icon, Button, Chip, Wordmark, Ostrich, etc.
- `v1/components/ios-frame.jsx` — iOS device chrome for desktop preview
- `v1/components/supabase-client.jsx` — Supabase client + `useSession` / `useProfile` / `useRecovering` / `signOut` hooks
- `v1/components/user-data.jsx` — `useRealUserSync` overwrites `MOCK.USER` / `MOCK.ACTIVITY` / `MOCK.HISTORY` with the signed-in user's real data so every screen Just Works without per-screen refactors
- `v1/components/screens/auth.jsx` — Welcome / SignUp / SignIn / Forgot / ResetPassword / DisplayName / ProfileSetup
- `v1/components/screens/home.jsx` — Home (greeting + activity feed + quick stats)
- `v1/components/screens/play.jsx` — Play tab wrapper with Ranked / Unranked segmented control
- `v1/components/screens/events.jsx` — Ranked tournaments list + detail (still mock data; needs `events` table)
- `v1/components/screens/match-hub.jsx` — Challenge a Friend hub (start / join / waiting / recent matches)
- `v1/components/screens/match-live.jsx` — Live 1v1 + 2v2 scoring with realtime sync, per-hole stat capture, cancel
- `v1/components/screens/stats.jsx` — Stats dashboard (SBX, scramble intel, match history)
- `v1/components/screens/profile.jsx` — Self + public view (member-gated stats)
- `v1/components/screens/social.jsx` — Live / Season / All-time leaderboards
- `v1/components/screens/membership-live-share.jsx` — Membership tiers + (legacy) Live scorecard + Result share

**Root:**
- `index.html` — One-line redirect to `v1/`
- `web/` — Next.js port (see below)

**`web/` (long-term production rewrite):**
- `web/src/app/` — Next.js App Router pages/layouts
- `web/package.json` — Next 16, React 19, Tailwind v4, TS 5
- `web/.env.local` — gitignored; template at root `.env.example`

**Docs:**
- `docs/BUSINESS_CONTEXT.md` — **Source of truth. Read this first.**
- `docs/handoff/` — cross-session handoff notes

## Collaboration conventions

This repo is worked on by multiple people, each using their own Claude Code account. To keep things sane:

### Secrets & env vars
- **Supabase anon key is committed on purpose.** That's the public anon role; RLS guards data. **Never commit `service_role` keys.**
- All other secrets (Stripe, Clerk, Postgres direct URL, etc.) live in `.env.local`, which is gitignored.
- `.env.example` is the committed template — copy it to `.env.local` and fill in real values locally.
- If a new secret is introduced, add a placeholder line to `.env.example` in the same commit so teammates know to set it.
- Signing certificates (`.p12`, `.mobileprovision`, `.keystore`) are gitignored — store them in a shared password manager (1Password/Bitwarden), not git.

### Branches & PRs
- Work on feature branches, not directly on `main`. Suggested naming: `feat/<short-description>`, `fix/<short-description>`.
- Open a PR into `main` when ready. **`main` is the production branch — every push auto-deploys to https://sbx.golf via Vercel.** Keep it runnable.

### Handoff files
- When pausing mid-task or passing work to the other collaborator, drop a markdown file in `docs/handoff/` named `YYYY-MM-DD-<topic>.md`.
- Include: what was done, what's next, any gotchas, and the files touched. This becomes the next Claude's briefing.

### Gotchas worth memorizing
- **Babel-standalone is strict mode.** Undeclared identifiers throw `ReferenceError` and the screen goes blank. Most of the recent crash fixes have been exactly this — a stale variable left over from a refactor.
- **Real user data is synced into `window.MOCK` globally** by `useRealUserSync`. If you rename a `MOCK` field or touch `user-data.jsx`, every screen breaks. Speed-vs-purity tradeoff we accepted.
- **Tab bar hides on `live`, `resultShare`, `match`, `challenge`** — these screens own their own navigation. New "flow" screens need to be added to `hideTabs` in the App component.
- **Vercel caches aggressively.** After a push, `Ctrl+Shift+R` (Mac: `Cmd+Shift+R`) hard-refreshes to bust client cache.
- **Email confirmation must stay OFF** in Supabase → Auth → Providers → Email until we go to a real public beta, otherwise signups can't immediately log in.
