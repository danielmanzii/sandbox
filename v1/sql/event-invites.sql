-- Sandbox Pitch & Putt — Event invites.
-- Run AFTER setup.sql. Safe to re-run (drop policy / if not exists everywhere).
--
-- Two invite types:
--   'general'  — "Hey, come to this event!" Invitee sees notification + can register.
--   'partner'  — Inviter tagged invitee as their scramble partner. Invitee is
--                auto-registered on insert; declining removes their registration.

create table if not exists public.event_invites (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  invited_by   uuid not null references public.profiles(id) on delete cascade,
  invitee_id   uuid not null references public.profiles(id) on delete cascade,
  invite_type  text not null default 'general'
               check (invite_type in ('general', 'partner')),
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at   timestamptz default now(),
  responded_at timestamptz,
  unique (event_id, invitee_id)   -- one active invite per event/invitee
);

create index if not exists event_invites_invitee_idx
  on public.event_invites (invitee_id, status);
create index if not exists event_invites_event_idx
  on public.event_invites (event_id);
create index if not exists event_invites_inviter_idx
  on public.event_invites (invited_by);

alter table public.event_invites enable row level security;

-- Invitee + sender can read their own invites.
drop policy if exists "Event invites visible to invitee and sender" on public.event_invites;
create policy "Event invites visible to invitee and sender"
  on public.event_invites for select to authenticated
  using (auth.uid() in (invitee_id, invited_by));

-- Any registered user can send invites for events they're signed up for.
-- (Simplification: any authenticated user can send; RLS on event_registrations
--  is the guard on who can auto-register partners.)
drop policy if exists "Authenticated users can send event invites" on public.event_invites;
create policy "Authenticated users can send event invites"
  on public.event_invites for insert to authenticated
  with check (auth.uid() = invited_by);

-- Invitee responds; sender can cancel.
drop policy if exists "Invitee can respond, sender can cancel" on public.event_invites;
create policy "Invitee can respond, sender can cancel"
  on public.event_invites for update to authenticated
  using (auth.uid() in (invitee_id, invited_by));

-- Realtime so invitees get notified the instant an invite arrives.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'event_invites'
  ) then
    alter publication supabase_realtime add table public.event_invites;
  end if;
end $$;
