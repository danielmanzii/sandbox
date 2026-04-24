# Phase 5 — Social: follows, avatars, friend feed, notifications

Handoff for Rob — full social layer is shipped and live on https://sbx.golf as of commit `39b2d1c`. Daniel ran every required SQL + dashboard step before this handoff, so the production app is in a working state. Nothing is half-deployed.

## What shipped

### Phase 5.1 — Foundation (commits `8b5305c` → `1b0d9e4`)

- **Follow system** (`v1/sql/social.sql`, `v1/components/social-data.jsx`)
  - Twitter-style directed `follows` table (no acceptance), RLS lets any authed user read, you can only follow/unfollow as yourself.
  - Hooks: `useFollowCounts`, `useIsFollowing`, `useFollowing`, `useFollowers`. All subscribe to `follows` realtime so counts flip instantly on either side.
- **Avatar uploads** (Supabase Storage `avatars` bucket, public)
  - `uploadAvatar({ userId, file })` writes to `<user_id>/avatar.<ext>` and persists the public URL to `profiles.avatar_url`.
  - User-data sync (`user-data.jsx`) threads `avatar_url` into `MOCK.USER` so every screen sees it without a per-screen refactor.
  - **Crop modal** (`v1/components/screens/profile.jsx` → `AvatarCropper`): drag + zoom inside a circular frame, confirms by exporting a 512×512 jpg via canvas. Upload is always ~50–200KB regardless of source.
- **Profile screen** (`profile.jsx`)
  - Real follow/unfollow button on other users' profiles, real follower/following counts.
  - Self avatar circle has a "+" badge that opens the cropper.
  - **Edit profile sheet**: edits first/last name, username (with charset + uniqueness validation), home course, bio. Bottom-sheet style with iOS-style header (Cancel ⟷ title ⟷ Save).
- **User search** (`v1/components/screens/social.jsx` → `FindPlayers`)
  - Search bar at top of Social tab. Debounced 250ms, matches handle + first/last name. Inline Follow/Unfollow per row.
- **Bottom-nav "You" tab** now shows the user's avatar in a 22px circle when set, otherwise the User icon.
- **Universal `@` handle prefix** — added `formatHandle()` to `primitives.jsx` and wired it into every display site (profile header, match-hub header, Play "Playing as", events partner picker). Handles stored as either `"rob"` or `"@rob"` always render as `@rob`.
- **You-tab routing fix**: `TabBar` clears `viewingHandle` on every tap so opening "You" always returns to your own profile (was carrying over the last person you viewed because `go()` does `{...prev, ...next}`).

### Phase 5.2 — Friend feed + notifications (commit `39b2d1c`)

- **Home "The Feed"** is now real activity (`v1/components/screens/home.jsx`):
  - Driven by `useFriendFeed(userId, limit)` — unified time-sorted stream of event signups + completed matches from people you follow (and yourself).
  - Renders `@rob signed up for Crandon ⛳` and `@rob beat @alex · 3&2 🏆` style rows, tappable to that profile.
  - Empty state when `followCount===0` nudges to "Find players" → Social tab.
  - Realtime on `event_registrations`, `matches`, and `follows`.
- **"X friends here" pill** on event cards — `useFriendsRegisteredForEvents(viewerId, eventIds)` returns a `{event_id → [friend profiles]}` map, fed to the new `FriendsHere` avatar-stack component:
  - Small light pill on Home "Up Next" mini cards.
  - Larger overlay pill on the dark hero of `FullEventCard` in the Play tab.
- **Notifications screen** (`v1/components/screens/notifications.jsx`)
  - Now merges match invites + new followers (last 30 days), sorted newest-first via `useNewFollowers`.
  - New `FollowerCard` shows tappable user info + a **Follow back** button (or "You follow each other" once mutual).
  - Bell badge on Home counts both invites + new followers.

## What Daniel already did manually (don't redo)

- ✅ Ran `v1/sql/social.sql` (most recent version — includes `bio`/`home_course` columns, completed-matches RLS, realtime publications for `event_registrations` + `matches`).
- ✅ Created the public `avatars` Storage bucket via Supabase dashboard, ran the storage policies SQL.

