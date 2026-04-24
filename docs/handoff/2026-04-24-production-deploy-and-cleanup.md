# Production deploy live + repo cleanup + doc sync

Handoff for Rob — quick note on the production wiring + a few cleanup commits stacked on top of yours from earlier today.

## Done

### Production deploy
- **Live at https://sbx.golf** — apex is the canonical, `www.sbx.golf` 307-redirects to it.
- **Vercel** is the host. Project name `sandbox` under team `sbxgolf-3133`. Framework Preset = **Other** (no build step). **Root Directory = `v1`** so the app serves from the URL root with no `/v1/` path in the address bar. Auto-deploys on every push to `main`.
- **Vercel preview URL** that always tracks production: `sandbox-beryl-seven.vercel.app`.
- **DNS** at GoDaddy:
  - `A @ → 76.76.21.21`
  - `CNAME www → cname.vercel-dns.com`
- **HTTPS** auto-provisioned by Vercel via Let's Encrypt — both apex and www are on TLS.
- Vercel shows a yellow "DNS Change Recommended" badge (working but they suggest using their nameservers for resilience). Not blocking, didn't act on it.

### URL polish (post-initial-deploy)
- Apex `sbx.golf` is canonical; `www.sbx.golf` redirects 307 to apex (was the other way at first).
- Vercel Root Directory set to `v1` so users see `https://sbx.golf/<screen>` with no `/v1/` prefix.
- Root `index.html` (the redirect script) is now Vercel-invisible but still useful for local dev (`python -m http.server` from repo root).
- Root redirect script updated earlier to preserve `?query` and `#hash`, so Supabase auth callbacks land safely even if anyone reaches it.

### Cleanup
- Deleted orphan `v2/` directory (was just empty subfolders + `.bak` files left over after your `ef35e4a` commit removed the tracked v2 files).
- Deleted root `/assets/` (only `.bak` backups remained — the live brand SVGs all live inside `v1/assets/`).
- Deleted `Sandbox Pitch & Putt App.html` (gitignored duplicate from the very first Claude Design export).

### Doc sync
- **CLAUDE.md** rewritten to reflect post-v2 reality: production URL section, Supabase backend section, accurate project map (v1 only), updated gotchas (added Babel-strict-mode, MOCK-globals warning, hideTabs reminder, Vercel cache).
- **.env.example** updated: dropped Clerk (since we went Supabase), added Supabase vars for the eventual `web/` port to read from. Notes that `v1/` reads from inlined keys and needs no env setup.

## Supabase URL Configuration — done

Supabase Auth → URL Configuration was updated by Daniel. The old config pointed at `https://danielmanzii.github.io/sandbox/v1/` (a GitHub Pages URL that was never deployed). New values now match the Vercel deploy + canonical-apex + no-`/v1/`-in-URL setup:

- **Site URL:** `https://sbx.golf/`
- **Redirect URLs (allowlist):**
  - `https://sbx.golf/**`
  - `https://www.sbx.golf/**`
  - `https://sandbox-beryl-seven.vercel.app/**`

`/**` is the Supabase wildcard — covers any path under each origin. Password reset + email confirm flows verified working end-to-end.

## Next (continuing your priority list)

Your handoff already laid out the right priorities (real events table, per-shot tracking for 2v2, friends/social, membership/Stripe, Google OAuth, real avatars). No changes from me — picking those up in order makes sense.

One small one to add: **`web/` port now has a real production URL pattern to mirror** when it's time to flip the cutover. Same Vercel project can host both surfaces by changing the Output Directory + Framework Preset, or by spinning up a second Vercel project pointed at `web/` with its own subdomain (e.g. `next.sbx.golf`) for parallel testing before cutover.

## Files touched

- `CLAUDE.md` — rewritten
- `.env.example` — Supabase vars added, Clerk removed
- `docs/handoff/2026-04-24-production-deploy-and-cleanup.md` (this file)
- Deleted: `v2/`, `assets/`, `Sandbox Pitch & Putt App.html`
