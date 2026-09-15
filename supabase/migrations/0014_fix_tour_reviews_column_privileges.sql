-- 0014_fix_tour_reviews_column_privileges.sql
-- Corrects 0011, whose column level revoke on tour_reviews had no effect.
--
-- 0011 ran:
--   revoke select (user_email, moderation_notes, flags) on public.tour_reviews
--     from anon, authenticated;
-- intending to hide those columns from the public read policy. It did nothing.
-- A column level REVOKE cannot take away access that a table level GRANT still
-- provides, and Supabase grants table level SELECT on public tables to anon and
-- authenticated by default. Checked with has_column_privilege after 0011: both
-- roles could still select user_email, moderation_notes and flags. The table
-- held no rows at the time, so nothing was exposed, but the hole was real.
--
-- The working form, the same one 0013 uses for
-- paystack_transactions.authorization_code, is to revoke table level SELECT and
-- then grant SELECT back by name on only the columns the public may read.
--
-- Public columns: what a published review shows, plus the keys needed to query
-- it. Hidden: user_email, which is personal data; moderation_notes and flags,
-- which are internal staff workings; is_flagged, which is moderation state; and
-- legacy_id, which only the import uses.
--
-- Consequences, all deliberate.
--   A column added later is NOT readable until it is added to the grant below.
--   That fails closed.
--   Queries must name their columns. select=* is refused.
--   Admins run as the authenticated role, so they lose the hidden columns too.
--   The moderation screen reads them through the service role or a security
--   definer function, not through a client query.

revoke select on public.tour_reviews from anon, authenticated;

grant select (id, tour_id, user_name, rating, comment, status, created_at, updated_at)
  on public.tour_reviews to anon, authenticated;

comment on column public.tour_reviews.user_email is
  'Not readable by anon or authenticated. Table level SELECT is revoked in 0014 and only public columns are granted back. The column level revoke in 0011 alone was ineffective.';
