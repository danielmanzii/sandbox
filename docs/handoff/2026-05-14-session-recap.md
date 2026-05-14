# Handoff — 2026-05-14

Written by Rob's Claude session. Everything below is live on `main` and deployed to sbx.golf.

---

## What was done this session

### 1. Sample / mock data cleared (`v1/components/data.jsx`)
All fake placeholder data has been wiped. These arrays/objects are now empty stubs:
- `MOCK_FRIENDS = []`
- `MOCK_EVENTS = []`
- `MOCK_LIVE = { currentHole: 0, yourMatch: null, matches: [] }` (safe shape — don't set to null, crashes)
- `MOCK_YOUR_CARD = null`
- `MOCK_BADGES` — now has **20 real badges** (all `locked: true`; see below)
- `MOCK_ROUND_HISTORY = []`
- `MOCK_ACTIVITY = []`
- `MOCK_H2H = []`
- `MOCK_MEMBERSHIPS` — kept, unchanged (real pricing content)

Real user data continues to flow in via `useRealUserSync` (user-data.jsx), which overwrites `MOCK.USER`, `MOCK.ACTIVITY`, and `MOCK.HISTORY` for signed-in users.

---

### 2. 20 badges defined (`v1/components/data.jsx`)
All start `locked: true`. Unlock logic is not yet wired — when a badge is earned, flip `locked: false` and set `count`. Categories: Match Play, Streaks, Participation, Achievement, Social/Partner. Full list in `MOCK_BADGES`.

---

### 3. Null guards added (crash prevention)
- `v1/components/screens/social.jsx` — `LiveLeaderboard` now returns an empty state when no live event, instead of crashing on `MOCK.LIVE.yourMatch`
- `v1/components/screens/membership-live-share.jsx` — `LiveScorecardScreen` returns "No live match" empty state when `MOCK.YOUR_CARD` is null
- `index.html` TWEAK_DEFAULTS — `liveMode` changed from `true` to `false`

---

### 4. Events (.ics calendar download, Coming Up state, partner tagging, admin UI)
All shipped in earlier commits this session:
- **"Add to Calendar"** — downloads a real .ics file from the event detail screen
- **"Coming Up" state** — registered users see a "Coming Up ✓" pill instead of "Grab spot"
- **Partner invite** — selecting a partner auto-registers them and sends a `event_invites` notification
- **Admin event creation** — "+" button in the Events header (admins only); edit button on event detail for admins
- **Event invites table** — SQL at `v1/sql/event-invites.sql`; run this in Supabase if not already done

To grant admin: `UPDATE public.profiles SET is_admin = true WHERE id = '<uuid>';`

---

### 5. Notification system
- **Bell dot** — only lights up for *unseen* notifications (reads localStorage key `spp_seen_notifs` set by NotificationsScreen)
- **New / Old News split** — NotificationsScreen shows unseen items under "New", seen items under "Old News" at reduced opacity; items are marked seen on visit
- **Event invite cards** — partner invites show "Looks good / Decline"; general invites show "View event / Dismiss"

---

### 6. Social leaderboard (real data)
`LiveLeaderboard` in `social.jsx` now reads from `useLiveEvent()`, `useNextMajor()`, and `useUpcomingEvents()` instead of MOCK data.
- No live event → "No live leaderboard available. Next match is: [next event card]"
- Live event → shows real course name; individual match board is stubbed ("coming soon") — needs real match-board query when ready

---

### 7. Stats screen cleanup
- **Badges tab** — "Collected · X of Y" is now dynamic; locked badges render greyed out with lock icon; unlocked badges show full color
- **You tab** — "Hole win %" and "Best win" computed from real `MOCK.USER` fields; "How it moves" and "Win rate by rating" sections hidden until user has match history; match history shows empty state when empty
- **H2H tab** — "Best Pairing" hero reads from real `MOCK.H2H`; shows "No pairings yet" empty state when empty

---

### 8. Profile screen
- **Avatar zoom** — tapping another user's profile picture opens a fullscreen dark overlay (same as the home.jsx `AvatarBy zoomable` pattern); self-view still opens the photo picker
- **Followers / Following tappable** — both counts are buttons; tap opens a `FollowListSheet` bottom sheet with real Supabase data (`useFollowers` / `useFollowing` hooks); tap any person to navigate to their profile
- **"Events" → "Events attended"** in both the profile header strip and the stats card
- **Menu changes**:
  - "My membership" → "Manage my membership"
  - "Guest passes · 2 left" → "View my guest passes"
  - "Notifications" row removed

---

### 9. Guest Passes sheet (`v1/components/screens/profile.jsx` — `GuestPassesSheet`)
- Opens from the profile menu
- Ticket count by tier: League = 2, Plus = 4, others = 0
- Ticket cards show the standing bird logo (`assets/mascot-full-cream.svg`), dashed tear line
- Usage stored in localStorage key `spp_guest_passes = { used: N, month: 'YYYY-MM' }`; auto-resets when month changes
- Tapping a live ticket → event picker sub-sheet → selecting an event navigates to that event detail and closes the sheet
- Used tickets grey out with "Resets [date]" text

---

### 10. Membership screen (`v1/components/screens/membership-live-share.jsx`)
- "Stats" tier renamed to **"Stats Add On"**, price updated to **$10/mo**
- **Sandbox League** perks now include "Stats Add On included"
- Selecting a plan actually calls `setTier(id)` (was previously a no-op), persists to `localStorage.spp_tier`, and marks `spp_tier_explicit = '1'`; shows "✓ Plan updated" then navigates back
- Current plan shows "Active" badge on non-highlighted cards

### Tier defaults
- New users: **Walk-up** (changed from League in TWEAK_DEFAULTS)
- Admins (`profile.is_admin = true`): auto-elevated to **Plus** on first load if no explicit tier has been set (`spp_tier_explicit` key absent from localStorage)

---

## What still needs to be done / known gaps

- **Badge unlock logic** — no backend trigger wires earned badges yet. When building this, flip `locked: false` server-side (or via a Supabase function) and push the update to the client.
- **Live match board** — the Social "Live" tab shows the live event header but says "Live match board coming soon." Needs a query against the `matches` table filtered by event to populate real rows.
- **Guest pass enforcement** — the guest pass sheet subtracts from localStorage only. No server-side enforcement yet; a proper implementation would write to a `guest_pass_usage` table.
- **Membership billing** — tier selection is client-only (localStorage). No Stripe or billing integration. When billing is added, the `spp_tier` localStorage value should be overridden by the DB subscription status.
- **Admin grant for Daniel** — to make Daniel an admin, run: `UPDATE public.profiles SET is_admin = true WHERE id = '<daniel-uuid>';` in Supabase SQL editor. You need his UUID from `auth.users`.

## Key files touched this session

| File | What changed |
|------|-------------|
| `v1/components/data.jsx` | All mock data cleared; 20 badges added |
| `v1/components/screens/home.jsx` | Notification dot uses seenIds; Coming Up pill; isRegistered from hook |
| `v1/components/screens/events.jsx` | Calendar download; Coming Up state; partner search; admin create/edit; invite sheet |
| `v1/components/screens/notifications.jsx` | New/Old News split; seenIds localStorage |
| `v1/components/screens/social.jsx` | LiveLeaderboard reads real DB hooks |
| `v1/components/screens/stats.jsx` | Dynamic badge count; StatsYou/H2H cleaned |
| `v1/components/screens/profile.jsx` | Avatar zoom; tappable followers/following; GuestPassesSheet; menu updates |
| `v1/components/screens/membership-live-share.jsx` | Stats Add On; real tier switching; null guard on LiveScorecardScreen |
| `v1/components/events-data.jsx` | useNextEventForUser returns isRegistered; sendEventInvite; createEvent; updateEvent |
| `v1/sql/event-invites.sql` | New table for event invites (partner + general) |
| `v1/index.html` | liveMode default false; tier default walkup; admin auto-elevation to plus |
