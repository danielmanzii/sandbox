# Supabase backend + Challenge a Friend + real user data

Handoff for Daniel — summary of everything Rob & I pushed since your V2 Round 2 commit (`68c77d7`).

## Goal
Turn v1 into a real, usable, logged-in app that Rob and you can play a live 1v1 (or 2v2) match on tomorrow's course. Ship auth, real user data, a match-making flow (Challenge a Friend), live hole-by-hole scoring synced across phones, and per-hole stat capture — all on top of v1's existing look & feel.

## Done

### v1/v2 → v1 only
- `ef35e4a` — **v2 removed.** Per your call that v2 didn't work, the entire `v2/` folder was deleted (~5.5k lines), the V1/V2 switcher pill stripped from `v1/index.html`, and the root `index.html` replaced with a redirect straight to `/v1/`. `CLAUDE.md` updated to two-surface state (v1 + web/).

### Real backend: Supabase
- `b05144b` — Supabase added as the data layer for everything "real".
  - Project URL: `https://rklxjcchgtwgxbeatsoc.supabase.co`
  - Anon key baked into [v1/components/supabase-client.jsx](../../v1/components/supabase-client.jsx) (safe — Row-Level Security guards everything).
  - Schema + RLS policies in [v1/sql/setup.sql](../../v1/sql/setup.sql). **Safe to re-run** (uses `if not exists`, guarded `alter publication`, and `drop policy if exists`). Must be re-run after any schema change below lands.
  - Realtime replication enabled on `matches` and `match_holes` so both phones sync live.

### Auth (end-to-end)
- Welcome → Sign Up / Sign In / Forgot password (in [auth.jsx](../../v1/components/screens/auth.jsx)).
- Signup form: first name, last name, gender, DOB, email, password → writes to `profiles` table without a handle.
- `047e6f8` — **Display name is its own step** after signup. Live availability check (debounced 400ms), format strips to `[a-z0-9_]{3,20}`, shows ✓/✗ inline.
- `b447b96` — **Password reset** via Supabase email link. Lands back on origin; a new `useRecovering` hook latches the `PASSWORD_RECOVERY` auth event and routes into a "Set new password" screen.
- Same commit: **change display name from Match Hub** — tap the `@handle` in the hub header, pencil icon opens the same DisplayNameScreen in edit mode.

### Real user data everywhere
- `e1447bc` — New [v1/components/user-data.jsx](../../v1/components/user-data.jsx) is the key architectural move. It:
  - Loads the signed-in user's matches (plus opponent profiles via FK join) on App mount.
  - Derives W/L/H, streak, season points, and advanced stats (GIR %, avg putts, avg proximity).
  - **Globally overwrites `window.MOCK.USER`, `MOCK.ACTIVITY`, and `MOCK.HISTORY`** with real-data-shaped equivalents before any screen renders.
  - Subscribes to `matches` + `match_holes` realtime changes so the aggregates stay fresh.
- Impact: every v1 screen that reads `MOCK.USER.whatever` now sees the real user without us refactoring each screen. Home greeting, Stats record, Profile name/handle/history, Social leaderboard "you" row — all real.
- Scramble-specific fields we don't track yet (shot usage, proximityByDist, holeWinByDist) are overridden to honest zeros/empty arrays rather than inheriting Alex Rivera's mock numbers.

