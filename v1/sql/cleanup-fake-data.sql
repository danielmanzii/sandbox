-- ─────────────────────────────────────────────────────────────────
-- Cleanup: remove fictional/seed data so the app only ever shows REAL
-- user + course data. Safe to re-run.
--
-- What this removes:
--   * The 5 fictional seed EVENTS (deterministic ids 1111…1101–1105 from
--     the old seed-events.sql). Their event_invites / registrations are
--     removed automatically (both FK with ON DELETE CASCADE).
--
-- What this intentionally KEEPS:
--   * All real profiles (your test accounts are real users — not touched).
--   * Killian Greens courses / tees / holes (a real network course).
--
-- NOTE on ratings: the SBX engine was rewritten (see sbx.sql). After
-- applying sbx.sql, recompute everyone cleanly with:
--     update public.profiles set sbx = null, sbx_2v2 = null, sbx_1v1 = null;
--     select public.recompute_sbx();
-- ─────────────────────────────────────────────────────────────────

delete from public.events
where id::text like '11111111-1111-1111-1111-%';
