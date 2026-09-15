-- 0003_tours.sql
-- Tours domain, from tours_tourcategory, tours_tour, tours_tourschedule,
-- tours_tourreview and tours_booking.
--
-- Rules the old system enforced in Python are enforced here as CHECK
-- constraints and generated columns. Anything computed as a Django @property
-- becomes a stored generated column so a Supabase client reading named columns
-- (design.md B8) gets the same value without a round trip.
--
-- No RLS policies in this file. That is task 1.6.


-- ---------------------------------------------------------------------------
-- tour_categories, from tours_tourcategory
-- ---------------------------------------------------------------------------

create table if not exists public.tour_categories (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  name text not null,
  slug text not null,
  description text not null default '',

  -- Was the quoted column "order". Renamed to sort_order so it never has to be
  -- quoted in a query. ORDER is a reserved word and supabase-js would have to
  -- escape it on every call.
  sort_order integer not null default 0,

  -- Legacy Django ImageField path, renamed from image for the same reason as
  -- profiles.avatar_path. Media moves to Supabase Storage.
  image_path text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  -- Not in the old schema. tours_tourcategory had created_at only. Added for
  -- the architecture.md section 5 convention.
  updated_at timestamptz not null default now(),

  constraint tour_categories_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.tour_categories is 'Tour categories. From tours_tourcategory.';
comment on column public.tour_categories.legacy_id is
  'TEMPORARY. Old tours_tourcategory.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.tour_categories.sort_order is
  'Was the reserved-word column "order" in tours_tourcategory.';

create unique index if not exists tour_categories_legacy_id_key on public.tour_categories (legacy_id);
-- Old: UNIQUE (slug), tours_tourcategory_slug_key. Carried.
create unique index if not exists tour_categories_slug_key on public.tour_categories (slug);
-- Addition, not in the old database. Meta.ordering was ['order'] and the
-- public list filters on is_active, so every category listing sorted on an
-- unindexed column.
create index if not exists tour_categories_active_sort_order_idx
  on public.tour_categories (sort_order) where is_active;
-- Not carried: tours_tourcategory_slug_a39b9cb9_like, a Django *_like
-- companion to the unique slug. Slugs are looked up by equality, never prefix.

drop trigger if exists tour_categories_set_updated_at on public.tour_categories;
create trigger tour_categories_set_updated_at
  before update on public.tour_categories
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- tours, from tours_tour
-- ---------------------------------------------------------------------------

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- DEVIATION from the old schema. Django declared this FK as
  -- on_delete=CASCADE while the column is nullable. Deleting one category
  -- therefore deleted every tour in it, which contradicts the nullable column
  -- and is almost certainly not what was intended. Rebuilt as SET NULL.
  category_id uuid references public.tour_categories (id) on delete set null,

  title text not null,
  slug text not null,
  short_description text not null default '',
  description text not null,

  location text not null default '',
  region text not null default '',

  -- Media. featured_image was a Django ImageField path on local disk, renamed
  -- to featured_image_path so it is not confused with featured_image_url,
  -- which held an external URL. Both are kept because the old get_image()
  -- preferred the uploaded file and fell back to the URL, so dropping either
  -- would lose images.
  featured_image_path text,
  featured_image_url text not null default '',

  video_url text not null default '',
  video_preview_seconds integer not null default 15,
  -- Comma-separated image URLs in the old schema. Left as text rather than
  -- promoted to an array, because the import would have to guess at the
  -- separator handling of existing rows. Convert in a later migration if wanted.
  gallery text not null default '',

  -- Money, per architecture.md section 5 and design.md B6.
  price numeric(10,2) not null default 0,
  discount_price numeric(10,2),
  currency public.currency_code not null default 'GHS',
  -- Was Tour.final_price, a Python @property. Generated so the server can
  -- recompute a total from the database without loading application logic,
  -- which is what design.md B6 requires of every payment path.
  final_price numeric(10,2) generated always as (coalesce(discount_price, price)) stored,

  duration_days integer not null default 1,
  min_group_size integer not null default 1,
  max_group_size integer not null default 10,
  meeting_point text not null default '',

  itinerary text not null default '',
  highlights text not null default '',
  includes text not null default '',
  excludes text not null default '',

  -- Denormalised, maintained from tour_reviews by the application. Kept
  -- because the tour list sorts and filters on rating and would otherwise
  -- aggregate the review table on every page load.
  rating numeric(3,1) not null default 0,
  review_count integer not null default 0,

  is_featured boolean not null default false,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Enforced in Python or not at all in the old system.
  constraint tours_price_non_negative check (price >= 0),
  constraint tours_discount_price_non_negative check (discount_price is null or discount_price >= 0),
  -- A discount above the list price was possible in the old system. It was
  -- never intended, so it is refused here.
  constraint tours_discount_below_price check (discount_price is null or discount_price <= price),
  constraint tours_duration_positive check (duration_days > 0),
  constraint tours_min_group_size_positive check (min_group_size > 0),
  constraint tours_group_size_ordered check (max_group_size >= min_group_size),
  -- 0 is allowed, it is the default for a tour with no reviews yet.
  constraint tours_rating_range check (rating >= 0 and rating <= 5),
  constraint tours_review_count_non_negative check (review_count >= 0),
  constraint tours_video_preview_positive check (video_preview_seconds > 0)
);