If you re-clone or pull, **don't re-run those SQL files** unless the schema has actually changed — they're idempotent so it's safe, but pointless.

## Outstanding / nice-to-have for Phase 5.x

None of these block anything. Pick up if/when you want to.

- **Match-end realtime in feed**: feed refetches on any matches table change, so it'll be a few seconds slow under high write volume. Fine for our scale.
- **2v2 partner attribution in the feed**: `useFriendFeed` only labels player_a vs player_b. For a 2v2 match it shows the team captain, not the partner. Worth fixing once we have real 2v2 data flowing.
- **Friend-feed pagination**: hard-capped at `limit=12` on Home. No "See more" yet — feed currently rolls off after 12 items. Easy add when needed.
- **Notification dot persistence**: badge clears immediately when the items change (since the hooks just look at the current rows). Long-term we probably want a "last seen" timestamp per user to do real "unread" semantics.
- **Profile screen still uses `MOCK.HISTORY` for the recent-matches list** at the bottom — that needs to swap to a real query joining `matches` + per-side result interpretation. Not done in 5.x.
- **Bio/home_course are not shown on public profiles yet** — only on the self-view. Should render those on `PublicStatsBlock` too.

## Gotchas worth knowing

- **`useFriendFeed` always includes the viewer** in the `ids` set so your own activity shows up (not just friends'). Intentional — keeps the empty state from feeling dead when you've followed nobody but you've registered for an event yourself.
- **Friend match RLS**: Phase 5.2 added a policy `Completed matches viewable by authenticated users` on `public.matches`. The original RLS only let players read their own matches; the feed needed broader read access for completed games. In-flight (`waiting`, `active`) matches remain player-gated. If you ever decide to make the feed show *live* friend matches, you'll need to revisit that policy.
- **Realtime channels need unique names per hook instance.** Every hook in `social-data.jsx` does `React.useRef(\`thing-${Math.random()...}\`).current` for this exact reason. If you copy-paste a hook, change the channel-name prefix.
- **Babel-standalone strict mode**: undeclared identifiers blank the screen. New components/hooks must be added to the `/* global ... */` comment of any consumer file *and* exported via `Object.assign(window, { ... })` in the producer file.
- **Crop math (`AvatarCropper`)**: source rect derived from `(renderedW/2 - FRAME/2 - pos.x) / effectiveScale`. If you mess with the centered-image positioning, this formula breaks subtly.
- **Edit Profile inputs were invisible for a while** because `var(--paper)` and `var(--canvas)` are both pure white — the old "filled cream" look was actually rendering, just colored white-on-white. Current version uses literal hex colors (`#F4EFE2` for the field shell, `#1C492A` for focus border) instead of CSS vars to dodge that whole class of bug.

## Files touched this round

```
v1/sql/social.sql                           (avatar_url, bio, home_course, follows, RLS, realtime)
v1/components/social-data.jsx               (every social hook + uploadAvatar + updateProfile)
v1/components/user-data.jsx                 (threads avatar_url + bio + home_course into MOCK.USER)
v1/components/primitives.jsx                (formatHandle helper, Icon.Search)
v1/components/screens/profile.jsx           (full rewrite: real follow, avatar upload, crop modal, edit sheet)
v1/components/screens/home.jsx              (real friend feed, friends-here pills, notification badge)
v1/components/screens/social.jsx            (FindPlayers search section)
v1/components/screens/notifications.jsx     (merged invites + new-follower cards)
v1/components/screens/events.jsx            (FriendsHere on FullEventCard)
v1/index.html                               (TabBar avatar + viewingHandle clear)
```

## Next Phase candidates (Daniel hasn't picked one yet)

- **Phase 6 — Stats**: real Sandbox Rating updates after match completion, populate the dashboard, season leaderboard from real data instead of `MOCK`.
- **Phase 7 — Live scoring polish**: the `match-live.jsx` flow is solid but we could pull in pace-of-play, putts/GIR analytics, longer match formats.
- **Push notifications**: bell badge is in-app only. Web Push for "you got a match invite" / "your friend just signed up" would meaningfully increase engagement.

When you pick up: run the dev server (`python -m http.server 5173` from repo root), hit http://127.0.0.1:5173/, sign in. Everything in 5.x should Just Work against the production Supabase.
