-- Sandbox Pitch & Putt — persist per-player OB + raw on-green (#stats).
-- Run AFTER player-hole-stats.sql. Idempotent.
--
-- Two per-player columns the scoring UI already captures but never stored:
--   ob       — the Penalty / OB tap (powers OB rescues in Clutch %).
--   on_green — did the player's ball reach the green AT ALL this hole, regardless
--              of regulation. `gir` now means a PURE green-in-regulation (your
--              ball, every shot, within par−2), so Clutch's "partner missed the
--              green" needs this rawer signal to stay correct.
-- Going forward, every clickable per-player input in scoring should land here so
-- new stats are just a query.

alter table public.hole_player_stats
  add column if not exists ob       boolean,
  add column if not exists on_green boolean;
