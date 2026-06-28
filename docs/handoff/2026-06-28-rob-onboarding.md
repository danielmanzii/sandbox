# Onboarding + recap for Rob (and his Claude) — 2026-06-28

Welcome / catch-up doc. Daniel's been heads-down for ~2–3 weeks; this gets you (and your
Claude Code session) fully up to speed on **what Sandbox is now, what got built, how it
works, and how we work together** without stepping on each other.

> **Rob — first thing:** open your Claude Code in this repo and tell it:
> *"Read `CLAUDE.md`, `docs/BUSINESS_CONTEXT.md`, and `COLLABORATION.md` before doing anything,
> then read `docs/handoff/2026-06-28-rob-onboarding.md`."*
> Those four files are how your Claude gets all the context — it can't see Daniel's private
> notes, only what's committed in the repo.

---

## 1. The big shift: the business model changed (June 2026)

Sandbox **used to be** "a Miami-Dade membership league that *we* run." It's now a **B2B2C
network platform**:

- We **don't own courses.** We partner with **existing golf courses** and turn their **unused
  twilight tee times** into bookable, **9-hole, sub-hour, competitive** rounds.
- Format: **2-man scramble** pitch-and-putt is the flagship, but the app supports **all match
  play** — **1v1 and 2v2**, on **Sandbox-format (pitch & putt)** *and* **full regular courses**.
- Golfers **book in the app**, get **matched**, **play**, and build a proprietary **SBX**
  match-play rating (our DUPR equivalent).
- **Three surfaces** (design data so all three read the same tables):
  1. **Golfer app** — what's built now.
  2. **Course portal** — future; courses manage slots/pricing + see revenue/KPIs.
  3. **Sandbox admin** — future; run Majors/tournaments.

**How it makes money (dual):** ~15% **rev-share from courses** + a **booking fee from golfers**.
Payments are **reserve-only for now** (no charge yet; Stripe Connect comes later). Plus
**loyalty points** (Starbucks-style) and a **paid membership** — but **member perks must never
force a course to discount** (fund them from Sandbox margin / yield inventory).

📖 **Full detail + business rules:** `docs/BUSINESS_CONTEXT.md` (source of truth — read it).

---

## 2. SBX — the rating engine (modeled on DUPR)

