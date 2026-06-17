-- Sandbox Pitch & Putt — Courses, tee slots, and bookings (Phase A).
-- The network layer: real golf courses → bookable twilight tee slots →
-- golfer bookings → (later) a live match. Designed so the future COURSE
-- PORTAL reads these same tables: per-course revenue, booked matches, and
-- results all roll up from tee_slots + bookings + matches.
--
-- Run AFTER setup.sql. Idempotent (if-not-exists / drop-policy-if-exists).

-- ─────────────────────────────────────────────────────────────────
-- courses — network partner courses.
--   The course is played as a 9-hole pitch-and-putt ("Sandbox 9"):
--   tee boxes within ~100yd of each pin. We also store the REAL course
--   stats (par/yardage/rating/slope) for authenticity + the diorama
--   render.
--   suggested_price = what Sandbox recommends charging; the course sets
--   the actual price per slot. sandbox_take_pct = our rev-share on that
--   course's bookings (per-course so contracts can vary later).
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.courses (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,                 -- "Killian Greens Golf Club"
  short_name      text not null unique,          -- "Killian Greens"
  city            text not null,
  state           text default 'FL',
  address         text,
  lat             double precision,
  lng             double precision,
  phone           text,
  hero_img        text,                          -- photo / clay render
  render_img      text,                          -- transparent clay hole diorama
  description     text,
  holes           int  not null default 9,       -- Sandbox plays 9
  par             int  not null default 27,      -- pitch-and-putt: 9 × par 3
  -- Real underlying course (reference / authenticity)
  real_par        int,
  real_yardage    int,
  real_rating     numeric,
  real_slope      int,
  real_holes      int,
  status          text not null default 'active'
                    check (status in ('active','coming_soon','inactive')),
  suggested_price int  not null default 0,       -- dollars; Sandbox's suggestion
  sandbox_take_pct int not null default 15,      -- our rev-share % on this course
  created_at      timestamptz default now()
);

create index if not exists courses_city_idx   on public.courses (city);
create index if not exists courses_status_idx on public.courses (status);

alter table public.courses enable row level security;

drop policy if exists "Courses are viewable by authenticated users" on public.courses;
create policy "Courses are viewable by authenticated users"
  on public.courses for select to authenticated using (true);

