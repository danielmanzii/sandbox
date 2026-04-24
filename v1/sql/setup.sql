-- Sandbox Pitch & Putt — Supabase setup
-- Run this once in the Supabase SQL Editor:
--   Project → SQL Editor → New Query → paste this whole file → Run
-- Safe to re-run; uses guarded / if-not-exists patterns throughout.

-- ─────────────────────────────────────────────────────────────────
-- profiles: one row per authenticated user
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name  text not null,
  gender     text,
  dob        date,
  handle     text unique,
  sbx        numeric default 4.000,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────
-- matches: 1v1 match between two players
--   status: waiting | active | completed | abandoned
--   result: 'A' | 'B' | 'H' (halved) | null
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.matches (
  id             uuid primary key default gen_random_uuid(),
  join_code      text unique not null,
  course_name    text,
  total_holes    int default 9,
  player_a       uuid references public.profiles(id) not null,
  player_b       uuid references public.profiles(id),
  status         text default 'waiting',
  result         text,
  final_margin   text,
  created_at     timestamptz default now(),
  started_at     timestamptz,
  completed_at   timestamptz
);

alter table public.matches enable row level security;

drop policy if exists "Players can read relevant matches" on public.matches;
create policy "Players can read relevant matches"
  on public.matches for select to authenticated
  using (
    auth.uid() = player_a
    or auth.uid() = player_b
    or (status = 'waiting' and player_b is null)
  );

drop policy if exists "Users can create matches as player_a" on public.matches;
create policy "Users can create matches as player_a"
  on public.matches for insert to authenticated
  with check (auth.uid() = player_a);

drop policy if exists "Players can update relevant matches" on public.matches;
create policy "Players can update relevant matches"
  on public.matches for update to authenticated
  using (
    auth.uid() = player_a
    or auth.uid() = player_b
    or (status = 'waiting' and player_b is null)
  );

-- ─────────────────────────────────────────────────────────────────
-- match_holes: one row per hole per match
--   result: 'A' | 'B' | 'H' | null   (A=player_a wins hole, B=player_b, H=halved)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.match_holes (
  match_id       uuid references public.matches(id) on delete cascade,
  hole_number    int not null,
  par            int default 3,
  distance_yards int,
  player_a_score int,
  player_b_score int,
  result         text,
  updated_at     timestamptz default now(),
  primary key (match_id, hole_number)
);

alter table public.match_holes enable row level security;

drop policy if exists "Players can read holes in their matches" on public.match_holes;
create policy "Players can read holes in their matches"
  on public.match_holes for select to authenticated
  using (exists (
    select 1 from public.matches m
    where m.id = match_holes.match_id
      and (m.player_a = auth.uid() or m.player_b = auth.uid())
  ));

drop policy if exists "Players can write holes in their matches" on public.match_holes;
create policy "Players can write holes in their matches"
  on public.match_holes for all to authenticated
  using (exists (
    select 1 from public.matches m
    where m.id = match_holes.match_id
      and (m.player_a = auth.uid() or m.player_b = auth.uid())
  ));

-- ─────────────────────────────────────────────────────────────────
-- Additive migrations (safe to re-run):
--   - match_type: 1v1 | 2v2  (Challenge a Friend modes)
--   - player_a2, player_b2: second player on each team for 2v2
--   - per-hole stat capture: GIR, putts, proximity-to-pin (in feet)
-- ─────────────────────────────────────────────────────────────────
alter table public.matches
  add column if not exists match_type text default '1v1';
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'matches' and constraint_name = 'matches_match_type_check'
  ) then
    alter table public.matches
      add constraint matches_match_type_check check (match_type in ('1v1','2v2'));
  end if;
end $$;

alter table public.matches
  add column if not exists player_a2 uuid references public.profiles(id);
alter table public.matches
  add column if not exists player_b2 uuid references public.profiles(id);

alter table public.match_holes
  add column if not exists player_a_gir boolean;
alter table public.match_holes
  add column if not exists player_b_gir boolean;
alter table public.match_holes
  add column if not exists player_a_putts int;
alter table public.match_holes
  add column if not exists player_b_putts int;
alter table public.match_holes
  add column if not exists player_a_proximity_ft int;
alter table public.match_holes
  add column if not exists player_b_proximity_ft int;

-- Broaden RLS: any of the up-to-four players (plus "waiting" visibility)
-- can read/update their match. Player_a2/player_b2 are null for 1v1 so the
-- policy is backward-compatible.
drop policy if exists "Players can read relevant matches" on public.matches;
create policy "Players can read relevant matches"
  on public.matches for select to authenticated
  using (
    auth.uid() in (player_a, player_a2, player_b, player_b2)
    or (status = 'waiting' and (player_b is null or player_b2 is null))
  );

drop policy if exists "Players can update relevant matches" on public.matches;
create policy "Players can update relevant matches"
  on public.matches for update to authenticated
  using (
    auth.uid() in (player_a, player_a2, player_b, player_b2)
    or (status = 'waiting' and (player_b is null or player_b2 is null))
  );

drop policy if exists "Players can read holes in their matches" on public.match_holes;
create policy "Players can read holes in their matches"
  on public.match_holes for select to authenticated
  using (exists (
    select 1 from public.matches m
    where m.id = match_holes.match_id
      and auth.uid() in (m.player_a, m.player_a2, m.player_b, m.player_b2)
  ));

drop policy if exists "Players can write holes in their matches" on public.match_holes;
create policy "Players can write holes in their matches"
  on public.match_holes for all to authenticated
  using (exists (
    select 1 from public.matches m
    where m.id = match_holes.match_id
      and auth.uid() in (m.player_a, m.player_a2, m.player_b, m.player_b2)
  ));

