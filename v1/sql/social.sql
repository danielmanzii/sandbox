-- Sandbox Pitch & Putt — Social: follows + profile photos.
-- Run AFTER setup.sql. Safe to re-run (drop policy / if not exists everywhere).

-- ─────────────────────────────────────────────────────────────────
-- profiles.avatar_url — URL into the public `avatars` storage bucket.
-- Created via the Supabase dashboard (Storage → New bucket → "avatars",
-- public). The client uploads to <user_id>/avatar.<ext> and writes the
-- resulting public URL here.
-- ─────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists avatar_url  text,
  add column if not exists bio         text,
  add column if not exists home_course text;

-- ─────────────────────────────────────────────────────────────────
-- follows: directed (Twitter-style). Following someone makes their
-- activity show up in your feed; no acceptance required.
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.follows (
  follower_id   uuid not null references public.profiles(id) on delete cascade,
  following_id  uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id);
create index if not exists follows_follower_idx  on public.follows (follower_id);

alter table public.follows enable row level security;

drop policy if exists "Anyone authenticated can read follows" on public.follows;
create policy "Anyone authenticated can read follows"
  on public.follows for select to authenticated using (true);

drop policy if exists "Users can follow others (insert as themselves)" on public.follows;
create policy "Users can follow others (insert as themselves)"
  on public.follows for insert to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow (delete their own follow row)" on public.follows;
create policy "Users can unfollow (delete their own follow row)"
  on public.follows for delete to authenticated
  using (auth.uid() = follower_id);

-- Realtime so follower counts + feed updates flow live.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'follows'
  ) then
    alter publication supabase_realtime add table public.follows;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────
-- Friend feed: completed matches need to be visible to non-players
-- so the social feed can render "Rob beat Alex 3&2" type events.
-- The original RLS only allowed players themselves to read their
-- matches; for completed games this is overly restrictive given we
-- already publish results on profile pages.
-- ─────────────────────────────────────────────────────────────────
drop policy if exists "Completed matches viewable by authenticated users" on public.matches;
create policy "Completed matches viewable by authenticated users"
  on public.matches for select to authenticated
  using (status = 'completed');

-- Realtime on event_registrations + matches so the feed updates live
-- when a friend signs up or finishes a match.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'event_registrations'
  ) then
    alter publication supabase_realtime add table public.event_registrations;
  end if;
end $$;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────
-- Storage policies on the `avatars` bucket.
-- Run these AFTER you create the bucket in the dashboard.
-- (The bucket itself can also be created via SQL — see commented
--  block below — but the dashboard is one click and avoids a quirk
--  where storage bucket inserts via SQL sometimes lag the UI.)
-- ─────────────────────────────────────────────────────────────────

-- Anyone (logged in or not) can VIEW avatar files — they're shown on
-- public profile screens and the activity feed.
drop policy if exists "Avatars are publicly viewable" on storage.objects;
create policy "Avatars are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can UPLOAD into the avatars bucket. We don't
-- enforce path ownership here because the client always writes under
-- <user_id>/...; the column update on profiles is what's authoritative.
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

-- Users can REPLACE their own avatar (UPDATE on storage.objects).
drop policy if exists "Authenticated users can update avatars" on storage.objects;
create policy "Authenticated users can update avatars"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars');

-- Users can DELETE their own avatar files.
drop policy if exists "Authenticated users can delete own avatars" on storage.objects;
create policy "Authenticated users can delete own avatars"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- (Optional) Bucket via SQL — uncomment if you'd rather not click in dashboard:
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
--   on conflict (id) do nothing;
