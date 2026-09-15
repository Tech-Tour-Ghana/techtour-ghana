-- 0008_engagement.sql
-- Careers and inbound messages, from pages_jobcategory, pages_jobopening,
-- pages_contactmessage, pages_newslettersubscriber, pages_suggestion and
-- pages_reportissue.
--
-- Everything in this file except the two careers tables is written by the
-- public and read by staff. The careers pair is the mirror image: written by
-- staff, read by the public. That split is recorded in the table comments
-- below because task 1.6 needs it to write the policies, and getting it
-- backwards on any one of these tables leaks either a mailbox or a hiring plan.
--
-- Same rules as 0005. Anything the old system enforced in Python becomes a
-- CHECK constraint. Columns nullable in the database but blank=True in Django
-- become NOT NULL DEFAULT '' and the import must coalesce. The reserved-word
-- column "order" becomes sort_order.
--
-- No RLS policies in this file. That is task 1.6.


-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
-- Same idempotent DO block form as 0001, since Postgres has no
-- CREATE TYPE IF NOT EXISTS. Every one of these replaces a status or category
-- varchar whose value set is declared in a Django choices list, which is the
-- bar 0001 set for creating an enum at all.

-- employment_type. The old column was pages_jobopening.employment_type
-- character varying(20). Values from JobOpening.EMPLOYMENT_CHOICES in
-- pages/models.py:
--   full_time, part_time, contract, internship, remote
do $$ begin
  create type public.employment_type as enum
    ('full_time', 'part_time', 'contract', 'internship', 'remote');
exception when duplicate_object then null;
end $$;

-- newsletter_source. The old column was pages_newslettersubscriber.source
-- character varying(50). Values from the inline choices list on
-- NewsletterSubscriber.source in pages/models.py:
--   footer, popup, landing, other
do $$ begin
  create type public.newsletter_source as enum ('footer', 'popup', 'landing', 'other');
exception when duplicate_object then null;
end $$;

-- suggestion_category. The old column was pages_suggestion.category character
-- varying(20). Values from Suggestion.CATEGORY_CHOICES in pages/models.py:
--   feature, improvement, general, other
do $$ begin
  create type public.suggestion_category as enum
    ('feature', 'improvement', 'general', 'other');
exception when duplicate_object then null;
end $$;

-- suggestion_status. The old column was pages_suggestion.status character
-- varying(20). Values from Suggestion.STATUS_CHOICES in pages/models.py:
--   pending, reviewing, approved, rejected, implemented
--
-- Deliberately NOT public.review_status from 0001. That enum is
-- pending/approved/rejected and belongs to tour reviews. This set has two extra
-- states, so reusing it would mean either losing reviewing and implemented or
-- widening a type that other tables depend on. Separate types, separate
-- lifecycles.
do $$ begin
  create type public.suggestion_status as enum
    ('pending', 'reviewing', 'approved', 'rejected', 'implemented');
exception when duplicate_object then null;
end $$;

-- issue_priority. The old column was pages_reportissue.priority character
-- varying(20). Values from ReportIssue.PRIORITY_CHOICES in pages/models.py:
--   low, medium, high, critical
do $$ begin
  create type public.issue_priority as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null;
end $$;

-- issue_status. The old column was pages_reportissue.status character
-- varying(20). Values from ReportIssue.STATUS_CHOICES in pages/models.py:
--   new, in_progress, resolved, closed, wont_fix
do $$ begin
  create type public.issue_status as enum
    ('new', 'in_progress', 'resolved', 'closed', 'wont_fix');
exception when duplicate_object then null;
end $$;


-- ---------------------------------------------------------------------------
-- job_categories, from pages_jobcategory
-- ---------------------------------------------------------------------------
-- Declared before job_openings, which references it.

