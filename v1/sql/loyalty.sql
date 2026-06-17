-- Sandbox Pitch & Putt — Loyalty points (Phase D4). Run AFTER shots.sql.
-- Starbucks-style ledger: every confirmed match earns points; logging the
-- optional ball-position detail earns BONUS points (free on-field data).
--   base    +50  per player, per confirmed match
--   win     +25  to the winning side
--   detail  +10  per hole with a zone logged (to each participant)

create table if not exists public.loyalty_points (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  points     int  not null,
  reason     text not null,
  match_id   uuid references public.matches(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists loyalty_user_idx on public.loyalty_points (user_id, created_at desc);

alter table public.loyalty_points enable row level security;

drop policy if exists "Read own points" on public.loyalty_points;
create policy "Read own points"
  on public.loyalty_points for select to authenticated using (auth.uid() = user_id);

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and tablename='loyalty_points') then
    alter publication supabase_realtime add table public.loyalty_points;
  end if;
end $$;

-- Award points for a confirmed match (idempotency handled by the caller).
create or replace function public.award_match_points(p_match uuid)
returns void language plpgsql security definer as $$
declare m record; zones int; uid uuid;
begin
  select * into m from public.matches where id = p_match;
  if not found then return; end if;
  select count(*) into zones from public.match_holes where match_id = p_match and zone is not null;

  for uid in select unnest(array[m.player_a, m.player_a2, m.player_b, m.player_b2]) loop
    if uid is null then continue; end if;
    insert into public.loyalty_points (user_id, points, reason, match_id)
      values (uid, 50, 'Match played', p_match);
    if zones > 0 then
      insert into public.loyalty_points (user_id, points, reason, match_id)
        values (uid, zones * 10, 'Detailed tracking bonus', p_match);
    end if;
  end loop;

  if m.result in ('A','B') then
    for uid in select unnest(case when m.result='A' then array[m.player_a, m.player_a2]
                                  else array[m.player_b, m.player_b2] end) loop
      if uid is null then continue; end if;
      insert into public.loyalty_points (user_id, points, reason, match_id)
        values (uid, 25, 'Match won', p_match);
    end loop;
  end if;
end $$;

-- Redefine confirm: on the FIRST time both sides agree, run SBX + award
-- points exactly once (row_count guard prevents double-award).
create or replace function public.confirm_match_result(p_match uuid)
returns void language plpgsql security definer as $$
declare m record; side text; both_done boolean; newly int;
begin
  select * into m from public.matches where id = p_match;
  if not found then raise exception 'Match not found'; end if;

  if auth.uid() in (m.player_a, m.player_a2) then side := 'a';
  elsif auth.uid() in (m.player_b, m.player_b2) then side := 'b';
  else raise exception 'Not a participant'; end if;

  if side = 'a' then update public.matches set confirmed_a = true where id = p_match;
  else                update public.matches set confirmed_b = true where id = p_match; end if;

  select confirmed_a and confirmed_b into both_done from public.matches where id = p_match;
  if both_done then
    update public.matches set confirmed_at = now() where id = p_match and confirmed_at is null;
    get diagnostics newly = row_count;
    if newly > 0 then
      perform public.recompute_sbx();
      perform public.award_match_points(p_match);
    end if;
  end if;
end $$;
grant execute on function public.confirm_match_result(uuid) to authenticated;
