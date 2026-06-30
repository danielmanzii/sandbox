-- Sandbox Pitch & Putt — persist per-player OB (#stats).
-- Run AFTER player-hole-stats.sql. Idempotent.
--
-- The Penalty / OB tap is already made during scoring but only used to bump the
-- stroke count — it was never stored per player. Persisting it lets us build
-- rescue-based stats (Clutch %: your partner went OB / missed the green / missed
-- the fairway and your ball saved the hole). Going forward, every clickable
-- per-player input in scoring should land here so new stats are just a query.

alter table public.hole_player_stats
  add column if not exists ob boolean;
