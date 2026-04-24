-- Sandbox Pitch & Putt — Match invites + notifications.
-- Run AFTER setup.sql. Safe to re-run (drop policy / if not exists everywhere).
--
-- Powers the "Invite by username" flow on the Challenge a Friend
-- waiting screen, and the notification banner the invitee sees on
-- Home / Play.

-- ─────────────────────────────────────────────────────────────────
-- match_invites: pending + resolved invitations to a match.
--   status: pending | accepted | declined | cancelled
--   The match itself doesn't change shape; on accept, we add the
--   invitee into the next free slot of matches (player_b, then
--   player_a2 / player_b2 for 2v2) — handled client-side.
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.match_invites (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  invited_by  uuid not null references public.profiles(id) on delete cascade,
  invitee_id  uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'pending'
              check (status in ('pending','accepted','declined','cancelled')),
  created_at  timestamptz default now(),
  responded_at timestamptz,
  unique (match_id, invitee_id)   -- can't double-invite the same player
);

create index if not exists match_invites_invitee_idx
  on public.match_invites (invitee_id, status);
create index if not exists match_invites_match_idx
  on public.match_invites (match_id);

alter table public.match_invites enable row level security;

-- Invitee + sender can SELECT their own invites. Anyone in the match
-- can also see invites for that match (so the creator can see status).
drop policy if exists "Invites visible to invitee + sender + match players" on public.match_invites;
create policy "Invites visible to invitee + sender + match players"
  on public.match_invites for select to authenticated
  using (
    auth.uid() = invitee_id
    or auth.uid() = invited_by
    or exists (
      select 1 from public.matches m
      where m.id = match_invites.match_id
        and auth.uid() in (m.player_a, m.player_a2, m.player_b, m.player_b2)
    )
  );

-- Anyone in the match can send invites (so partners can invite too).
drop policy if exists "Match players can send invites" on public.match_invites;
create policy "Match players can send invites"
  on public.match_invites for insert to authenticated
  with check (
    auth.uid() = invited_by
    and exists (
      select 1 from public.matches m
      where m.id = match_invites.match_id
        and auth.uid() in (m.player_a, m.player_a2, m.player_b, m.player_b2)
    )
  );

-- Only the invitee can update their own invite (accept / decline).
-- Sender can also cancel a pending invite.
drop policy if exists "Invitee can respond, sender can cancel" on public.match_invites;
create policy "Invitee can respond, sender can cancel"
  on public.match_invites for update to authenticated
  using (auth.uid() in (invitee_id, invited_by));

-- Realtime so invitees get notified the instant an invite arrives,
-- and senders see status flip from pending → accepted/declined.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'match_invites'
  ) then
    alter publication supabase_realtime add table public.match_invites;
  end if;
end $$;
