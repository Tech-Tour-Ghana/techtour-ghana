-- 0022_fix_profiles_update_recursion.sql
-- profiles_update_own (0010) pinned is_admin with a subquery on public.profiles
-- inside its own WITH CHECK. A policy that reads the table it protects makes
-- Postgres recurse ("infinite recursion detected in policy for relation
-- profiles"), so every customer profile edit from the account Profile and
-- Settings pages failed.
--
-- public.is_admin() is SECURITY DEFINER and returns the caller's stored
-- is_admin, so comparing the new value with it enforces the same rule without
-- re-entering the policy: a customer may edit their own profile, and can never
-- change is_admin from what is stored.

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and is_admin = public.is_admin()
  );

comment on policy profiles_update_own on public.profiles is
  'A signed in user updates their own profile. is_admin is pinned to its stored value through public.is_admin(), which avoids the recursion a self-referencing subquery caused, so this policy cannot be used to grant admin.';
