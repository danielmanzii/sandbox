-- Sandbox Pitch & Putt — SBX rating engine v1 (Phase D2).
-- Run AFTER confirm.sql. Idempotent. Requires pg_cron (already enabled).
--
-- DUPR-faithful WINDOWED recompute:
--   * Two ratings — 2v2 (headline) and 1v1 (secondary) — on profiles.
--   * Each recompute re-solves every player's rating from their last N
--     CONFIRMED matches given opponents' CURRENT ratings, via fixed-point
--     iteration (6 passes) → self-correcting, not order-dependent.
--   * Performance vs expectation: a match's "actual" = your side's share of
--     decisive holes; implied rating = the value that fits that result vs
--     the opponent team (doubles team rating = avg of partners).
--   * Weights: ranked (booked) full, casual 0.5; recency decays ~6 months.
--   * Reliability from volume + opponent variety. Placement: unrated until
--     3 confirmed matches (display handled in D5); internal prior 4.0.

alter table public.profiles
  add column if not exists sbx_1v1      numeric,
  add column if not exists sbx_2v2      numeric,
  add column if not exists sbx_1v1_n    int     not null default 0,
  add column if not exists sbx_2v2_n    int     not null default 0,
  add column if not exists sbx_1v1_rel  numeric not null default 0,
  add column if not exists sbx_2v2_rel  numeric not null default 0;

