-- ============================================================================
-- email-exists.sql — lets the signup flow warn "email already in use" on the
-- email step, before creating anything. The anon client can't read auth.users
-- directly, so this SECURITY DEFINER function checks for us.
--
-- Note: this intentionally allows checking whether an email is registered
-- (needed for the inline warning). Fine for this app. Idempotent.
-- ============================================================================

create or replace function public.email_exists(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users where lower(email) = lower(trim(p_email))
  );
$$;

grant execute on function public.email_exists(text) to anon, authenticated;