comment on table public.tours is 'Tours. From tours_tour.';
comment on column public.tours.legacy_id is
  'TEMPORARY. Old tours_tour.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.tours.final_price is
  'Was the Tour.final_price property: discount_price when set, otherwise price.';
comment on column public.tours.rating is
  'Denormalised average of approved tour_reviews. Kept so list queries do not aggregate reviews.';
comment on column public.tours.review_count is
  'Denormalised count of approved tour_reviews. Maintained alongside rating.';
comment on column public.tours.featured_image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';

create unique index if not exists tours_legacy_id_key on public.tours (legacy_id);
-- Old: UNIQUE (slug), tours_tour_slug_key. Carried.
create unique index if not exists tours_slug_key on public.tours (slug);
-- Old: tours_tour_category_id_ab730f30 ON (category_id). Carried.
create index if not exists tours_category_id_idx on public.tours (category_id);

-- Additions, not in the old database. tours_tour had exactly two indexes
-- besides its keys, so the main public listing had no index support at all.
-- Meta.ordering was ['-is_featured', '-created_at'], always filtered on
-- is_active, which is precisely this index.
create index if not exists tours_active_listing_idx
  on public.tours (is_featured desc, created_at desc) where is_active;
-- Sort by rating on the tour list.
create index if not exists tours_rating_idx on public.tours (rating desc) where is_active;
-- Region is the one real facet on the tour list. No index on location: it is
-- free text like "Accra, Eastern Region", so equality matching on it is not
-- selective. Add one when there is a filter UI that actually queries it.
create index if not exists tours_region_idx on public.tours (region) where is_active;

-- Not carried: tours_tour_slug_29234195_like, the Django *_like companion.

drop trigger if exists tours_set_updated_at on public.tours;
create trigger tours_set_updated_at
  before update on public.tours
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- tour_schedules, from tours_tourschedule
-- ---------------------------------------------------------------------------

create table if not exists public.tour_schedules (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  tour_id uuid not null references public.tours (id) on delete cascade,

  start_date date not null,
  end_date date not null,

  available_spots integer not null default 10,
  booked_spots integer not null default 0,

  -- Were the remaining_spots and is_full Python properties. Generated so the
  -- availability check happens in the query rather than after the fetch, which
  -- is what design.md B8 asks for. is_full is not redundant with the
  -- expression: it is what the client filters on.
  remaining_spots integer generated always as (available_spots - booked_spots) stored,
  is_full boolean generated always as (booked_spots >= available_spots) stored,

  is_cancelled boolean not null default false,
  notes text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tour_schedules_dates_ordered check (end_date >= start_date),
  constraint tour_schedules_available_spots_non_negative check (available_spots >= 0),
  constraint tour_schedules_booked_spots_non_negative check (booked_spots >= 0),
  -- The overbooking guard. The old system checked this in Python at booking
  -- time, so two concurrent bookings could push booked_spots past
  -- available_spots. The database now refuses it outright.
  constraint tour_schedules_not_overbooked check (booked_spots <= available_spots)
);

comment on table public.tour_schedules is 'Dated departures for a tour. From tours_tourschedule.';
comment on column public.tour_schedules.legacy_id is
  'TEMPORARY. Old tours_tourschedule.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.tour_schedules.remaining_spots is
  'Was the TourSchedule.remaining_spots property.';
comment on column public.tour_schedules.is_full is
  'Was the TourSchedule.is_full property. Stored so clients can filter on it.';

