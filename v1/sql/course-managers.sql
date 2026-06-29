-- ============================================================================
-- course-managers.sql — partner logins scoped to a single course.
--
-- A "course manager" is a non-admin account that can manage ONLY the course(s)
-- they're assigned to: set tee-slot times + pricing, set per-day hole yardages,
-- watch live play, and read their own bookings/financials. Admins assign them.
--
-- This is the data + security layer for the admin.sbx.golf course-partner portal.
-- It deliberately reuses the existing courses / tee_slots / bookings / matches /
-- match_holes tables (per CLAUDE.md: the course portal reads the SAME tables the
-- golfer app writes) — it only adds scoping, never a parallel copy.
--
-- Apply order: run AFTER courses.sql, play.sql and membership.sql.
-- Idempotent (if-not-exists / create-or-replace / drop-policy-if-exists).
-- Coordinated change: adds RLS to shared tables. Run once; tell Daniel first.
-- ============================================================================

-- ── 0a. is_admin() helper (SECURITY DEFINER so RLS policies don't recurse) ──
-- Defined first; it only references profiles, which already exists.
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin);
$$;

-- ── 1. course_managers — who manages which course ───────────────────────────
-- NOTE: the table MUST exist before manages_course() below — a `language sql`
-- function is validated against its referenced tables at creation time.
create table if not exists public.course_managers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid not null references public.courses(id)  on delete cascade,
  role        text not null default 'manager' check (role in ('manager','staff')),
  created_at  timestamptz default now(),
  created_by  uuid references public.profiles(id) on delete set null,
  unique (user_id, course_id)
);
create index if not exists course_managers_user_idx   on public.course_managers (user_id);
create index if not exists course_managers_course_idx on public.course_managers (course_id);

alter table public.course_managers enable row level security;

-- ── 0b. manages_course() helper — now that course_managers exists ───────────
-- current user is assigned to manage that course.
create or replace function public.manages_course(p_course uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.course_managers
    where course_id = p_course and user_id = auth.uid()
  );
$$;

-- A manager reads their OWN assignments; admins read all.
drop policy if exists "Read own or admin course managers" on public.course_managers;
create policy "Read own or admin course managers"
  on public.course_managers for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Only admins assign / remove managers.
drop policy if exists "Admins manage course managers" on public.course_managers;
create policy "Admins manage course managers"
  on public.course_managers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── 2. Managers can manage THEIR course's tee slots ─────────────────────────
-- (Existing "Tee slots viewable by all" + "Admins manage tee slots" stay; RLS ORs.)
drop policy if exists "Managers manage their tee slots" on public.tee_slots;
create policy "Managers manage their tee slots"
  on public.tee_slots for all to authenticated
  using     (public.manages_course(course_id))
  with check (public.manages_course(course_id));

-- ── 3. Managers can manage THEIR course's hole layout (base yardages) ────────
drop policy if exists "Managers manage their course holes" on public.course_holes;
create policy "Managers manage their course holes"
  on public.course_holes for all to authenticated
  using     (public.manages_course(course_id))
  with check (public.manages_course(course_id));

-- ── 4. course_hole_days — per-DAY yardage overrides (pins move daily) ────────
-- Falls back to course_holes.sandbox_yards when no override exists for a date.
create table if not exists public.course_hole_days (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses(id) on delete cascade,
  play_date     date not null,
  hole_number   int  not null,
  sandbox_yards int,
  updated_at    timestamptz default now(),
  unique (course_id, play_date, hole_number)
);
create index if not exists course_hole_days_lookup_idx
  on public.course_hole_days (course_id, play_date);

alter table public.course_hole_days enable row level security;

-- Everyone authenticated can read today's yardages (the golfer app needs them).
drop policy if exists "Hole days viewable by authenticated users" on public.course_hole_days;
create policy "Hole days viewable by authenticated users"
  on public.course_hole_days for select to authenticated using (true);

-- Managers (their course) + admins can set them.
drop policy if exists "Managers set their hole days" on public.course_hole_days;
create policy "Managers set their hole days"
  on public.course_hole_days for all to authenticated
  using     (public.manages_course(course_id) or public.is_admin())
  with check (public.manages_course(course_id) or public.is_admin());

-- ── 5. Managers can READ their course's bookings (financials / fill rate) ────
-- bookings join tee_slots → course. (Existing user/admin booking policies stay.)
drop policy if exists "Managers read their bookings" on public.bookings;
create policy "Managers read their bookings"
  on public.bookings for select to authenticated
  using (public.manages_course(
           (select ts.course_id from public.tee_slots ts where ts.id = bookings.slot_id)));

-- ── 6. Managers can READ their course's live matches + holes ────────────────
-- Read-only: live on-course tracking. (Player write/read policies stay intact.)
drop policy if exists "Managers read their course matches" on public.matches;
create policy "Managers read their course matches"
  on public.matches for select to authenticated
  using (course_id is not null and public.manages_course(course_id));

drop policy if exists "Managers read their course match holes" on public.match_holes;
create policy "Managers read their course match holes"
  on public.match_holes for select to authenticated
  using (exists (
    select 1 from public.matches m
    where m.id = match_holes.match_id
      and m.course_id is not null
      and public.manages_course(m.course_id)
  ));

-- Realtime so the manager's "live on course" board updates as golfers score.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and tablename='matches') then
    alter publication supabase_realtime add table public.matches;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and tablename='match_holes') then
    alter publication supabase_realtime add table public.match_holes;
  end if;
end $$;

-- ── 7. Honour per-day yardages when a booked match starts ───────────────────
-- Redefine start_booked_match to seed match_holes from course_hole_days for
-- TODAY when present, else the course_holes base. Logic is otherwise identical
-- to play.sql's version.
create or replace function public.start_booked_match(p_match uuid)
returns void language plpgsql security definer as $$
declare m record; cid uuid; cnt int;
begin
  select * into m from public.matches where id = p_match;
  if not found then raise exception 'Match not found'; end if;
  if auth.uid() not in (m.player_a, m.player_a2, m.player_b, m.player_b2) then
    raise exception 'Not a participant';
  end if;

  select count(*) into cnt from public.match_holes where match_id = p_match;
  if cnt = 0 then
    cid := m.course_id;
    if cid is null then
      select id into cid from public.courses
        where short_name = m.course_name or name = m.course_name limit 1;
    end if;
    if cid is not null and exists (select 1 from public.course_holes where course_id = cid) then
      insert into public.match_holes (match_id, hole_number, par, distance_yards)
        select p_match, ch.hole_number, ch.par,
               coalesce(d.sandbox_yards, ch.sandbox_yards)
        from public.course_holes ch
        left join public.course_hole_days d
          on  d.course_id   = ch.course_id
          and d.hole_number = ch.hole_number
          and d.play_date   = current_date
        where ch.course_id = cid
        order by ch.hole_number;
    else
      insert into public.match_holes (match_id, hole_number, par)
        select p_match, g, 3 from generate_series(1, coalesce(m.total_holes, 9)) g;
    end if;
  end if;

  update public.matches
    set status = 'active', started_at = coalesce(started_at, now())
    where id = p_match and status <> 'completed';
end $$;
grant execute on function public.start_booked_match(uuid) to authenticated;
