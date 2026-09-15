-- 0002_identity.sql
-- Identity domain, from accounts_user, accounts_login_history and
-- accounts_user_session.
--
-- Supabase Auth owns credentials, email and phone verification, MFA, lockout
-- counters and OAuth identities. Everything in that group is dropped from
-- accounts_user here and is listed explicitly further down so the omission is
-- reviewable rather than accidental.
--
-- No RLS policies in this file. That is task 1.6.


-- ---------------------------------------------------------------------------
-- profiles, from accounts_user
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  -- Not gen_random_uuid(). A profile has no identity of its own, it is the
  -- application-side half of an auth.users row and shares its id.
  id uuid primary key references auth.users (id) on delete cascade,

  -- Temporary. Holds accounts_user.id so the bigint user_id columns on
  -- bookings, orders, analytics and the rest can be rebuilt against this
  -- table during import. Dropped once the import is verified.
  legacy_id bigint,

  -- Denormalised from auth.users.email. Kept because every list view joined on
  -- it, because RLS and admin queries would otherwise need a cross-schema join
  -- into auth on every read, and because the import needs somewhere to land it.
  -- auth.users remains the authority, this is a mirror.
  email text not null,

  first_name text not null default '',
  last_name text not null default '',
  phone_number text,
  bio text,

  -- Old schema had two image columns. avatar_url held an external URL
  -- (Google OAuth or otherwise). profile_picture held a Django ImageField
  -- path on local disk, renamed here to avatar_path so it is not mistaken for
  -- a URL. Media moves to Supabase Storage per architecture.md section 3, so
  -- avatar_path exists to carry the legacy path through the import.
  avatar_url text,
  avatar_path text,

  -- Single admin flag derived at import from is_staff OR is_superuser. The old
  -- system never used the two independently. architecture.md section 6 requires
  -- an admin claim for content writes, this column is where task 1.6 sources it.
  is_admin boolean not null default false,

  -- Soft delete, matching accounts_user.is_active.
  is_active boolean not null default true,

  -- Preferences. All three were bare varchars with a Python default and no
  -- choices list anywhere, so they stay text. See the note at the end of 0001.
  preferred_language text not null default 'en',
  timezone text not null default 'Africa/Accra',
  text_size text not null default 'medium',

  email_notifications boolean not null default true,
  sms_notifications boolean not null default false,
  marketing_emails boolean not null default true,

  -- auto_now in Django, written on every save. Kept as a plain column because
  -- the application updates it deliberately, not on every row write.
  last_activity timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Columns from accounts_user deliberately NOT carried across, all owned by
-- Supabase Auth from here on:
--   password, last_login          -> auth.users
--   email_verified                -> auth.users.email_confirmed_at
--   phone_verified                -> auth.users.phone_confirmed_at
--   two_factor_enabled,
--   two_factor_secret,
--   two_factor_backup_codes       -> auth.mfa_factors
--   login_attempts, locked_until  -> Supabase Auth rate limiting
--   last_login_ip                 -> login_history below already records it
--   google_id                     -> auth.identities
--   is_staff, is_superuser        -> collapsed into is_admin above
--   date_joined                   -> auth.users.created_at, and created_at here

comment on table public.profiles is
  'Application-side user record, keyed 1:1 to auth.users.id. Replaces accounts_user.';
comment on column public.profiles.legacy_id is
  'TEMPORARY. Old accounts_user.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.profiles.email is
  'Mirror of auth.users.email. auth.users is the authority.';
comment on column public.profiles.avatar_path is
  'Legacy Django ImageField path from accounts_user.profile_picture. Resolved to Supabase Storage during media migration.';
comment on column public.profiles.is_admin is
  'Derived at import from accounts_user.is_staff OR is_superuser. Source for the admin claim used by RLS.';

create unique index if not exists profiles_legacy_id_key on public.profiles (legacy_id);
-- accounts_user had UNIQUE (email), case sensitive. This is on lower(email)
-- instead, because Supabase Auth treats addresses case insensitively and two
-- profiles differing only by case would be a live bug. Stricter than the old
-- rule, so check the dump for case-duplicate emails before importing.
-- Consequence: query with lower(email) = lower($1), a bare email = $1 will not
-- use this index.
create unique index if not exists profiles_email_key on public.profiles (lower(email));
-- Old: accounts_us_is_acti_a5841d_idx ON accounts_user (is_active).
create index if not exists profiles_is_active_idx on public.profiles (is_active);

