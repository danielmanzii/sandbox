-- ─────────────────────────────────────────────────────────────────
-- Sandbox Pitch & Putt — fictional-but-real-feeling event seeds.
--
-- Run AFTER setup.sql (which creates the events table).
-- Safe to re-run: each event has a stable id (gen_random_uuid is
-- replaced with a deterministic uuid below) so on conflict it updates
-- instead of inserting duplicates.
--
-- Edit dates / prices / images here as your real cadence solidifies.
-- All times are stored as timestamptz; the client formats display
-- strings (date, dateFull, time) from starts_at.
-- ─────────────────────────────────────────────────────────────────

insert into public.events (
  id, course_short, course_name, starts_at, field, tagline, description, img_url, is_major, type, status, price_walkup, price_member
) values
  (
    '11111111-1111-1111-1111-111111111101',
    'Melreese',
    'International Links Melreese',
    '2026-04-25 22:30:00+00',  -- Fri Apr 25, 6:30 PM EDT
    40,
    'Friday Match Night',
    'The weekly. 9 holes, 2-man scramble, 60 minutes flat. Brickell crowd, post-round bar at the clubhouse.',
    'https://images.unsplash.com/photo-1587174486073-ae5e5cec4cdf?w=800&q=80&auto=format&fit=crop',
    false,
    'weekly',
    'open',
    45,
    25
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'Crandon',
    'Crandon Park Golf Course',
    '2026-04-26 20:00:00+00',  -- Sat Apr 26, 4:00 PM EDT
    60,
    'The Crandon Open',
    'First Major of the season. Larger field, premium prizes, post-round mixer. Members get $30 off.',
    'https://images.unsplash.com/photo-1587174486073-ae5e5cec4cdf?w=800&q=80&auto=format&fit=crop',
    true,
    'major',
    'open',
    75,
    45
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'Biltmore',
    'Biltmore Hotel Golf Course',
    '2026-04-29 22:00:00+00',  -- Tue Apr 29, 6:00 PM EDT
    32,
    'Biltmore Mixer',
    'Coral Gables midweek. Smaller field, faster pace, drinks at the Biltmore bar after the last team finishes.',
    'https://images.unsplash.com/photo-1535132011086-b8818f016104?w=800&q=80&auto=format&fit=crop',
    false,
    'social',
    'open',
    50,
    28
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    'CC of Miami',
    'Country Club of Miami',
    '2026-05-03 21:00:00+00',  -- Sun May 3, 5:00 PM EDT
    32,
    'Members Night',
    'Members-only. No walk-ups. Sandbox-branded prizes for top 3 teams.',
    'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80&auto=format&fit=crop',
    false,
    'member-only',
    'member-only',
    0,
    0
  ),
  (
    '11111111-1111-1111-1111-111111111105',
    'Doral',
    'Trump National Doral Miami',
    '2026-05-09 18:00:00+00',  -- Sat May 9, 2:00 PM EDT
    80,
    'The Doral Cup',
    'Bigger Major. 80-player field, shotgun start, two flights, custom Sandbox + Doral merch in every bag.',
    'https://images.unsplash.com/photo-1530028828-25e8270793c5?w=800&q=80&auto=format&fit=crop',
    true,
    'major',
    'open',
    90,
    50
  )
on conflict (id) do update set
  course_short = excluded.course_short,
  course_name  = excluded.course_name,
  starts_at    = excluded.starts_at,
  field        = excluded.field,
  tagline      = excluded.tagline,
  description  = excluded.description,
  img_url      = excluded.img_url,
  is_major     = excluded.is_major,
  type         = excluded.type,
  status       = excluded.status,
  price_walkup = excluded.price_walkup,
  price_member = excluded.price_member;
