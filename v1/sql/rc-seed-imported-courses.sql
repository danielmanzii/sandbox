-- ============================================================================
-- rc-seed-imported-courses.sql — add 3 real courses' scorecards so their tees
-- are selectable in the golfer app. Sandbox-9 pitch-and-putt data left blank.
--
-- Courses: Palmetto Bay (18) · Trump National Doral – Blue Monster (18) ·
--          Briar Bay Golf Course (9).
--
-- NOTE: per-hole yardages were transcribed from scorecard photos — verify/edit
-- them in admin → Scorecards. Idempotent. Run AFTER rc-courses.sql.
-- ============================================================================

-- ── Palmetto Bay (18) ───────────────────────────────────────────────────────
insert into public.rc_courses (name, city, state, holes)
values ('Palmetto Bay', 'Miami', 'FL', 18)
on conflict (name, city) do nothing;

insert into public.rc_tees (course_id, name, color, par, yards, rating, slope)
select c.id, t.name, t.color, 70, t.yards, t.rating, t.slope
from public.rc_courses c
cross join (values
  ('Blue',  '#3b6fb3', 6532, 71.6, 136),
  ('White', '#9aa0a6', 6124, 70.0, 130),
  ('Gold',  '#caa53d', 5554, 67.4, 121),
  ('Red',   '#c0392b', 5494, 66.9, 119)
) t(name, color, yards, rating, slope)
where c.name = 'Palmetto Bay' and c.city = 'Miami'
on conflict (course_id, name) do update set yards=excluded.yards, rating=excluded.rating, slope=excluded.slope;

insert into public.rc_holes (tee_id, hole_number, par, yards)
select t.id, n,
  (array[5,4,4,4,3,4,3,4,5, 4,3,4,4,4,4,3,4,4])[n],
  (case t.name
    when 'Blue'  then (array[517,436,420,319,188,364,167,431,529, 402,204,444,390,368,393,379,180,430])[n]
    when 'White' then (array[474,420,414,298,176,338,157,400,514, 392,193,412,378,354,383,365,162,417])[n]
    when 'Gold'  then (array[458,398,409,253,159,329,110,376,458, 381,180,397,363,332,372,352,143,395])[n]
    when 'Red'   then (array[443,387,404,242,143,321,107,326,455, 371,168,382,348,310,291,301,125,370])[n]
  end)
from public.rc_tees t join public.rc_courses c on c.id = t.course_id
cross join generate_series(1,18) n
where c.name = 'Palmetto Bay' and c.city = 'Miami'
on conflict (tee_id, hole_number) do update set par=excluded.par, yards=excluded.yards;

-- ── Trump National Doral – Blue Monster (18) ────────────────────────────────
insert into public.rc_courses (name, city, state, holes)
values ('Trump National Doral – Blue Monster', 'Doral', 'FL', 18)
on conflict (name, city) do nothing;

insert into public.rc_tees (course_id, name, color, par, yards, rating, slope)
select c.id, t.name, t.color, 72, t.yards, t.rating, t.slope
from public.rc_courses c
cross join (values
  ('Black', '#111111', 7510, null::numeric, null::int),
  ('Gold',  '#caa53d', 7019, null, null),
  ('Blue',  '#3b6fb3', 6398, null, null),
  ('Red',   '#c0392b', 5463, null, null)
) t(name, color, yards, rating, slope)
where c.name = 'Trump National Doral – Blue Monster' and c.city = 'Doral'
on conflict (course_id, name) do update set yards=excluded.yards;

insert into public.rc_holes (tee_id, hole_number, par, yards)
select t.id, n,
  (array[5,4,4,3,4,4,4,5,3, 5,4,5,3,4,3,4,4,4])[n],
  (case t.name
    when 'Black' then (array[578,446,440,207,419,430,472,550,216, 608,428,600,245,475,153,340,430,473])[n]
    when 'Gold'  then (array[559,381,404,196,402,416,442,528,207, 572,344,589,230,439,142,325,410,433])[n]
    when 'Blue'  then (array[543,364,393,176,378,402,435,497,185, 560,326,557,197,398,126,280,370,386])[n]
    when 'Red'   then (array[433,325,297,135,314,348,390,414,143, 418,285,490,172,305,117,252,289,336])[n]
  end)
from public.rc_tees t join public.rc_courses c on c.id = t.course_id
cross join generate_series(1,18) n
where c.name = 'Trump National Doral – Blue Monster' and c.city = 'Doral'
on conflict (tee_id, hole_number) do update set par=excluded.par, yards=excluded.yards;

-- ── Briar Bay Golf Course (9) ───────────────────────────────────────────────
insert into public.rc_courses (name, city, state, holes)
values ('Briar Bay Golf Course', 'Miami', 'FL', 9)
on conflict (name, city) do nothing;

insert into public.rc_tees (course_id, name, color, par, yards, rating, slope)
select c.id, t.name, t.color, 31, t.yards, null::numeric, null::int
from public.rc_courses c
cross join (values
  ('Blue',  '#3b6fb3', 1949),
  ('White', '#9aa0a6', 1795),
  ('Red',   '#c0392b', 1580)
) t(name, color, yards)
where c.name = 'Briar Bay Golf Course' and c.city = 'Miami'
on conflict (course_id, name) do update set yards=excluded.yards;

insert into public.rc_holes (tee_id, hole_number, par, yards, hcp)
select t.id, n,
  (array[3,4,4,4,3,4,3,3,3])[n],
  (case t.name
    when 'Blue'  then (array[148,262,312,327,123,371,126,137,143])[n]
    when 'White' then (array[138,251,298,292,112,330,116,126,132])[n]
    when 'Red'   then (array[104,240,261,229,104,316,92,115,119])[n]
  end),
  (array[5,4,1,3,9,2,6,7,8])[n]
from public.rc_tees t join public.rc_courses c on c.id = t.course_id
cross join generate_series(1,9) n
where c.name = 'Briar Bay Golf Course' and c.city = 'Miami'
on conflict (tee_id, hole_number) do update set par=excluded.par, yards=excluded.yards, hcp=excluded.hcp;
