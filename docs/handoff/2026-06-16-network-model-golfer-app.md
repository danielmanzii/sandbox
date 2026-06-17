# Network model pivot + full golfer-app build (booking → SBX)

Big session. The business sharpened into a **B2B2C network platform** (courses monetize twilight tee times; golfers book + get an SBX match-play rating) and the entire golfer-facing loop was built on top of the existing match engine. CLAUDE.md + BUSINESS_CONTEXT.md are updated to match — **read those first.**

## What shipped (all live on `main`)

**Phase A–C — booking → matchmaking → play**
- `courses` / `course_holes` / `tee_slots` / `bookings` schema, seeded with **Killian Greens** (real scorecard → Sandbox 9). `courses.sql`
- Book tab (date-first availability, near-you geo, search), course detail w/ Sandbox-9 scorecard, booking sheet (1v1/2v2), My Rounds. `courses.jsx` / `courses-data.jsx`
- 2v2 matchmaking: "do you have a partner?" → consent invite or **auto-pair solos** (SBX-banded, instant + **2h-cutoff sweep** with revenue-salvage + refund). Generic `notifications` table + partner invite/accept/decline RPCs. `matchmaking.sql` / `notifications-data.jsx`
- **Foursome formation** balanced by effective team strength; **matchup reveal** (scout all 4 + SBX). `foursome.sql`
- **Partner DM + foursome group chat.** `chat.jsx` / `chat-data.jsx`
- **Check in → start** seeds Sandbox-9 holes + opens the existing live scorecard. `play.sql` (also fixed a bug: formed 2v2s weren't setting `match_type`)

**Phase D — rating + stats + data**
- **Dual result confirmation** (one per side) — the integrity gate. `confirm.sql`
- **SBX engine** — DUPR-faithful **windowed recompute**: 2v2 headline + 1v1 secondary, placement calibration (unrated <3 matches), verification weighting (ranked vs casual ½), reliability from volume + opponent variety. Runs on confirmation + 15-min `recompute-sbx` cron. `sbx.sql`
- **Stats + Profile fully real** — real SBX/record/history; honest empty states where data isn't captured yet (no mock numbers).
- **Ball-selection capture** (one-tap whose-ball / who-holed + optional zone) on 2v2 holes → **loyalty points** (base + win + bonus for detailed tracking, 🎁 callout) → **AI "whose ball" caddie** (Sandbox+ perk, make-probability priors → learns from captured zones). `shots.sql` / `loyalty.sql` / `caddie-data.jsx`

**Phase E — visuals (first pass)**
- Clay renders + official logo SVGs into `v1/assets`; course-detail hero diorama, Home CTA golfer, My Rounds empty state, new full-lockup everywhere.

## ⚠️ SQL run order (Daniel ran all of these in prod)
`setup → social → courses → matchmaking → foursome → play → confirm → sbx → shots → loyalty`. All idempotent. **pg_cron** enabled with two jobs: `resolve-pairings`, `recompute-sbx`.

## Gotchas
- Don't name a plpgsql var `both` (reserved → syntax error; we hit this — use `both_done`).
- Only **confirmed** matches feed SBX/points. No 2-on-1 ever (formation needs a full foursome).
- Babel-standalone strict mode: new components must be in the `/* global */` comment + exported via `Object.assign(window, …)`.
- Clay PNGs are heavy (course-hole 4.6MB, tee-mat 6MB) — compress before scale; tee-mat not placed yet.

## Open / next
- **Consolidate `events` into the courses/tee_slots/bookings model** (currently parallel). Majors/league nights are still the legacy `events` system.
- Course portal (B2B) + Sandbox admin surfaces — schema already rolls up per-course (bookings→tee_slots→matches).
- Payments: **Stripe Connect** (reserve-only today; `price_charged`/`booking_fee` columns reserved).
- Compress clay assets; generate more clay renders for Book cards / matchup / empty states (external — agent can't generate them).
- Caddie + shot-usage stats get richer as zone data accumulates.
