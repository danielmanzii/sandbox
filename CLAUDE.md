> Working principles for all Claude sessions in this repo: **[CLAUDE_PRINCIPLES.md](CLAUDE_PRINCIPLES.md)** — read before coding.
>
> **Two people work on this repo (Daniel + Rob).** `main` is protected — **never push to `main`
> directly.** Make a branch, push it, open a PR, check the Vercel preview, then merge. The full
> workflow + which files belong to which tab is in **[COLLABORATION.md](COLLABORATION.md)** —
> read it before committing. New here / catching up? Start with the latest
> **[docs/handoff/](docs/handoff/)** note.

# For AI coding agents (Claude Code, Cursor, etc.)

**Read [docs/BUSINESS_CONTEXT.md](docs/BUSINESS_CONTEXT.md) before writing any code.** It's the source-of-truth document for what Sandbox Pitch & Putt is, how it monetizes, the key business rules the software must enforce, and the target personas. Every feature, copy decision, and data-model choice should be consistent with that doc.

## What this project is

A web-first responsive consumer app for **Sandbox Pitch & Putt** — a **B2B2C platform** that turns unused twilight tee times at existing golf courses into 9-hole, sub-hour, competitive **2-man scramble** pitch-and-putt. Partner courses join the network and set their pricing; golfers book in the app, get matched, play, and build a proprietary **SBX** match-play rating. (Evolved June 2026 from the original "league we run" framing — see [docs/BUSINESS_CONTEXT.md](docs/BUSINESS_CONTEXT.md) §1.)

**Three surfaces:** (1) **golfer app** — the current build; (2) **course portal** — future, courses manage slots/pricing + see KPIs; (3) **Sandbox admin** — future, creates Majors/tournaments. Design every data model so the course portal can read the *same* tables (bookings/tee_slots/matches roll up to per-course revenue + results).

## Current state

**Two code surfaces:**

- **`v1/`** — The live app. React via CDN + Babel-in-browser, **Supabase-backed**, no build step. This is production.
- **`web/`** — Next.js 16 scaffold; long-term rewrite target. Features ship in `v1/` first.

The root `index.html` redirects straight to `v1/`. New features go in `v1/`.

**The golfer-app build (as of June 2026) — the full booking→rating loop is live:**
- **Book** a round at a network course: date-first availability, near-you geo, course detail w/ Sandbox-9 scorecard + tee-slot booking (`courses.jsx`, `courses-data.jsx`).
- **Matchmaking:** 2v2 "do you have a partner?" → invite (consent) or auto-pair solos (SBX-banded, instant + 2h-cutoff sweep w/ revenue-salvage + refund); foursome formation balanced by effective team strength (`matchmaking.sql`, `foursome.sql`).
- **Matchup reveal** (scout all 4 + SBX), **partner DM + foursome group chat** (`chat.jsx`), **check in → live scorecard**.
- **SBX rating engine** — DUPR-faithful **windowed recompute**, 2v2 headline + 1v1 secondary, placement calibration (unrated <3 matches), verification weighting (ranked vs casual), reliability (`sbx.sql`). Gated by **dual result confirmation** (`confirm.sql`).
- **Ball-selection + shot capture** (one-tap whose-ball/who-holed + optional zone) → **loyalty points** (bonus for detailed tracking) → **AI "whose ball" caddie** (Sandbox+ perk, priors→learned) (`shots.sql`, `loyalty.sql`, `caddie-data.jsx`).
- Real Stats + Profile (real SBX/record/history; no mock numbers).

Legacy **events** (league nights / Majors via `events.jsx`) still exist in parallel; consolidating events into the unified courses/tee_slots/bookings model is a planned later pass.

## Production

