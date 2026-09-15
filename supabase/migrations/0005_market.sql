-- 0005_market.sql
-- Market and artisan domains, from pages_marketcategory, pages_marketproduct,
-- pages_productgallery, pages_order, pages_shippingsettings, pages_artisan and
-- pages_artisanproduct.
--
-- Same rules as 0003. Anything the old system enforced in Python becomes a
-- CHECK constraint here. Django ImageField columns held disk paths, so they are
-- renamed to *_path to keep them apart from the sibling *_url columns that held
-- external links. The reserved-word column "order" becomes sort_order.
--
-- pages_order is a financial record and is treated the way tours_booking was
-- treated in 0003: RESTRICT on both of its foreign keys, so deleting a user or
-- a product can never destroy an order.
--
-- No RLS policies in this file. That is task 1.6.


-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
-- Same idempotent DO block form as 0001, since Postgres has no
-- CREATE TYPE IF NOT EXISTS.

-- order_status. The old column was pages_order.order_status character
-- varying(20). Values from Order.ORDER_STATUS_CHOICES in pages/models.py:
--   pending, processing, shipped, delivered, cancelled, refunded
do $$ begin
  create type public.order_status as enum
    ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
exception when duplicate_object then null;
end $$;

-- No new enum for pages_order.payment_status. Order.PAYMENT_STATUS_CHOICES was
-- pending, paid, failed, refunded, which is the same lifecycle as
-- public.payment_status from 0001 under different spellings, plus one value
-- that belongs on the other column. Import maps:
--   pending  -> payment_status 'pending'
--   paid     -> payment_status 'success'
--   failed   -> payment_status 'failed'
--   refunded -> payment_status 'success' AND order_status 'refunded'
-- The last one is the point. A refund is not a payment state, it is what
-- happened after a successful payment, and design.md B6 requires that a
-- terminal payment state never moves again. order_status carries the refund.
-- Check the dump for rows where payment_status was 'refunded' but order_status
-- was not, they need the mapping above applied to both columns.


-- ---------------------------------------------------------------------------
-- market_categories, from pages_marketcategory
-- ---------------------------------------------------------------------------

