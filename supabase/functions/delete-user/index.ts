// delete-user — Supabase Edge Function (server-side, holds the service-role
// key). Lets a signed-in ADMIN permanently delete a user: removes the auth
// account, which cascades to their profile (and anything FK-cascaded off it).
//
// Deploy (once):
//   supabase functions deploy delete-user --no-verify-jwt
// (We verify the caller is an admin inside the function; that also lets the
// CORS preflight through. SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY are
// injected by the platform.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    // Verify the caller is a signed-in admin.
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await caller.auth.getUser();
    if (uErr || !user) return json({ error: "Not signed in." }, 401);

    const admin = createClient(url, service);
    const { data: prof } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (!prof || !prof.is_admin) return json({ error: "Admins only." }, 403);

    const { userId } = await req.json();
    if (!userId) return json({ error: "userId is required." }, 400);
    if (userId === user.id) return json({ error: "You can't delete your own account here." }, 400);

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      // Most common: the user still has matches/bookings referencing them.
      return json({ error: delErr.message || "Could not delete the user." }, 400);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error)?.message || "Unexpected error." }, 500);
  }
});
