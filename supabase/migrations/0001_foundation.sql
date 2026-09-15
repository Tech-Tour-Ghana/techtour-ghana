-- 0001_foundation.sql
-- Shared groundwork for every later migration: extensions, the updated_at
-- trigger function, and the enum types the core domain needs.
--
-- Source of truth for every value below is
-- docs/old-database-to-transfer-to-supabase/extracted-schema.sql plus the
-- Django choice lists in docs/old-sites/techtour-backend/.


-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

-- Checked rather than assumed: gen_random_uuid() has been core Postgres since
-- 13, so on Supabase (15/17) the uuid primary key defaults in 0002 and 0003
-- need no extension at all. Nothing in these three migrations strictly requires
-- pgcrypto. It is enabled anyway because Supabase ships it and later domains
-- (token hashing on the payments side) will want it. Kept in the extensions
-- schema, which is the Supabase convention, so public stays application only.
create extension if not exists pgcrypto with schema extensions;


-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

-- Django set updated_at in Python via auto_now. Postgres does it here instead,
-- so a write from the Supabase dashboard or a SQL console is maintained too.
-- Every table in later migrations attaches this rather than repeating it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger function. Stamps updated_at with now() on every row update.';


-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
-- Postgres has no CREATE TYPE IF NOT EXISTS, so each type is wrapped in a DO
-- block that swallows duplicate_object. That is the idempotent form available.

-- booking_status. The old column was tours_booking.status character varying(20).
-- Values from Booking.STATUS_CHOICES in tours/models.py:
--   pending, confirmed, cancelled, completed
do $$ begin
  create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
exception when duplicate_object then null;
end $$;

-- payment_status. The old column was tours_booking.payment_status character
-- varying(20) with NO choices declared on the Django field, just default
-- 'pending'. The value set is taken from PaystackTransaction.STATUS_CHOICES in
-- paystack/models.py, which is what actually wrote the column, and it matches
-- design.md B6: pending moves once to success, failed or abandoned.
do $$ begin
  create type public.payment_status as enum ('pending', 'success', 'failed', 'abandoned');
exception when duplicate_object then null;
end $$;

-- review_status. The old column was tours_tourreview.status character
-- varying(20). Values from TourReview.STATUS_CHOICES in tours/models.py:
--   pending, approved, rejected
do $$ begin
  create type public.review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

-- currency_code. architecture.md section 5 and design.md B6 both require an
-- explicit currency column defaulting to GHS. Values from
-- PaystackTransaction.CURRENCY_CHOICES, the only place the old system
-- enumerated currencies at all.
do $$ begin
  create type public.currency_code as enum ('GHS', 'USD', 'EUR', 'GBP');
exception when duplicate_object then null;
end $$;

-- device_type. The old column was accounts_user_session.device_type character
-- varying(20). Values from UserSession.DEVICE_TYPES in accounts/models.py:
--   desktop, mobile, tablet, other
do $$ begin
  create type public.device_type as enum ('desktop', 'mobile', 'tablet', 'other');
exception when duplicate_object then null;
end $$;

-- Deliberately NOT an enum: profiles.text_size, profiles.preferred_language and
-- profiles.timezone. All three were bare varchars with a Python default and no
-- choices list anywhere in the Django models, serializers, admin or frontend,
-- so there is no authoritative value set to derive. They stay text.