create table if not exists public.market_categories (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  name text not null,
  slug text not null,

  -- description, icon and image_url were nullable in the old table because it
  -- was created outside the Django migration chain, while the Django field
  -- declared blank=True, which means '' and not NULL. Normalised to NOT NULL
  -- DEFAULT '' so the application never has to handle both empties. Import must
  -- coalesce NULL to ''.
  description text not null default '',
  icon text not null default '',

  -- Legacy Django ImageField path, renamed from image. Same reason as
  -- tour_categories.image_path in 0003.
  image_path text,
  image_url text not null default '',

  -- Was the quoted column "order". Renamed for the same reason as
  -- tour_categories.sort_order.
  sort_order integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint market_categories_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.market_categories is 'Market product categories. From pages_marketcategory.';
comment on column public.market_categories.legacy_id is
  'TEMPORARY. Old pages_marketcategory.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.market_categories.sort_order is
  'Was the reserved-word column "order" in pages_marketcategory.';
comment on column public.market_categories.image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';

create unique index if not exists market_categories_legacy_id_key
  on public.market_categories (legacy_id);
-- Old: UNIQUE (slug), pages_marketcategory_slug_key. Carried.
create unique index if not exists market_categories_slug_key
  on public.market_categories (slug);
-- Old: idx_pages_marketcategory_order ON ("order") and
-- idx_pages_marketcategory_active ON (is_active), merged into one partial
-- index. Meta.ordering was ['order'] and every public listing filters on
-- is_active, so the two old indexes were only ever useful together. Same shape
-- as tour_categories_active_sort_order_idx in 0003.
create index if not exists market_categories_active_sort_order_idx
  on public.market_categories (sort_order) where is_active;
-- Not carried: idx_pages_marketcategory_slug ON (slug). It duplicates the
-- unique index above exactly.

drop trigger if exists market_categories_set_updated_at on public.market_categories;
create trigger market_categories_set_updated_at
  before update on public.market_categories
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- artisans, from pages_artisan
-- ---------------------------------------------------------------------------
-- Declared before market_products, which references it.

create table if not exists public.artisans (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  name text not null,
  slug text not null,
  title text not null default '',
  bio text not null default '',
  location text not null default '',

  -- profile_image and cover_image were Django ImageField disk paths, renamed to
  -- *_path. The *_url columns beside them held external links and are kept,
  -- because the old templates preferred the upload and fell back to the URL.
  profile_image_path text,
  profile_image_url text not null default '',
  cover_image_path text,
  cover_image_url text not null default '',

  craft_type text not null default '',
  -- Comma-separated in the old schema. Left as text rather than promoted to an
  -- array, for the same reason as tours.gallery in 0003: the import would have
  -- to guess how existing rows are separated.
  specialties text not null default '',
  years_of_experience integer not null default 0,

  email text not null default '',
  phone text not null default '',
  website text not null default '',
  instagram text not null default '',
  facebook text not null default '',
  twitter text not null default '',

  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Both carried directly from the old table.
  -- Old: pages_artisan_years_of_experience_check.
  constraint artisans_years_of_experience_non_negative check (years_of_experience >= 0),
  -- Old: pages_artisan_order_check.
  constraint artisans_sort_order_non_negative check (sort_order >= 0)
);

comment on table public.artisans is 'Artisan profiles. From pages_artisan.';
comment on column public.artisans.legacy_id is
  'TEMPORARY. Old pages_artisan.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.artisans.sort_order is
  'Was the reserved-word column "order" in pages_artisan.';
comment on column public.artisans.profile_image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';
comment on column public.artisans.cover_image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';

create unique index if not exists artisans_legacy_id_key on public.artisans (legacy_id);
-- Old: UNIQUE (slug), pages_artisan_slug_key. Carried.
create unique index if not exists artisans_slug_key on public.artisans (slug);
-- Addition. pages_artisan had no index besides its key and its slug, so the
-- directory listing sorted on an unindexed column. Meta.ordering was
-- ['order', 'name'] and the listing filters on is_active.
create index if not exists artisans_active_sort_order_idx
  on public.artisans (sort_order, name) where is_active;
-- Not carried: pages_artisan_slug_1d0c5d1f_like, a Django *_like companion to
-- the unique slug. Slugs are looked up by equality, never by prefix. Same
-- reasoning as 0002 and 0003.

drop trigger if exists artisans_set_updated_at on public.artisans;
create trigger artisans_set_updated_at
  before update on public.artisans
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- market_products, from pages_marketproduct
-- ---------------------------------------------------------------------------

create table if not exists public.market_products (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  title text not null,
  slug text not null,
  description text not null default '',

  -- image was a Django ImageField disk path, image_url held an external link.
  -- Both kept, the path renamed. Same shape as tours.featured_image_path in 0003.
  image_path text,
  image_url text not null default '',
  -- Comma-separated URLs in the old schema, left as text. See artisans.specialties.
  gallery_images text not null default '',

  -- Money, per architecture.md section 5 and design.md B6. The old table had no
  -- currency column at all, so this is an addition carrying the documented
  -- default.
  price numeric(10,2) not null default 0,
  discount_price numeric(10,2),
  currency public.currency_code not null default 'GHS',

  sku text not null default '',
  stock_quantity integer not null default 0,
  is_in_stock boolean not null default true,

  -- ON DELETE SET NULL, matching both the old database constraint
  -- (fk_pages_marketproduct_category, one of the very few in the dump that
  -- declared one) and the Django on_delete=SET_NULL. The column is nullable, so
  -- an uncategorised product is a legitimate state.
  category_id uuid references public.market_categories (id) on delete set null,

  -- Was the column `artisan`, a foreign key declared with db_column='artisan'
  -- so it never got Django's _id suffix. Renamed to artisan_id so it reads like
  -- every other foreign key in this schema. SET NULL: the column is nullable,
  -- Django declared SET_NULL, and a product outlives the removal of an artisan
  -- record. Nothing financial is lost, orders hold their own unit_price.
  artisan_id uuid references public.artisans (id) on delete set null,

  -- Denormalised copies of artisan detail, kept because the old product page
  -- read them directly and rows exist where the artisan foreign key is null but
  -- these are filled in. artisan_image was a Django URLField, not an
  -- ImageField, so it holds a URL and is named accordingly.
  artisan_bio text not null default '',
  artisan_image_url text not null default '',

  -- All comma-separated or free text in the old schema. Left as text.
  colors text not null default '',
  sizes text not null default '',
  materials text not null default '',
  tags text not null default '',
  dimensions text not null default '',
  weight text not null default '',
  care_instructions text not null default '',
  origin text not null default '',

  -- numeric(3,2) in the old schema, kept as is. It is a different scale from
  -- tours.rating numeric(3,1) in 0003, but it still represents 0.00 to 5.00 and
  -- narrowing it would throw away precision that exists in the dump.
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,

  button_text text not null default 'Shop Now',
  button_link text not null default '',

  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The old table declared no CHECK constraints at all. Everything below was
  -- enforced in Python or not at all.
  constraint market_products_price_non_negative check (price >= 0),
  constraint market_products_discount_price_non_negative
    check (discount_price is null or discount_price >= 0),
  -- A discount above the list price was possible in the old system and was
  -- never intended. Refused here, same as tours in 0003.
  constraint market_products_discount_below_price
    check (discount_price is null or discount_price <= price),
  constraint market_products_stock_quantity_non_negative check (stock_quantity >= 0),
  constraint market_products_rating_range check (rating >= 0 and rating <= 5),
  constraint market_products_review_count_non_negative check (review_count >= 0),
  constraint market_products_sort_order_non_negative check (sort_order >= 0)
);

-- Deliberately NOT constrained: the relationship between is_in_stock and
-- stock_quantity. The old system let them disagree. is_in_stock was an
-- editor-facing switch and stock_quantity was a count, and staff used the switch
-- to hide a product that still had stock. Tying them together would change
-- behaviour rather than enforce it.

comment on table public.market_products is 'Market products. From pages_marketproduct.';
comment on column public.market_products.legacy_id is
  'TEMPORARY. Old pages_marketproduct.id, used to rebuild foreign keys during import. Drop after import.';
comment on column public.market_products.artisan_id is
  'Was the column artisan in pages_marketproduct, a foreign key with db_column set to artisan.';
comment on column public.market_products.artisan_image_url is
  'Was pages_marketproduct.artisan_image, a Django URLField. Renamed so it is not read as a disk path.';
comment on column public.market_products.image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';
comment on column public.market_products.sort_order is
  'Was the reserved-word column "order" in pages_marketproduct.';

create unique index if not exists market_products_legacy_id_key
  on public.market_products (legacy_id);
-- Old: UNIQUE (slug), pages_marketproduct_slug_key. Carried.
create unique index if not exists market_products_slug_key
  on public.market_products (slug);
-- Old: idx_pages_marketproduct_artisan_id ON (artisan). Carried.
create index if not exists market_products_artisan_id_idx
  on public.market_products (artisan_id);
-- Addition. The old table had a foreign key to pages_marketcategory with no
-- index behind it, so every category page scanned the product table.
create index if not exists market_products_category_id_idx
  on public.market_products (category_id);
-- Additions. Meta.ordering was ['order'] and the shop listing always filters on
-- is_active, so the main listing had no index support either.
create index if not exists market_products_active_sort_order_idx
  on public.market_products (sort_order) where is_active;
create index if not exists market_products_featured_idx
  on public.market_products (sort_order) where is_active and is_featured;
-- Not carried: pages_marketproduct_slug_bff8153e_like, the Django *_like
-- companion to the unique slug.

drop trigger if exists market_products_set_updated_at on public.market_products;
create trigger market_products_set_updated_at
  before update on public.market_products
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- product_gallery, from pages_productgallery
-- ---------------------------------------------------------------------------

create table if not exists public.product_gallery (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- CASCADE. This is one of the few foreign keys where the old database did
  -- declare a behaviour, fk_pages_productgallery_product ON DELETE CASCADE, and
  -- Django agreed with on_delete=CASCADE. A gallery row is a part of its
  -- product, not a record about it, so CASCADE is correct as well as inherited.
  product_id uuid not null references public.market_products (id) on delete cascade,

  -- Left as text, NOT an enum. The old column is character varying(20) DEFAULT
  -- 'image', but the ProductGallery Django model does not declare this field at
  -- all, let alone a choices list, so there is no authoritative value set to
  -- build an enum from. The only MEDIA_TYPE_CHOICES in pages/models.py belongs
  -- to VideoSection, an unrelated model, and borrowing it would be a guess.
  media_type text not null default 'image',

  -- image and video_file were Django-style disk paths, renamed to *_path. The
  -- *_url columns held external links.
  image_path text,
  image_url text not null default '',
  video_file_path text,
  video_url text not null default '',

  title text not null default '',
  alt_text text not null default '',

  is_primary boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint product_gallery_sort_order_non_negative check (sort_order >= 0)
);

-- Two columns from pages_productgallery are deliberately NOT carried. Both are
-- duplicates the table accumulated outside the Django migration chain:
--   is_cover      -> collapsed into is_primary. Both were boolean DEFAULT false
--                    meaning the same thing, and only is_primary exists on the
--                    Django model and is read by get_primary_image().
--                    Import: is_primary = (is_cover or is_primary).
--   display_order -> collapsed into sort_order, which is the old "order". Both
--                    were integer DEFAULT 0. Only "order" is on the Django
--                    model, and only "order" is indexed and ordered by.
--                    Import: take "order", falling back to display_order where
--                    "order" is 0 and display_order is not.
-- If the dump shows the discarded halves carrying values the kept halves do
-- not, stop and reconcile before importing rather than losing them quietly.

comment on table public.product_gallery is
  'Gallery media for market products. From pages_productgallery. The duplicate is_cover and display_order columns are collapsed into is_primary and sort_order.';
comment on column public.product_gallery.legacy_id is
  'TEMPORARY. Old pages_productgallery.id. Drop after import.';
comment on column public.product_gallery.media_type is
  'Free text, not an enum. pages_productgallery.media_type had no choices list on the Django model.';
comment on column public.product_gallery.image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';

create unique index if not exists product_gallery_legacy_id_key
  on public.product_gallery (legacy_id);
-- Old: idx_pages_productgallery_product_id ON (product_id), widened with
-- sort_order because Meta.ordering was ['order'] and every read is scoped to
-- one product and sorted. The old bare index is a strict prefix of this.
-- This also subsumes idx_pages_productgallery_order ON ("order"), which was a
-- bare sort key: nothing sorts the gallery across all products, so on its own
-- that index was never usable.
create index if not exists product_gallery_product_id_sort_order_idx
  on public.product_gallery (product_id, sort_order);
-- Not carried: idx_pages_productgallery_is_active ON (is_active). A bare
-- boolean index on a column that is true for nearly every row. Same reasoning
-- as the is_active index dropped from user_sessions in 0002.

-- No unique index enforcing one primary image per product. The old schema had
-- none and nothing stopped an editor ticking two, so the dump is likely to
-- contain products that would violate it. get_primary_image() took .first(),
-- which means such rows already resolve harmlessly. Add the constraint after
-- the import has been checked, not before it.

drop trigger if exists product_gallery_set_updated_at on public.product_gallery;
create trigger product_gallery_set_updated_at
  before update on public.product_gallery
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- artisan_products, from pages_artisanproduct
-- ---------------------------------------------------------------------------

create table if not exists public.artisan_products (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- NOT NULL with ON DELETE CASCADE. The old column artisan_id is NOT NULL, so
  -- SET NULL is not available without widening it. The Django model is no help
  -- here: it declares the `artisan` field twice, first as CASCADE and
  -- non-nullable, then again as SET_NULL and nullable, and the second
  -- definition silently wins in Python while the database kept the first.
  -- CASCADE matches the column that actually exists and matches the meaning: an
  -- artisan product is a listing under an artisan, not a record that outlives
  -- them. Nothing financial hangs off this table, orders reference
  -- market_products instead.
  artisan_id uuid not null references public.artisans (id) on delete cascade,

  title text not null,
  -- Not unique. pages_artisanproduct had a plain index on slug and no unique
  -- constraint, and the Django SlugField omits unique=True here, unlike every
  -- other slug in this migration. Carried as is rather than tightened, because
  -- two artisans may legitimately both list a "kente-stole".
  slug text not null,
  description text not null default '',

  price numeric(10,2) not null default 0,
  -- Addition, per architecture.md section 5. The old table had no currency column.
  currency public.currency_code not null default 'GHS',

  image_path text,
  image_url text not null default '',

  craft_type text not null default '',
  materials text not null default '',
  dimensions text not null default '',
  weight text not null default '',

  in_stock boolean not null default true,
  quantity integer not null default 0,

  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Old: pages_artisanproduct_quantity_check. Carried.
  constraint artisan_products_quantity_non_negative check (quantity >= 0),
  -- Old: pages_artisanproduct_order_check. Carried.
  constraint artisan_products_sort_order_non_negative check (sort_order >= 0),
  -- Not in the old schema. Enforced in Python or not at all.
  constraint artisan_products_price_non_negative check (price >= 0)
);

comment on table public.artisan_products is 'Products listed under an artisan. From pages_artisanproduct.';
comment on column public.artisan_products.legacy_id is
  'TEMPORARY. Old pages_artisanproduct.id. Drop after import.';
comment on column public.artisan_products.sort_order is
  'Was the reserved-word column "order" in pages_artisanproduct.';
comment on column public.artisan_products.image_path is
  'Legacy Django ImageField path. Resolved to Supabase Storage during media migration.';

create unique index if not exists artisan_products_legacy_id_key
  on public.artisan_products (legacy_id);
-- Old: pages_artisanproduct_artisan_id_c603e37c ON (artisan_id), widened with
-- sort_order and title because Meta.ordering was ['order', 'title'] and every
-- read is one artisan's product list. The old bare index is a strict prefix.
create index if not exists artisan_products_artisan_id_sort_order_idx
  on public.artisan_products (artisan_id, sort_order, title);
-- Old: pages_artisanproduct_slug_0bc083bb ON (slug). Carried. The slug is not
-- unique here, see the column comment, so this index does real work rather than
-- duplicating a constraint.
create index if not exists artisan_products_slug_idx on public.artisan_products (slug);
-- Not carried: pages_artisanproduct_slug_0bc083bb_like, the Django *_like
-- companion. Slugs are looked up by equality.

drop trigger if exists artisan_products_set_updated_at on public.artisan_products;
create trigger artisan_products_set_updated_at
  before update on public.artisan_products
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- orders, from pages_order
-- ---------------------------------------------------------------------------
-- A financial record. Read the bookings section of 0003 alongside this one, the
-- reasoning is the same and it is deliberately repeated rather than referenced.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- Was generated in Python as "ORD-" plus uuid4().hex[:12].upper(). Moved into
  -- the database so an order written from anywhere gets a number, and so the
  -- uniqueness the Django field declared is actually enforced. Built from
  -- gen_random_uuid() rather than pgcrypto's gen_random_bytes, same as
  -- bookings.booking_reference in 0003, so the default does not depend on which
  -- schema an extension happens to live in.
  order_number text not null
    default 'ORD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),

  -- RESTRICT, deliberately. An order is a financial record and it outlives the
  -- account that placed it, so deleting a user must never destroy one. A
  -- right-to-erasure request is satisfied by anonymising the profile row,
  -- scrubbing name, email, phone and avatar, and leaving the order in place.
  -- The old Django on_delete was CASCADE, enforced in Python, which means
  -- deleting a user deleted every order they had ever paid for. That is
  -- destructive for a financial record and is not carried. The old database
  -- declared no ON DELETE here at all, so this is a first specification.
  -- Do not "fix" this back to CASCADE.
  user_id uuid not null references public.profiles (id) on delete restrict,

  -- RESTRICT for the same reason. Django's Python-side CASCADE meant deleting a
  -- product destroyed every order ever placed against it, including the record
  -- of what was charged and where it was shipped. Retire a product with
  -- is_active instead of deleting it.
  product_id uuid not null references public.market_products (id) on delete restrict,

  -- DEVIATION from the old CHECK. pages_order_quantity_check was
  -- (quantity >= 0), which permits an order for zero items with a non-zero
  -- total. The Django field was a PositiveIntegerField defaulting to 1 and
  -- nothing created a zero-quantity order deliberately. Tightened to > 0. If
  -- the dump contains quantity = 0 rows they are data to investigate, not a
  -- reason to loosen this back.
  quantity integer not null default 1,

  -- Money. unit_price and total_price were NOT NULL with no default in the old
  -- table and are kept that way, since an order with no price is meaningless.
  -- currency is an addition, the old table had none.
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  currency public.currency_code not null default 'GHS',

  shipping_address text not null default '',
  shipping_city text not null default '',
  shipping_region text not null default '',
  shipping_country text not null default 'Ghana',
  shipping_postal_code text not null default '',
  phone_number text not null default '',

  order_status public.order_status not null default 'pending',
  -- Reuses public.payment_status from 0001. See the enum section at the top of
  -- this file for how the old pending/paid/failed/refunded values map onto it.
  payment_status public.payment_status not null default 'pending',

  tracking_number text not null default '',
  notes text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_quantity_positive check (quantity > 0),
  constraint orders_unit_price_non_negative check (unit_price >= 0),
  constraint orders_total_price_non_negative check (total_price >= 0)
);

