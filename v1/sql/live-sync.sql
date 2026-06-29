-- Sandbox Pitch & Putt — teammate live sync (#4).
-- Run AFTER setup.sql. Idempotent.
--
-- Shares the IN-PROGRESS hole (the shot-by-shot ShotFlow state) between the two
-- teammates on a side. The finalized score already lives on match_holes and
-- syncs via realtime; this adds a per-side scratchpad so either teammate can
-- log shots and both phones mirror the hole as it's built — and it survives a
-- reload or a teammate opening the match mid-hole.
--
--   draft_a — team A's in-progress hole   { stroke, card, phase, putts,
--   draft_b — team B's in-progress hole     puttCard, chosen, history, rev, by }
--
-- It's wiped (set null) the moment the hole is finalized. match_holes is already
-- in the realtime publication and its RLS write policy covers all columns, so no
-- further grants are needed — the existing UPDATE just carries the new column.

alter table public.match_holes
  add column if not exists draft_a jsonb,
  add column if not exists draft_b jsonb;
