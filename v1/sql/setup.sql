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