-- The order number format the old Order.save() produced, and the line-total
-- identity the old checkout computed in Python. Both are declared NOT VALID so
-- existing rows are not checked at load time and odd legacy data cannot block
-- the import, while every new or updated row is still checked. NOT VALID is
-- only accepted on ALTER TABLE, hence the separate statements. Same pattern,
-- and the same follow-up obligation, as bookings_reference_format in 0003.
-- AFTER the import has landed, run:
--
--   alter table public.orders validate constraint orders_number_format;
--   alter table public.orders validate constraint orders_total_matches_line;
--
-- and investigate whatever they reject. That is how bad legacy data gets found
-- rather than crashed on or accepted forever.
do $$ begin
  alter table public.orders
    add constraint orders_number_format
    check (order_number ~ '^ORD-[0-9A-F]{12}$') not valid;
exception when duplicate_object then null;
end $$;

-- pages_order holds exactly one product line, so the total is fully determined
-- by the other two columns. design.md B6 requires the server to recompute every
-- total from the database, and this is the database refusing to hold a total
-- that does not follow from its own columns. Shipping is not part of it:
-- shipping cost lives on shipping_settings and was never written into
-- pages_order.
do $$ begin
  alter table public.orders
    add constraint orders_total_matches_line
    check (total_price = unit_price * quantity) not valid;
