// create-manager — Supabase Edge Function (server-side, holds the service-role
// key that must NEVER be in the browser). Lets a signed-in ADMIN mint a course-
// manager login in one step: creates the auth user, a profile row, and the
// course_managers link.
//
// Deploy (once):
//   supabase functions deploy create-manager --no-verify-jwt
// We verify the caller is an admin INSIDE the function, so --no-verify-jwt is
// correct (it also lets the CORS preflight through). SUPABASE_URL / ANON_KEY /
// SERVICE_ROLE_KEY are injected automatically by the platform.
//
// The admin portal calls it via supabase.functions.invoke('create-manager', …);
// supabase-js attaches the caller's JWT, which we check below.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    // 1) Verify the caller is a signed-in admin.
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: uErr } = await caller.auth.getUser();
    if (uErr || !user) return json({ error: "Not signed in." }, 401);

    const admin = createClient(url, service);
    const { data: prof } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (!prof || !prof.is_admin) return json({ error: "Admins only." }, 403);

    // 2) Validate input.
    const { email, password, courseId, firstName, lastName, handle } = await req.json();
    if (!email || !password || !courseId) return json({ error: "Email, password and course are required." }, 400);
    if (String(password).length < 8) return json({ error: "Password must be at least 8 characters." }, 400);

    // 3) Create the auth user (auto-confirmed so it can log in immediately).
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: String(email).trim(),
      password: String(password),
      email_confirm: true,
    });
    if (cErr || !created?.user) return json({ error: cErr?.message || "Could not create the login." }, 400);
    const newId = created.user.id;

    // 4) Profile row (no signup trigger exists, so we make it here).
    const { error: pErr } = await admin.from("profiles").upsert({
      id: newId,
      first_name: (firstName || "Course").toString().trim(),
      last_name: (lastName || "Manager").toString().trim(),
      handle: handle ? String(handle).replace(/^@/, "").trim() : null,
    }, { onConflict: "id" });
    if (pErr) return json({ error: "Login created, but profile failed: " + pErr.message }, 500);

    // 5) Link as a manager of the course.
    const { error: mErr } = await admin.from("course_managers").insert({
      user_id: newId, course_id: courseId, role: "manager", created_by: user.id,
    });
    if (mErr) return json({ error: "Login created, but linking the course failed: " + mErr.message }, 500);

    return json({ ok: true, userId: newId, email: String(email).trim() });
  } catch (e) {
    return json({ error: (e as Error)?.message || "Unexpected error." }, 500);
  }
});
