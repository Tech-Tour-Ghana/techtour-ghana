-- 0007_site_content.sql
-- The editor managed site content, from pages_sitesettings, pages_navbarmenu,
-- pages_navbardropdown, pages_homepageslide, pages_homepagesection,
-- pages_mainfeaturecard, pages_smallglasscard, pages_videosection,
-- pages_testimonial, pages_teammember, pages_footersettings,
-- pages_footerfeature, pages_footerquicklink, pages_footercontact,
-- pages_sociallink and pages_legallink.
--
-- Same rules as 0003, 0005 and 0006. Rules the old application enforced in
-- Python become CHECK constraints, Django ImageField and FileField disk paths
-- become *_path, and the reserved-word column "order" becomes sort_order the
-- way tour_categories did in 0003.
--
-- Two things are specific to this file.
--
-- First, the old API served these sixteen tables through 45 flat endpoints, six
-- of them for the footer alone. The new application reads them from Server
-- Components, one query per region of the page rather than one per fragment:
-- the navbar reads navbar_menus joined to navbar_dropdowns, the homepage reads
-- homepage_sections, homepage_slides, main_feature_cards joined to
-- small_glass_cards, video_sections and testimonials, the footer reads
-- footer_settings plus its four child tables plus social_links and legal_links.
-- Every index below is shaped for that access pattern: a partial index on
-- is_active carrying the sort column, so a region query is one index scan per
-- table with no sort step. No views are defined here. A view would need its own
-- decision about security_invoker and it would have to be granted alongside the
-- policies, so it belongs with task 1.6 if it is wanted at all.
--
-- Second, almost every table in this file lacked created_at and updated_at.
-- Only pages_homepageslide and pages_videosection had both, and
-- pages_mainfeaturecard and pages_testimonial had created_at alone. The rest
-- had neither. architecture.md section 5 requires both on every table, so they
-- are added. Rows imported into a table that had no created_at will all carry
-- the import timestamp, which is honest, since the old schema never recorded
-- when the row was made.
--
-- No RLS policies in this file. That is task 1.6.


-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
-- Same idempotent DO block form as 0001, since Postgres has no
-- CREATE TYPE IF NOT EXISTS. Every type below replaces a character varying
-- column whose value set is declared on the Django model, so the set is
-- recovered rather than guessed, and the source is named in each case.

-- text_alignment. Old columns pages_mainfeaturecard.title_alignment,
-- .subtitle_alignment and .description_alignment, plus
-- pages_smallglasscard.title_alignment and .description_alignment, all
-- character varying(10). Values from MainFeatureCard.ALIGNMENT_CHOICES and
-- SmallGlassCard.ALIGNMENT_CHOICES in pages/models.py, which are the same list:
--   left, center, right
-- One type for both tables, because the two lists are identical and the two
-- card tables are rendered by the same layout code.
do $$ begin
  create type public.text_alignment as enum ('left', 'center', 'right');
exception when duplicate_object then null;
end $$;

-- homepage_section_key. Old column pages_homepagesection.section character
-- varying(50), UNIQUE. Values from HomepageSection.SECTION_CHOICES in
-- pages/models.py:
--   hero, destinations, study_abroad, market
-- Worth an enum rather than text even though the column is already unique,
-- because the application switches on this value to pick a renderer. A typo
-- here silently hides a whole homepage section.
do $$ begin
  create type public.homepage_section_key as enum
    ('hero', 'destinations', 'study_abroad', 'market');
exception when duplicate_object then null;
end $$;

-- feature_card_type. Old column pages_mainfeaturecard.card_type character
-- varying(20), default 'custom'. Values from MainFeatureCard.CARD_TYPES in
-- pages/models.py:
--   study, market, custom
do $$ begin
  create type public.feature_card_type as enum ('study', 'market', 'custom');
exception when duplicate_object then null;
end $$;

-- video_card_type. Old column pages_videosection.card_type character
-- varying(10), default 'wide'. Values from VideoSection.CARD_TYPE_CHOICES in
-- pages/models.py:
--   wide, short
-- Not merged with feature_card_type. The two lists share a column name and
-- nothing else, and merging them would let a video section claim to be a study
-- abroad card. Same reasoning as vacation_booking_status in 0006.
do $$ begin
  create type public.video_card_type as enum ('wide', 'short');
exception when duplicate_object then null;
end $$;

-- video_media_type. Old column pages_videosection.media_type character
-- varying(10), default 'video'. Values from VideoSection.MEDIA_TYPE_CHOICES in
-- pages/models.py:
--   video, image, none
-- 'none' is a real value in the list, not a stand-in for NULL. It means the
-- card renders copy and a button with no media at all.
do $$ begin
  create type public.video_media_type as enum ('video', 'image', 'none');
exception when duplicate_object then null;
end $$;

