# Handoff: Admin + Course-Manager portal, signup revamp — 2026-06-30 (from Rob)

Daniel — here's everything Rob's Claude built since the 2026-06-28 onboarding note. Big one:
the whole **admin portal** and the **course-partner (manager) portal** now exist, plus a
golfer-app signup overhaul. This is written so **your Claude can pick up the manager-side
editing** without re-discovering how it all fits together.

> **Daniel — point your Claude at this first:**
> *"Read `CLAUDE.md`, `COLLABORATION.md`, `docs/BUSINESS_CONTEXT.md`, then
> `docs/handoff/2026-06-30-admin-manager-portal.md`. The admin portal lives in `admin/` and is
> deployed separately."*

---

## 0. TL;DR of what's new

- **`admin/`** — a brand-new top-level folder: the **admin + course-partner portal**, deployed
  as its **own Vercel project** at **admin.sbx.golf**. Same stack as `v1/` (React via CDN +
  Babel-in-browser + Supabase, **no build step**), anon-key-only, RLS-gated.
- **Course-manager role** — a non-admin login scoped to **one course**. Same admin.sbx.golf URL;
  the login gate routes admins → full dashboard, managers → a course-locked portal.
- **`supabase/functions/`** — two Edge Functions (`create-manager`, `delete-user`) for the few
  actions that need the service-role key.
- **Golfer app (`v1/`)** — signup rebuilt as a step-by-step wizard, centered auth screens,
  animated dock, branded loaders, new users start at **SBX 0**.
- Several **SQL migrations** in `v1/sql/` — see §6 for what must be run.

---

## 1. The admin portal (`admin/`)

Separate Vercel project (**`sandbox_admin`**, Root Directory = `admin`), domain
**admin.sbx.golf**, DNS CNAME `admin → cname.vercel-dns.com`. Auto-deploys from `main` like the
main site. `https://admin.sbx.golf/**` is in the Supabase auth redirect allowlist.

**Architecture mirrors `v1/`:**
- `admin/index.html` — loads React/Babel/Supabase + all the JSX in order (order matters — data
  files before screens before `admin-app.jsx`, which mounts last).
- `admin/components/supabase-client.jsx` — same project + **public anon key**. `useSession` /
  `useProfile` / `signOut`.
- `admin/components/admin-ui.jsx` — shared `Row` / `Field` / `Spinner` / `Mascot`.
- `admin/components/admin-app.jsx` — `Root` → login → **role gate**:
  - `profile.is_admin` → `Dashboard` (sidebar + modules).
  - else → `ManagerGate` → if they manage a course → `ManagerPortal`, else "Not authorised".
- Cross-file sharing uses the same `/* global ... */` + `Object.assign(window, {...})` pattern as
  `v1/`. **Babel-in-browser is strict mode — an undeclared identifier blanks the screen.**

**Admin modules (sidebar):**
1. **SBX courses** (`screens/courses.jsx`) — merged what used to be two modules. One list of every
   golf course (union of `courses` + `rc_courses` by name). Each row has two buttons:
   - **Full course** → real scorecard data (`rc_courses` / `rc_tees` / `rc_holes`): tees, yardage,
     rating, slope, per-hole. Editor in `screens/scorecards.jsx` (`RcEditor`, `TeeRow`, `HoleGrid`).
   - **SBX course** → Sandbox-9 pitch-and-putt (`courses` / `course_holes`): the per-hole
     `sandbox_yards`. Editor `CourseEditor` (same file as the module).
   - **＋ Enter a scorecard** opens `QuickScorecard` — a whole-card grid (rows = tees, cols = holes,
     + par + handicap rows, 9/18 toggle) that writes `rc_courses`+`rc_tees`+`rc_holes` in one go
     (`saveFullScorecard` in `rc-data.jsx`).
   - **Tee colour comes from the tee name** (`teeColor()` map in `rc-data.jsx`) — there is no hex
     picker on purpose.