-- The TourSchedule.status property (upcoming / active / full / cancelled /
-- past) is deliberately NOT stored. It depends on today's date, so a stored
-- column would be stale the moment it is written. Derive it in the query from
-- start_date, end_date, is_cancelled and is_full.

create unique index if not exists tour_schedules_legacy_id_key on public.tour_schedules (legacy_id);
-- Old: tours_tourschedule_tour_id_5fce7e30 ON (tour_id). Widened to include
-- start_date, since Meta.ordering was ['start_date'] and every read of a
-- schedule list is scoped to one tour and sorted by date. The old bare
-- (tour_id) index is a strict prefix of this, so nothing is lost.
create index if not exists tour_schedules_tour_id_start_date_idx
  on public.tour_schedules (tour_id, start_date);
-- Addition. The booking widget lists bookable departures across all tours.
create index if not exists tour_schedules_bookable_idx
  on public.tour_schedules (start_date) where not is_cancelled;

drop trigger if exists tour_schedules_set_updated_at on public.tour_schedules;
create trigger tour_schedules_set_updated_at
  before update on public.tour_schedules
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- tour_reviews, from tours_tourreview
-- ---------------------------------------------------------------------------

create table if not exists public.tour_reviews (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  tour_id uuid not null references public.tours (id) on delete cascade,

  -- No user_id. tours_tourreview had none, reviews were identified by
  -- free-text name and email, so there is nothing to rebuild a link from.
  user_name text not null,
  user_email text not null default '',

  rating integer not null default 5,
  comment text not null,

  status public.review_status not null default 'pending',

  -- is_approved is NOT carried across. The old model kept both is_approved and
  -- status, with the boolean marked "keep for backward compatibility", so the
  -- two could and did disagree. status is the richer field and the only one the
  -- moderation flow wrote. Import maps is_approved = true to 'approved' only
  -- where status is missing, otherwise status wins.

  is_flagged boolean not null default false,
  flags jsonb not null default '[]'::jsonb,
  moderation_notes text not null default '',

  created_at timestamptz not null default now(),
  -- Not in the old schema. Added for the architecture.md section 5 convention,
  -- and moderation genuinely needs to know when a review last changed.
  updated_at timestamptz not null default now(),

  -- Django declared choices 1..5 on the field, which the ORM enforced and the
  -- database did not.
  constraint tour_reviews_rating_range check (rating between 1 and 5)
);

comment on table public.tour_reviews is
  'Tour reviews. From tours_tourreview. The legacy is_approved boolean is dropped, status replaces it.';
comment on column public.tour_reviews.legacy_id is
  'TEMPORARY. Old tours_tourreview.id. Drop after import.';
comment on column public.tour_reviews.status is
  'Replaces the redundant pair of status and is_approved in tours_tourreview.';

create unique index if not exists tour_reviews_legacy_id_key on public.tour_reviews (legacy_id);
-- Old: tours_tourreview_tour_id_2c4098c8 ON (tour_id). Widened with created_at
-- because Meta.ordering was ['-created_at']. The old bare index is a prefix.
create index if not exists tour_reviews_tour_id_created_at_idx
  on public.tour_reviews (tour_id, created_at desc);
-- The three below are additions. Review moderation had no index support.
create index if not exists tour_reviews_approved_idx
  on public.tour_reviews (tour_id, created_at desc) where status = 'approved';
-- The moderation queue.
create index if not exists tour_reviews_status_idx on public.tour_reviews (status, created_at desc);
create index if not exists tour_reviews_flagged_idx
  on public.tour_reviews (created_at desc) where is_flagged;

