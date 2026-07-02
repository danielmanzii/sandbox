-- Sandbox Pitch & Putt — per-SIDE ball/holed/zone capture (collision fix).
-- Run AFTER shot-log.sql. Idempotent.
--
-- Both teams score into the SAME match_holes row, but ball_player / holed_by /
-- zone were single shared columns — whichever side finished the hole last
-- overwrote the other side's values. That silently corrupted Clutch %,
-- Finisher %, Shot efficiency % and the loyalty tracking bonus.
--
-- Fix: one column per side (matching shot_log_a / shot_log_b). The app now
-- writes only the side-suffixed columns; legacy columns stay for old matches.

alter table public.match_holes
  add column if not exists ball_player_a uuid references public.profiles(id),
  add column if not exists ball_player_b uuid references public.profiles(id),
  add column if not exists holed_by_a    uuid references public.profiles(id),
  add column if not exists holed_by_b    uuid references public.profiles(id),
  add column if not exists zone_a        text,
  add column if not exists zone_b        text;

-- ── Backfill what's recoverable ──────────────────────────────────────
-- A surviving ball_player/holed_by uuid tells us which side wrote it (the
-- player belongs to team A's or team B's roster), so un-clobbered history can
-- be re-attributed to the right side. Values that were overwritten are gone
-- (only the last write survived). zone is free text — can't be attributed, so
-- it backfills alongside whichever side the hole's ball_player belonged to.

update public.match_holes mh
set ball_player_a = mh.ball_player,
    zone_a = coalesce(mh.zone_a, mh.zone)
from public.matches m
where mh.match_id = m.id
  and mh.ball_player is not null and mh.ball_player_a is null
  and mh.ball_player in (m.player_a, m.player_a2);

update public.match_holes mh
set ball_player_b = mh.ball_player,
    zone_b = coalesce(mh.zone_b, mh.zone)
from public.matches m
where mh.match_id = m.id
  and mh.ball_player is not null and mh.ball_player_b is null
  and mh.ball_player in (m.player_b, m.player_b2);

update public.match_holes mh
set holed_by_a = mh.holed_by
from public.matches m
where mh.match_id = m.id
  and mh.holed_by is not null and mh.holed_by_a is null
  and mh.holed_by in (m.player_a, m.player_a2);

update public.match_holes mh
set holed_by_b = mh.holed_by
from public.matches m
where mh.match_id = m.id
  and mh.holed_by is not null and mh.holed_by_b is null
  and mh.holed_by in (m.player_b, m.player_b2);

-- ── Loyalty: per-side tracking bonus ─────────────────────────────────
-- Was: everyone got 10 pts × count of the SHARED zone column — i.e. whichever
-- side wrote last set the whole foursome's bonus. Now each side earns its own
-- zone count (legacy shared zone still counts for pre-migration matches that
-- have no side-scoped zones at all).

create or replace function public.award_match_points(p_match uuid)
returns void language plpgsql security definer as $$
declare m record; zones_a int; zones_b int; legacy int; uid uuid;
begin
  select * into m from public.matches where id = p_match;
  if not found then return; end if;

  select count(*) filter (where zone_a is not null),
         count(*) filter (where zone_b is not null),
         count(*) filter (where zone   is not null)
    into zones_a, zones_b, legacy
    from public.match_holes where match_id = p_match;
  -- Pre-migration match (nothing side-scoped): fall back to the legacy count.
  if zones_a = 0 and zones_b = 0 and legacy > 0 then
    zones_a := legacy; zones_b := legacy;
  end if;

  for uid in select unnest(array[m.player_a, m.player_a2]) loop
    if uid is null then continue; end if;
    insert into public.loyalty_points (user_id, points, reason, match_id)
      values (uid, 50, 'Match played', p_match);
    if zones_a > 0 then
      insert into public.loyalty_points (user_id, points, reason, match_id)
        values (uid, zones_a * 10, 'Detailed tracking bonus', p_match);
    end if;
  end loop;

  for uid in select unnest(array[m.player_b, m.player_b2]) loop
    if uid is null then continue; end if;
    insert into public.loyalty_points (user_id, points, reason, match_id)
      values (uid, 50, 'Match played', p_match);
    if zones_b > 0 then
      insert into public.loyalty_points (user_id, points, reason, match_id)
        values (uid, zones_b * 10, 'Detailed tracking bonus', p_match);
    end if;
  end loop;

  if m.result in ('A','B') then
    for uid in select unnest(case when m.result='A' then array[m.player_a, m.player_a2]
                                  else array[m.player_b, m.player_b2] end) loop
      if uid is null then continue; end if;
      insert into public.loyalty_points (user_id, points, reason, match_id)
        values (uid, 25, 'Match won', p_match);
    end loop;
  end if;
end $$;