-- footer_link_category. Old column pages_footerquicklink.category character
-- varying(20). Values from FooterQuickLink.CATEGORY_CHOICES in pages/models.py:
--   destinations, services, company, support
-- This is what turns six flat footer endpoints into one query. The footer link
-- columns are this enum, grouped in the application after a single read.
do $$ begin
  create type public.footer_link_category as enum
    ('destinations', 'services', 'company', 'support');
exception when duplicate_object then null;
end $$;

-- social_platform. Two old columns, pages_sociallink.platform character
-- varying(20) and pages_videosection.social_platform character varying(20).
-- Values are the union of two lists in pages/models.py:
--   SocialLink.PLATFORM_CHOICES:
--     facebook, twitter, instagram, linkedin, youtube, tiktok, whatsapp
--   VideoSection.SOCIAL_PLATFORM_CHOICES:
--     youtube, tiktok, instagram, facebook, twitter, other
-- One type rather than two, unlike the card_type pair above, because these two
-- lists genuinely name the same thing. They differ only in which platforms each
-- editor form happened to offer, not in what the value means. The union is
-- taken so neither column loses a value it can already hold. The cost is that
-- social_links.platform can now be set to 'other', which the old form did not
-- offer. That is a widening of an editor choice list, not a semantic change,
-- and the alternative was two near-identical types.
do $$ begin
  create type public.social_platform as enum
    ('facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok',
     'whatsapp', 'other');
exception when duplicate_object then null;
end $$;

-- Deliberately NOT enums, for the same reason 0001 left profiles.text_size as
-- text. The colour columns on pages_mainfeaturecard and pages_smallglasscard
-- (button_color, title_color, subtitle_color, description_color) hold raw hex
-- strings with a Python default and no choices list. The size columns
-- (title_size, description_size) and the layout columns (mobile_card_height,
-- mobile_card_width, max_width) hold Tailwind class names, which are open
-- ended by nature. There is no authoritative value set for any of them.


-- ---------------------------------------------------------------------------
-- site_settings, from pages_sitesettings
-- ---------------------------------------------------------------------------
-- Global branding and auth page copy. Read as one row.

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  logo_url text not null default '',
  favicon_url text not null default '',

  -- Auth page backgrounds and copy. Every one of these columns was nullable in
  -- pages_sitesettings and declared blank=True on the Django field, so '' and
  -- NULL both reached the column depending on which form saved it. Normalised
  -- to NOT NULL DEFAULT '' for the same reason as market_categories in 0005.
  -- Import must coalesce NULL to ''. These fields also carried null=True, so
  -- there will be real NULLs in the dump, not just the theoretical possibility.
  login_background_url text not null default '',
  login_headline text not null default '',
  login_description text not null default '',
  -- Newline separated list in the old schema, one feature per line, split by
  -- SiteSettings.get_login_features_list(). Left as text rather than promoted
  -- to an array, for the same reason as artisans.specialties in 0005: the
  -- import would have to guess the separator for rows saved before the helper.
  login_features text not null default '',

  register_background_url text not null default '',
  register_headline text not null default '',
  register_description text not null default '',
  register_features text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No constraint forcing a single row, for the same reason as shipping_settings
-- in 0005. The old table had none and the dump may hold several, since the
-- Django admin never stopped anyone adding one. A singleton guard added now
-- would refuse the import. Decide on one after the import shows the row count.
--
-- No is_active column either. shipping_settings got one in 0005 because the
-- Django ShippingSettings model declared it, so there was a source. SiteSettings
-- declares nothing of the kind, and a site with its branding soft deleted has
-- no sensible rendering.

comment on table public.site_settings is
  'Global branding and auth page copy. From pages_sitesettings. Read as a singleton, one row, no constraint enforcing that. See the note above the table.';
comment on column public.site_settings.legacy_id is
  'TEMPORARY. Old pages_sitesettings.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.site_settings.login_features is
  'Newline separated feature list. Was split in Python by SiteSettings.get_login_features_list().';
comment on column public.site_settings.register_features is
  'Newline separated feature list. Was split in Python by SiteSettings.get_register_features_list().';

create unique index if not exists site_settings_legacy_id_key
  on public.site_settings (legacy_id);
-- No other index. pages_sitesettings had none beyond its primary key, and a
-- table read one row at a time does not need one.

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- navbar_menus, from pages_navbarmenu
-- ---------------------------------------------------------------------------
-- Declared before navbar_dropdowns, which references it.

create table if not exists public.navbar_menus (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  label text not null,
  -- blank=True on the Django field with help_text 'Leave blank if has
  -- dropdown'. Not a CHECK constraint, see the note below the table.
  url text not null default '',

  -- Was the quoted column "order". Renamed for the same reason as
  -- tour_categories.sort_order in 0003.
  sort_order integer not null default 0,
  is_active boolean not null default true,
  has_dropdown boolean not null default false,

  -- Addition. pages_navbarmenu had neither column.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Addition. pages_navbarmenu declared no check, but Meta.ordering was
  -- ['order'] and a negative position is meaningless.
  constraint navbar_menus_sort_order_non_negative check (sort_order >= 0)
);

