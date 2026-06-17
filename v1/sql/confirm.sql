-- Sandbox Pitch & Putt — Dual result confirmation (Phase D1).
-- Run AFTER play.sql. Idempotent.
--
-- A finished match isn't official until BOTH sides confirm the result
-- (one confirmation per side — scramble means it's the same for teammates).
-- Only a confirmed match will feed SBX + loyalty points (Phase D2/D4).

alter table public.matches
  add column if not exists confirmed_a  boolean not null default false,
  add column if not exists confirmed_b  boolean not null default false,
  add column if not exists confirmed_at timestamptz;

-- Record the caller's side confirmation; stamp confirmed_at once both agree.
create or replace function public.confirm_match_result(p_match uuid)
returns void language plpgsql security definer as $$
declare m record; side text;
begin
  select * into m from public.matches where id = p_match;
  if not found then raise exception 'Match not found'; end if;

  if auth.uid() in (m.player_a, m.player_a2) then side := 'a';
  elsif auth.uid() in (m.player_b, m.player_b2) then side := 'b';
  else raise exception 'Not a participant'; end if;

  if side = 'a' then
    update public.matches set confirmed_a = true where id = p_match;
  else
    update public.matches set confirmed_b = true where id = p_match;
  end if;

  -- Both sides in → lock it as confirmed (D2 will trigger SBX from here).
  update public.matches set confirmed_at = now()
    where id = p_match and confirmed_a and confirmed_b and confirmed_at is null;
end $$;
grant execute on function public.confirm_match_result(uuid) to authenticated;
