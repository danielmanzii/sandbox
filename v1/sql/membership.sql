-- ============================================================================
-- membership.sql — move membership tier + guest passes into the database, and
-- make tier / is_admin admin-controlled (closing a self-escalation hole).
--
-- Apply order: run AFTER setup.sql (needs profiles + is_admin) and events.sql.
-- Safe to re-run (idempotent: if-not-exists / drop-if-exists / guarded DO).
--
-- Coordinated change: touches the shared `profiles` table + RLS. Run once in
-- Supabase, and tell the other collaborator before applying.
-- ============================================================================

-- ── 1. Membership tier on profiles ─────────────────────────────────────────
-- Valid values: 'walkup' | 'stats' | 'league' | 'plus'. New users = 'walkup'.
alter table public.profiles
  add column if not exists tier text not null default 'walkup';

-- ── 2. Guest passes ledger ──────────────────────────────────────────────────
create table if not exists public.guest_passes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'available'
                check (status in ('available','used','expired')),
  event_id    uuid references public.events(id) on delete set null,
  granted_by  uuid references public.profiles(id) on delete set null,
  note        text,
  created_at  timestamptz default now(),
  used_at     timestamptz
);
create index if not exists guest_passes_user_idx on public.guest_passes(user_id);

alter table public.guest_passes enable row level security;

drop policy if exists "Read own or admin guest passes" on public.guest_passes;
create policy "Read own or admin guest passes"
  on public.guest_passes for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

drop policy if exists "Admins manage guest passes" on public.guest_passes;
create policy "Admins manage guest passes"
  on public.guest_passes for all to authenticated
  using     (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ── 3. Admins can update ANY profile ────────────────────────────────────────
-- (The existing "Users can update own profile" policy stays; RLS ORs them.)
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update to authenticated
  using     (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ── 4. Guard: only admins may change is_admin or tier ───────────────────────
-- Without this, the "update own profile" policy would let any user set their
-- own is_admin = true or change their own tier. This trigger blocks that for
-- non-admins while still letting them edit name/handle/bio/home_course.
create or replace function public.guard_profile_privileged()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    if new.is_admin is distinct from old.is_admin then
      raise exception 'Only admins can change is_admin';
    end if;
    if new.tier is distinct from old.tier then
      raise exception 'Only admins can change membership tier';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_profile_privileged on public.profiles;
create trigger trg_guard_profile_privileged
  before update on public.profiles
  for each row execute function public.guard_profile_privileged();
