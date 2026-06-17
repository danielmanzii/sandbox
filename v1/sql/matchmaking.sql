-- Sandbox Pitch & Putt — Matchmaking + notifications (Phase C1).
-- Run AFTER courses.sql. Idempotent.
--
-- Provides:
--   notifications  : generic in-app notifications (pairing/refund/invite/…)
--   attempt_pair() : SBX-banded instant pairing of two waiting solos
--   trigger        : fires attempt_pair on each new solo 2v2 booking
--   book_with_partner / accept_partner_invite / decline_partner_invite RPCs
--   resolve_pairings() : 2h-before-tee sweep — salvage-pair leftovers, else
--                        release (refund) the odd one out + notify
--
-- NOTE: the pg_cron schedule at the BOTTOM requires the pg_cron extension.
-- Enable it once in Supabase → Database → Extensions (search "pg_cron"),
-- then run the final block. Everything above works without it.

-- ─────────────────────────────────────────────────────────────────
-- notifications — one row per in-app notification for a user.
--   type: 'paired' | 'refund' | 'partner_invite' | 'partner_accepted'
--         | 'partner_declined' | (future: 'foursome_set' | 'message' …)
--   data: jsonb refs (slot_id, partner_id, inviter_id, booking_id, …)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  data       jsonb not null default '{}'::jsonb,
  read       boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Read own notifications" on public.notifications;
create policy "Read own notifications"
  on public.notifications for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Update own notifications" on public.notifications;
create policy "Update own notifications"
  on public.notifications for update to authenticated using (auth.uid() = user_id);

-- Direct inserts only for yourself; cross-user notifications are created by
-- the SECURITY DEFINER functions below (which bypass RLS).
drop policy if exists "Insert own notifications" on public.notifications;
create policy "Insert own notifications"
  on public.notifications for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Delete own notifications" on public.notifications;
create policy "Delete own notifications"
  on public.notifications for delete to authenticated using (auth.uid() = user_id);

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and tablename='notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────
-- attempt_pair(booking) — pair a waiting solo with the closest-SBX
-- waiting solo in the same slot, within a 1.0 SBX band. No-op if none
-- in band (they keep waiting; the 2h sweep relaxes the band later).
-- ─────────────────────────────────────────────────────────────────
create or replace function public.attempt_pair(p_booking uuid)
returns void language plpgsql security definer as $$
declare meb record; mate record;
begin
  select * into meb from public.bookings where id = p_booking;
  if not found or meb.partner_id is not null or not meb.needs_partner
     or meb.match_type <> '2v2' or meb.status <> 'reserved' then
    return;
  end if;

  select b.* into mate
  from public.bookings b
  join public.profiles p  on p.id  = b.user_id
  join public.profiles me on me.id = meb.user_id
  where b.slot_id = meb.slot_id
    and b.match_type = '2v2' and b.needs_partner and b.partner_id is null
    and b.status = 'reserved'
    and b.user_id <> meb.user_id and b.id <> meb.id
    and abs(coalesce(p.sbx, 4) - coalesce(me.sbx, 4)) <= 1.0
  order by abs(coalesce(p.sbx, 4) - coalesce(me.sbx, 4)) asc, b.created_at asc
  limit 1;

  if found then
    update public.bookings set partner_id = mate.user_id, needs_partner = false where id = meb.id;
    update public.bookings set partner_id = meb.user_id, needs_partner = false where id = mate.id;
    insert into public.notifications (user_id, type, title, body, data) values
      (meb.user_id,  'paired', 'You''ve got a partner!', 'You''ve been paired for your 2v2.',
        jsonb_build_object('slot_id', meb.slot_id, 'partner_id', mate.user_id)),
      (mate.user_id, 'paired', 'You''ve got a partner!', 'You''ve been paired for your 2v2.',
        jsonb_build_object('slot_id', meb.slot_id, 'partner_id', meb.user_id));
  end if;
end $$;

-- Fire instant pairing whenever a solo 2v2 booking is created.
create or replace function public.bookings_after_insert()
returns trigger language plpgsql security definer as $$
begin
  if NEW.needs_partner and NEW.partner_id is null and NEW.match_type = '2v2' then
    perform public.attempt_pair(NEW.id);
  end if;
  return NEW;
