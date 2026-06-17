-- Sandbox Pitch & Putt — Foursome / match formation (Phase C2).
-- Run AFTER matchmaking.sql. Idempotent.
--
-- Turns complete teams (2v2) and lone players (1v1) in a slot into actual
-- MATCHES, balanced by effective strength, links the bookings, and
-- notifies everyone ("Your match is set"). Fires opportunistically on
-- every booking insert and again in the 2h cutoff sweep.
--
-- Effective 2v2 team strength = 0.6*better + 0.4*worse SBX — models the
-- scramble "carry" (the stronger partner pulls the team up), so we match
-- teams on that rather than a naive average.

-- Let all four participants read their formed match (the base policy only
-- covered player_a / player_b).
drop policy if exists "Team players can read their match" on public.matches;
create policy "Team players can read their match"
  on public.matches for select to authenticated
  using (auth.uid() in (player_a, player_b, player_a2, player_b2));

create or replace function public.form_matches_for_slot(p_slot uuid)
returns void language plpgsql security definer as $$
declare cname text; rec record; other record; code text; mid uuid;
begin
  select coalesce(c.short_name, c.name) into cname
    from public.tee_slots ts join public.courses c on c.id = ts.course_id
    where ts.id = p_slot;

  -- ===== 2v2: pair two complete teams by closest effective strength =====
  loop
    select * into rec from (
      select b1.user_id as p1, b2.user_id as p2,
             0.6*greatest(coalesce(pr1.sbx,4),coalesce(pr2.sbx,4))
           + 0.4*least(coalesce(pr1.sbx,4),coalesce(pr2.sbx,4)) as strength,
             greatest(b1.created_at, b2.created_at) as ready_at
      from public.bookings b1
      join public.bookings b2
        on b2.user_id = b1.partner_id and b2.partner_id = b1.user_id and b2.slot_id = b1.slot_id
      join public.profiles pr1 on pr1.id = b1.user_id
      join public.profiles pr2 on pr2.id = b2.user_id
      where b1.slot_id = p_slot and b1.match_type='2v2' and b2.match_type='2v2'
        and b1.status='reserved' and b2.status='reserved'
        and b1.match_id is null and b2.match_id is null
        and b1.user_id < b2.user_id
    ) t order by ready_at asc limit 1;
    exit when not found;

    select * into other from (
      select b1.user_id as p1, b2.user_id as p2,
             0.6*greatest(coalesce(pr1.sbx,4),coalesce(pr2.sbx,4))
           + 0.4*least(coalesce(pr1.sbx,4),coalesce(pr2.sbx,4)) as strength,
             greatest(b1.created_at, b2.created_at) as ready_at
      from public.bookings b1
      join public.bookings b2
        on b2.user_id = b1.partner_id and b2.partner_id = b1.user_id and b2.slot_id = b1.slot_id
      join public.profiles pr1 on pr1.id = b1.user_id
      join public.profiles pr2 on pr2.id = b2.user_id
      where b1.slot_id = p_slot and b1.match_type='2v2' and b2.match_type='2v2'
        and b1.status='reserved' and b2.status='reserved'
        and b1.match_id is null and b2.match_id is null
        and b1.user_id < b2.user_id
    ) t where not (t.p1 = rec.p1 and t.p2 = rec.p2)
      order by abs(t.strength - rec.strength) asc, ready_at asc limit 1;
    exit when not found;  -- only one complete team; wait for an opponent

    code := upper(substr(md5(random()::text), 1, 6));
    insert into public.matches (join_code, course_name, total_holes, player_a, player_a2, player_b, player_b2, status)
      values (code, cname, 9, rec.p1, rec.p2, other.p1, other.p2, 'waiting')
      returning id into mid;
    update public.bookings set match_id = mid
      where slot_id = p_slot and user_id in (rec.p1, rec.p2, other.p1, other.p2) and match_id is null;
    insert into public.notifications (user_id, type, title, body, data)
      select uid, 'match_set', 'Your match is set',
             'Your foursome is locked in — tap to scout your matchup.',
             jsonb_build_object('slot_id', p_slot, 'match_id', mid)
      from unnest(array[rec.p1, rec.p2, other.p1, other.p2]) as uid;
  end loop;

  -- ===== 1v1: pair two players by closest SBX =====
  loop
    select * into rec from (
      select b.user_id as uid, coalesce(pr.sbx,4) as sbx, b.created_at as ready_at
      from public.bookings b join public.profiles pr on pr.id = b.user_id
      where b.slot_id = p_slot and b.match_type='1v1' and b.status='reserved' and b.match_id is null
    ) t order by ready_at asc limit 1;
    exit when not found;

    select * into other from (
      select b.user_id as uid, coalesce(pr.sbx,4) as sbx, b.created_at as ready_at
      from public.bookings b join public.profiles pr on pr.id = b.user_id
      where b.slot_id = p_slot and b.match_type='1v1' and b.status='reserved' and b.match_id is null
    ) t where t.uid <> rec.uid
      order by abs(t.sbx - rec.sbx) asc, ready_at asc limit 1;
    exit when not found;

    code := upper(substr(md5(random()::text), 1, 6));
    insert into public.matches (join_code, course_name, total_holes, player_a, player_b, status)
      values (code, cname, 9, rec.uid, other.uid, 'waiting') returning id into mid;
    update public.bookings set match_id = mid
      where slot_id = p_slot and user_id in (rec.uid, other.uid) and match_id is null;
    insert into public.notifications (user_id, type, title, body, data)
      select uid, 'match_set', 'Your match is set',
             'Your 1v1 is locked in — tap to scout your opponent.',
             jsonb_build_object('slot_id', p_slot, 'match_id', mid)
      from unnest(array[rec.uid, other.uid]) as uid;
  end loop;