create table if not exists public.job_categories (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  name text not null,
  slug text not null,

  -- Was the quoted column "order". Renamed for the same reason as
  -- tour_categories.sort_order in 0003.
  sort_order integer not null default 0,

  is_active boolean not null default true,

  -- Both added. pages_jobcategory had neither, it was the only careers table
  -- with no timestamps at all. Added for the architecture.md section 5
  -- convention. Import should set both from the parent job opening's
  -- created_at where one exists, otherwise now() is honest enough for a
  -- lookup table.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint job_categories_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.job_categories is
  'Job opening categories. From pages_jobcategory. Public reads where is_active, admin writes.';
comment on column public.job_categories.legacy_id is
  'TEMPORARY. Old pages_jobcategory.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.job_categories.sort_order is
  'Was the reserved-word column "order" in pages_jobcategory.';
comment on column public.job_categories.created_at is
  'Added in migration. pages_jobcategory had no timestamp columns.';

create unique index if not exists job_categories_legacy_id_key
  on public.job_categories (legacy_id);
-- Old: UNIQUE (slug), pages_jobcategory_slug_key. Carried.
create unique index if not exists job_categories_slug_key on public.job_categories (slug);
-- Addition, same shape as market_categories_active_sort_order_idx in 0005.
-- Meta.ordering was ['order', 'name'] and the careers page lists active
-- categories only.
create index if not exists job_categories_active_sort_order_idx
  on public.job_categories (sort_order) where is_active;
-- Not carried: pages_jobcategory_slug_0c588732_like ON (slug
-- varchar_pattern_ops). Django adds a *_like index to every unique varchar so
-- LIKE 'x%' can use an index under a non-C collation. Nothing looks up a job
-- category by slug prefix, it is looked up by exact slug, which the unique
-- index above serves. Same decision as 0002 made for profiles.email.

drop trigger if exists job_categories_set_updated_at on public.job_categories;
create trigger job_categories_set_updated_at
  before update on public.job_categories
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- job_openings, from pages_jobopening
-- ---------------------------------------------------------------------------

create table if not exists public.job_openings (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  title text not null,
  slug text not null,

  -- SET NULL. The column is nullable in the old schema and Django declared
  -- on_delete=SET_NULL, so a vacancy survives its category being retired. The
  -- alternative, CASCADE, would delete live vacancies as a side effect of
  -- tidying a lookup table.
  category_id uuid references public.job_categories (id) on delete set null,

  -- The Django field carried default='Accra' and the column is NOT NULL.
  location text not null default 'Accra',

  employment_type public.employment_type not null default 'full_time',

  description text not null,
  requirements text not null,

  is_active boolean not null default true,
  closing_date date,

  created_at timestamptz not null default now(),
  -- Added. pages_jobopening had created_at but no updated_at, while a vacancy
  -- is edited in place more often than most content here.
  updated_at timestamptz not null default now()
);

-- Column in the Django model that is NOT carried: JobOpening.benefits
-- (TextField, blank=True, null=True). It does not exist in
-- pages_jobopening in the extracted schema, so the migration never ran and no
-- row can be holding a value. Flagged rather than silently added, because if
-- the intent was for it to exist it should arrive as its own migration with
-- the rest of the careers work, not be smuggled in here.

comment on table public.job_openings is
  'Job vacancies. From pages_jobopening. Public reads where is_active, admin writes.';
comment on column public.job_openings.legacy_id is
  'TEMPORARY. Old pages_jobopening.id. Drop after import.';
comment on column public.job_openings.updated_at is
  'Added in migration. pages_jobopening had created_at only.';

create unique index if not exists job_openings_legacy_id_key
  on public.job_openings (legacy_id);
-- Old: UNIQUE (slug), pages_jobopening_slug_key. Carried.
create unique index if not exists job_openings_slug_key on public.job_openings (slug);
-- Old: pages_jobopening_category_id_795d19bb ON (category_id). Carried, but
-- narrowed to the active rows, which is the only set the careers listing reads
-- and roughly the only set anyone filters by category.
create index if not exists job_openings_category_id_idx
  on public.job_openings (category_id) where is_active;
-- Addition. Meta.ordering was ['-created_at'] and the careers page is one
-- unfiltered newest-first list of open roles.
create index if not exists job_openings_active_created_at_idx
  on public.job_openings (created_at desc) where is_active;
-- Not carried: pages_jobopening_slug_79e49a0e_like ON (slug
-- varchar_pattern_ops). Same reasoning as the job_categories one above.

drop trigger if exists job_openings_set_updated_at on public.job_openings;
create trigger job_openings_set_updated_at
  before update on public.job_openings
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- contact_messages, from pages_contactmessage
-- ---------------------------------------------------------------------------
-- Write from the public, read by staff. Anonymous visitors INSERT, only admins
-- SELECT. There is no owner column to match on, so there is no third case:
-- a submitter cannot read their own message back, and the insert policy must
-- not be paired with a select policy that returns anything.
--
-- analytics_contactsubmission in 0009 is the same shape under another name.
-- The two are kept apart rather than merged, because architecture.md section 5
-- lists them in different domains and merging them would silently join a
-- staff mailbox to an analytics feed. See the note on
-- analytics_contact_submissions in 0009.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  name text not null,
  email text not null,
  -- blank=True in Django, NOT NULL in the database, so it already holds ''
  -- rather than NULL. Kept as is.
  phone text not null default '',
  subject text not null,
  message text not null,

  -- Staff triage flag. The only column an admin writes on this table.
  is_read boolean not null default false,

  created_at timestamptz not null default now(),
  -- Added. pages_contactmessage had created_at only. It is not purely append
  -- only, is_read is toggled, so this one earns its keep.
  updated_at timestamptz not null default now()
);