end $$;

drop trigger if exists bookings_pair_trg on public.bookings;
create trigger bookings_pair_trg
  after insert on public.bookings
  for each row execute function public.bookings_after_insert();

-- ─────────────────────────────────────────────────────────────────
-- Partner invite flow (consent required — no one is booked without
-- accepting). book_with_partner creates the inviter's booking + an
-- invite notification; accept/decline complete or unwind it.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.book_with_partner(p_slot uuid, p_partner uuid, p_price int)
returns uuid language plpgsql security definer as $$
declare me uuid := auth.uid(); my_booking uuid; me_name text;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  insert into public.bookings (slot_id, user_id, partner_id, match_type, needs_partner, status, price_charged)
    values (p_slot, me, p_partner, '2v2', false, 'reserved', p_price)
    returning id into my_booking;
  select coalesce(nullif(trim(first_name || ' ' || coalesce(last_name,'')), ''), handle)
    into me_name from public.profiles where id = me;
  insert into public.notifications (user_id, type, title, body, data)
    values (p_partner, 'partner_invite', 'Partner invite',
            coalesce(me_name, 'A player') || ' invited you to play a 2v2.',
            jsonb_build_object('slot_id', p_slot, 'inviter_id', me, 'booking_id', my_booking));
  return my_booking;
end $$;
grant execute on function public.book_with_partner(uuid, uuid, int) to authenticated;

create or replace function public.accept_partner_invite(p_notif uuid)
returns uuid language plpgsql security definer as $$
declare me uuid := auth.uid(); n record; inviter uuid; slot uuid; pr int; new_b uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select * into n from public.notifications where id = p_notif and user_id = me and type = 'partner_invite';
  if not found then raise exception 'Invite not found'; end if;
  inviter := (n.data->>'inviter_id')::uuid;
  slot    := (n.data->>'slot_id')::uuid;
  select price into pr from public.tee_slots where id = slot;
  insert into public.bookings (slot_id, user_id, partner_id, match_type, needs_partner, status, price_charged)
    values (slot, me, inviter, '2v2', false, 'reserved', pr)
    returning id into new_b;
  update public.notifications set read = true where id = p_notif;
  insert into public.notifications (user_id, type, title, body, data)
    values (inviter, 'partner_accepted', 'Partner confirmed',
            'Your partner accepted — you''re set for the 2v2.',
            jsonb_build_object('slot_id', slot, 'partner_id', me));
  return new_b;
end $$;
grant execute on function public.accept_partner_invite(uuid) to authenticated;

create or replace function public.decline_partner_invite(p_notif uuid)
returns void language plpgsql security definer as $$
declare me uuid := auth.uid(); n record; inviter uuid; slot uuid; inviter_booking uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  select * into n from public.notifications where id = p_notif and user_id = me and type = 'partner_invite';
  if not found then raise exception 'Invite not found'; end if;
  inviter := (n.data->>'inviter_id')::uuid;
  slot    := (n.data->>'slot_id')::uuid;
  update public.notifications set read = true where id = p_notif;
  -- Inviter falls back into the solo pool, then we immediately try to re-pair.
  update public.bookings set partner_id = null, needs_partner = true
    where slot_id = slot and user_id = inviter
    returning id into inviter_booking;
  insert into public.notifications (user_id, type, title, body, data)
    values (inviter, 'partner_declined', 'Partner declined',
            'Your invite was declined — we''ll pair you with another solo.',
            jsonb_build_object('slot_id', slot));
  if inviter_booking is not null then
    perform public.attempt_pair(inviter_booking);
  end if;
end $$;
grant execute on function public.decline_partner_invite(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────
-- resolve_pairings() — runs on a schedule. For tee times now within
-- 2 hours: salvage-pair ANY two remaining solos (relaxed band, to keep
-- the revenue), then release (refund) the final odd one out + notify.
-- ─────────────────────────────────────────────────────────────────
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
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────
-- SCHEDULE (requires pg_cron — enable it in Database → Extensions first,
-- then run this block). Runs every 10 minutes. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────
-- do $$ begin
--   perform cron.unschedule('resolve-pairings');
-- exception when others then null; end $$;
-- select cron.schedule('resolve-pairings', '*/10 * * * *', $$select public.resolve_pairings()$$);
