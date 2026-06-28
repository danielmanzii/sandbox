# Working together (Daniel + Rob)

Goal: either person can **independently** edit a section, **preview it live**, and only
then decide to ship it — without stepping on each other or breaking the live site.

`main` is **production**: the moment something lands on `main` it auto-deploys to
**https://sbx.golf**. So nothing goes to `main` until it's been previewed and you're happy.

---

## The loop (every change, every time)

1. **Start fresh from `main`** and make your own branch.
2. **Edit + commit** on that branch.
3. **Push the branch + open a Pull Request (PR).**
4. **Vercel auto-builds a private preview URL** and posts it on the PR. Open it, test on your phone.
5. **Happy? Merge your own PR** → it deploys to sbx.golf. **Not happy?** Keep editing on the branch (the preview updates on each push), or just close the PR.
6. **Delete the branch.**

You never wait on each other — you each preview and merge your **own** work.

### If you use Claude Code (you both do)

You don't have to memorize git. Tell your Claude, e.g.:

> "Branch off the latest `main` as `rob/board-leaderboard`, then [the change you want].
> When it's done, push it and open a PR."

and when you've checked the preview:

> "Merge the `rob/board-leaderboard` PR into main and delete the branch."

Claude runs the git/`gh` commands for you. The exact commands it'll use are at the bottom
if you ever want to do it by hand.

### Branch names

`<your-name>/<section>-<short-thing>` — e.g. `daniel/play-booking-ui`, `rob/board-follow-button`.
The `<section>` part is just so you both can see at a glance what each branch touches.

---

## Who owns what (the 5 sections = the 5 tabs)

Pick a section before you start and tell the other person. Each section's **own screen file**
is safe to edit solo. The **Shared** list at the bottom affects everyone — coordinate first.

### 🏠 Home
- `v1/components/screens/home.jsx`

### ⛳ Play  (booking, matches, challenge, live scoring — the biggest section)
- `v1/components/screens/play.jsx`
- `v1/components/screens/courses.jsx`  (Book / Course detail / My Rounds / Matchup / Match detail)
- `v1/components/screens/match-hub.jsx`  (Challenge a Friend)
- `v1/components/screens/events.jsx`  (tournaments)
- `v1/components/screens/chat.jsx`
- `v1/components/screens/membership-live-share.jsx`
- data hooks: `courses-data.jsx`, `events-data.jsx`, `invite-data.jsx`, `loyalty-data.jsx`, `caddie-data.jsx`, `chat-data.jsx`, `live-data.jsx`

### 🏆 Board
- `v1/components/screens/social.jsx`

### 📊 Stats
- `v1/components/screens/stats.jsx`

### 👤 You
- `v1/components/screens/profile.jsx`
- `v1/components/screens/auth.jsx`  (sign up / sign in / profile setup)

---

## ⚠️ Shared — DON'T touch without a heads-up to the other person

These power **multiple tabs**. A change here can break the whole app, so message each
other before editing, and keep these changes in their own small PR.

- `v1/index.html` — the app shell: routing, the tab bar, the phone frame
- `v1/styles.css` — design tokens (colors, fonts) — touches every screen
- `v1/components/primitives.jsx` — shared `Icon`, `Button`, `Chip`, etc.
- `v1/components/supabase-client.jsx` — login/session
- `v1/components/user-data.jsx` — pushes the real signed-in user into every screen
- `v1/components/data.jsx` — mock data still used in places
- `v1/components/ios-frame.jsx`
- `v1/components/social-data.jsx` — **Board** owns it, but it also drives avatars/follows on **You**
- `v1/components/screens/match-live.jsx` — **Play** owns it, but it's also opened from **Home** and **Stats** (resume/finish a live match)
- `v1/components/notifications-data.jsx` + `screens/notifications.jsx` — the bell, reachable from several tabs
- **Everything in `v1/sql/`** — you share **one** Supabase database. Only one person runs a
  migration at a time, commit the `.sql` file so the other knows, and never run two at once.

> Reality check: the tabs aren't 100% isolated in code (Play's live-scoring screen is reached
> from Home and Stats, shared buttons/styles, one database). So "section ownership" is mostly
> about **coordination**, not a hard wall. When in doubt, ping each other.

---

## Don't break production

- **Never commit a `service_role` key.** The Supabase **anon** key in `supabase-client.jsx` is
  public on purpose (RLS guards the data) — that one's fine.
- Keep `main` runnable. If a preview looks broken, **don't merge** — fix it on the branch first.
- After merging, hard-refresh sbx.golf (`Cmd/Ctrl+Shift+R`) to confirm it's live.

---

## Raw git commands (only if you're not using Claude)

```bash
# 1. fresh branch off latest main
git checkout main && git pull
git checkout -b daniel/play-booking-ui

# 2. ...edit files..., then:
git add -A && git commit -m "Play: tweak booking sheet"

# 3. push + open a PR (needs the GitHub CLI `gh`)
git push -u origin daniel/play-booking-ui
gh pr create --fill

# 4. Vercel posts the preview URL on the PR — open it, test.

# 5. happy → merge your own PR, then clean up
gh pr merge --merge --delete-branch
```