create or replace function public.recompute_sbx()
returns void language plpgsql security definer as $$
declare pass int; spread numeric := 1.5;  -- logistic spread on the 2–8 scale
begin
  for pass in 1..6 loop
    -- ===== 2v2 fixed-point pass =====
    update public.profiles pr set sbx_2v2 = x.new_r from (
      with mp as (
        select mh.match_id,
               sum((mh.result='A')::int) as aw,
               sum((mh.result='B')::int) as bw,
               sum((mh.result='H')::int) as hw
        from public.match_holes mh group by mh.match_id
      ),
      persp as (
        select m.id, m.confirmed_at, mp.aw, mp.bw, mp.hw,
               pl.uid, pl.partner, pl.opp1, pl.opp2, pl.is_a,
               exists(select 1 from public.bookings b where b.match_id=m.id) as ranked
        from public.matches m
        join mp on mp.match_id = m.id
        cross join lateral (values
          (m.player_a,  m.player_a2, m.player_b,  m.player_b2, true),
          (m.player_a2, m.player_a,  m.player_b,  m.player_b2, true),
          (m.player_b,  m.player_b2, m.player_a,  m.player_a2, false),
          (m.player_b2, m.player_b,  m.player_a,  m.player_a2, false)
        ) as pl(uid, partner, opp1, opp2, is_a)
        where m.match_type='2v2' and m.confirmed_at is not null and pl.uid is not null
      ),
      scored as (
        select p.uid, p.confirmed_at, p.ranked,
          case when p.is_a then (p.aw+0.5*p.hw) else (p.bw+0.5*p.hw) end as mypts,
          case when p.is_a then (p.bw+0.5*p.hw) else (p.aw+0.5*p.hw) end as opppts,
          (coalesce(po1.sbx_2v2,4)+coalesce(po2.sbx_2v2,4))/2.0 as opp_team,
          coalesce(ppart.sbx_2v2,4) as partner_r,
          row_number() over (partition by p.uid order by p.confirmed_at desc) as rn
        from persp p
        left join public.profiles po1   on po1.id   = p.opp1
        left join public.profiles po2   on po2.id   = p.opp2
        left join public.profiles ppart on ppart.id = p.partner
      ),
      calc as (
        select uid,
          (2*(opp_team + spread*ln(a/(1-a))) - partner_r) as implied_r,
          (case when ranked then 1.0 else 0.5 end)
            * exp(- extract(epoch from (now()-confirmed_at))/(86400*180)) as w
        from (
          select uid, confirmed_at, ranked, opp_team, partner_r,
                 greatest(0.05, least(0.95, mypts/nullif(mypts+opppts,0))) as a
          from scored where (mypts+opppts) > 0 and rn <= 60
        ) s
      )
      select uid, round(greatest(2.0, least(8.0, sum(implied_r*w)/nullif(sum(w),0))), 3) as new_r
      from calc group by uid
    ) x where pr.id = x.uid;

    -- ===== 1v1 fixed-point pass =====
    update public.profiles pr set sbx_1v1 = x.new_r from (
      with mp as (
        select mh.match_id,
               sum((mh.result='A')::int) as aw,
               sum((mh.result='B')::int) as bw,
               sum((mh.result='H')::int) as hw
        from public.match_holes mh group by mh.match_id
      ),
      persp as (
        select m.id, m.confirmed_at, mp.aw, mp.bw, mp.hw,
               pl.uid, pl.opp, pl.is_a,
               exists(select 1 from public.bookings b where b.match_id=m.id) as ranked
        from public.matches m
        join mp on mp.match_id = m.id
        cross join lateral (values
          (m.player_a, m.player_b, true),
          (m.player_b, m.player_a, false)
        ) as pl(uid, opp, is_a)
        where m.match_type='1v1' and m.confirmed_at is not null and pl.uid is not null
      ),
      scored as (
        select p.uid, p.confirmed_at, p.ranked,
          case when p.is_a then (p.aw+0.5*p.hw) else (p.bw+0.5*p.hw) end as mypts,
          case when p.is_a then (p.bw+0.5*p.hw) else (p.aw+0.5*p.hw) end as opppts,
          coalesce(po.sbx_1v1,4) as opp_r,
          row_number() over (partition by p.uid order by p.confirmed_at desc) as rn
        from persp p
        left join public.profiles po on po.id = p.opp
      ),
      calc as (
        select uid,
          (opp_r + spread*ln(a/(1-a))) as implied_r,
          (case when ranked then 1.0 else 0.5 end)
            * exp(- extract(epoch from (now()-confirmed_at))/(86400*180)) as w
        from (
          select uid, confirmed_at, ranked, opp_r,
                 greatest(0.05, least(0.95, mypts/nullif(mypts+opppts,0))) as a
          from scored where (mypts+opppts) > 0 and rn <= 30
        ) s
      )
      select uid, round(greatest(2.0, least(8.0, sum(implied_r*w)/nullif(sum(w),0))), 3) as new_r
      from calc group by uid
    ) x where pr.id = x.uid;
  end loop;

  -- ===== counts + reliability (volume × opponent variety) =====
  update public.profiles pr set
    sbx_2v2_n   = coalesce(s.n, 0),
    sbx_2v2_rel = round(least(1.0, coalesce(s.n,0)/10.0) * least(1.0, coalesce(s.opps,0)/5.0), 2)
  from (
    select uid, count(*) as n, count(distinct opp) as opps from (
      select pl.uid, unnest(array[o1,o2]) as opp from (
        select m.id,
               unnest(array[m.player_a,m.player_a2,m.player_b,m.player_b2]) as uid_all,
               m.player_a as a1, m.player_a2 as a2, m.player_b as b1, m.player_b2 as b2
        from public.matches m where m.match_type='2v2' and m.confirmed_at is not null
      ) z
      cross join lateral (values (z.uid_all)) pl(uid)
      cross join lateral (
        select case when pl.uid in (z.a1,z.a2) then z.b1 else z.a1 end as o1,
               case when pl.uid in (z.a1,z.a2) then z.b2 else z.a2 end as o2
      ) oo(o1,o2)
      where pl.uid is not null
    ) per group by uid
  ) s where pr.id = s.uid;

  update public.profiles pr set
    sbx_1v1_n   = coalesce(s.n, 0),
    sbx_1v1_rel = round(least(1.0, coalesce(s.n,0)/10.0) * least(1.0, coalesce(s.opps,0)/5.0), 2)
  from (
    select uid, count(*) as n, count(distinct opp) as opps from (
      select case when m.player_a = u.uid then m.player_b else m.player_a end as opp, u.uid
      from public.matches m
      cross join lateral (values (m.player_a),(m.player_b)) u(uid)
      where m.match_type='1v1' and m.confirmed_at is not null and u.uid is not null
    ) per group by uid
  ) s where pr.id = s.uid;

  -- Headline SBX mirrors the 2v2 rating (our core format) once it exists.
  update public.profiles set sbx = sbx_2v2 where sbx_2v2 is not null;
end $$;
grant execute on function public.recompute_sbx() to authenticated;

-- Run the engine the moment a match becomes confirmed.
create or replace function public.confirm_match_result(p_match uuid)
returns void language plpgsql security definer as $$
declare m record; side text; both_done boolean;
begin
  select * into m from public.matches where id = p_match;
  if not found then raise exception 'Match not found'; end if;

  if auth.uid() in (m.player_a, m.player_a2) then side := 'a';
  elsif auth.uid() in (m.player_b, m.player_b2) then side := 'b';
  else raise exception 'Not a participant'; end if;

  if side = 'a' then update public.matches set confirmed_a = true where id = p_match;
  else                update public.matches set confirmed_b = true where id = p_match; end if;

  select confirmed_a and confirmed_b into both_done from public.matches where id = p_match;
  if both_done then
    update public.matches set confirmed_at = now() where id = p_match and confirmed_at is null;
    perform public.recompute_sbx();
  end if;
end $$;
grant execute on function public.confirm_match_result(uuid) to authenticated;

-- Safety-net periodic recompute (keeps recency decay + cross-effects fresh).
do $$ begin perform cron.unschedule('recompute-sbx'); exception when others then null; end $$;
select cron.schedule('recompute-sbx', '*/15 * * * *', $$select public.recompute_sbx()$$);