-- Two old indexes are deliberately not carried:
--   accounts_us_email_74c8d6_idx ON (email). Duplicates the UNIQUE (email)
--     constraint's own index, which is the shape the unique index above takes.
--   accounts_user_email_b2644a56_like ON (email varchar_pattern_ops). Django
--     adds a *_like index to every unique varchar so LIKE 'x%' can use an
--     index under a non-C collation. Nothing in the new application does
--     prefix search on email. If admin search needs it later, pg_trgm is the
--     better answer than a pattern_ops btree.
-- No index on is_admin. RLS resolves it by primary key via auth.uid(), which
-- the id index already serves, so a separate one would never be read.

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Provision a profile for every new auth.users row
-- ---------------------------------------------------------------------------

-- security definer because the trigger fires inside Supabase Auth's own
-- transaction, which has no rights on public. search_path is pinned so a
-- shadowing object in a writable schema cannot hijack the insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    -- Google OAuth supplies one of these two keys depending on the provider.
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  -- The bulk import in phase 1 writes profiles and auth.users in that order,
  -- so a row may already exist. Do not fail the signup over it.
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates the matching public.profiles row whenever Supabase Auth creates a user.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- login_history, from accounts_login_history
-- ---------------------------------------------------------------------------
-- Retained for audit per architecture.md section 5. Append only in practice.

create table if not exists public.login_history (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  user_id uuid not null references public.profiles (id) on delete cascade,
  ip_address inet not null,
  user_agent text not null default '',
  location text,
  success boolean not null,

  created_at timestamptz not null default now(),
  -- Added for the architecture.md section 5 convention. Rows are append only,
  -- so in practice this never diverges from created_at.
  updated_at timestamptz not null default now()
);

comment on table public.login_history is
  'Login attempt audit trail. From accounts_login_history.';
comment on column public.login_history.legacy_id is
  'TEMPORARY. Old accounts_login_history.id. Drop after import.';

create unique index if not exists login_history_legacy_id_key on public.login_history (legacy_id);
-- Old: accounts_lo_user_id_392dc4_idx ON (user_id, created_at). DESC here
-- because the account activity view reads newest first.
-- The old accounts_login_history_user_id_74cb7281 ON (user_id) is not carried:
-- it is a strict prefix of this one and buys nothing.
create index if not exists login_history_user_id_created_at_idx
  on public.login_history (user_id, created_at desc);

drop trigger if exists login_history_set_updated_at on public.login_history;
create trigger login_history_set_updated_at
  before update on public.login_history
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- user_sessions, from accounts_user_session
-- ---------------------------------------------------------------------------
-- Retained for audit. Supabase Auth owns the real session now, so these rows
-- are a record of device activity, not a thing the application authenticates
-- against. Django's Meta ordering was -last_activity.

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Was character varying(100), non-unique in the old schema. Left non-unique
  -- so the import cannot fail on historical duplicates.
  session_key text not null,
  ip_address inet not null,
  user_agent text not null default '',
  device_type public.device_type not null default 'other',
  last_activity timestamptz not null default now(),
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_sessions is
  'Device and session audit trail. From accounts_user_session. Supabase Auth owns the live session.';
comment on column public.user_sessions.legacy_id is
  'TEMPORARY. Old accounts_user_session.id. Drop after import.';

create unique index if not exists user_sessions_legacy_id_key on public.user_sessions (legacy_id);
-- Meta.ordering was -last_activity, scoped to one user.
create index if not exists user_sessions_user_id_last_activity_idx
  on public.user_sessions (user_id, last_activity desc);
-- Old: accounts_us_user_id_d90441_idx ON (user_id, session_key). Carried as is.
create index if not exists user_sessions_user_id_session_key_idx
  on public.user_sessions (user_id, session_key);
-- Two old indexes are deliberately not carried:
--   accounts_us_is_acti_e7b214_idx ON (is_active). A bare boolean index on a
--     column that is true for most rows. The user_id-leading indexes above
--     already narrow far better, and is_active is a cheap residual filter.
--   accounts_user_session_user_id_1b3a81c3 ON (user_id). A strict prefix of
--     both composites above.

drop trigger if exists user_sessions_set_updated_at on public.user_sessions;
create trigger user_sessions_set_updated_at
  before update on public.user_sessions
  for each row execute function public.set_updated_at();
