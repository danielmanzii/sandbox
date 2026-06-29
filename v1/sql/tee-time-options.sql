-- ============================================================================
-- tee-time-options.sql — adds the "includes cart" flag to tee slots.
--
-- The course-partner portal lets a manager mark a tee time as cart-included or
-- not. It's an informational label (no price effect) the golfer app can surface
-- on the booking card. A tee time is always a foursome, so capacity stays 4.
--
-- Run AFTER courses.sql. Idempotent.
-- ============================================================================

alter table public.tee_slots
  add column if not exists includes_cart boolean not null default false;