-- ─────────────────────────────────────────────────────────────────
-- Enable real-time replication so both phones see score updates live.
-- Guarded so re-runs don't error on "already a member of publication".
-- ─────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'match_holes'
  ) then
    alter publication supabase_realtime add table public.match_holes;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────
-- Username (handle) → email lookup for the Sign-In screen.
-- Lets unauthenticated users resolve a @handle to the associated
-- email so we can pass it to sbx.auth.signInWithPassword().
-- SECURITY DEFINER is required because anon users can't read
-- auth.users directly; the function only returns the email column
-- and only when a matching profile exists.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.email_for_handle(handle_input text)
returns text
language sql
security definer
set search_path = public, auth
as $$
  -- Strip leading @ from BOTH the stored handle and the input before
  -- comparing, so "alex.miami", "@alex.miami", and any case variant
  -- all resolve to the same account regardless of how the handle is
  -- stored in profiles.handle.
  select u.email::text
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(ltrim(p.handle, '@')) = lower(ltrim(handle_input, '@'))
  limit 1
$$;

grant execute on function public.email_for_handle(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- PHASE 1 — Events + Registrations + admin role.
-- All idempotent (if-not-exists / drop-if-exists / on-conflict).
-- ─────────────────────────────────────────────────────────────────

-- Add is_admin flag to profiles (Daniel + Rob granted manually below).
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Events table: source of truth for all bookable events on Home /
-- Play / Event Detail. starts_at is the canonical date+time; the
-- client formats display strings (date, dateFull, time) from it.
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  course_short  text not null,                 -- "Melreese", "Crandon", etc.
  course_name   text not null,                 -- "International Links Melreese"
  starts_at     timestamptz not null,
  field         int  not null check (field > 0),
  tagline       text,                          -- "Weekly Match Night"
  description   text,                          -- short editorial blurb
  img_url       text,                          -- hero image (Unsplash URL OK for MVP)
  is_major      boolean not null default false,
  type          text not null default 'weekly' check (type in ('weekly','major','social','member-only','corporate')),
  status        text not null default 'open'   check (status in ('open','live','member-only','closed','cancelled')),
  price_walkup  int  not null default 0,       -- whole dollars; cents = future
  price_member  int  not null default 0,
  created_at    timestamptz default now()
);

-- Indexes for the queries Home + Play will run constantly.
create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists events_status_idx    on public.events (status);
create index if not exists events_is_major_idx  on public.events (is_major) where is_major;

alter table public.events enable row level security;

-- Anyone authenticated can browse.
drop policy if exists "Events are viewable by authenticated users" on public.events;
create policy "Events are viewable by authenticated users"
  on public.events for select to authenticated using (true);

-- Only admins can create / edit / delete events.
drop policy if exists "Admins can insert events" on public.events;
create policy "Admins can insert events"
  on public.events for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
  on public.events for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
  on public.events for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- Registrations join table. partner_id supports the 2-man scramble
-- format; null for solo / not-yet-paired registrations.
create table if not exists public.event_registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  partner_id  uuid     references public.profiles(id) on delete set null,
  is_guest    boolean not null default false,    -- true = used a guest pass
  created_at  timestamptz default now(),
  unique (event_id, user_id)                      -- prevent double-registration
);

create index if not exists event_regs_event_idx on public.event_registrations (event_id);
create index if not exists event_regs_user_idx  on public.event_registrations (user_id);

alter table public.event_registrations enable row level security;

-- Anyone authenticated can SEE registrations (so we can show field counts
-- + "friends attending" badges on event cards).
drop policy if exists "Registrations viewable by authenticated users" on public.event_registrations;
create policy "Registrations viewable by authenticated users"
  on public.event_registrations for select to authenticated using (true);

-- Users can register themselves only.
drop policy if exists "Users can register themselves" on public.event_registrations;
create policy "Users can register themselves"
  on public.event_registrations for insert to authenticated
  with check (auth.uid() = user_id);

-- Users can cancel their own registration.
drop policy if exists "Users can cancel own registration" on public.event_registrations;
create policy "Users can cancel own registration"
  on public.event_registrations for delete to authenticated
  using (auth.uid() = user_id);

-- Admins can also delete any registration (manual cleanup).
drop policy if exists "Admins can delete any registration" on public.event_registrations;
create policy "Admins can delete any registration"
  on public.event_registrations for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- Capacity enforcement: refuse INSERT when the event is already full.
create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
as $$
declare
  current_count int;
  cap int;
begin
  select count(*) into current_count from public.event_registrations where event_id = new.event_id;
  select field      into cap         from public.events              where id       = new.event_id;
  if current_count >= cap then
    raise exception 'Event % is full (% / % registered)', new.event_id, current_count, cap;
  end if;
  return new;
end $$;

drop trigger if exists trg_enforce_event_capacity on public.event_registrations;
create trigger trg_enforce_event_capacity
  before insert on public.event_registrations
  for each row execute function public.enforce_event_capacity();

-- Convenience view: events with live filled-counts.
-- Home uses this so we don't have to count registrations client-side.
create or replace view public.events_with_counts as
  select
    e.*,
    coalesce(r.filled, 0) as filled
  from public.events e
  left join (
    select event_id, count(*)::int as filled
    from public.event_registrations
    group by event_id
  ) r on r.event_id = e.id;

grant select on public.events_with_counts to authenticated;

-- Realtime: surface registration changes so cards update live.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'event_registrations'
  ) then
    alter publication supabase_realtime add table public.event_registrations;
  end if;
end $$;
