-- 0004_harden_functions.sql
-- Closes two findings from the Supabase security advisor against 0001 and 0002.
--
-- Not addressed here, deliberately: the advisor also reports
-- rls_enabled_no_policy on all eight tables. That is expected. RLS is enabled
-- with no policies, which denies everything, and the policies land in task 1.6.
--
-- Also not touched: public.rls_auto_enable(). That is a Supabase platform
-- event trigger that enables RLS on every new table in public, which is why
-- these tables arrived with RLS already on. It is not ours to change.


-- ---------------------------------------------------------------------------
-- 1. Pin the search_path on set_updated_at
-- ---------------------------------------------------------------------------
-- Advisor: function_search_path_mutable.
--
-- Without a pinned search_path the function resolves unqualified names using
-- whatever search_path the calling role has. handle_new_user in 0002 already
-- pinned its own. This one was missed. It is a trigger function that runs on
-- every write, so it is worth closing.
--
-- Empty rather than a schema list, because the body references nothing but
-- now() and the NEW record, both of which resolve without a search_path.
alter function public.set_updated_at() set search_path = '';


-- ---------------------------------------------------------------------------
-- 2. Stop both trigger functions being callable over the REST API
-- ---------------------------------------------------------------------------
-- Advisor: anon_security_definer_function_executable and
-- authenticated_security_definer_function_executable.
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and Supabase
-- exposes anything in the public schema through PostgREST. That left
-- handle_new_user callable by any anonymous visitor at
-- /rest/v1/rpc/handle_new_user. It is SECURITY DEFINER, so it runs with the
-- owner's rights.
--
-- Revoking EXECUTE does not stop either trigger from firing. Postgres checks
-- EXECUTE when a trigger is created, not each time it fires, so the signup
-- path and the updated_at stamping are unaffected. Task 2.1 verifies that by
-- running a real signup.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
