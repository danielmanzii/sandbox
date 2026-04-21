# Next.js port — kickoff

## Goal
Start the migration from the root prototype (React-via-CDN + Babel-in-browser) to a production Next.js app, living in `web/`, so we can later wire in Postgres + Clerk + Stripe and wrap with Capacitor for the app stores.

## Done
- Scaffolded Next.js 16 app at `web/` via `create-next-app`:
  - TypeScript, Tailwind v4, ESLint, App Router, `src/` layout, `@/*` import alias
  - Dependencies installed (`node_modules/` is gitignored)
  - Dev server runs on `http://localhost:3000` via `npm run dev` from `web/`
- Deleted the auto-generated `web/CLAUDE.md` and `web/AGENTS.md` — root `CLAUDE.md` is the single source of truth (Claude Code reads parent CLAUDE.md files automatically).
- Updated root `CLAUDE.md` to document the two-codebase state: root = legacy prototype (reference only), `web/` = where new work goes.
- Still just the create-next-app boilerplate inside `web/src/app/page.tsx` — no screens ported yet.

## Next
In rough order:
1. **Design tokens.** Port the forest/cream palette and font stack (Bagel Fat One, Archivo, Instrument Serif, JetBrains Mono) from `styles.css` into `web/src/app/globals.css` as Tailwind v4 `@theme` tokens. Do NOT color-port the W/H/L result states — those are shape-based (see CLAUDE.md design system).
2. **Shared primitives.** Port `components/primitives.jsx` (Icon, Button, Chip, Wordmark, Ostrich) to `web/src/components/` as TypeScript components.
3. **Mock data layer.** Move `components/data.jsx` to `web/src/lib/mock-data.ts`. Keep it mock-backed for now — we'll swap for Postgres later.
4. **First screen.** Port the simplest screen first (probably the home/dashboard) to validate the stack end-to-end before tackling the Live Scorecard.
5. **Auth stub.** Add Clerk once >1 screen needs a logged-in user.

## Gotchas
- **Tailwind v4**, not v3. Config lives in `globals.css` via `@theme`, not `tailwind.config.js`. Many tutorials online are still v3.
- **React 19** is the runtime — some older libs may lag compatibility.
- The legacy prototype uses **CSS custom properties on `:root`** in `styles.css`. Tailwind v4's `@theme` is the equivalent pattern — map 1:1.
- Don't touch the prototype's `styles.css` tokens without checking cascades — per root CLAUDE.md.
- Match-play scoring (W/H/L) and SBX rating rules live in the business-context doc — read `docs/BUSINESS_CONTEXT.md` before porting any scorecard code.

## Files touched
- `web/` (new — entire Next.js scaffold)
- `CLAUDE.md` (documented two-codebase state, updated run + project map sections)
- `docs/handoff/2026-04-20-nextjs-port-kickoff.md` (this file)