-- Only admins manage courses for now (course portal will extend this later).
drop policy if exists "Admins manage courses" on public.courses;
create policy "Admins manage courses"
  on public.courses for all to authenticated
  using     (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- ─────────────────────────────────────────────────────────────────
-- course_holes — the Sandbox 9 layout (par 3 each, sub-100yd tees),
-- with optional reference to the real underlying hole.
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.course_holes (
  course_id     uuid not null references public.courses(id) on delete cascade,
  hole_number   int  not null,                 -- 1..9 (Sandbox)
  par           int  not null default 3,
  sandbox_yards int,                           -- pitch-and-putt distance (≤100)
  source_hole   int,                           -- real course hole this maps to
  source_par    int,
  source_yards  int,
  primary key (course_id, hole_number)
);

alter table public.course_holes enable row level security;

drop policy if exists "Course holes are viewable by authenticated users" on public.course_holes;
create policy "Course holes are viewable by authenticated users"
  on public.course_holes for select to authenticated using (true);

drop policy if exists "Admins manage course holes" on public.course_holes;
create policy "Admins manage course holes"
  on public.course_holes for all to authenticated
  using     (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- ─────────────────────────────────────────────────────────────────
-- tee_slots — bookable twilight windows at a course.
--   type: 'open'  = open play (the new core golfer flow)
--         'event' = curated league night
--         'major' = Sandbox-created major / one-off tournament
--   price is set by the course (we just suggest). Capacity is # of
--   players the window can hold.
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.tee_slots (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  starts_at   timestamptz not null,
  capacity    int  not null default 8 check (capacity > 0),
  price       int  not null default 0,         -- dollars, set by course
  type        text not null default 'open'
                check (type in ('open','event','major')),
  title       text,                            -- for event/major naming
  status      text not null default 'open'
                check (status in ('open','full','closed','cancelled')),
  created_at  timestamptz default now(),
  unique (course_id, starts_at)                -- one slot per course per time
);

create index if not exists tee_slots_course_idx on public.tee_slots (course_id);
create index if not exists tee_slots_starts_idx on public.tee_slots (starts_at);
create index if not exists tee_slots_type_idx   on public.tee_slots (type);

alter table public.tee_slots enable row level security;

drop policy if exists "Tee slots are viewable by authenticated users" on public.tee_slots;
create policy "Tee slots are viewable by authenticated users"
  on public.tee_slots for select to authenticated using (true);

drop policy if exists "Admins manage tee slots" on public.tee_slots;
create policy "Admins manage tee slots"
  on public.tee_slots for all to authenticated
  using     (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- ─────────────────────────────────────────────────────────────────
-- bookings — a golfer reserves a slot for a 1v1 or 2v2 match.
--   Reserve-only for now (no payment). price_charged / booking_fee are
--   snapshotted at booking time so course-portal revenue rollups stay
--   correct even if the slot price later changes. They stay null until
--   Stripe Connect lands.
--   match_id links to the live match once play begins.
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  slot_id       uuid not null references public.tee_slots(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  partner_id    uuid references public.profiles(id) on delete set null, -- 2v2 teammate
  match_type    text not null default '1v1' check (match_type in ('1v1','2v2')),
  status        text not null default 'reserved'
                  check (status in ('reserved','checked_in','playing','completed','cancelled','no_show')),
  match_id      uuid references public.matches(id) on delete set null,
  price_charged int,                            -- snapshot (dollars), null until payments
  booking_fee   int,                            -- snapshot (dollars), null until payments
  created_at    timestamptz default now(),
  unique (slot_id, user_id)                      -- no double-booking a slot
);

create index if not exists bookings_slot_idx on public.bookings (slot_id);
create index if not exists bookings_user_idx on public.bookings (user_id);

alter table public.bookings enable row level security;

-- Anyone authenticated can SEE bookings (so we can show "friends booked
-- here" on course cards + field counts), mirroring event_registrations.
drop policy if exists "Bookings viewable by authenticated users" on public.bookings;
create policy "Bookings viewable by authenticated users"
  on public.bookings for select to authenticated using (true);

drop policy if exists "Users can book themselves" on public.bookings;
create policy "Users can book themselves"
  on public.bookings for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own booking" on public.bookings;
create policy "Users can update own booking"
  on public.bookings for update to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can cancel own booking" on public.bookings;
create policy "Users can cancel own booking"
  on public.bookings for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins manage any booking" on public.bookings;
create policy "Admins manage any booking"
  on public.bookings for all to authenticated
  using     (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- Realtime so availability + "friends here" update live.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and tablename='tee_slots') then
    alter publication supabase_realtime add table public.tee_slots;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and tablename='bookings') then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────
-- SEED: Killian Greens Golf Club (Miami, FL) — our first network course.
--   Real course: 18-hole par 72, 6,449 yds, rating 70.1 / slope 124,
--   opened 1969. Sandbox plays a 9-hole pitch-and-putt over it.
-- ─────────────────────────────────────────────────────────────────
insert into public.courses
  (name, short_name, city, state, address, lat, lng, phone,
   description, holes, par,
   real_par, real_yardage, real_rating, real_slope, real_holes,
   status, suggested_price, sandbox_take_pct)
values
  ('Killian Greens Golf Club', 'Killian Greens', 'Miami', 'FL',
   '9980 SW 104th St, Miami, FL 33176',
   25.6837, -80.3690, '(305) 271-0917',
   'A Miami staple since 1969. After the regular field clears out, Sandbox takes over the back nine for fast, floodlit pitch-and-putt — nine holes, all within 100 yards, done in under an hour.',
   9, 27,
   72, 6449, 70.1, 124, 18,
   'active', 22, 15)
on conflict (short_name) do update set
  city = excluded.city,
  address = excluded.address,
  lat = excluded.lat,
  lng = excluded.lng,
  description = excluded.description,
  real_par = excluded.real_par,
  real_yardage = excluded.real_yardage,
  real_rating = excluded.real_rating,
  real_slope = excluded.real_slope;

-- Sandbox 9 layout (all par 3, sub-100yd tees). source_* references the
-- real Killian Greens scorecard holes for authenticity.
insert into public.course_holes (course_id, hole_number, par, sandbox_yards, source_hole, source_par, source_yards)
select c.id, h.hole_number, 3, h.sandbox_yards, h.source_hole, h.source_par, h.source_yards
from public.courses c
cross join (values
  (1, 58,  8,  3, 154),
  (2, 82,  6,  3, 198),
  (3, 71, 12,  3, 157),
  (4, 94, 17,  3, 205),
  (5, 49,  8,  3, 154),
  (6, 66,  6,  3, 198),
  (7, 88, 17,  3, 205),
  (8, 53, 12,  3, 157),
  (9, 77,  6,  3, 198)
) as h(hole_number, sandbox_yards, source_hole, source_par, source_yards)
where c.short_name = 'Killian Greens'
on conflict (course_id, hole_number) do update set
  sandbox_yards = excluded.sandbox_yards;

-- Twilight tee slots: next 7 days, every 30 min from 4:30–7:30 PM.
-- Re-running adds only missing slots (unique course_id+starts_at).
insert into public.tee_slots (course_id, starts_at, capacity, price, type)
select c.id,
       ((current_date + d) + t)::timestamptz,
       8, 22, 'open'
from public.courses c
cross join generate_series(0, 6) as d
cross join unnest(array['16:30','17:00','17:30','18:00','18:30','19:00','19:30']::time[]) as t
where c.short_name = 'Killian Greens'
on conflict (course_id, starts_at) do nothing;