-- No CHECK tying url to has_dropdown. The obvious rule, that a menu has either
-- a url or a dropdown, was never enforced anywhere: the model only carried it
-- as help_text, and the old templates rendered a menu with both by ignoring the
-- url. A constraint here would reject legacy rows the old site displayed fine.
-- Worth revisiting once the import shows whether any such rows exist.

comment on table public.navbar_menus is 'Top level navigation items. From pages_navbarmenu.';
comment on column public.navbar_menus.legacy_id is
  'TEMPORARY. Old pages_navbarmenu.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.navbar_menus.sort_order is
  'Was the reserved-word column "order" in pages_navbarmenu.';
comment on column public.navbar_menus.has_dropdown is
  'Editor flag, not derived from navbar_dropdowns. A menu may be flagged before its children are added.';

create unique index if not exists navbar_menus_legacy_id_key
  on public.navbar_menus (legacy_id);
-- Addition. pages_navbarmenu had no index beyond its primary key, so the navbar
-- sorted on an unindexed column on every request. Meta.ordering was ['order']
-- and the navbar reads active rows only. Same shape as
-- market_categories_active_sort_order_idx in 0005.
create index if not exists navbar_menus_active_sort_order_idx
  on public.navbar_menus (sort_order) where is_active;

drop trigger if exists navbar_menus_set_updated_at on public.navbar_menus;
create trigger navbar_menus_set_updated_at
  before update on public.navbar_menus
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- navbar_dropdowns, from pages_navbardropdown
-- ---------------------------------------------------------------------------

