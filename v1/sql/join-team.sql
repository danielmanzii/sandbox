-- Sandbox Pitch & Putt — team-pick on join (#9).
-- Run AFTER setup.sql. Idempotent.
--
-- Lets a joiner CHOOSE their side of a 2v2 instead of being auto-slotted.
-- Client passes the side ('a' or 'b'); we claim the first open slot on that
-- team under a row lock so two people can't grab the same seat, and flip the
-- match to 'active' once the foursome (or 1v1 pair) is complete.
--
-- Why an RPC and not a plain client UPDATE: the matches RLS "waiting"
-- visibility clause only opens up while a Team B slot is free, so a 4th player
-- picking Team A (player_a2) after both B seats filled would be blocked. This
-- runs SECURITY DEFINER, validates auth.uid() itself, and only ever adds the
-- caller to an empty slot — never touches anyone else's seat.

create or replace function public.join_match_slot(p_match uuid, p_side text)
returns public.matches
language plpgsql security definer as $$
declare
  m   public.matches;
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not signed in'; end if;

  -- Lock the row so concurrent joiners serialize.
  select * into m from public.matches where id = p_match for update;
  if not found then raise exception 'Match not found'; end if;
  if m.status in ('completed', 'abandoned') then raise exception 'That match is over.'; end if;

  -- Already seated → no-op, just hand the row back.
  if uid in (m.player_a, m.player_a2, m.player_b, m.player_b2) then
    return m;
  end if;

  if m.match_type = '1v1' then
    if m.player_b is not null then raise exception 'That match already has two players.'; end if;
    update public.matches
       set player_b = uid, status = 'active', started_at = coalesce(started_at, now())
     where id = p_match
     returning * into m;
    return m;
  end if;

  -- 2v2: claim the first open seat on the chosen side.
  if p_side = 'a' then
    if m.player_a2 is not null then raise exception 'Team A is full.'; end if;
    update public.matches set player_a2 = uid where id = p_match returning * into m;
  elsif p_side = 'b' then
    if m.player_b is null then
      update public.matches set player_b = uid where id = p_match returning * into m;
    elsif m.player_b2 is null then
      update public.matches set player_b2 = uid where id = p_match returning * into m;
    else
      raise exception 'Team B is full.';
    end if;
  else
    raise exception 'Pick a team.';
  end if;

  -- Foursome complete → kick the match live.
  if m.player_a is not null and m.player_a2 is not null
     and m.player_b is not null and m.player_b2 is not null then
    update public.matches
       set status = 'active', started_at = coalesce(started_at, now())
     where id = p_match
     returning * into m;
  end if;

  return m;
end $$;

grant execute on function public.join_match_slot(uuid, text) to authenticated;

-- Discoverability: a waiting match must be readable by a prospective joiner
-- while ANY seat is open — not just a Team B seat. Otherwise a 4th player
-- picking Team A (after both B seats filled) can't even load the match.
-- (Codes still gate who actually joins; this only widens read visibility.)
drop policy if exists "Players can read relevant matches" on public.matches;
create policy "Players can read relevant matches"
  on public.matches for select to authenticated
  using (
    auth.uid() in (player_a, player_a2, player_b, player_b2)
    or (status = 'waiting' and (player_a2 is null or player_b is null or player_b2 is null))
  );

drop policy if exists "Players can update relevant matches" on public.matches;
create policy "Players can update relevant matches"
  on public.matches for update to authenticated
  using (
    auth.uid() in (player_a, player_a2, player_b, player_b2)
    or (status = 'waiting' and (player_a2 is null or player_b is null or player_b2 is null))
  );
