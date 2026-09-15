-- 0006_services.sql
-- The remaining service domains, from pages_studydestination, pages_scholarship,
-- pages_vacationrental, pages_vacationbooking, pages_techinnovation,
-- pages_techevent and pages_techresource.
--
-- Same rules as 0003 and 0005. Python-side rules become CHECK constraints,
-- Django ImageField disk paths become *_path, and the reserved-word column
-- "order" becomes sort_order.
--
-- pages_vacationbooking is a financial record and is treated the way
-- tours_booking was treated in 0003: RESTRICT on both of its foreign keys, so
-- deleting a user or a rental can never destroy a booking.
--
-- No RLS policies in this file. That is task 1.6.


-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
-- Same idempotent DO block form as 0001. Each of these replaces a character
-- varying column whose value set is declared on the Django model, so the set is
-- recoverable rather than guessed. Every source is named.

-- scholarship_level. Old column pages_scholarship.level character varying(20).
-- Values from Scholarship.LEVEL_CHOICES in pages/models.py:
--   bachelor, master, phd, all
do $$ begin
  create type public.scholarship_level as enum ('bachelor', 'master', 'phd', 'all');
exception when duplicate_object then null;
end $$;

-- rental_property_type. Old column pages_vacationrental.property_type character
-- varying(20). Values from VacationRental.PROPERTY_TYPES in pages/models.py:
--   apartment, house, villa, cottage, studio, other
do $$ begin
  create type public.rental_property_type as enum
    ('apartment', 'house', 'villa', 'cottage', 'studio', 'other');
exception when duplicate_object then null;
end $$;

-- vacation_booking_status. Old column pages_vacationbooking.status character
-- varying(20). Values from VacationBooking.BOOKING_STATUS_CHOICES in
-- pages/models.py:
--   pending, confirmed, cancelled, completed, refunded
--
-- A separate type rather than a reuse of public.booking_status from 0001. The
-- first four values are identical, but this list adds 'refunded', which
-- tours_booking never had. Widening booking_status with ALTER TYPE ADD VALUE
-- would hand the tours domain a state its application has no handling for, and
-- a value added that way cannot be used in the same transaction that adds it,
-- which makes migrations awkward for no gain. Two small honest types beat one
-- shared type that is wrong for one of its users.
do $$ begin
  create type public.vacation_booking_status as enum
    ('pending', 'confirmed', 'cancelled', 'completed', 'refunded');
exception when duplicate_object then null;
end $$;

-- innovation_status. Old column pages_techinnovation.status character
-- varying(20). Values from TechInnovation.STATUS_CHOICES in pages/models.py:
--   active, development, completed, planned
do $$ begin
  create type public.innovation_status as enum
    ('active', 'development', 'completed', 'planned');
exception when duplicate_object then null;
end $$;

-- innovation_category. Old column pages_techinnovation.category character
-- varying(50). Values from TechInnovation.CATEGORY_CHOICES in pages/models.py:
--   ai, vr, cloud, mobile, blockchain, iot, web3, other
do $$ begin
  create type public.innovation_category as enum
    ('ai', 'vr', 'cloud', 'mobile', 'blockchain', 'iot', 'web3', 'other');
exception when duplicate_object then null;
end $$;

-- tech_event_type. Old column pages_techevent.event_type character varying(20).
-- Values from TechEvent.EVENT_TYPES in pages/models.py:
--   workshop, hackathon, seminar, conference, meetup, webinar
do $$ begin
  create type public.tech_event_type as enum
    ('workshop', 'hackathon', 'seminar', 'conference', 'meetup', 'webinar');
exception when duplicate_object then null;
end $$;

-- tech_resource_type. Old column pages_techresource.resource_type character
-- varying(20). Values from TechResource.RESOURCE_TYPES in pages/models.py:
--   article, video, tutorial, tool, course, podcast
do $$ begin
  create type public.tech_resource_type as enum
    ('article', 'video', 'tutorial', 'tool', 'course', 'podcast');
exception when duplicate_object then null;
end $$;

-- resource_difficulty. Old column pages_techresource.difficulty character
-- varying(20). Values from TechResource.DIFFICULTY_CHOICES in pages/models.py:
--   beginner, intermediate, advanced
do $$ begin
  create type public.resource_difficulty as enum ('beginner', 'intermediate', 'advanced');