create table if not exists public.navbar_dropdowns (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- ON DELETE CASCADE. A dropdown entry is a part of its menu, not a thing in
  -- its own right: it has no url that means anything outside the menu heading
  -- it sits under, and NavbarDropdown.parent_menu declared
  -- on_delete=models.CASCADE, so the old system already behaved this way in
  -- Python. Same reasoning as tour_schedules in 0003. The column is NOT NULL,
  -- so SET NULL is not available and RESTRICT would leave an editor unable to
  -- remove a menu without first emptying it by hand.
  parent_menu_id uuid not null references public.navbar_menus (id) on delete cascade,

  label text not null,
  url text not null,

  -- Was the quoted column "order".
  sort_order integer not null default 0,
  is_active boolean not null default true,

  -- Addition. pages_navbardropdown had neither column.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint navbar_dropdowns_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.navbar_dropdowns is
  'Second level navigation items. From pages_navbardropdown. Cascades from navbar_menus.';
comment on column public.navbar_dropdowns.legacy_id is
  'TEMPORARY. Old pages_navbardropdown.id. Drop after import.';
comment on column public.navbar_dropdowns.sort_order is
  'Was the reserved-word column "order" in pages_navbardropdown.';

create unique index if not exists navbar_dropdowns_legacy_id_key
  on public.navbar_dropdowns (legacy_id);
-- Old: pages_navbardropdown_parent_menu_id_b122529f ON (parent_menu_id),
-- widened with sort_order because Meta.ordering was ['order'] and the navbar
-- reads one menu's children in order. The old bare index is a strict prefix of
-- this, so nothing is lost. Same treatment as orders_user_id_created_at_idx
-- in 0005.
create index if not exists navbar_dropdowns_parent_menu_id_sort_order_idx
  on public.navbar_dropdowns (parent_menu_id, sort_order);

drop trigger if exists navbar_dropdowns_set_updated_at on public.navbar_dropdowns;
create trigger navbar_dropdowns_set_updated_at
  before update on public.navbar_dropdowns
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- homepage_sections, from pages_homepagesection
-- ---------------------------------------------------------------------------
-- One row per switchable homepage region. The homepage reads this table first
-- to decide what to render at all, then reads the content tables below.

create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- Was character varying(50) with SECTION_CHOICES. See the enum note above.
  section public.homepage_section_key not null,

  title text not null default '',
  subtitle text not null default '',

  is_active boolean not null default true,
  -- Was the quoted column "order".
  sort_order integer not null default 0,

  -- Addition. pages_homepagesection had neither column.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint homepage_sections_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.homepage_sections is
  'Which homepage regions render, and their headings. From pages_homepagesection.';
comment on column public.homepage_sections.legacy_id is
  'TEMPORARY. Old pages_homepagesection.id. Drop after import.';
comment on column public.homepage_sections.section is
  'Identifies the region. The application switches on this value to pick a renderer.';
comment on column public.homepage_sections.sort_order is
  'Was the reserved-word column "order" in pages_homepagesection.';

create unique index if not exists homepage_sections_legacy_id_key
  on public.homepage_sections (legacy_id);
-- Old: UNIQUE (section), pages_homepagesection_section_key. Carried.
create unique index if not exists homepage_sections_section_key
  on public.homepage_sections (section);
-- Not carried: pages_homepagesection_section_e032f62c_like, the Django *_like
-- companion to the unique section column. Same reasoning as 0002, 0003 and
-- 0005: the column is looked up by equality, never by prefix, and the enum
-- above has no varchar_pattern_ops operator class anyway.
--
-- No active-and-ordered index either. This table holds four rows, one per value
-- of the enum. A sequential scan beats an index on a table that fits in a
-- single page, and every query reads all of it.

drop trigger if exists homepage_sections_set_updated_at on public.homepage_sections;
create trigger homepage_sections_set_updated_at
  before update on public.homepage_sections
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- homepage_slides, from pages_homepageslide
-- ---------------------------------------------------------------------------

create table if not exists public.homepage_slides (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  title text not null,
  subtitle text not null default '',
  description text not null default '',

  -- image was a Django ImageField disk path, image_url held an external link.
  -- Both kept, the path renamed. HomepageSlide.get_image() preferred the URL
  -- and fell back to the upload, which is the opposite order to
  -- MainFeatureCard.get_image(), so the application must not assume one rule
  -- for every card table. Same shape as market_products.image_path in 0005.
  image_path text,
  image_url text not null default '',

  button_text text not null default 'Explore Now',
  button_link text not null default '/destinations',

  -- Was the quoted column "order".
  sort_order integer not null default 0,
  is_active boolean not null default true,

  -- Both present on pages_homepageslide, one of only two tables in this file
  -- that had them.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint homepage_slides_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.homepage_slides is 'Hero slider slides. From pages_homepageslide.';
comment on column public.homepage_slides.legacy_id is
  'TEMPORARY. Old pages_homepageslide.id. Drop after import.';
comment on column public.homepage_slides.sort_order is
  'Was the reserved-word column "order" in pages_homepageslide.';
comment on column public.homepage_slides.image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration. HomepageSlide.get_image() preferred image_url over this.';

create unique index if not exists homepage_slides_legacy_id_key
  on public.homepage_slides (legacy_id);
-- Addition. pages_homepageslide had no index beyond its primary key.
-- Meta.ordering was ['order'] and the hero reads active slides only.
create index if not exists homepage_slides_active_sort_order_idx
  on public.homepage_slides (sort_order) where is_active;

drop trigger if exists homepage_slides_set_updated_at on public.homepage_slides;
create trigger homepage_slides_set_updated_at
  before update on public.homepage_slides
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- main_feature_cards, from pages_mainfeaturecard
-- ---------------------------------------------------------------------------
-- Declared before small_glass_cards, which references it.

create table if not exists public.main_feature_cards (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- Was character varying(20) with CARD_TYPES, default 'custom'.
  card_type public.feature_card_type not null default 'custom',

  title text not null,
  subtitle text not null default '',
  description text not null default '',

  -- image was a Django ImageField disk path, image_url held an external link.
  -- MainFeatureCard.get_image() preferred the upload and fell back to the URL.
  image_path text,
  image_url text not null default '',

  button_text text not null default '',
  button_link text not null default '',

  -- Presentation columns. All were character varying in the old table with a
  -- Python default and blank=True. Kept as text because there is no
  -- authoritative value set, see the enum section above. The colours are raw
  -- hex strings, the sizes and widths are Tailwind class names.
  button_color text not null default '#0d9488',
  title_color text not null default '#ffffff',
  subtitle_color text not null default '#5eead4',
  description_color text not null default '#e5e7eb',

  title_alignment public.text_alignment not null default 'left',
  subtitle_alignment public.text_alignment not null default 'left',
  description_alignment public.text_alignment not null default 'left',

  mobile_card_height text not null default 'min-h-[550px]',
  mobile_card_width text not null default 'w-full',
  max_width text not null default 'max-w-7xl',

  -- Was the quoted column "order".
  sort_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  -- Addition. pages_mainfeaturecard had created_at but no updated_at, so there
  -- was no way to tell when an editor last changed a card. The trigger below
  -- maintains it from now on. Import should set it equal to created_at.
  updated_at timestamptz not null default now(),

  constraint main_feature_cards_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.main_feature_cards is
  'Large homepage feature cards. From pages_mainfeaturecard. Parent of small_glass_cards.';
comment on column public.main_feature_cards.legacy_id is
  'TEMPORARY. Old pages_mainfeaturecard.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.main_feature_cards.sort_order is
  'Was the reserved-word column "order" in pages_mainfeaturecard.';
comment on column public.main_feature_cards.image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration. MainFeatureCard.get_image() preferred this over image_url.';
comment on column public.main_feature_cards.updated_at is
  'Not in pages_mainfeaturecard. Added for the timestamp convention. Import should copy created_at into it.';
comment on column public.main_feature_cards.mobile_card_height is
  'Tailwind class name, mobile only. Desktop sizing is hardcoded in the frontend.';

create unique index if not exists main_feature_cards_legacy_id_key
  on public.main_feature_cards (legacy_id);
-- Addition. pages_mainfeaturecard had no index beyond its primary key.
-- Meta.ordering was ['order'] and the homepage reads active cards only.
create index if not exists main_feature_cards_active_sort_order_idx
  on public.main_feature_cards (sort_order) where is_active;

drop trigger if exists main_feature_cards_set_updated_at on public.main_feature_cards;
create trigger main_feature_cards_set_updated_at
  before update on public.main_feature_cards
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- small_glass_cards, from pages_smallglasscard
-- ---------------------------------------------------------------------------

create table if not exists public.small_glass_cards (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- ON DELETE CASCADE, matching SmallGlassCard.main_card, which declared
  -- on_delete=models.CASCADE. A small card is a tile inside a feature card and
  -- has no placement of its own once the parent is gone.
  --
  -- The column stays nullable, as pages_smallglasscard.main_card_id was, since
  -- the Django field carried null=True and blank=True. That combination is
  -- unusual next to CASCADE and it is deliberate on the old model: an orphan
  -- small card is a draft an editor has not yet attached to a parent. CASCADE
  -- never fires for those rows, so nothing is lost by keeping both.
  --
  -- Not SET NULL. That would quietly turn every tile of a deleted card into a
  -- draft, and the editor would find a pile of unattached cards with no way to
  -- tell which parent they came from.
  main_card_id uuid references public.main_feature_cards (id) on delete cascade,

  title text not null,
  description text not null default '',

  -- icon holds an emoji, icon_image was a Django ImageField disk path, and
  -- icon_image_url held an external link. All three kept, the path renamed.
  -- SmallGlassCard.get_icon() preferred the upload, then the URL, then the
  -- emoji, so all three can be populated at once and the order matters.
  icon text not null default '',
  icon_image_path text,
  icon_image_url text not null default '',

  button_text text not null default 'Learn More',
  button_link text not null default '#',

  title_alignment public.text_alignment not null default 'center',
  description_alignment public.text_alignment not null default 'center',
  title_color text not null default '#ffffff',
  description_color text not null default '#e5e7eb',
  -- Tailwind class names, not enums. See the enum section above.
  title_size text not null default 'text-base',
  description_size text not null default 'text-xs',

  -- Was the quoted column "order".
  sort_order integer not null default 0,
  is_active boolean not null default true,

  -- Addition. pages_smallglasscard had neither column.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint small_glass_cards_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.small_glass_cards is
  'Small tiles inside a main feature card. From pages_smallglasscard. A row with a null main_card_id is an unattached draft.';
comment on column public.small_glass_cards.legacy_id is
  'TEMPORARY. Old pages_smallglasscard.id. Drop after import.';
comment on column public.small_glass_cards.main_card_id is
  'Nullable, as in pages_smallglasscard. Null means an unattached draft, not a broken link.';
comment on column public.small_glass_cards.sort_order is
  'Was the reserved-word column "order" in pages_smallglasscard.';
comment on column public.small_glass_cards.icon_image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration. SmallGlassCard.get_icon() preferred this over icon_image_url, then over icon.';

create unique index if not exists small_glass_cards_legacy_id_key
  on public.small_glass_cards (legacy_id);
-- Old: pages_smallglasscard_main_card_id_02a9dd3c ON (main_card_id), widened
-- with sort_order because Meta.ordering was ['order'] and the homepage reads
-- one parent's tiles in order. The old bare index is a strict prefix of this.
create index if not exists small_glass_cards_main_card_id_sort_order_idx
  on public.small_glass_cards (main_card_id, sort_order);

drop trigger if exists small_glass_cards_set_updated_at on public.small_glass_cards;
create trigger small_glass_cards_set_updated_at
  before update on public.small_glass_cards
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- video_sections, from pages_videosection
-- ---------------------------------------------------------------------------

create table if not exists public.video_sections (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  title text not null,
  description text not null default '',
  -- Free text in the old schema, used for client side filtering. Not a foreign
  -- key to anything and not an enum, since editors typed it by hand.
  category text not null default '',

  -- Both were character varying with a choices list. See the enum notes above.
  card_type public.video_card_type not null default 'wide',
  media_type public.video_media_type not null default 'video',

  -- video_file and image_file were Django FileField and ImageField disk paths,
  -- thumbnail was an ImageField path. All three renamed to *_path. The sibling
  -- *_url columns held external links and are kept, because
  -- VideoSection.get_video_url() preferred the upload and fell back to the URL.
  video_file_path text,
  video_url text not null default '',
  image_file_path text,
  image_url text not null default '',
  thumbnail_path text,

  -- Nullable, unlike every other enum column in this file. The old column was
  -- character varying(20) NOT NULL with blank=True, which means a video section
  -- with no social link stored '' there. An enum cannot hold '', so the empty
  -- case becomes NULL. Import must coalesce '' to NULL on this column only.
  social_platform public.social_platform,
  social_link text not null default '',
  social_button_text text not null default 'View on Social',

  -- Was the quoted column "order".
  sort_order integer not null default 0,
  is_active boolean not null default true,

  -- Both present on pages_videosection.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint video_sections_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.video_sections is
  'Homepage video and image cards. From pages_videosection.';
comment on column public.video_sections.legacy_id is
  'TEMPORARY. Old pages_videosection.id. Drop after import.';
comment on column public.video_sections.sort_order is
  'Was the reserved-word column "order" in pages_videosection.';
comment on column public.video_sections.social_platform is
  'Null means no social link. The old column stored the empty string for that case, since it was a NOT NULL varchar with blank=True.';
comment on column public.video_sections.video_file_path is
  'Legacy Django FileField path. Resolved to Supabase Storage during media migration. VideoSection.get_video_url() preferred this over video_url.';
comment on column public.video_sections.image_file_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';
comment on column public.video_sections.thumbnail_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';

create unique index if not exists video_sections_legacy_id_key
  on public.video_sections (legacy_id);
-- Addition. pages_videosection had no index beyond its primary key.
-- Meta.ordering was ['order'] and the homepage reads active rows only.
create index if not exists video_sections_active_sort_order_idx
  on public.video_sections (sort_order) where is_active;

drop trigger if exists video_sections_set_updated_at on public.video_sections;
create trigger video_sections_set_updated_at
  before update on public.video_sections
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- testimonials, from pages_testimonial
-- ---------------------------------------------------------------------------

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  author_name text not null,
  author_position text not null default '',
  -- author_image was a Django ImageField disk path, renamed. There is no
  -- sibling *_url column on this table, unlike the card tables above.
  author_image_path text,

  content text not null,
  rating integer not null default 5,

  is_featured boolean not null default false,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  -- Addition. pages_testimonial had created_at but no updated_at. Import should
  -- set it equal to created_at.
  updated_at timestamptz not null default now(),

  -- Addition, not carried from the old table, which had no check at all. The
  -- old system enforced nothing here, in Python or anywhere else: the Django
  -- field was a bare IntegerField with default=5 and no validators, so a
  -- typo in the admin could store 50. The application renders this as stars out
  -- of five, and tour_reviews in 0003 constrains its own rating the same way.
  -- Zero is allowed rather than one, because an unrated testimonial saved
  -- through the API would have stored 0 and rejecting those would fail the
  -- import. Check the dump for rows outside 0 to 5 before applying this file.
  constraint testimonials_rating_range check (rating between 0 and 5),

  -- No sort_order on this table. pages_testimonial had no "order" column and
  -- Meta.ordering was ['-created_at'].
  constraint testimonials_content_not_blank check (length(btrim(content)) > 0)
);

comment on table public.testimonials is
  'Customer testimonials. From pages_testimonial. Ordered newest first, there is no sort_order column.';
comment on column public.testimonials.legacy_id is
  'TEMPORARY. Old pages_testimonial.id. Drop after import.';
comment on column public.testimonials.rating is
  'Stars out of five. The old column was unconstrained, the range check here is an addition.';
comment on column public.testimonials.author_image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';
comment on column public.testimonials.updated_at is
  'Not in pages_testimonial. Added for the timestamp convention. Import should copy created_at into it.';

create unique index if not exists testimonials_legacy_id_key
  on public.testimonials (legacy_id);
-- Addition. pages_testimonial had no index beyond its primary key, so the
-- homepage sorted on an unindexed column. Meta.ordering was ['-created_at'] and
-- every public read filters on is_active.
create index if not exists testimonials_active_created_at_idx
  on public.testimonials (created_at desc) where is_active;
-- Addition. The homepage shows a featured subset, which was a second unindexed
-- filter on the same table.
create index if not exists testimonials_featured_created_at_idx
  on public.testimonials (created_at desc) where is_active and is_featured;

drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- team_members, from pages_teammember
-- ---------------------------------------------------------------------------

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  name text not null,
  -- Kept as position. Unlike "order" this is not a reserved word in Postgres,
  -- it is a non-reserved keyword that is legal as a column name unquoted. The
  -- old schema quoted it out of caution, which is not needed here.
  position text not null default '',
  bio text not null default '',

  -- image was a Django ImageField disk path, renamed. Note that the Django
  -- TeamMember model calls this field photo while the table column is image.
  -- The column name is what the dump carries, so image_path follows it.
  image_path text,

  email text not null default '',
  linkedin text not null default '',

  -- Was the quoted column "order".
  sort_order integer not null default 0,
  is_active boolean not null default true,

  -- Addition. pages_teammember had neither column.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint team_members_sort_order_non_negative check (sort_order >= 0)
);

-- Not carried forward: the twitter, facebook and instagram fields declared on
-- the Django TeamMember model. They exist on the model and not in the table, so
-- there is no data behind them. See the report for this file. Add them later if
-- the about page needs them, as three text columns.

comment on table public.team_members is 'Team profiles for the about page. From pages_teammember.';
comment on column public.team_members.legacy_id is
  'TEMPORARY. Old pages_teammember.id. Drop after import.';
comment on column public.team_members.sort_order is
  'Was the reserved-word column "order" in pages_teammember.';
comment on column public.team_members.image_path is
  'Legacy Django ImageField path, from the column pages_teammember.image. Resolved to Supabase Storage during media migration.';

create unique index if not exists team_members_legacy_id_key
  on public.team_members (legacy_id);
-- Addition. pages_teammember had no index beyond its primary key.
-- Meta.ordering was ['order'] and the about page reads active rows only.
create index if not exists team_members_active_sort_order_idx
  on public.team_members (sort_order) where is_active;

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- footer_settings, from pages_footersettings
-- ---------------------------------------------------------------------------
-- Footer copy. Read as one row, alongside the four footer child tables below.

create table if not exists public.footer_settings (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  company_name text not null default 'TechTour Ghana',
  tagline text not null default 'Your gateway to authentic Ghanaian experiences.',
  copyright_text text not null default 'All rights reserved.',

  newsletter_placeholder text not null default 'Enter your email address',
  newsletter_button text not null default 'Subscribe',
  newsletter_note text not null default 'By subscribing, you agree to our Privacy Policy',

  -- Addition. pages_footersettings had neither column.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No constraint forcing a single row, same reasoning as site_settings above and
-- shipping_settings in 0005. The old table had none, the dump may hold several,
-- and a guard added now would refuse the import. Decide after the row count is
-- known. No is_active column either, for the same reason as site_settings: the
-- Django FooterSettings model declares none, and a footer with its copy soft
-- deleted renders as a blank strip.

comment on table public.footer_settings is
  'Footer copy and newsletter prompts. From pages_footersettings. Read as a singleton, one row, no constraint enforcing that. See the note above the table.';
comment on column public.footer_settings.legacy_id is
  'TEMPORARY. Old pages_footersettings.id. Drop after import.';

create unique index if not exists footer_settings_legacy_id_key
  on public.footer_settings (legacy_id);
-- No other index. pages_footersettings had none beyond its primary key.

drop trigger if exists footer_settings_set_updated_at on public.footer_settings;
create trigger footer_settings_set_updated_at
  before update on public.footer_settings
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- footer_features, from pages_footerfeature
-- ---------------------------------------------------------------------------

create table if not exists public.footer_features (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- Icon name, not a path. The old column was character varying(50) NOT NULL
  -- and held an icon identifier or an emoji, never an upload, so it keeps its
  -- name rather than becoming icon_path.
  icon text not null default '',
  title text not null,
  description text not null default '',

  -- Was the quoted column "order".
  sort_order integer not null default 0,
  is_active boolean not null default true,

  -- Addition. pages_footerfeature had neither column.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint footer_features_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.footer_features is
  'Trust and feature strip above the footer. From pages_footerfeature.';
comment on column public.footer_features.legacy_id is
  'TEMPORARY. Old pages_footerfeature.id. Drop after import.';
comment on column public.footer_features.sort_order is
  'Was the reserved-word column "order" in pages_footerfeature.';

create unique index if not exists footer_features_legacy_id_key
  on public.footer_features (legacy_id);
-- Addition. pages_footerfeature had no index beyond its primary key.
-- Meta.ordering was ['order'] and the footer reads active rows only.
create index if not exists footer_features_active_sort_order_idx
  on public.footer_features (sort_order) where is_active;

drop trigger if exists footer_features_set_updated_at on public.footer_features;
create trigger footer_features_set_updated_at
  before update on public.footer_features
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- footer_quick_links, from pages_footerquicklink
-- ---------------------------------------------------------------------------
-- The old API served one endpoint per category. The category column is an enum
-- here so the footer reads the whole table once and groups in the application.

create table if not exists public.footer_quick_links (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- Was character varying(20) with CATEGORY_CHOICES. See the enum note above.
  category public.footer_link_category not null,
  label text not null,
  url text not null,

  -- Was the quoted column "order".
  sort_order integer not null default 0,
  is_active boolean not null default true,

  -- Addition. pages_footerquicklink had neither column.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint footer_quick_links_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.footer_quick_links is
  'Footer link columns. From pages_footerquicklink. One row per link, grouped by category.';
comment on column public.footer_quick_links.legacy_id is
  'TEMPORARY. Old pages_footerquicklink.id. Drop after import.';
comment on column public.footer_quick_links.category is
  'Which footer column the link appears in. The old API served one endpoint per value of this.';
comment on column public.footer_quick_links.sort_order is
  'Was the reserved-word column "order" in pages_footerquicklink.';

create unique index if not exists footer_quick_links_legacy_id_key
  on public.footer_quick_links (legacy_id);
-- Addition. pages_footerquicklink had no index beyond its primary key.
-- Meta.ordering was ['category', 'order'], which is exactly this index, and the
-- footer reads active rows only.
create index if not exists footer_quick_links_active_category_sort_order_idx
  on public.footer_quick_links (category, sort_order) where is_active;

drop trigger if exists footer_quick_links_set_updated_at on public.footer_quick_links;
create trigger footer_quick_links_set_updated_at
  before update on public.footer_quick_links
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- footer_contacts, from pages_footercontact
-- ---------------------------------------------------------------------------

create table if not exists public.footer_contacts (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- Icon name or emoji, not a path. Same as footer_features.icon.
  icon text not null default '',
  -- Free text. The old column was character varying(300) and held an address
  -- line, a phone number or an email depending on the row, with no type column
  -- to say which. Left as one text column, since splitting it would mean
  -- guessing per row.
  text text not null,

  -- Was the quoted column "order".
  sort_order integer not null default 0,
  is_active boolean not null default true,

  -- Addition. pages_footercontact had neither column.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint footer_contacts_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.footer_contacts is
  'Footer contact lines. From pages_footercontact. The text column holds an address, phone or email with nothing recording which.';
comment on column public.footer_contacts.legacy_id is
  'TEMPORARY. Old pages_footercontact.id. Drop after import.';
comment on column public.footer_contacts.sort_order is
  'Was the reserved-word column "order" in pages_footercontact.';

create unique index if not exists footer_contacts_legacy_id_key
  on public.footer_contacts (legacy_id);
-- Addition. pages_footercontact had no index beyond its primary key.
-- Meta.ordering was ['order'] and the footer reads active rows only.
create index if not exists footer_contacts_active_sort_order_idx
  on public.footer_contacts (sort_order) where is_active;

drop trigger if exists footer_contacts_set_updated_at on public.footer_contacts;
create trigger footer_contacts_set_updated_at
  before update on public.footer_contacts
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- social_links, from pages_sociallink
-- ---------------------------------------------------------------------------

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- Was character varying(20) with PLATFORM_CHOICES. Shares the type with
  -- video_sections.social_platform. See the enum note above for why that union
  -- was taken.
  platform public.social_platform not null,
  -- Icon name or emoji, not a path. Same as footer_features.icon.
  icon text not null default '',
  url text not null,
  -- Raw hex string, not an enum. blank=True on the Django field.
  color text not null default '',

  -- Was the quoted column "order".
  sort_order integer not null default 0,
  is_active boolean not null default true,

  -- Addition. pages_sociallink had neither column.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint social_links_sort_order_non_negative check (sort_order >= 0)
);

-- No unique constraint on platform. The old table had none and the old editor
-- allowed two rows for the same platform, for instance a main account and a
-- regional one. Adding one now would refuse the import if such a pair exists.

comment on table public.social_links is
  'Social account links in the footer. From pages_sociallink. Platform is not unique, the old editor allowed more than one row per platform.';
comment on column public.social_links.legacy_id is
  'TEMPORARY. Old pages_sociallink.id. Drop after import.';
comment on column public.social_links.sort_order is
  'Was the reserved-word column "order" in pages_sociallink.';

create unique index if not exists social_links_legacy_id_key
  on public.social_links (legacy_id);
-- Addition. pages_sociallink had no index beyond its primary key.
-- Meta.ordering was ['order'] and the footer reads active rows only.
create index if not exists social_links_active_sort_order_idx
  on public.social_links (sort_order) where is_active;

drop trigger if exists social_links_set_updated_at on public.social_links;
create trigger social_links_set_updated_at
  before update on public.social_links
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- legal_links, from pages_legallink
-- ---------------------------------------------------------------------------

create table if not exists public.legal_links (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  label text not null,
  url text not null,

  -- Was the quoted column "order".
  sort_order integer not null default 0,
  is_active boolean not null default true,

  -- Addition. pages_legallink had neither column.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint legal_links_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.legal_links is
  'Privacy, terms and similar links in the footer bar. From pages_legallink.';
comment on column public.legal_links.legacy_id is
  'TEMPORARY. Old pages_legallink.id. Drop after import.';
comment on column public.legal_links.sort_order is
  'Was the reserved-word column "order" in pages_legallink.';

create unique index if not exists legal_links_legacy_id_key
  on public.legal_links (legacy_id);
-- Addition. pages_legallink had no index beyond its primary key.
-- Meta.ordering was ['order'] and the footer reads active rows only.
create index if not exists legal_links_active_sort_order_idx
  on public.legal_links (sort_order) where is_active;

drop trigger if exists legal_links_set_updated_at on public.legal_links;
create trigger legal_links_set_updated_at
  before update on public.legal_links
  for each row execute function public.set_updated_at();
