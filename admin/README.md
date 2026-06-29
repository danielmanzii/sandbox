# Sandbox Admin (admin.sbx.golf)

Internal admin portal for managing backend data (courses + tee boxes, tee slots,
users/membership, bookings, events). Built the same way as `v1/` — React via CDN +
Babel-in-browser + Supabase, **no build step**. Static site, deployed separately.

Security: uses the **public anon key only** (same as the golfer app). Row-Level
Security + the `is_admin` flag on `profiles` protect every table. **Never** add a
service-role key here — it would be exposed in the browser.

## Run locally
```bash
# from the repo root
python -m http.server 5174
# open http://127.0.0.1:5174/admin/
```

## Deploy to admin.sbx.golf (one-time)
1. **Vercel:** New Project → import `danielmanzii/sandbox` → **Root Directory = `admin`**,
   Framework Preset = **Other** (no build). Deploy.
2. **Custom domain:** In the new Vercel project → Settings → Domains → add `admin.sbx.golf`.
3. **DNS (GoDaddy):** add `CNAME admin → cname.vercel-dns.com`.
4. **Supabase:** Authentication → URL Configuration → add `https://admin.sbx.golf/**` to the
   redirect allowlist.

Auto-deploys on push to `main` like the main site. Access is gated to accounts with
`is_admin = true` on their profile.