comment on table public.contact_messages is
  'Contact form submissions. From pages_contactmessage. Anonymous visitors insert, only admins read. No owner column, so there is no self-read case.';
comment on column public.contact_messages.legacy_id is
  'TEMPORARY. Old pages_contactmessage.id. Drop after import.';
comment on column public.contact_messages.updated_at is
  'Added in migration. pages_contactmessage had created_at only.';

create unique index if not exists contact_messages_legacy_id_key
  on public.contact_messages (legacy_id);
-- pages_contactmessage had no index at all beyond its primary key, and no
-- unique constraint. Both additions below back the only two queries the staff
-- mailbox runs: the unread queue, and the full list newest first
-- (Meta.ordering was ['-created_at']).
create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);
-- Partial, because the unread set is the small one and stays small if the
-- mailbox is worked. A full index on (is_read, created_at) would be mostly
-- read rows nobody queries for.
create index if not exists contact_messages_unread_idx
  on public.contact_messages (created_at desc) where not is_read;

drop trigger if exists contact_messages_set_updated_at on public.contact_messages;
create trigger contact_messages_set_updated_at
  before update on public.contact_messages
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- newsletter_subscribers, from pages_newslettersubscriber
-- ---------------------------------------------------------------------------
-- Anonymous visitors INSERT, only admins read. The email column makes every
-- row personal data, so this table must never be readable by anon, not even
-- to check whether an address is already subscribed. A duplicate subscribe
-- attempt is handled server side by ON CONFLICT against the unique index
-- below, which tells the visitor nothing.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  email text not null,
  source public.newsletter_source not null default 'footer',

  -- Soft delete, and also the unsubscribe flag. An unsubscribe flips this
  -- rather than deleting the row, so a later resubscribe does not lose the
  -- original date and so the address is not silently re-added by an import.
  is_active boolean not null default true,

  -- Capture context, all of it nullable in the old table and all of it
  -- genuinely unknown for some rows, so unlike the blank=True columns
  -- elsewhere these stay nullable. NULL here means "we never resolved it",
  -- which is a different fact from ''.
  ip_address inet,
  user_agent text,
  country text,
  country_code text,
  region text,
  city text,
  postal_code text,
  latitude numeric(10,6),
  longitude numeric(10,6),
  device_type text,
  os text,
  browser text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The old table had no bounds on these at all. Anything outside them is a
  -- broken geocode, not a subscriber in the Pacific.
  constraint newsletter_subscribers_latitude_range
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  constraint newsletter_subscribers_longitude_range
    check (longitude is null or (longitude >= -180 and longitude <= 180))
);