### Challenge a Friend (the actual playable feature)
- `ef1c4f2` — Full v1 App restored inside an auth gate. Home is back to its original layout, tab bar is back, all six demo screens still reachable.
- `3cbde34` — **Play tab restructured** into Ranked / Unranked segmented control:
  - **Ranked** = existing `EventsScreen` (still mock tournament cards)
  - **Unranked** = new `UnrankedView` with mode cards for 1v1 and 2v2
  - New screen at [v1/components/screens/play.jsx](../../v1/components/screens/play.jsx) wraps both.
  - Home no longer carries a Challenge card (moved to Play per Rob's direction).
- **1v1 (fully working):**
  - Creator picks course + holes → gets a 6-char code (unambiguous alphabet, no 0/O/1/I).
  - Opponent taps Join → types code → match goes `active` → both drop into `MatchLive`.
  - Live scoring: two steppers (your score / opponent), W/H/L auto-computed when both filled, running state badge (`2 UP`, `DORMIE`, etc.), final margin (`3&2`, `1 UP`, `AS`) computed and persisted when clinched.
- **2v2 (functional MVP):**
  - Same flow; creator = player_a, first joiner fills player_a2 (partner), next two fill player_b/player_b2 (opposing team). Match goes active when the 4th slot fills.
  - Live screen shows team-level scoring (e.g. "Rob + Daniel vs María + Leo"). Same match-play logic — lower team score wins the hole.
  - Per-shot stat capture is deliberately 1v1-only for now (see Gotchas).

### Cancel match
- Waiting lobby has a red "Cancel match" button → sets `status='abandoned'`, both phones exit.
- Live match footer has a "Cancel match" link (hidden once decided) with a `window.confirm` prompt.
- Abandoned matches are filtered out of the user's stats aggregation.

### Per-hole stat capture (1v1)
- Schema columns on `match_holes`: `player_a_gir` / `player_b_gir` (bool), `player_a_putts` / `player_b_putts` (int), `player_a_proximity_ft` / `player_b_proximity_ft` (int).
- UI: under the hole's score steppers there's an expandable "Log stats (optional)" panel — GIR toggle, putts 0–5, proximity input.
- Writes go to the current user's column (A or B). Aggregated by `useUserStats` into real GIR %, avg putts, avg proximity + a GIR trend array.

### Recovery
- `a72ef30` — Fixed a blank-grey-screen crash from a stale `opponent` variable left behind when `MatchLive` was refactored to a players map for 2v2.
- `afc4a62` — Two more crash fixes (Profile/Stats tabs): `sbxGlobalRank: null` and `shotUsageTrend: []` were breaking `.toLocaleString()` and sparkline math respectively. Also added a **React ErrorBoundary** at the root so any future render crash shows a "Something glitched — Reset app" card instead of a blank screen, with a button that clears `spp_route` + `spp_active_match` localStorage and reloads.

## Next (priorities roughly in order)

1. **Real tournament/event data model.** Ranked tab still shows mock events. Needs an `events` table, registration flow, capacity/field enforcement, membership gating, eventually Stripe. This is the biggest missing piece before a real beta.
2. **Per-shot tracking for 2v2.** Shot usage, clutch/leadoff/cleanup ratios — these need per-shot rows (who hit, was the ball used). Design a `match_shots` table, wire into the 2v2 live screen, then surface on the Stats page's ScrambleIntel section (currently zeros).
3. **Friends / social.** MOCK.FRIENDS still drives most of Social. Need a `follows` table (or similar) + search-by-handle so the leaderboard and head-to-head show real opponents beyond just the signed-in user.
4. **Membership / Stripe.** MembershipScreen is still purely mock tiers. Billing + entitlement checks for event registration come with this.
5. **Google OAuth.** Rob asked, but it's deferred. Supabase makes it a toggle once you create Google Cloud OAuth credentials and paste the client ID in Supabase → Auth → Providers.
6. **Avatars for real users.** Activity feed uses `AvatarBy` which looks up `MOCK.FRIENDS` for the avatar image. Real users fall through to a grey circle. Either extend MOCK.FRIENDS at sync time with colored initials, or modify `AvatarBy` to render initials when no row is found.

## Gotchas

- **`v1/sql/setup.sql` must be re-run whenever new columns land.** The current file adds `match_type`, `player_a2`, `player_b2`, and the six per-hole stat columns. Safe to run multiple times.
- **Email confirmation must be OFF** in Supabase → Authentication → Providers → Email, otherwise signups can't immediately log in. Re-enable before any public beta.
- **Site URL + Redirect URLs** must include `https://danielmanzii.github.io/sandbox/v1/` in Supabase → Authentication → URL Configuration, otherwise password-reset emails bounce with an invalid-redirect error.
- **Anon key in client code is intentional.** Supabase's `anon` role is designed to be public; the RLS policies in `setup.sql` are what keep data safe. Never paste the `service_role` key anywhere near the client.
- **Real user data is synced into `window.MOCK` globally.** This is the load-bearing design decision — we didn't refactor every screen. If you touch `user-data.jsx` or rename a MOCK field, every screen breaks. The tradeoff was speed vs. clean props threading; we went speed.
- **Route state is persisted in `localStorage.spp_route`.** If a render crashes on a specific screen, the user gets stuck on it even after a fix. The new ErrorBoundary has a Reset button for that case, and it clears `spp_route` + `spp_active_match`.
- **Babel-standalone is strict mode.** Undeclared identifiers throw `ReferenceError`. Most common way to cause a grey-flash-then-blank is a typo or stale variable from a refactor — both crashes we fixed this pass were exactly that.
- **GitHub Pages caches aggressively.** After a push, if the old JS is cached, `Ctrl+Shift+R` (or Cmd+Shift+R on Mac) hard-refreshes to bust it.
- **Tab bar hides on `live`, `resultShare`, `match`, `challenge`** — these screens own their own navigation (back arrow, cancel, etc.). If you add a new "flow" screen, add it to `hideTabs` in `App`.

## Architecture reference

How the auth gate chains in [v1/index.html](../../v1/index.html):

```
Root
 ├─ session undefined  → Loading
 ├─ session + recovery → ResetPasswordScreen
 ├─ session null       → AuthScreens (Welcome / SignUp / SignIn / Forgot)
 ├─ profile null       → ProfileSetupScreen (OAuth edge case only)
 ├─ !profile.handle    → DisplayNameScreen (first-time)
 └─ logged in          → App
                          ├─ useRealUserSync(profile)   // swaps MOCK globally
                          ├─ route.screen switch
                          │   ├─ home   → HomeScreen
                          │   ├─ events → PlayScreen (Ranked | Unranked)
                          │   ├─ stats  → StatsScreen
                          │   ├─ profile→ ProfileScreen
                          │   ├─ social → SocialScreen
                          │   ├─ ...
                          │   ├─ challenge → MatchHub (mode=1v1|2v2)
                          │   │                ├─ Start → code → Waiting → Live
                          │   │                └─ Join  → Live
                          │   └─ match → MatchLive (realtime scoring + cancel + stats)
                          └─ TabBar (hidden on deep screens)
```

## Files touched

**New:**
- `v1/sql/setup.sql` — Postgres schema, RLS, realtime publications
- `v1/components/supabase-client.jsx` — client init + session/profile/recovery hooks
- `v1/components/user-data.jsx` — real-user aggregation + global MOCK sync
- `v1/components/screens/auth.jsx` — Welcome / SignUp / SignIn / Forgot / ResetPassword / DisplayName / ProfileSetup
- `v1/components/screens/match-hub.jsx` — Challenge hub (start / join / waiting / recent list)
- `v1/components/screens/match-live.jsx` — live scoring + stats capture + cancel
- `v1/components/screens/play.jsx` — Play tab Ranked/Unranked wrapper + mode cards

**Modified:**
- `v1/index.html` — Root (auth gate) + App (routing) + ErrorBoundary + all new screens loaded
- `v1/components/screens/home.jsx` — Challenge card removed, greeting uses `profile.first_name`
- `v1/components/screens/profile.jsx` — avatar initial uses real name
- `v1/components/screens/social.jsx` — leaderboard "you" row uses real handle + real record
- `v1/styles.css` — added `@keyframes spin` for the handle-availability spinner

**Root:**
- `index.html` — redirects to `v1/` (was the V1/V2 picker)
- `CLAUDE.md` — two-surface state (v1 + web/)

The Next.js port in `web/` is untouched — still just the home screen scaffold.
