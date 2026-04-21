# Home screen ported to Next.js — ready for next screen

## Goal
Execute steps 1–5 from the kickoff handoff ([2026-04-20-nextjs-port-kickoff.md](2026-04-20-nextjs-port-kickoff.md)): port design tokens, primitives, mock data, one screen end-to-end, and stub auth — so the Next.js app in `web/` actually does something.

## Done
**Step 1 — Design tokens** → [web/src/app/globals.css](../../web/src/app/globals.css)
- Ported every CSS variable from root `styles.css` (forest, cream, ink, shadows, radii).
- Bridged them into Tailwind v4 via `@theme inline` so `bg-forest`, `text-cream`, `font-display`, etc. work as utility classes.
- Kept legacy utility classes (`.card`, `.card-hero`, `.eyebrow`, `.caption-serif`, `.display`, `.data-num`, `.display-num`, `.paper-tex`, `.forest-tex`, `.grain`, `.scroll-hide`, `.dashed-line`, `.glass`, `.hairline`).
- Moved `@keyframes live-pulse` from inline `<style>` to the global stylesheet.

**Fonts** → [web/src/app/layout.tsx](../../web/src/app/layout.tsx)
- Loaded Archivo, Bagel Fat One, Instrument Serif, and JetBrains Mono via `next/font/google` — self-hosted, zero CLS.
- Font CSS variables wired to the same token names the prototype used (`--font-body`, `--font-display`, `--font-serif`, `--font-mono`).

**Step 2 — Primitives** → [web/src/components/](../../web/src/components/)
- [icons.tsx](../../web/src/components/icons.tsx) — all 20 icons from the prototype as named exports. Import as `import * as Icon from "@/components/icons"` then `<Icon.Flag />`.
- [ui.tsx](../../web/src/components/ui.tsx) — `Button`, `Chip`, `Eyebrow`, `Dashed`, `LiveDot`, `Spark`, `ScoreDial`. All marked `"use client"` since they have interaction.
- [brand.tsx](../../web/src/components/brand.tsx) — `Wordmark`, `Lockup`, `Ostrich`, `SppMark`. Brand SVGs live at [web/public/assets/](../../web/public/assets/).

**Step 3 — Mock data** → [web/src/lib/mock-data.ts](../../web/src/lib/mock-data.ts)
- Typed ports of `MOCK_USER`, `MOCK_FRIENDS`, `MOCK_EVENTS`, `MOCK_LIVE`, `MOCK_ACTIVITY`.
- Still to port from root [components/data.jsx](../../components/data.jsx): `MOCK_YOUR_CARD`, `MOCK_BADGES`, `MOCK_ROUND_HISTORY`, `MOCK_MEMBERSHIPS`, `MOCK_H2H`. Port these as each screen lands.

**Step 4 — Home screen** → [web/src/app/page.tsx](../../web/src/app/page.tsx)
- 1:1 port of `components/screens/home.jsx`: brand bar, Next-up card, quick stats strip, Major banner, activity feed, upcoming events, brand foot.
- Navigation callbacks (`go({...})`) are stubbed to `console.log`. Replace with `useRouter().push()` as routes land.

**Step 5 — Auth stub** → [web/src/lib/auth.ts](../../web/src/lib/auth.ts)
- `getCurrentUser()` returns `MOCK_USER` synchronously. Every screen that needs "the current user" should call this, not read `MOCK_USER` directly.
- When Clerk is ready, swap the body of this function and nothing else should need to change. Full instructions are in the file header.

## Verified
- `npm run build` — clean, 4 static routes, ~12s TS check.
- `npm run lint` — 6 img-tag warnings + 0 errors (intentional, see Gotchas).

## Next
Pick whichever is closest to your strength:

1. **Port the Events list screen** — [components/screens/events.jsx](../../components/screens/events.jsx) → `web/src/app/events/page.tsx`. Wire the home `go({ screen: "events" })` stub into `useRouter().push("/events")`.
2. **Port the Event detail screen** — new route `web/src/app/events/[id]/page.tsx`. Home's Register buttons navigate here.
3. **Port the Live scorecard** — the core match-play UX. This is the hardest one; involves reading `MOCK_LIVE.yourMatch.holes` and rendering W/H/L shape-based result states. Re-read [docs/BUSINESS_CONTEXT.md](../BUSINESS_CONTEXT.md) and the design system section of [CLAUDE.md](../../CLAUDE.md) before starting.
4. **Port Stats / Profile / Social** — lower priority; start with 1–3 above.
5. **Add Clerk for real auth** — once you have a Clerk account + keys in `.env.local`. See [web/src/lib/auth.ts](../../web/src/lib/auth.ts) for the exact swap.
6. **Add a mobile-friendly layout** — the prototype has iOS frame chrome for desktop preview; the Next.js port just lets the app be responsive. If that's wanted, port [components/ios-frame.jsx](../../components/ios-frame.jsx).

## Gotchas
- **Tailwind v4 (not v3).** Config lives in `globals.css` via `@theme inline`. Don't try to add `tailwind.config.ts` — it's not the v4 way.
- **`<img>` vs `next/image`.** The port uses plain `<img>` tags (matching the prototype). Lint warns on every one. For production, switch to `next/image` *and* add Unsplash + avatar hosts to `next.config.ts` under `images.remotePatterns`.
- **`"use client"` directive.** Components with interactivity (buttons, hooks) need this at the top. The Next.js App Router renders server components by default — server components can't handle `onClick`. `ui.tsx` is `"use client"` because Button has state. `page.tsx` is `"use client"` because of the stub nav handler.
- **Home's nav is stubbed.** Every `go({...})` call is a `console.log`. Replace with `useRouter().push(...)` as you build each route.
- **Fonts warm-up.** First `npm run dev` fetches the Google Fonts — takes ~30s. Subsequent runs are cached.
- **Root prototype still runnable.** `python -m http.server 5173` from the repo root still serves the legacy app. Use for visual reference while porting.

## Files touched
- `web/public/assets/` (new — 10 brand SVGs)
- `web/src/app/globals.css` (rewritten with design tokens)
- `web/src/app/layout.tsx` (font loading)
- `web/src/app/page.tsx` (home screen port)
- `web/src/components/icons.tsx` (new)
- `web/src/components/ui.tsx` (new)
- `web/src/components/brand.tsx` (new)
- `web/src/lib/mock-data.ts` (new)
- `web/src/lib/auth.ts` (new)
- `docs/handoff/2026-04-20-home-screen-ported.md` (this file)
