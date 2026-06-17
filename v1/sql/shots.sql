-- Sandbox Pitch & Putt — Ball-selection + shot capture (Phase D3).
-- Run AFTER sbx.sql. Idempotent.
--
-- Per-hole capture for 2v2 scramble (seamless, one-tap):
--   ball_player — whose ball the team played this hole  (shot-usage data)
--   holed_by    — who sank the putt                     (clutch stat)
--   zone        — ball position on the green (optional)  (feeds AI suggestion)

alter table public.match_holes
  add column if not exists ball_player uuid references public.profiles(id),
  add column if not exists holed_by    uuid references public.profiles(id),
  add column if not exists zone        text;
