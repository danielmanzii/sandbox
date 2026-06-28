# Explore tab overhaul (Board → Explore) — 2026-06-28

From Rob. Shipped to `main` (PR #3) and live on sbx.golf. Heads-up because it
touches two **shared** files — see the ⚠️ section so we don't collide.

## What shipped

Renamed the **Board** tab to **Explore** and rebuilt it as a single scrollable
page (`v1/components/screens/social.jsx`):

- **Prominent search** — forest search bar pinned at the top; live results by
  name or @handle with inline Follow.
- **Your band rank** — card showing where you sit inside your SBX band, e.g.
  *3rd of 8 in the 3.000–3.999 band*, with your exact SBX. Shows a "not rated
  yet" prompt when you have fewer than 3 confirmed matches.
- **Top 10** — top 10 players by Sandbox Rating; tap a row → their profile.
- **Stat leaders** — records across all rated players: Highest SBX, Most
  matches, and **Best 2v2 win / Best 1v1 win** shown as the most dominant
  winning margin in match-play notation (e.g. `7&6`), not an SBX number.
  Tapping a card opens that player's profile.
- Live-now banner kept (only appears when a match is in progress).

The old Live / Season / All-time segmented control is gone (folded into the
single page).

### Profile changes (the "click a player" destination)

- Viewing **another player** now loads **their** match history (was hard-wired
  to the signed-in user's `MOCK.HISTORY`).
- Public profile now shows **real** data instead of old hardcoded placeholders:
  Home course, Joined date (from `created_at`), Events attended, and the SBX
  card's W–L–H record — all from `useUserStats`. Bio now shows for other users
  too.
- **Match history rows** now show full teams (you + partner **vs** opp + opp2)
  for 2v2 instead of a single "vs opp". Every @handle in a row is individually
  clickable → opens that player's profile. **Only the score** (e.g. `3&2`)
  opens the scorecard/match detail — the row is no longer one big button.

## How it's wired (so you don't have to re-read the diff)

- New per-user match history is built **locally in profile.jsx** from
  `useUserStats(targetId).recentMatches`. Partner/second-opponent handles that
  aren't in the joined match rows (`player_a2` / `player_b2`) are resolved by id
  via a single `profiles` lookup (`usePlayerDirectory` — local to profile.jsx).
  **`user-data.jsx` was intentionally NOT touched.**
- `useBiggestWin(matchType)` in social.jsx queries completed matches and parses
  `final_margin` (`marginUp()` pulls the holes-up number) to find the biggest
  win per format.
- `useSbxLeaderboard` (in `social-data.jsx`) was reused as-is — not modified.

## ⚠️ Shared files touched

- **`v1/index.html`** — one line only: tab label `Board` → `Explore`. The route
  id is unchanged (still `social`), so routing / `go()` are untouched.
- **`v1/components/screens/profile.jsx`** (You tab) — the profile changes above.
  Daniel: if you're mid-edit here, ping me before you pull.

Everything else is in `social.jsx` (Board's own file).

## Gotchas worth knowing

- `useUserStats(profileId)` returns the **stats object directly**, not a
  `[value, loading]` tuple. (Cost me a blank-screen crash — array-destructuring
  it throws "destructure non-iterable".)
- For self, profile match history now does a live `useUserStats` fetch instead
  of reading `MOCK.HISTORY`, so there's a brief "Loading…" before rows appear.

## Possible follow-ups (not done)

- 2v2 rows put 4 handles on one line; on a narrow phone they wrap. Could stack
  the two teams on separate lines if it reads cramped.
- Real avatars in the Top 10 / search rows (currently initials when no
  `avatar_url`).
- The inline profile match-history score opens the `matchDetail` **screen**,
  while the "View all" sheet opens the `MatchScorecardSheet` **overlay** — two
  different scorecards. Could unify.
