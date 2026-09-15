-- 0010_rls_foundation.sql
-- The shared admin helper, and row level security policies for the identity
-- tables from 0002.
--
-- Every table in this schema already has RLS enabled with zero policies, which
-- denies everything. This file and the ones after it open exactly the doors
-- that are needed and no others.


-- ---------------------------------------------------------------------------
-- The admin helper
-- ---------------------------------------------------------------------------
-- Three things here are deliberate and each would be a bug if changed.
--
-- security definer is required, not a convenience. profiles has RLS on it, so
-- a policy on profiles that called a plain function which itself selects from
-- profiles would recurse forever. Definer rights bypass RLS inside the
-- function and break the cycle.
--
-- auth.uid() is wrapped in a scalar subselect so Postgres evaluates it once
-- per statement rather than once per row. On a large table that is not a
-- marginal difference.
--
-- EXECUTE is NOT revoked from authenticated and anon, unlike the trigger
-- functions hardened in 0004. Policy expressions are evaluated with the
-- querying role's privileges, so revoking would make every policy that calls
-- this fail closed. It is safe to leave callable: it takes no arguments and
-- only ever reports on the caller.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

comment on function public.is_admin() is
  'True when the signed in user has profiles.is_admin. False when not an admin and when nobody is signed in. security definer so policies on profiles do not recurse.';


-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Not publicly readable. Nothing on the public site needs a profile today:
-- tour_reviews carries a free text name and has no user link, so author names
-- come from the review row itself. If the site later shows real author
-- identities, do NOT open this table. Add a narrow view exposing only the
-- display columns, or denormalise the display name onto the content row. A
-- profile holds an email address and a phone number, and neither belongs in a
-- public payload.

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));
comment on policy profiles_select_own on public.profiles is
  'A signed in user reads their own profile.';

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (public.is_admin());
comment on policy profiles_select_admin on public.profiles is
  'Admins read every profile, for staff tooling.';

-- The update policy is where privilege escalation would live, so read this
-- carefully. using decides which rows may be targeted, with check decides what
-- they may become. Both are needed and they are not the same test.
--
-- The with check clause repeats the ownership test AND pins is_admin to its
-- current value. Without that second condition a user could target their own
-- row legitimately and set is_admin to true on the way through, because a
-- using clause alone says nothing about the new row. Comparing against a
-- subselect of the stored value means the submitted value must match what is
-- already there, so the column cannot be changed from here at all. Admins
-- change it through the admin policy below.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and is_admin = (select p.is_admin from public.profiles p where p.id = (select auth.uid()))
  );
comment on policy profiles_update_own on public.profiles is
  'A signed in user updates their own profile. The with check pins is_admin to its stored value, so this policy cannot be used to grant admin.';

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
comment on policy profiles_update_admin on public.profiles is
  'Admins update any profile, including is_admin.';

-- No insert policy, deliberately. The handle_new_user trigger in 0002 owns
-- profile creation and runs as security definer, so it is not subject to RLS.
-- A client that could insert here directly could mint a profile row for an id
-- that has no matching auth.users row, or worse, set is_admin on creation.
--
-- No delete policy, deliberately. Profiles are removed by cascade from
-- auth.users. Deleting one directly would be refused anyway, because bookings
-- and orders restrict it.


-- ---------------------------------------------------------------------------
-- login_history
-- ---------------------------------------------------------------------------
-- Read only from the client's point of view. The server writes these with the
-- service role, which bypasses RLS entirely, so no insert policy is needed and
-- adding one would only let a client forge its own audit trail.

drop policy if exists login_history_select_own on public.login_history;
create policy login_history_select_own on public.login_history
  for select to authenticated
  using (user_id = (select auth.uid()));
comment on policy login_history_select_own on public.login_history is
  'A signed in user reads their own login history, for the account security page.';

drop policy if exists login_history_select_admin on public.login_history;
create policy login_history_select_admin on public.login_history
  for select to authenticated
  using (public.is_admin());
comment on policy login_history_select_admin on public.login_history is
  'Admins read all login history, for investigating account issues.';

-- No insert, update or delete policy. An audit trail a user can write to or
-- erase is not an audit trail.


-- ---------------------------------------------------------------------------
-- user_sessions
-- ---------------------------------------------------------------------------
-- Same shape as login_history, with one addition: a user may revoke their own
-- session from the account page, which is an update that flips is_active.

drop policy if exists user_sessions_select_own on public.user_sessions;
create policy user_sessions_select_own on public.user_sessions
  for select to authenticated
  using (user_id = (select auth.uid()));
comment on policy user_sessions_select_own on public.user_sessions is
  'A signed in user sees their own devices and sessions.';

drop policy if exists user_sessions_select_admin on public.user_sessions;
create policy user_sessions_select_admin on public.user_sessions
  for select to authenticated
  using (public.is_admin());
comment on policy user_sessions_select_admin on public.user_sessions is
  'Admins read all sessions.';

-- The with check repeats ownership so a revoke cannot reassign the row to
-- another user on the way through.
drop policy if exists user_sessions_update_own on public.user_sessions;
create policy user_sessions_update_own on public.user_sessions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
comment on policy user_sessions_update_own on public.user_sessions is
  'A signed in user revokes their own session by flipping is_active. The with check stops the row being reassigned to someone else.';

-- No insert policy. Sessions are recorded server side. No delete policy,
-- revoking sets is_active false and keeps the audit record.