2. **Tee slots** (`screens/tee-slots.jsx`) — admin-level `tee_slots` editor. The `type`
   (open/event/major) field was **removed** (new model doesn't use it). Status is open/closed.
3. **Users** (`screens/users.jsx`, `users-data.jsx`):
   - Role segment filter: **All / Admins / Managers / Regular** (managers detected via
     `useManagerIds()` reading `course_managers`).
   - Set membership **tier**, toggle **is_admin** (not on self), grant/revoke **guest passes**.
   - **Course access** panel — assign an existing user as a course manager.
   - **+ New manager account** — `CreateManagerForm` → calls the `create-manager` Edge Function
     (mints a login + profile + `course_managers` link).
   - **Danger zone → Delete user** — two-step confirm → `delete-user` Edge Function.
4. **Bookings** (`screens/bookings.jsx`) — view/adjust bookings per course.
5. **Events** (`screens/events.jsx`) — legacy events table; enforces walk-up > member price.

---

## 2. The course-manager portal (this is the part you may pick up)

When a **non-admin who manages a course** signs in, `ManagerGate` renders **`ManagerPortal`**
(`admin/components/screens/manager.jsx`), locked to their course(s). Data layer is
`admin/components/manager-data.jsx`. **All scoping is enforced by RLS** (see §3) — the UI just
never offers anything outside their course.

Sections:
- **Live on course** — realtime board of which hole each foursome is on. Reads the same
  `matches` / `match_holes` the golfers score into (`useLiveOnCourse`, subscribed to realtime).
- **Tee times** — the most-built screen. Top → bottom:
  - Date strip (Play-style).
  - **Interval slider** (3–15 min) + **price-per-golfer slider** ($0–75) + **Walk only / Cart
    included** toggle + **expected daily revenue** chip (driven by the course's real historical
    fill rate via `useCourseFillRate`; the 👁 reveals the formula).
  - **Multi-select window filter** (All day / Morning / Midday / Twilight / Night).
  - **Selection grid** — **dark = live, light = off.** It's a two-state toggle. Selection is
    tracked as **deltas from the live schedule** (`added` / `removed` sets), so by default the dark
    chips == the currently-live times. **Save changes** makes the live schedule (within the viewed
    windows) exactly the dark chips — publishes new ones, removes turned-off ones, **protects any
    slot that already has players booked**.
  - **Live times list** — each row shows the **auto status** + **player avatars** (4 seats) +
    Close/Reopen + delete. It has its **own** window filter.
  - **Auto status** (`teeStatus()` in `manager.jsx`) is derived, not manual:
    `open → searching for 3/2/1 more → booked → in progress → closed`. Computed from how many
    players are booked + booking play state (`playing` → in progress, all `completed` → closed).
    The manager only manually **Close/Reopen**.
- **Daily yardages** — per-day pin distances (`course_hole_days`). `start_booked_match` was
  redefined to seed a starting match from that day's overrides (falls back to `course_holes`).
- **Financials** — booked revenue, Sandbox rev-share (`sandbox_take_pct`), course net, fill rate.

**Manager-side gotchas if you edit this:**
- Add new manager data hooks to `manager-data.jsx` and export via the `Object.assign(window, …)`
  at the bottom; declare them in the `/* global … */` of `manager.jsx`.
- New managers must have **both** a `profiles` row **and** a `course_managers` row (dashboard-made
  auth users don't get a profile automatically — there's no signup trigger).

---

## 3. Database — new tables/functions (all in `v1/sql/`)

- **`membership.sql`** — `profiles.tier` (`walkup|stats|league|plus`), `guest_passes` ledger,
  `use_guest_pass()` RPC (League = 2/mo, Plus = unlimited), and a **security fix**:
  `guard_profile_privileged()` trigger so only admins can change `is_admin` / `tier`.
- **`course-managers.sql`** — `course_managers` table; helper fns **`is_admin()`** and
  **`manages_course(course_id)`** (SECURITY DEFINER, used throughout RLS); `course_hole_days`
  (per-day yardages); RLS so a manager can manage only their own `tee_slots` / `course_holes` /
  `course_hole_days` and **read** only their own `bookings` / `matches` / `match_holes`; redefines
  `start_booked_match` to honour daily yardages. **Note:** the table must be created before
  `manages_course()` (a `language sql` fn is validated at creation) — already ordered correctly.
- **`tee-time-options.sql`** — `tee_slots.includes_cart` boolean.
- **`rc-courses.sql`** — `rc_courses` / `rc_tees` / `rc_holes` (the real scorecards; the golfer
  app's match setup already reads these).
- **`rc-seed-imported-courses.sql`** — seeds **Palmetto Bay**, **Trump National Doral – Blue
  Monster**, **Briar Bay** (yardages transcribed from photos — *verify in admin → SBX courses*).
- **`email-exists.sql`** — `email_exists()` RPC (anon-callable) for the signup "email already in
  use" check.
- **`sbx-default-zero.sql`** — `alter … sbx set default 0` (new users start unrated).

RLS pattern to keep in mind: admin-only writes use `is_admin()`; manager scoping uses
`manages_course()`. Both are SECURITY DEFINER so policies don't recurse.

---

## 4. Edge Functions (`supabase/functions/`)

Two functions hold the **service-role key server-side** (never in the browser). Deploy each once
in **Supabase → Edge Functions** (paste `index.ts`, name it exactly, **Verify JWT OFF** — we
verify the admin caller inside, which also lets the CORS preflight through). No secrets to set.

- **`create-manager`** — admin mints a course-manager login (auth user + profile +
  `course_managers` link). Called by **Users → + New manager account**.
- **`delete-user`** — admin permanently deletes a user (auth account; profile cascades). Called by
  **Users → Danger zone**. Refuses if the user still has matches/bookings referencing them.

Both UIs show a friendly "function isn't deployed yet" message until deployed.

---

## 5. Golfer app (`v1/`) changes

- **Signup is now a wizard** (`v1/components/screens/auth.jsx`, `SignUpView`): one question per
  screen, slides right→left, progress dots. Steps: first name → last name → **email** (inline
  "email already in use" via `email_exists`, with a Sign-in button) → **password** → **gender**
  (choice buttons) → **birthday** (custom scroll-**WheelPicker**) → **display name** (live
  @handle-taken check via the `email_for_handle` RPC, since you're not authed yet) → **Create
  account**. New users are inserted with **`sbx: 0`**.
- **Centered + keyboard-aware + no-scroll** across Welcome / Sign in / Create account. Uses
  `useKeyboardInset()` (visualViewport) to lift content above the keyboard.
- **Branded loader** — `LoadingScreen` in `index.html` is now a bouncing monogram. `Root` has a
  `landing` flag with `window.spp_beginLanding()` / `spp_endLanding()`; signup **and** sign-in
  show it for ~2s, then land on Home.
- **Animated dock** — `TabBar` in `index.html`: icons-only, the active tab expands to reveal its
  label, icon bounces on select (`@keyframes iconBounce` / `sppbounce` in `v1/styles.css`).
- **Icons** (`v1/components/primitives.jsx`): redrawn **Tee** (dimpled ball on a tee) and a longer
  **Search** handle so Play vs Explore are distinct.

---

## 6. What still needs running/deploying (status as of this note)

Rob ran `membership.sql`. The rest may or may not be applied — **verify in Supabase**, all are
idempotent so re-running is safe:

| Item | Type | Action |
|---|---|---|
| `course-managers.sql` | SQL | run (reordered version) |
| `tee-time-options.sql` | SQL | run (the `includes_cart` column) |
| `rc-seed-imported-courses.sql` | SQL | run to add the 3 courses; **verify yardages** |
| `email-exists.sql` | SQL | run (enables the signup email-in-use warning) |
| `sbx-default-zero.sql` | SQL | run (DB default 0; app already writes 0) |
| `create-manager` | Edge Fn | deploy, Verify JWT off |
| `delete-user` | Edge Fn | deploy, Verify JWT off |

To stand up a test/real manager: create the auth user, then ensure a `profiles` row + a
`course_managers` row exist (or just use **Users → + New manager account** once `create-manager`
is deployed).

---

## 7. How we've been working

Same as always: **branch → PR → Vercel preview → merge**, `main` is protected. App-facing changes
got previewed before merge; the admin portal auto-deploys from `main` to admin.sbx.golf. Rob's
Claude has been driving most of this via Claude Code. Shout if any of the manager-portal scoping
or the two-state tee grid needs a second pair of eyes — the RLS + the `added/removed` delta model
are the two places worth understanding before editing.
