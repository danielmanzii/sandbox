-- Sandbox Pitch & Putt — full stroke-by-stroke shot log.
-- Run AFTER hole-player-ob.sql. Idempotent.
--
-- Until now the guided shot flow computed a per-shot record (each player's
-- outcome on every stroke + whose ball the team took) but only persisted a
-- per-hole summary — the stroke detail was thrown away when the hole ended.
-- These columns keep ALL of it, one JSON array per hole PER SIDE (a single
-- shared column would let team B's write clobber team A's — both teams score
-- into the same match_holes row):
--
--   shot_log_a — team A's log   ·   shot_log_b — team B's log
--
--   [
--     { "shot": 1, "phase": "shot",
--       "outcomes": { "<player_id>": { "fairway": "hit", "reached": true,
--                                      "ob": false, "zone": "back-left" } },
--       "picked": "<player_id>",          -- whose ball the team took
--       "suggested": "<player_id>" },     -- caddie suggestion (if shown)
--     { "shot": 3, "phase": "putt", "round": 1,
--       "results": { "<player_id>": "made" | "missed" } }
--   ]
--
-- 1v1 matches log the same shape with a single player per entry.
-- Reads/writes are already covered by match_holes' existing RLS policies,
-- and match_holes is already in the realtime publication.

alter table public.match_holes
  add column if not exists shot_log_a jsonb,
  add column if not exists shot_log_b jsonb;