- **Two numbers:** a **2v2 headline** + a **1v1 secondary** (DUPR splits singles/doubles; so do we).
- **Windowed recompute** (re-solved from each player's last N confirmed matches, not incremental),
  **performance-vs-expectation**, **placement calibration** (unrated until 3 confirmed matches),
  **verification weighting** (booked/ranked full weight, casual ½ — casual *does* move it),
  and a **reliability** score from volume + opponent variety.
- **Only confirmed matches count.** A finished match needs **dual confirmation** (one per side)
  before it feeds SBX or loyalty points. Recompute is **event-driven** (on confirmation) + a
  daily guarded cron safety net.
- Lives in `v1/sql/sbx.sql` + `confirm.sql`.

---

## 3. What got built (the last ~2–3 weeks)

**The golfer product end-to-end (book → match → play → rate):**
- **Booking** at network courses: date-first availability, "near you" geo, course detail with the
  Sandbox-9 scorecard, tee-slot booking. (`courses.jsx`, `courses-data.jsx`)
- **Matchmaking:** 2v2 "do you have a partner?" → invite (consent) or auto-pair solos (SBX-banded),
  foursome formation balanced by effective team strength, 2h-cutoff sweep + refund.
  (`matchmaking.sql`, `foursome.sql`)
- **Matchup reveal**, **partner DM + foursome group chat** (`chat.jsx`), **check-in → live scorecard**.
- **SBX engine** + **dual confirmation** + **loyalty points** + **shot/ball capture**.
  (`sbx.sql`, `confirm.sql`, `loyalty.sql`, `shots.sql`, `player-hole-stats.sql`)
- **Full regular-course support:** real 18-hole courses with tees/pars (`rc_courses`/`rc_tees`/
  `rc_holes`), Killian Greens seeded. (`rc-courses.sql`, `regular-flow.sql`)
- Real **Stats** + **Profile** (real SBX / record / history — no mock numbers).

**The live-scoring UI overhaul (most of this session's work) — now identical across *all*
match types (1v1 & 2v2, Sandbox & Full Course):** `v1/components/screens/match-live.jsx`
- Up-front **"How do you want to score?"** chooser → **Quick Score** vs **+ Track Stats**.
- **Quick Score:** GHIN-style score wheel + a **read-only opponent live scoreboard** (you can't
  enter their score — it streams in via realtime as they tap; "Strokes so far" counts up live).
- **+ Track Stats (shot-by-shot):** per-player cards (avatar + @handle) →
  **Fairway hit?** (directional fairway cross) → **Reached the green?** (✕ / ✓) →
  **Putt made?** (✕ / ✓). 2v2 adds a **"whose ball did the team take?"** scramble pick; 1v1 just
  has a **Continue** (no whose-ball). Score *emerges* from the shot count.
- Team headers show each player's **avatar 9px before the name**; **"Bonus Sandbox Points"**
  callout (forest monogram) nudges Quick Score users into + Track Stats.
- In-progress scoring is **persisted to localStorage**, so backing out mid-hole doesn't lose it.

**Bug fixes / polish this stretch:**
- Killed the **reload flash** (it was the *Profile-setup* screen, not login — `useProfile`
  returned `null` while the session was still resolving). Plus self-host/preload the Bagel font
  and a `vercel.json` so reloads always pull fresh code (no more stale-cache login flashes).
- **Resume an in-progress match** from Stats history or its detail screen (was getting stuck).
- Smoothed the match-launch loading sequence (no more wrong-hole / desktop-frame flashes).
- Removed the ambiguous **"Where on the green"** zone picker (see follow-ups).

---

## 4. Current state / what's live

- **Live:** https://sbx.golf (apex). Host = **Vercel**, auto-deploys on push to `main`,
  **Root Directory = `v1`** (no build step — React via CDN + Babel-in-browser).
- **Backend:** Supabase (Postgres + RLS + Realtime + Auth). All SQL in `v1/sql/` has been applied;
  apply order is documented in `CLAUDE.md`.
- The Next.js app in `web/` is a long-term rewrite target — **features ship in `v1/` first.**

---

## 5. How we work together now (READ `COLLABORATION.md`)

`main` is **production** (every merge auto-deploys). As of 2026-06-28 it's **protected** — nobody
can push to `main` directly; changes go through a **branch → preview → merge** flow:

1. Branch off latest `main`.
2. Edit + commit on the branch; push it; open a Pull Request.
3. **Vercel posts a private preview URL** on the PR — check it on your phone.
4. Happy? **Merge your own PR** (no approval needed) → it goes live.

**Sections = the 5 tabs** (Home / Play / Board / Stats / You). Pick one, **tell Daniel** which
you're taking so you're not in the same files. Each tab's own screen file is safe to own solo;
the **Shared** files (styles, `primitives.jsx`, `match-live.jsx`, `user-data.jsx`, all `sql/`)
affect everyone — **ping before touching.** Full map + the exact git/Claude steps are in
**`COLLABORATION.md`**.

---

## 6. Open follow-ups (not yet done)

1. **Rework the AI "Caddie tip"** — Daniel likes it but it "needs work"; removed from the live
   scoring UI for now. `CaddieTip` + `suggestBall` code kept (unused) in `match-live.jsx` /
   `caddie-data.jsx`.
2. **"Where on the green" picker** — scrapped the ambiguous text-zone grid. Vision: a clay-style
   green render (like `clay-course-hole.png`) with a tappable 9-square grid, **or** a stylized SVG
   green with a fixed frame. `GREEN_ZONES` + zone plumbing still in `match-live.jsx`.
3. **Compress the clay PNGs** (`clay-course-hole.png` ~4.6MB, `clay-tee-mat.png` ~6MB) before real
   traffic; place clubhouse + tee-mat renders once optimized.
4. **Load more South Florida courses** into `rc_courses` (Daniel feeds scorecards; generate inserts).
5. **Full end-to-end test:** book → check in → score → both confirm → watch SBX + loyalty move.

---

## 7. Gotchas your Claude must know

- **Babel-standalone is strict mode.** An undeclared identifier throws `ReferenceError` and the
  screen goes blank. Cross-file components must be in a `/* global ... */` comment and exported via
  `Object.assign(window, {...})`. Most "blank screen" bugs are a stale variable from a refactor.
- **Real user data is synced into `window.MOCK`** by `useRealUserSync` (`user-data.jsx`). Rename a
  `MOCK` field and every screen breaks.
- **Supabase anon key is committed on purpose** (RLS guards data). **Never commit `service_role`.**
- **Email confirmation stays OFF** in Supabase until a real public beta.
- **One shared database.** Coordinate SQL migrations; run one at a time; commit the `.sql` file.
- **Vercel caches** — hard-refresh (`Cmd/Ctrl+Shift+R`) after a deploy to be sure you see it.