-- SUSPECT DATA IN THE SOURCE SCHEMA, not corrected here.
-- pages_newslettersubscriber in extracted-schema.sql carries five columns that
-- have nothing to do with a newsletter subscriber:
--   hero_image, login_background_image, login_background_video,
--   register_background_image, register_background_video
-- All five are SiteSettings fields, and none of them appear on the
-- NewsletterSubscriber model in pages/models.py. They look like an ALTER TABLE
-- that was aimed at pages_sitesettings and landed here. They are not carried.
-- Check the dump before import: if any of those five columns holds a non-NULL
-- value, that value belongs to site settings and needs rescuing, otherwise the
-- columns are simply dead and dropping them is the whole fix.
--
-- device_type is deliberately text and not public.device_type from 0001. The
-- old column is character varying(50) with no choices list anywhere, populated
-- by whatever a user-agent parser returned, so there is no authoritative value
-- set and a bad parse would fail the import against an enum. The 0001 enum is
-- fed by an explicit four-value choices list on a different model, so the two
-- are not the same column under two names.

comment on table public.newsletter_subscribers is
  'Newsletter signups. From pages_newslettersubscriber. Anonymous visitors insert, only admins read. Never expose the email column to anon, not even for a duplicate check.';
comment on column public.newsletter_subscribers.legacy_id is
  'TEMPORARY. Old pages_newslettersubscriber.id. Drop after import.';
comment on column public.newsletter_subscribers.is_active is
  'Also the unsubscribe flag. Unsubscribing flips this, it never deletes the row.';
comment on column public.newsletter_subscribers.device_type is
  'Free text from a user-agent parser. Not public.device_type, the old column had no choices list.';

create unique index if not exists newsletter_subscribers_legacy_id_key
  on public.newsletter_subscribers (legacy_id);
-- Old: UNIQUE (email), pages_newslettersubscriber_email_key. Carried, but on
-- lower(email), the same tightening 0002 applied to profiles.email and for the
-- same reason: a case-different duplicate is a live bug, here it means sending
-- the same person two copies of every campaign. STRICTER than the old rule, so
-- check the dump for case-duplicate addresses before importing.
-- Consequence: query with lower(email) = lower($1).
create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));
-- Addition. The export and the admin list both read active subscribers newest
-- first, and is_active is the one filter that always applies.
create index if not exists newsletter_subscribers_active_created_at_idx
  on public.newsletter_subscribers (created_at desc) where is_active;
-- Not carried: pages_newslettersubscriber_email_8105721c_like ON (email
-- varchar_pattern_ops). Same *_like reasoning as above. Admin search over
-- addresses, if it is ever built, wants pg_trgm rather than a pattern_ops
-- btree, which only helps anchored prefixes.

drop trigger if exists newsletter_subscribers_set_updated_at on public.newsletter_subscribers;
create trigger newsletter_subscribers_set_updated_at
  before update on public.newsletter_subscribers
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- suggestions, from pages_suggestion
-- ---------------------------------------------------------------------------
-- Anonymous visitors INSERT, only admins read. This one has a user_id, so
-- task 1.6 has a genuine choice to make that the other inbound tables do not:
-- whether a signed-in submitter may read their own suggestion back. The
-- default is no, matching the old system, which exposed suggestions only
-- through the admin. votes is the reason to revisit that, since a public vote
-- count implies a public list.

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  subject text not null,
  message text not null,
  category public.suggestion_category not null default 'general',
  status public.suggestion_status not null default 'pending',

  -- SET NULL, matching Django's on_delete=SET_NULL and the nullable column.
  -- The suggestion is not a financial record, it is feedback, and it stays
  -- useful after the account behind it is gone. Deleting the user should not
  -- delete the idea, and CASCADE would do exactly that.
  user_id uuid references public.profiles (id) on delete set null,

  -- blank=True in Django, NOT NULL in the database. Already ''. Anonymous
  -- submissions leave it empty, which is why it is not validated as an
  -- address here.
  email text not null default '',

  is_read boolean not null default false,
  votes integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The old table had no bound on votes. Nothing in the application ever
  -- decremented below zero, a negative count is data corruption.
  constraint suggestions_votes_non_negative check (votes >= 0)
);