drop trigger if exists tour_reviews_set_updated_at on public.tour_reviews;
create trigger tour_reviews_set_updated_at
  before update on public.tour_reviews
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- bookings, from tours_booking
-- ---------------------------------------------------------------------------

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- Was generated in Python as "BK-" plus uuid4().hex[:8].upper(). Moved into
  -- the database so a booking written from anywhere gets a reference, and so
  -- the uniqueness the Django field declared is actually enforced. Built from
  -- gen_random_uuid(), which is core Postgres, rather than pgcrypto's
  -- gen_random_bytes, so the default does not depend on which schema an
  -- extension happens to live in. Same eight uppercase hex characters either way.
  booking_reference text not null
    default 'BK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),

  -- RESTRICT, deliberately. A booking is a financial record and it outlives
  -- the account that created it, so deleting a user must never destroy one.
  -- A right-to-erasure request is satisfied by anonymising the profile row,
  -- scrubbing name, email, phone and avatar, and leaving the booking in place.
  -- Do not "fix" this back to CASCADE: that silently deletes paid bookings.
  -- The old database declared no ON DELETE here at all, Django enforced
  -- CASCADE in Python, so this is a first specification, not a deviation.
  user_id uuid not null references public.profiles (id) on delete restrict,

  -- RESTRICT for the same reason. Django's Python-side CASCADE meant deleting
  -- a tour destroyed every booking ever made against it. Retire a tour with
  -- is_active instead of deleting it.
  tour_id uuid not null references public.tours (id) on delete restrict,

  -- SET NULL. The column is nullable and a booking survives its schedule being
  -- withdrawn. This matches the old Python-side SET_NULL.
  schedule_id uuid references public.tour_schedules (id) on delete set null,

  email text not null,
  phone text not null default '',
  participants integer not null default 1,
  special_requests text not null default '',

  total_price numeric(10,2) not null default 0,
  currency public.currency_code not null default 'GHS',

  status public.booking_status not null default 'pending',

  payment_method text not null default '',
  payment_status public.payment_status not null default 'pending',
  -- The Paystack reference. Left as plain text with no FK, because
  -- paystack_paystacktransaction lands in a later migration.
  transaction_id text not null default '',

  -- Was booking_date, a Django auto_now_add field, so it is the creation
  -- timestamp under another name. Renamed to created_at for the
  -- architecture.md section 5 convention.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bookings_participants_positive check (participants > 0),
  constraint bookings_total_price_non_negative check (total_price >= 0)
);

-- The reference format the old Booking.save() produced. Declared NOT VALID, so
-- existing rows are not checked at load time and an oddly formatted legacy
-- reference cannot block the import, while every new or updated row is still
-- checked. NOT VALID is only accepted on ALTER TABLE, hence the separate
-- statement. AFTER the import has landed, run:
--
--   alter table public.bookings validate constraint bookings_reference_format;
--
-- and investigate whatever it rejects. That is how we find out about bad
-- legacy data instead of crashing on it or accepting it forever.
do $$ begin
  alter table public.bookings
    add constraint bookings_reference_format
    check (booking_reference ~ '^BK-[0-9A-F]{8}$') not valid;
exception when duplicate_object then null;
end $$;

comment on table public.bookings is 'Tour bookings. From tours_booking.';
comment on column public.bookings.legacy_id is
  'TEMPORARY. Old tours_booking.id. Drop after import.';
comment on column public.bookings.booking_reference is
  'BK- plus eight uppercase hex characters. Was generated in Booking.save(), now a column default.';
comment on column public.bookings.created_at is
  'Was tours_booking.booking_date, a Django auto_now_add field.';
comment on column public.bookings.transaction_id is
  'Paystack reference. No foreign key yet, the paystack tables arrive in a later migration.';

create unique index if not exists bookings_legacy_id_key on public.bookings (legacy_id);
-- Old: UNIQUE (booking_reference), tours_booking_booking_reference_key. Carried.
create unique index if not exists bookings_booking_reference_key
  on public.bookings (booking_reference);
-- Old: tours_booking_user_id_c78b812c ON (user_id). Widened with created_at,
-- since Meta.ordering was ['-booking_date'] and the account page reads one
-- user newest first. The old bare index is a strict prefix of this.
create index if not exists bookings_user_id_created_at_idx
  on public.bookings (user_id, created_at desc);
-- Old: tours_booking_tour_id_c78288d5 and tours_booking_schedule_id_563dcc59.
-- Carried as is.
create index if not exists bookings_tour_id_idx on public.bookings (tour_id);
create index if not exists bookings_schedule_id_idx on public.bookings (schedule_id);

-- Additions. The admin booking queues filtered on both status columns with no
-- index behind them.
create index if not exists bookings_status_idx on public.bookings (status, created_at desc);
create index if not exists bookings_payment_status_idx on public.bookings (payment_status, created_at desc);
-- Webhook lookup by Paystack reference. Partial because the column is NOT NULL
-- DEFAULT '' and most rows never get one. This replaces the old
-- tours_booking_booking_reference_016ca5f1_like, which indexed the wrong
-- column for this job: the webhook arrives with a Paystack reference, not a
-- booking reference.
create index if not exists bookings_transaction_id_idx
  on public.bookings (transaction_id) where transaction_id <> '';

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();
