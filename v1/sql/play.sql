-- Sandbox Pitch & Putt — Check-in & start a booked match (Phase C-final).
-- Run AFTER foursome.sql. Idempotent.
--
-- 1) matches.course_id so we can seed the right Sandbox 9 holes.
-- 2) form_matches_for_slot redefined to set match_type + course_id
--    (the earlier version forgot match_type, so 2v2 foursomes scored as 1v1).
-- 3) start_booked_match(): seeds match_holes from the course's Sandbox 9
--    (par + yardage) if not already there, and flips the match to active.

alter table public.matches
  add column if not exists course_id uuid references public.courses(id);

-- ── form_matches_for_slot (now sets match_type + course_id) ───────────
create or replace function public.form_matches_for_slot(p_slot uuid)
returns void language plpgsql security definer as $$
declare cid uuid; cname text; rec record; other record; code text; mid uuid;
begin
  select c.id, coalesce(c.short_name, c.name) into cid, cname
    from public.tee_slots ts join public.courses c on c.id = ts.course_id
    where ts.id = p_slot;

  -- ===== 2v2 =====
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
    exit when not found;

    code := upper(substr(md5(random()::text), 1, 6));
    insert into public.matches (join_code, course_name, course_id, match_type, total_holes,
                                player_a, player_a2, player_b, player_b2, status)
      values (code, cname, cid, '2v2', 9, rec.p1, rec.p2, other.p1, other.p2, 'waiting')
      returning id into mid;
    update public.bookings set match_id = mid
      where slot_id = p_slot and user_id in (rec.p1, rec.p2, other.p1, other.p2) and match_id is null;
    insert into public.notifications (user_id, type, title, body, data)
      select uid, 'match_set', 'Your match is set',
             'Your foursome is locked in — tap to scout your matchup.',
             jsonb_build_object('slot_id', p_slot, 'match_id', mid)
      from unnest(array[rec.p1, rec.p2, other.p1, other.p2]) as uid;
  end loop;

  -- ===== 1v1 =====
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
    insert into public.matches (join_code, course_name, course_id, match_type, total_holes,
                                player_a, player_b, status)
      values (code, cname, cid, '1v1', 9, rec.uid, other.uid, 'waiting') returning id into mid;
    update public.bookings set match_id = mid
      where slot_id = p_slot and user_id in (rec.uid, other.uid) and match_id is null;
    insert into public.notifications (user_id, type, title, body, data)
      select uid, 'match_set', 'Your match is set',
             'Your 1v1 is locked in — tap to scout your opponent.',
             jsonb_build_object('slot_id', p_slot, 'match_id', mid)
      from unnest(array[rec.uid, other.uid]) as uid;
  end loop;
end $$;

-- ── start_booked_match: seed Sandbox 9 holes + go active ──────────────
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
        select p_match, hole_number, par, sandbox_yards
        from public.course_holes where course_id = cid order by hole_number;
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
