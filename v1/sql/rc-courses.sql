-- Sandbox Pitch & Putt — Regular-course scorecards (for Challenge Friends ·
-- Regular course). Separate from the network `courses` (Sandbox 9 / booking);
-- these are real 18-hole scorecards with multiple tees. Idempotent.

create table if not exists public.rc_courses (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  city       text,
  state      text default 'FL',
  holes      int  default 18,
  created_at timestamptz default now(),
  unique (name, city)
);

create table if not exists public.rc_tees (
  id        uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.rc_courses(id) on delete cascade,
  name      text not null,           -- Blue / White / Red …
  color     text,
  par       int,
  yards     int,
  rating    numeric,
  slope     int,
  unique (course_id, name)
);

create table if not exists public.rc_holes (
  tee_id      uuid not null references public.rc_tees(id) on delete cascade,
  hole_number int  not null,
  par         int,
  yards       int,
  hcp         int,
  primary key (tee_id, hole_number)
);

alter table public.rc_courses enable row level security;
alter table public.rc_tees    enable row level security;
alter table public.rc_holes   enable row level security;

drop policy if exists "rc_courses read" on public.rc_courses;
create policy "rc_courses read" on public.rc_courses for select to authenticated using (true);
drop policy if exists "rc_tees read" on public.rc_tees;
create policy "rc_tees read" on public.rc_tees for select to authenticated using (true);
drop policy if exists "rc_holes read" on public.rc_holes;
create policy "rc_holes read" on public.rc_holes for select to authenticated using (true);

drop policy if exists "rc_courses admin" on public.rc_courses;
create policy "rc_courses admin" on public.rc_courses for all to authenticated
  using (exists (select 1 from public.profiles where id=auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id=auth.uid() and is_admin));
drop policy if exists "rc_tees admin" on public.rc_tees;
create policy "rc_tees admin" on public.rc_tees for all to authenticated
  using (exists (select 1 from public.profiles where id=auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id=auth.uid() and is_admin));
drop policy if exists "rc_holes admin" on public.rc_holes;
create policy "rc_holes admin" on public.rc_holes for all to authenticated
  using (exists (select 1 from public.profiles where id=auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id=auth.uid() and is_admin));

-- ── Seed: Killian Greens Golf Club (Miami, FL) — 18 holes, 3 tees ──────
insert into public.rc_courses (name, city, state, holes)
values ('Killian Greens Golf Club', 'Miami', 'FL', 18)
on conflict (name, city) do nothing;

insert into public.rc_tees (course_id, name, color, par, yards, rating, slope)
select c.id, t.name, t.color, 72, t.yards, t.rating, t.slope
from public.rc_courses c
cross join (values
  ('Blue',  '#3b6fb3', 6449, 70.1, 124),
  ('White', '#9aa0a6', 6072, 68.4, 119),
  ('Red',   '#c0392b', 5417, 67.5, 112)
) t(name, color, yards, rating, slope)
where c.name = 'Killian Greens Golf Club'
on conflict (course_id, name) do nothing;

-- Par is identical across tees; yards + hcp vary by tee.
-- Blue
insert into public.rc_holes (tee_id, hole_number, par, yards, hcp)
select t.id, n,
  (array[4,5,4,4,5,3,4,3,4, 4,4,3,4,4,4,5,3,5])[n],
  (array[385,542,388,395,520,198,345,154,380, 325,400,157,340,360,375,490,205,490])[n],
  (array[1,7,9,3,5,15,13,17,11, 2,16,18,8,10,6,4,14,12])[n]
from public.rc_tees t join public.rc_courses c on c.id = t.course_id
cross join generate_series(1,18) n
where c.name='Killian Greens Golf Club' and t.name='Blue'
on conflict (tee_id, hole_number) do update set par=excluded.par, yards=excluded.yards, hcp=excluded.hcp;

-- White
insert into public.rc_holes (tee_id, hole_number, par, yards, hcp)
select t.id, n,
  (array[4,5,4,4,5,3,4,3,4, 4,4,3,4,4,4,5,3,5])[n],
  (array[361,510,360,382,505,190,330,150,330, 315,340,149,330,345,365,475,185,450])[n],
  (array[1,7,9,3,5,15,13,17,11, 2,16,18,8,10,6,4,14,12])[n]
from public.rc_tees t join public.rc_courses c on c.id = t.course_id
cross join generate_series(1,18) n
where c.name='Killian Greens Golf Club' and t.name='White'
on conflict (tee_id, hole_number) do update set par=excluded.par, yards=excluded.yards, hcp=excluded.hcp;

-- Red
insert into public.rc_holes (tee_id, hole_number, par, yards, hcp)
select t.id, n,
  (array[4,5,4,4,5,3,4,3,4, 4,4,3,4,4,4,5,3,5])[n],
  (array[310,445,310,362,423,182,310,137,305, 300,225,141,232,330,330,460,150,465])[n],
  (array[1,5,11,7,3,15,13,17,9, 6,16,18,10,12,8,2,14,4])[n]
from public.rc_tees t join public.rc_courses c on c.id = t.course_id
cross join generate_series(1,18) n
where c.name='Killian Greens Golf Club' and t.name='Red'
on conflict (tee_id, hole_number) do update set par=excluded.par, yards=excluded.yards, hcp=excluded.hcp;