- **Live URL:** [https://sbx.golf](https://sbx.golf) — apex is the canonical. `www.sbx.golf` 307-redirects here.
- **Host:** Vercel (project `sandbox` under team `sbxgolf-3133`). Framework Preset = **Other** (no build step). **Root Directory = `v1`** so the app is served from the repo root URL with no `/v1/` path prefix in the address bar. **Connected to `danielmanzii/sandbox` (this repo)** — auto-deploys on push to `main`. Both collaborators push here; no special workflow required for production deploys.
- **Vercel preview URL:** `sandbox-beryl-seven.vercel.app` (always points at the latest production build)
- **DNS:** GoDaddy. `A @ → 76.76.21.21` and `CNAME www → cname.vercel-dns.com`. TLS auto-provisioned by Vercel via Let's Encrypt.

## Backend (Supabase)

- **Project URL:** `https://rklxjcchgtwgxbeatsoc.supabase.co` — wired in [v1/components/supabase-client.jsx](v1/components/supabase-client.jsx).
- **Anon key is committed intentionally.** Supabase `anon` is designed for the browser; Row-Level Security (defined in [v1/sql/setup.sql](v1/sql/setup.sql)) is what guards every table. **Never paste the `service_role` key anywhere near the client.**
- **Schema** is split across ordered, idempotent files in `v1/sql/` — apply in this order: `setup.sql` (profiles/matches/match_holes/events) → `social.sql` (follows/avatars) → `courses.sql` (courses/course_holes/tee_slots/bookings + Killian seed) → `matchmaking.sql` (notifications + solo pairing + partner-invite RPCs + refund cron) → `foursome.sql` (match formation) → `play.sql` (course_id + check-in/start) → `confirm.sql` (dual confirmation) → `sbx.sql` (windowed rating engine) → `shots.sql` (ball/holed/zone capture) → `loyalty.sql` (points ledger + award). All use `if not exists`/`drop policy if exists`, safe to re-run.
- **pg_cron** is enabled. Two jobs: `resolve-pairings` (2h-cutoff salvage/refund) and `recompute-sbx` (15-min rating refresh). Reserved-keyword gotcha: don't name plpgsql vars `both` (use `both_done`).
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
7. **Sandbox Rating™ (SBX)** is a match-play-native rating, 2.000–8.000 (higher = better), modeled closely on **DUPR**: two numbers (**2v2 headline** + **1v1 secondary**), **windowed recompute** (re-solved from each player's last N confirmed matches, not incremental), **placement calibration** (unrated until 3 confirmed matches; provisional <10), **verification weighting** (ranked/booked full, casual ½), and a **reliability** score from volume + opponent variety. Casual play *does* move it (weighted down) — don't exclude it.
8. **Only confirmed matches feed SBX + loyalty points.** A finished match needs **dual confirmation** (one per side) before it counts — the integrity gate. Don't award rating/points off an unconfirmed match.
9. **No one ever plays 2-on-1.** A 2v2 match locks only at a full foursome; leftover solos get auto-paired (revenue-salvage at the 2h cutoff) or refunded — never thrown into a 2v1.
10. **Member perks must never force a course discount** — fund them from Sandbox margin (e.g. waived booking fee) or course-opted yield-management inventory.
11. **Reserve-only for now** — bookings take no payment yet; `price_charged`/`booking_fee` are snapshot columns reserved for Stripe Connect.

See [docs/BUSINESS_CONTEXT.md](docs/BUSINESS_CONTEXT.md) for the full set of rules, personas, pricing principles, and product context.

## Design system

- **Palette:** Forest `#1C492A` + Cream `#EAE2CE` as accents on a **white canvas**. No orange.
- **Type:** Bagel Fat One (display), Archivo (body), Instrument Serif italic (editorial), JetBrains Mono (eyebrows/data).
- **Result states:** Shape, not color. W = filled forest, L = filled cream, H = white outlined — applied consistently across match card pills, match history badges, hole-result cards, and summary legends.
- **Imagery:** soft **3D clay renders** (matte, rounded, subtle drop shadows — golfer, clubhouse, course-hole diorama, tee mat) over forest gradients. Use only the transparent-background renders in `v1/assets/clay-*.png`. New renders are generated externally (the agent can't make them) — author flat SVG/brand art in code instead. NOTE: clay PNGs are currently large (4–6MB) and need compression before scale.

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
- `v1/components/screens/social.jsx` — People search + leaderboards
- `v1/components/screens/membership-live-share.jsx` — Membership tiers + (legacy) Live scorecard + Result share

**Network / golfer-app layer (June 2026):**
- `v1/components/screens/courses.jsx` — Book / Course detail (+ Sandbox-9 scorecard) / Booking sheet / My Rounds / Matchup reveal
- `v1/components/courses-data.jsx` — courses, availability (geo "near you"), bookings, matchup hooks + `startBookedMatch`
- `v1/components/notifications-data.jsx` — generic notifications + partner invite/accept/decline RPC wrappers
- `v1/components/screens/chat.jsx` + `v1/components/chat-data.jsx` — partner DM + foursome group chat
- `v1/components/loyalty-data.jsx` — loyalty points balance/ledger
- `v1/components/caddie-data.jsx` — "whose ball" make-probability model (priors → learned)
- `v1/components/social-data.jsx` — follows, avatars, friend feed, profile editing, real SBX fields
- `v1/components/screens/match-live.jsx` — live scoring + ball-selection capture + AI caddie tip + dual result confirmation
- `v1/assets/clay-*.png` — clay 3D renders (golfer/clubhouse/course-hole/tee-mat); `lockup-full-*.svg` / `monogram-*.svg` / `mark-*.svg` — official June-2026 logo set

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
