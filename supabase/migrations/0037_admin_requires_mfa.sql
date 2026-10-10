-- 0037_admin_requires_mfa.sql
-- An admin who has enrolled an authenticator app only counts as an admin in the
-- database once the session has passed the code check (aal2). Admins without a
-- verified factor are unaffected, so nobody is locked out by turning this on.
-- Every admin RLS policy and admin function already goes through is_admin(), so
-- this covers direct API calls as well as the admin pages.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path to '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false)
    and (
      coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = (select auth.uid()) and f.status = 'verified')
    );
$$;
