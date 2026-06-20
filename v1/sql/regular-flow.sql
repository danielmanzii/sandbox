-- Sandbox Pitch & Putt — Regular-course match support. Run after rc-courses.sql.
-- format: 'pp' (pitch & putt, default) | 'regular' — drives the scorecard
-- (real pars + Fairway tracking). Fairway columns store the directional
-- cross result per player ('hit' | 'left' | 'right' | 'long' | 'short').

alter table public.matches
  add column if not exists format text not null default 'pp';

alter table public.match_holes
  add column if not exists player_a_fairway text,
  add column if not exists player_b_fairway text;
