# create-manager (Edge Function)

Lets a signed-in **admin** create a course-manager login (email + password),
its profile, and the `course_managers` link in one call. It holds the
service-role key **server-side** — that key must never be in the browser.

Used by the admin portal's **Users → + New manager account** button.

## Deploy (once)

**Easiest — Supabase Dashboard:**
1. Supabase → **Edge Functions** → **Deploy a new function** (via editor).
2. Name it exactly `create-manager`.
3. Paste the contents of [`index.ts`](./index.ts) and deploy.
4. Open the function's **Settings** → turn **Verify JWT OFF**. (We verify the
   caller is an admin inside the function; this also lets the browser's CORS
   preflight through.)

**Or with the CLI:**
```bash
supabase login
supabase link --project-ref rklxjcchgtwgxbeatsoc
supabase functions deploy create-manager --no-verify-jwt
```

No secrets to set: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` are injected by the platform automatically.

## Prerequisite
The `course-managers.sql` migration must be applied (it creates the
`course_managers` table this function inserts into).