end $$;

-- Fire formation on every booking insert (covers solo-pair, invite-accept,
-- and 1v1), after any instant solo pairing.
create or replace function public.bookings_after_insert()
returns trigger language plpgsql security definer as $$
begin
  if NEW.match_type = '2v2' and NEW.needs_partner and NEW.partner_id is null then
    perform public.attempt_pair(NEW.id);
  end if;
  perform public.form_matches_for_slot(NEW.slot_id);
  return NEW;
end $$;

-- Re-define the cutoff sweep to also form matches after salvage-pairing
-- (salvage pairs via UPDATE, which doesn't fire the insert trigger).
create or replace function public.resolve_pairings()
returns void language plpgsql security definer as $$
declare s record; a record; b record;
begin
  for s in
    select id as slot_id from public.tee_slots
    where starts_at > now() and starts_at <= now() + interval '2 hours'
  loop
    loop
      select * into a from public.bookings
        where slot_id = s.slot_id and match_type = '2v2'
          and needs_partner and partner_id is null and status = 'reserved'
        order by created_at asc limit 1;
      exit when not found;

      select * into b from public.bookings
        where slot_id = s.slot_id and match_type = '2v2'
          and needs_partner and partner_id is null and status = 'reserved'
          and id <> a.id
        order by created_at asc limit 1;

      if found then
        update public.bookings set partner_id = b.user_id, needs_partner = false where id = a.id;
        update public.bookings set partner_id = a.user_id, needs_partner = false where id = b.id;
        insert into public.notifications (user_id, type, title, body, data) values
          (a.user_id, 'paired', 'Paired just in time', 'We matched you with a partner for your 2v2.',
            jsonb_build_object('slot_id', s.slot_id, 'partner_id', b.user_id)),
          (b.user_id, 'paired', 'Paired just in time', 'We matched you with a partner for your 2v2.',
            jsonb_build_object('slot_id', s.slot_id, 'partner_id', a.user_id));
      else
        update public.bookings set status = 'cancelled', needs_partner = false where id = a.id;
        insert into public.notifications (user_id, type, title, body, data) values
          (a.user_id, 'refund', 'Reservation released',
           'We couldn''t find you a partner in time, so your spot was released — no charge. Sorry about that!',
            jsonb_build_object('slot_id', s.slot_id));
        exit;
      end if;
    end loop;
    perform public.form_matches_for_slot(s.slot_id);
  end loop;
end $$;