exception when duplicate_object then null;
end $$;

-- pages_vacationbooking.payment_status gets no new type. The Django field
-- borrows Order.PAYMENT_STATUS_CHOICES outright, so it reuses
-- public.payment_status from 0001 with exactly the mapping documented at the
-- top of 0005: paid maps to success, and refunded maps to success plus a status
-- of 'refunded' on the column above.


-- ---------------------------------------------------------------------------
-- study_destinations, from pages_studydestination
-- ---------------------------------------------------------------------------

create table if not exists public.study_destinations (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  country_name text not null,
  slug text not null,
  -- A short string holding a flag emoji, character varying(10) in the old
  -- schema. Not an image.
  flag text not null default '',

  description text not null default '',
  why_study text not null default '',
  cost_of_living text not null default '',
  language text not null default '',

  -- DELIBERATE RENAME. The old column was named `currency`, which in this
  -- schema means public.currency_code. It is nothing of the sort: it was a
  -- character varying(50) free-text label such as "Canadian Dollar", shown to
  -- the reader on the destination page. Renamed to currency_name so it cannot
  -- be mistaken for the money convention in architecture.md section 5, and kept
  -- as text.
  currency_name text not null default '',
  average_tuition text not null default '',

  button_text text not null default 'Find Out More',
  button_link text not null default '/study-abroad',

  -- Legacy Django ImageField path, renamed from image.
  image_path text,
  image_url text not null default '',

  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint study_destinations_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.study_destinations is 'Study abroad destinations. From pages_studydestination.';
comment on column public.study_destinations.legacy_id is
  'TEMPORARY. Old pages_studydestination.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.study_destinations.currency_name is
  'Was pages_studydestination.currency, a free-text currency label for display. Not a currency code.';
comment on column public.study_destinations.sort_order is
  'Was the reserved-word column "order" in pages_studydestination.';
comment on column public.study_destinations.image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';

create unique index if not exists study_destinations_legacy_id_key
  on public.study_destinations (legacy_id);
-- Old: UNIQUE (slug), pages_studydestination_slug_key. Carried.
create unique index if not exists study_destinations_slug_key
  on public.study_destinations (slug);
-- Addition. pages_studydestination had no index besides its key and its slug,
-- while Meta.ordering was ['order'] and the listing filters on is_active.
create index if not exists study_destinations_active_sort_order_idx
  on public.study_destinations (sort_order) where is_active;
-- Not carried: pages_studydestination_slug_a015cf8d_like, the Django *_like
-- companion to the unique slug.

drop trigger if exists study_destinations_set_updated_at on public.study_destinations;
create trigger study_destinations_set_updated_at
  before update on public.study_destinations
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- scholarships, from pages_scholarship
-- ---------------------------------------------------------------------------

create table if not exists public.scholarships (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- Was country_id. Renamed to destination_id because it points at
  -- study_destinations, not at a countries table, and "country_id" reads like a
  -- reference to something that does not exist here.
  --
  -- CASCADE. The column is NOT NULL, so SET NULL is unavailable, and a
  -- scholarship is defined by the destination it belongs to. This matches the
  -- old Django on_delete=CASCADE. Nothing financial hangs off this table, it is
  -- editorial content, so the reasoning that made RESTRICT correct for bookings
  -- and orders does not apply. Retire a destination with is_active if its
  -- scholarships should survive.
  destination_id uuid not null references public.study_destinations (id) on delete cascade,

  title text not null,
  slug text not null,
  level public.scholarship_level not null default 'all',
  description text not null default '',
  deadline date not null,

  -- Free text such as "Up to GHS 20,000" or "Full tuition". NOT a money column,
  -- so it gets no numeric type and no currency. Carried as it stands.
  amount text not null default '',

  is_featured boolean not null default false,
  is_active boolean not null default true,

  -- Neither column existed on pages_scholarship, which had no timestamps at
  -- all. Added for the architecture.md section 5 convention. Import should set
  -- both to the import time unless a better value can be recovered.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.scholarships is 'Scholarships, one destination each. From pages_scholarship.';
comment on column public.scholarships.legacy_id is
  'TEMPORARY. Old pages_scholarship.id. Drop after import.';
comment on column public.scholarships.destination_id is
  'Was pages_scholarship.country_id, a foreign key to pages_studydestination.';
comment on column public.scholarships.amount is
  'Free-text award description, not a money column. That is how pages_scholarship stored it.';

create unique index if not exists scholarships_legacy_id_key on public.scholarships (legacy_id);
-- Old: UNIQUE (slug), pages_scholarship_slug_key. Carried.
create unique index if not exists scholarships_slug_key on public.scholarships (slug);
-- Old: pages_scholarship_country_id_04270fb3 ON (country_id). Carried under the
-- new column name, widened with deadline because every read is one
-- destination's scholarships in deadline order. The old bare index is a strict
-- prefix of this.
create index if not exists scholarships_destination_id_deadline_idx
  on public.scholarships (destination_id, deadline);
-- Addition. The "closing soon" listing crosses all destinations and had no
-- index support at all.
create index if not exists scholarships_deadline_idx
  on public.scholarships (deadline) where is_active;
-- Not carried: pages_scholarship_slug_e3cf2efa_like, the Django *_like
-- companion to the unique slug.

drop trigger if exists scholarships_set_updated_at on public.scholarships;
create trigger scholarships_set_updated_at
  before update on public.scholarships
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- vacation_rentals, from pages_vacationrental
-- ---------------------------------------------------------------------------

create table if not exists public.vacation_rentals (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  title text not null,
  slug text not null,
  description text not null default '',
  property_type public.rental_property_type not null default 'house',

  location text not null default '',
  address text not null default '',
  city text not null default '',
  region text not null default '',
  country text not null default 'Ghana',

  bedrooms integer not null default 0,
  bathrooms integer not null default 0,
  max_guests integer not null default 1,

  -- Money, per architecture.md section 5 and design.md B6. The old table held
  -- three amounts and no currency column.
  price_per_night numeric(10,2) not null default 0,
  cleaning_fee numeric(10,2) not null default 0,
  security_deposit numeric(10,2) not null default 0,
  currency public.currency_code not null default 'GHS',

  -- Comma-separated free text in the old schema. Left as text, same reasoning
  -- as tours.gallery in 0003.
  amenities text not null default '',
  -- Already jsonb in the old schema, carried as is.
  images jsonb not null default '[]'::jsonb,

  -- main_image was a Django ImageField disk path, renamed. main_image_url held
  -- an external link and is kept beside it.
  main_image_path text,
  main_image_url text not null default '',

  is_featured boolean not null default false,
  is_active boolean not null default true,
  -- Distinct from is_active. is_active is the soft delete, is_available is the
  -- owner marking the property bookable or not for a while.
  is_available boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Old: pages_vacationrental_bedrooms_check and
  -- pages_vacationrental_bathrooms_check. Carried. Zero is allowed for both, a
  -- studio genuinely has no separate bedroom.
  constraint vacation_rentals_bedrooms_non_negative check (bedrooms >= 0),
  constraint vacation_rentals_bathrooms_non_negative check (bathrooms >= 0),
  -- DEVIATION from pages_vacationrental_max_guests_check, which was
  -- (max_guests >= 0). A rental that sleeps nobody cannot be booked, and the
  -- Django field was a PositiveIntegerField whose only purpose is the guest
  -- limit. Tightened to > 0. If the dump contains zeroes, they are unfinished
  -- listings to fix, not a reason to loosen this.
  constraint vacation_rentals_max_guests_positive check (max_guests > 0),
  -- Not in the old schema. Enforced in Python or not at all.
  constraint vacation_rentals_price_per_night_non_negative check (price_per_night >= 0),
  constraint vacation_rentals_cleaning_fee_non_negative check (cleaning_fee >= 0),
  constraint vacation_rentals_security_deposit_non_negative check (security_deposit >= 0),
  constraint vacation_rentals_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.vacation_rentals is 'Vacation rental listings. From pages_vacationrental.';
comment on column public.vacation_rentals.legacy_id is
  'TEMPORARY. Old pages_vacationrental.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.vacation_rentals.is_available is
  'Owner-facing bookability switch. Separate from is_active, which is the soft delete.';
comment on column public.vacation_rentals.sort_order is
  'Was the reserved-word column "order" in pages_vacationrental.';
comment on column public.vacation_rentals.main_image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';

create unique index if not exists vacation_rentals_legacy_id_key
  on public.vacation_rentals (legacy_id);
-- Old: UNIQUE (slug), pages_vacationrental_slug_key. Carried.
create unique index if not exists vacation_rentals_slug_key
  on public.vacation_rentals (slug);
-- Additions. pages_vacationrental had no index besides its key and its slug,
-- so the search listing had none. Meta.ordering was ['order'] and the listing
-- filters on both booleans.
create index if not exists vacation_rentals_bookable_idx
  on public.vacation_rentals (sort_order) where is_active and is_available;
-- City is the one real facet on the rental search. No index on location: like
-- tours.location in 0003 it is free text such as "Labadi, Accra", so equality
-- on it is not selective.
create index if not exists vacation_rentals_city_idx
  on public.vacation_rentals (city) where is_active;
-- Not carried: pages_vacationrental_slug_95e58aad_like, the Django *_like
-- companion to the unique slug.

drop trigger if exists vacation_rentals_set_updated_at on public.vacation_rentals;
create trigger vacation_rentals_set_updated_at
  before update on public.vacation_rentals
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- vacation_bookings, from pages_vacationbooking
-- ---------------------------------------------------------------------------
-- A financial record. Read the bookings section of 0003 and the orders section
-- of 0005 alongside this one, the reasoning is the same.

create table if not exists public.vacation_bookings (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- Was generated in Python as "VB-" plus uuid4().hex[:10].upper(). Moved into
  -- the database so a booking written from anywhere gets a number, and so the
  -- uniqueness the Django field declared is actually enforced. Built from
  -- gen_random_uuid() rather than pgcrypto, same as bookings.booking_reference
  -- in 0003 and orders.order_number in 0005.
  booking_number text not null
    default 'VB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),

  -- RESTRICT, deliberately. A vacation booking is a financial record and it
  -- outlives the account that made it, so deleting a user must never destroy
  -- one. A right-to-erasure request is satisfied by anonymising the profile row
  -- and the guest_ columns below, and leaving the booking in place. The old
  -- Django on_delete was CASCADE, enforced in Python, which means deleting a
  -- user deleted every stay they had ever paid for. Not carried. The old
  -- database declared no ON DELETE here at all.
  -- Do not "fix" this back to CASCADE.
  user_id uuid not null references public.profiles (id) on delete restrict,

  -- RESTRICT for the same reason. Django's Python-side CASCADE meant delisting
  -- a property destroyed the record of every stay ever paid for at it. Take a
  -- rental off the market with is_active or is_available instead.
  rental_id uuid not null references public.vacation_rentals (id) on delete restrict,

  check_in date not null,
  check_out date not null,

  -- DEVIATION from pages_vacationbooking_guests_check and
  -- pages_vacationbooking_total_nights_check, both of which were (>= 0). A stay
  -- with no guests or no nights is not a stay, and both Django fields were
  -- PositiveIntegerFields that the booking form always filled. Tightened to > 0.
  guests integer not null default 1,
  total_nights integer not null,

  -- Money. All three were NOT NULL with no default in the old table and are
  -- kept that way. currency is an addition, the old table had none.
  subtotal numeric(10,2) not null,
  cleaning_fee numeric(10,2) not null default 0,
  total_price numeric(10,2) not null,
  currency public.currency_code not null default 'GHS',

  -- Guest detail as given at booking time. Kept separate from the profile
  -- because a user may book for someone else, and because the booking must
  -- still read correctly after the profile is anonymised.
  guest_name text not null default '',
  guest_email text not null default '',
  guest_phone text not null default '',
  special_requests text not null default '',

  status public.vacation_booking_status not null default 'pending',
  -- Reuses public.payment_status from 0001. Mapping as documented at the top of
  -- 0005: the old paid becomes success, the old refunded becomes success with
  -- status 'refunded'.
  payment_status public.payment_status not null default 'pending',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint vacation_bookings_guests_positive check (guests > 0),
  constraint vacation_bookings_total_nights_positive check (total_nights > 0),
  -- A stay must end after it begins. Same shape as
  -- tour_schedules_dates_ordered in 0003, but strict: check_out equal to
  -- check_in would be a zero-night stay, which total_nights already forbids.
  constraint vacation_bookings_dates_ordered check (check_out > check_in),
  constraint vacation_bookings_subtotal_non_negative check (subtotal >= 0),
  constraint vacation_bookings_cleaning_fee_non_negative check (cleaning_fee >= 0),
  constraint vacation_bookings_total_price_non_negative check (total_price >= 0)
);

-- Three rules the old system computed in Python and never enforced. All are
-- declared NOT VALID so existing rows are not checked at load time and odd
-- legacy data cannot block the import, while every new or updated row is
-- checked. NOT VALID is only accepted on ALTER TABLE, hence the separate
-- statements. Same pattern, and the same follow-up obligation, as
-- bookings_reference_format in 0003. AFTER the import has landed, run:
--
--   alter table public.vacation_bookings validate constraint vacation_bookings_number_format;
--   alter table public.vacation_bookings validate constraint vacation_bookings_nights_match_dates;
--   alter table public.vacation_bookings validate constraint vacation_bookings_total_matches_parts;
--
-- and investigate whatever they reject.
do $$ begin
  alter table public.vacation_bookings
    add constraint vacation_bookings_number_format
    check (booking_number ~ '^VB-[0-9A-F]{10}$') not valid;
exception when duplicate_object then null;
end $$;

-- total_nights is fully determined by the two dates. Storing it as well as the
-- dates is a denormalisation the old checkout relied on, so it stays, but it
-- must agree with them.
do $$ begin
  alter table public.vacation_bookings
    add constraint vacation_bookings_nights_match_dates
    check (total_nights = (check_out - check_in)) not valid;
exception when duplicate_object then null;
end $$;

-- design.md B6 requires the server to recompute every total from the database.
-- This is the database refusing to hold a total that does not follow from its
-- own columns. The old VacationBooking.save() computed exactly this sum.
do $$ begin
  alter table public.vacation_bookings
    add constraint vacation_bookings_total_matches_parts
    check (total_price = subtotal + cleaning_fee) not valid;
exception when duplicate_object then null;
end $$;

comment on table public.vacation_bookings is
  'Vacation rental bookings. From pages_vacationbooking. A financial record, see the ON DELETE comments on user_id and rental_id.';
comment on column public.vacation_bookings.legacy_id is
  'TEMPORARY. Old pages_vacationbooking.id. Drop after import.';
comment on column public.vacation_bookings.booking_number is
  'VB- plus ten uppercase hex characters. Was generated in VacationBooking.save(), now a column default.';
comment on column public.vacation_bookings.payment_status is
  'public.payment_status from 0001. The old paid maps to success, the old refunded maps to success plus status refunded.';

create unique index if not exists vacation_bookings_legacy_id_key
  on public.vacation_bookings (legacy_id);
-- Old: UNIQUE (booking_number), pages_vacationbooking_booking_number_key. Carried.
create unique index if not exists vacation_bookings_booking_number_key
  on public.vacation_bookings (booking_number);
-- Old: pages_vacationbooking_user_id_a94b1a8c ON (user_id), widened with
-- created_at because Meta.ordering was ['-created_at'] and the account page
-- reads one user newest first. The old bare index is a strict prefix of this.
create index if not exists vacation_bookings_user_id_created_at_idx
  on public.vacation_bookings (user_id, created_at desc);
-- Old: pages_vacationbooking_rental_id_e1e5f7cd ON (rental_id), widened with
-- check_in. Every read of this column is an availability question about one
-- property over a date range, which the old bare index could not answer.
create index if not exists vacation_bookings_rental_id_check_in_idx
  on public.vacation_bookings (rental_id, check_in, check_out);
-- Additions. The admin booking queues filtered on both status columns with no
-- index behind them, exactly as in 0003 and 0005.
create index if not exists vacation_bookings_status_idx
  on public.vacation_bookings (status, created_at desc);
create index if not exists vacation_bookings_payment_status_idx
  on public.vacation_bookings (payment_status, created_at desc);
-- Not carried: pages_vacationbooking_booking_number_6af7321f_like, the Django
-- *_like companion to the unique booking_number. A booking number is looked up
-- whole, never by prefix.

-- No exclusion constraint preventing two confirmed bookings from overlapping on
-- one rental. It is the right tool (btree_gist plus EXCLUDE on rental_id and a
-- daterange), but the old system had no such guard, so the dump almost
-- certainly contains overlaps and the constraint would refuse the import.
-- Add it after the import, once the overlaps have been looked at.

drop trigger if exists vacation_bookings_set_updated_at on public.vacation_bookings;
create trigger vacation_bookings_set_updated_at
  before update on public.vacation_bookings
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- tech_innovations, from pages_techinnovation
-- ---------------------------------------------------------------------------

create table if not exists public.tech_innovations (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  title text not null,
  slug text not null,
  description text not null default '',

  category public.innovation_category not null default 'other',
  status public.innovation_status not null default 'development',

  -- An emoji or icon class name, character varying(50) in the old schema.
  icon text not null default '',
  -- Legacy Django ImageField path, renamed from image.
  image_path text,
  image_url text not null default '',

  launch_date date,
  impact_score integer not null default 0,

  -- All three comma-separated free text in the old schema. Left as text.
  features text not null default '',
  team text not null default '',
  tech_stack text not null default '',

  website text not null default '',
  demo_url text not null default '',
  github_url text not null default '',

  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The Django field carried help_text "Impact score 1-10" and a default of 0,
  -- so the intended range is 0 to 10 with 0 meaning unscored. Nothing enforced
  -- it, and an integer column accepted anything.
  constraint tech_innovations_impact_score_range check (impact_score between 0 and 10),
  constraint tech_innovations_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.tech_innovations is 'Tech innovations and projects. From pages_techinnovation.';
comment on column public.tech_innovations.legacy_id is
  'TEMPORARY. Old pages_techinnovation.id. Drop after import.';
comment on column public.tech_innovations.impact_score is
  '0 to 10, where 0 means unscored. The old field documented 1-10 and enforced nothing.';
comment on column public.tech_innovations.sort_order is
  'Was the reserved-word column "order" in pages_techinnovation.';
comment on column public.tech_innovations.image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';

create unique index if not exists tech_innovations_legacy_id_key
  on public.tech_innovations (legacy_id);
-- Old: UNIQUE (slug), pages_techinnovation_slug_key. Carried.
create unique index if not exists tech_innovations_slug_key
  on public.tech_innovations (slug);
-- Additions. pages_techinnovation had no index at all besides its key and its
-- slug. Meta.ordering was ['order'] and the listing filters on is_active, with
-- category as its one facet.
create index if not exists tech_innovations_active_sort_order_idx
  on public.tech_innovations (sort_order) where is_active;
create index if not exists tech_innovations_category_idx
  on public.tech_innovations (category, sort_order) where is_active;
-- The old table had no *_like index to decline, its slug key stood alone.

drop trigger if exists tech_innovations_set_updated_at on public.tech_innovations;
create trigger tech_innovations_set_updated_at
  before update on public.tech_innovations
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- tech_events, from pages_techevent
-- ---------------------------------------------------------------------------

create table if not exists public.tech_events (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  title text not null,
  slug text not null,
  description text not null default '',

  -- Was the column `date`, a timestamp with time zone. Renamed to starts_at:
  -- DATE is a type name, a bare column called date has to be qualified or
  -- quoted in half the places it appears, and the column is a timestamp rather
  -- than a date anyway. end_date is renamed to ends_at to match, and for the
  -- same reason, it too was a timestamptz and not a date.
  starts_at timestamptz not null,
  ends_at timestamptz,

  location text not null default '',
  venue text not null default '',
  address text not null default '',
  event_type public.tech_event_type not null default 'seminar',

  -- Legacy Django ImageField path, renamed from image.
  image_path text,
  image_url text not null default '',

  -- Comma-separated names in the old schema. Left as text.
  speakers text not null default '',

  capacity integer not null default 50,
  registered integer not null default 0,

  -- Redundant with starts_at in principle, and stale the moment an event
  -- passes, since nothing recomputes it. Carried anyway because it is an
  -- editor-facing switch used to pin an event into the upcoming list, which is
  -- not the same question as whether its date is in the future. Filter on
  -- starts_at when you mean the date.
  is_upcoming boolean not null default true,

  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- None of these existed in the old schema.
  constraint tech_events_dates_ordered check (ends_at is null or ends_at >= starts_at),
  constraint tech_events_capacity_non_negative check (capacity >= 0),
  constraint tech_events_registered_non_negative check (registered >= 0),
  -- The overbooking guard, the same one tour_schedules got in 0003. The old
  -- system checked this in Python at registration time, if at all. Note for the
  -- import: if legacy rows have registered above capacity this insert will
  -- fail, which is the point, but expect to have to look at them.
  constraint tech_events_not_overbooked check (registered <= capacity),
  constraint tech_events_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.tech_events is 'Tech events. From pages_techevent.';
comment on column public.tech_events.legacy_id is
  'TEMPORARY. Old pages_techevent.id. Drop after import.';
comment on column public.tech_events.starts_at is
  'Was pages_techevent.date, a timestamptz. Renamed so it is not confused with the date type.';
comment on column public.tech_events.ends_at is
  'Was pages_techevent.end_date, a timestamptz despite the name.';
comment on column public.tech_events.is_upcoming is
  'Editor-facing switch, not derived from starts_at. Filter on starts_at for the actual date question.';
comment on column public.tech_events.image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';

create unique index if not exists tech_events_legacy_id_key on public.tech_events (legacy_id);
-- Old: UNIQUE (slug), pages_techevent_slug_key. Carried.
create unique index if not exists tech_events_slug_key on public.tech_events (slug);
-- Additions. pages_techevent had no index at all besides its key and its slug,
-- so the event calendar, which is the only way anyone reads this table, sorted
-- and filtered on unindexed columns.
create index if not exists tech_events_active_starts_at_idx
  on public.tech_events (starts_at) where is_active;
create index if not exists tech_events_event_type_idx
  on public.tech_events (event_type, starts_at) where is_active;
-- The old table had no *_like index to decline.

drop trigger if exists tech_events_set_updated_at on public.tech_events;
create trigger tech_events_set_updated_at
  before update on public.tech_events
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- tech_resources, from pages_techresource
-- ---------------------------------------------------------------------------

create table if not exists public.tech_resources (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  title text not null,
  slug text not null,
  description text not null default '',

  resource_type public.tech_resource_type not null default 'article',
  difficulty public.resource_difficulty not null default 'beginner',

  -- The resource itself lives elsewhere. This was a Django URLField, NOT NULL
  -- and required, so it stays required.
  url text not null,

  -- thumbnail was a Django ImageField disk path, renamed. thumbnail_url held an
  -- external link and is kept beside it.
  thumbnail_path text,
  thumbnail_url text not null default '',

  author text not null default '',
  -- Comma-separated in the old schema. Left as text.
  tags text not null default '',
  -- Free text such as "15 min" or "1 hour", character varying(50) in the old
  -- schema. Not an interval, and not worth guessing at a parse during import.
  duration text not null default '',

  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tech_resources_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.tech_resources is 'Tech learning resources. From pages_techresource.';
comment on column public.tech_resources.legacy_id is
  'TEMPORARY. Old pages_techresource.id. Drop after import.';
comment on column public.tech_resources.duration is
  'Free text such as "15 min". Was character varying(50) in pages_techresource, not an interval.';
comment on column public.tech_resources.sort_order is
  'Was the reserved-word column "order" in pages_techresource.';
comment on column public.tech_resources.thumbnail_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';

create unique index if not exists tech_resources_legacy_id_key
  on public.tech_resources (legacy_id);
-- Old: UNIQUE (slug), pages_techresource_slug_key. Carried.
create unique index if not exists tech_resources_slug_key on public.tech_resources (slug);
-- Additions. pages_techresource had no index besides its key and its slug,
-- while the library page filters on both facets and sorts by "order".
create index if not exists tech_resources_active_sort_order_idx
  on public.tech_resources (sort_order) where is_active;
create index if not exists tech_resources_resource_type_idx
  on public.tech_resources (resource_type, difficulty, sort_order) where is_active;
-- One composite rather than two single-column indexes on the facets, because
-- the library page applies them together and resource_type is the more
-- selective of the two, so it leads. A difficulty-only filter still gets a
-- sequential scan on a table this small, which is the right trade.
-- The old table had no *_like index to decline.

drop trigger if exists tech_resources_set_updated_at on public.tech_resources;
create trigger tech_resources_set_updated_at
  before update on public.tech_resources
  for each row execute function public.set_updated_at();
