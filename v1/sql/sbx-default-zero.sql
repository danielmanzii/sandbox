-- ============================================================================
-- sbx-default-zero.sql — new users start unrated (SBX 0), not the old 4.0.
-- The signup code already sets sbx = 0; this makes the column default match so
-- any other insert path is consistent. Idempotent.
-- ============================================================================

alter table public.profiles alter column sbx set default 0;
