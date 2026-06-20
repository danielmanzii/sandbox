-- Sandbox Pitch & Putt — per-player, per-hole stats (2v2 scramble).
-- Lets BOTH teammates log their own shot each hole (fairway / reached green
-- / ball position), which powers the caddie comparison + ball selection.
-- Run after regular-flow.sql. Idempotent. Realtime so teammates sync live.

create table if not exists public.hole_player_stats (
  match_id    uuid not null references public.matches(id) on delete cascade,
  hole_number int  not null,
  player_id   uuid not null references public.profiles(id) on delete cascade,
  fairway     text,     -- hit | left | right | long | short
  gir         boolean,  -- did this player's ball reach the green
  zone        text,     -- green position if on
  primary key (match_id, hole_number, player_id)
);

alter table public.hole_player_stats enable row level security;

drop policy if exists "Participants read player hole stats" on public.hole_player_stats;
create policy "Participants read player hole stats"
  on public.hole_player_stats for select to authenticated using (
    exists (select 1 from public.matches m where m.id = match_id
            and auth.uid() in (m.player_a, m.player_a2, m.player_b, m.player_b2))
  );

drop policy if exists "Participants write player hole stats" on public.hole_player_stats;
create policy "Participants write player hole stats"
  on public.hole_player_stats for all to authenticated using (
    exists (select 1 from public.matches m where m.id = match_id
            and auth.uid() in (m.player_a, m.player_a2, m.player_b, m.player_b2))
  ) with check (
    exists (select 1 from public.matches m where m.id = match_id
            and auth.uid() in (m.player_a, m.player_a2, m.player_b, m.player_b2))
  );

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and tablename='hole_player_stats') then
    alter publication supabase_realtime add table public.hole_player_stats;
  end if;
end $$;