exception when duplicate_object then null;
end $$;

comment on table public.orders is
  'Market orders. From pages_order. A financial record, see the ON DELETE comments on user_id and product_id.';
comment on column public.orders.legacy_id is
  'TEMPORARY. Old pages_order.id. Drop after import.';
comment on column public.orders.order_number is
  'ORD- plus twelve uppercase hex characters. Was generated in Order.save(), now a column default.';
comment on column public.orders.payment_status is
  'public.payment_status from 0001. The old paid maps to success, the old refunded maps to success plus order_status refunded.';

create unique index if not exists orders_legacy_id_key on public.orders (legacy_id);
-- Old: UNIQUE (order_number), pages_order_order_number_key. Carried.
create unique index if not exists orders_order_number_key on public.orders (order_number);
-- Old: pages_order_user_id_a8a10f35 ON (user_id), widened with created_at
-- because Meta.ordering was ['-created_at'] and the account page reads one user
-- newest first. The old bare index is a strict prefix of this.
create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);
-- Old: pages_order_product_id_3f8bef30 ON (product_id). Carried as is.
create index if not exists orders_product_id_idx on public.orders (product_id);
-- Additions. The admin order queues filtered on both status columns with no
-- index behind them, exactly as the booking queues did in 0003.
create index if not exists orders_order_status_idx
  on public.orders (order_status, created_at desc);
