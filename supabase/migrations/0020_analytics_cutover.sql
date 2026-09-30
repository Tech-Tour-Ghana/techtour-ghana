-- 0020_analytics_cutover.sql
-- Clean production baseline for analytics: everything recorded before
-- 2026-09-30 00:00 Africa/Accra (UTC+0, no daylight saving) is development,
-- admin, crawler and preview traffic. It is flagged, not deleted, so it is
-- excluded by analytics_valid_views and can be un-flagged with one statement.

update public.analytics_user_activities
set is_test = true
where created_at < '2026-09-30 00:00:00+00'
  and not is_test;