comment on table public.suggestions is
  'Public suggestions. From pages_suggestion. Anonymous visitors insert, only admins read. user_id is nullable, anonymous submissions are normal.';
comment on column public.suggestions.legacy_id is
  'TEMPORARY. Old pages_suggestion.id. Drop after import.';
comment on column public.suggestions.email is
  'May be empty. Anonymous submissions carry no address.';

create unique index if not exists suggestions_legacy_id_key
  on public.suggestions (legacy_id);
-- Old: pages_suggestion_user_id_0dbbc8f7 ON (user_id). Widened with created_at
-- so it also serves a per-submitter newest-first read if task 1.6 allows one.
-- The old bare index is a strict prefix of this, same call 0002 made on
-- login_history.
create index if not exists suggestions_user_id_created_at_idx
  on public.suggestions (user_id, created_at desc);
-- Additions. Meta.ordering was ['-created_at'], and the admin screen filters
-- by status before anything else.
create index if not exists suggestions_status_created_at_idx
  on public.suggestions (status, created_at desc);
create index if not exists suggestions_unread_idx
  on public.suggestions (created_at desc) where not is_read;
-- No index on category. It has four values across a table that will not reach
-- five figures, so a filter on it is a cheap residual on top of the status
-- index. Add one when the row count says otherwise, not before.

drop trigger if exists suggestions_set_updated_at on public.suggestions;
create trigger suggestions_set_updated_at
  before update on public.suggestions
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- issue_reports, from pages_reportissue
-- ---------------------------------------------------------------------------
-- Renamed from the literal reading, report_issues, which parses as a verb and
-- an object rather than a thing. The rows are reports about issues.
--
-- Anonymous visitors INSERT, only admins read. resolution_notes is the reason
-- this table must never be readable by the submitter: staff write internal
-- triage notes into it, and a policy that lets a reporter read their own row
-- back hands them those notes.

create table if not exists public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  subject text not null,
  description text not null,
  priority public.issue_priority not null default 'medium',
  status public.issue_status not null default 'new',

  -- SET NULL, same reasoning as suggestions.user_id. A bug report outlives the
  -- account that filed it and is still worth acting on.
  user_id uuid references public.profiles (id) on delete set null,

  -- blank=True in Django, NOT NULL in the database. Already ''.
  email text not null default '',
  phone text not null default '',

  is_read boolean not null default false,

  -- Internal. Staff only, in every direction. See the table comment.
  resolution_notes text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.issue_reports is
  'Issue reports from the public. From pages_reportissue. Anonymous visitors insert, only admins read. resolution_notes is internal, never expose this table to the submitter.';
comment on column public.issue_reports.legacy_id is
  'TEMPORARY. Old pages_reportissue.id. Drop after import.';
comment on column public.issue_reports.resolution_notes is
  'Internal staff notes. Admin read and write only.';

create unique index if not exists issue_reports_legacy_id_key
  on public.issue_reports (legacy_id);
-- Old: pages_reportissue_user_id_bb8124df ON (user_id). Widened with
-- created_at, same reasoning as suggestions above. The old bare index is a
-- strict prefix.
create index if not exists issue_reports_user_id_created_at_idx
  on public.issue_reports (user_id, created_at desc);
-- Additions. Meta.ordering was ['-created_at'], and the triage queue reads
-- open issues worst first. priority is an enum, so ordering by it descending
-- is the declaration order reversed, meaning critical before high before
-- medium before low. Do not reorder the enum values, this index and the queue
-- both depend on that order being the severity order.
create index if not exists issue_reports_status_created_at_idx
  on public.issue_reports (status, created_at desc);
create index if not exists issue_reports_open_priority_idx
  on public.issue_reports (priority desc, created_at desc)
  where status in ('new', 'in_progress');

drop trigger if exists issue_reports_set_updated_at on public.issue_reports;
create trigger issue_reports_set_updated_at
  before update on public.issue_reports
  for each row execute function public.set_updated_at();