create index if not exists orders_payment_status_idx
  on public.orders (payment_status, created_at desc);
-- Not carried: pages_order_order_number_f56f664d_like, the Django *_like
-- companion to the unique order_number. An order number is looked up whole,
-- from a confirmation email or an admin search box, never by prefix.

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- shipping_settings, from pages_shippingsettings
-- ---------------------------------------------------------------------------
-- Global storefront settings. One row in practice.

create table if not exists public.shipping_settings (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  free_shipping_threshold numeric(10,2) not null default 200.00,
  shipping_cost numeric(10,2) not null default 0.00,
  -- Addition. These are money columns and architecture.md section 5 requires an
  -- explicit currency. The old table had none, and a threshold with no currency
  -- is ambiguous the moment a second one exists.
  currency public.currency_code not null default 'GHS',

  shipping_from text not null default 'Accra, Ghana',
  estimated_days text not null default '3-7 business days',
  secure_payment_text text not null default 'Secure payment with SSL encryption',
  money_back_guarantee text not null default '30-day money-back guarantee',
  return_policy text not null default '30-day return policy',

  -- Present on the Django ShippingSettings model but missing from the old
  -- table, which was created outside the migration chain. Added so the
  -- soft-delete convention holds and so a draft settings row can exist.
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint shipping_settings_free_shipping_threshold_non_negative
    check (free_shipping_threshold >= 0),
  constraint shipping_settings_shipping_cost_non_negative check (shipping_cost >= 0)
);

-- No constraint forcing a single row. The old table had none and the dump may
-- hold several, since the Django admin never stopped anyone adding one. The
-- application reads the active row. Decide on a singleton guard after the
-- import shows how many rows there actually are.

comment on table public.shipping_settings is
  'Global storefront shipping and trust copy. From pages_shippingsettings. Read as a singleton.';
comment on column public.shipping_settings.legacy_id is
  'TEMPORARY. Old pages_shippingsettings.id. Drop after import.';
comment on column public.shipping_settings.is_active is
  'Not in pages_shippingsettings. Present on the Django model and added here for the soft-delete convention.';

create unique index if not exists shipping_settings_legacy_id_key
  on public.shipping_settings (legacy_id);
-- No other index. pages_shippingsettings had none beyond its primary key, and a
-- table read one row at a time does not need one.

drop trigger if exists shipping_settings_set_updated_at on public.shipping_settings;
create trigger shipping_settings_set_updated_at
  before update on public.shipping_settings
  for each row execute function public.set_updated_at();
