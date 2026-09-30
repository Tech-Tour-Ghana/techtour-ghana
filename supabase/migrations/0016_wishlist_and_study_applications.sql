-- 0016_wishlist_and_study_applications.sql
-- Backs the Wishlist and Study pages of the customer account area.
--
-- The old frontend had both pages in its sidebar, but the Django endpoints
-- behind them imported pages.models.Wishlist and StudyApplication, which never
-- existed, so they could not have returned data. There is nothing to migrate.
-- These tables give the ported pages a real backing store.

-- ---------------------------------------------------------------------------
-- wishlist_items
-- ---------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.market_products (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint wishlist_items_user_product_key unique (user_id, product_id)
);

comment on table public.wishlist_items is
  'Products a signed in user saved from the market. Owner-only, CASCADE on both keys because a wishlist entry carries no record worth outliving either side.';

create index if not exists wishlist_items_user_id_idx
  on public.wishlist_items (user_id, created_at desc);

alter table public.wishlist_items enable row level security;

drop policy if exists wishlist_items_select_own on public.wishlist_items;
create policy wishlist_items_select_own on public.wishlist_items
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists wishlist_items_insert_own on public.wishlist_items;
create policy wishlist_items_insert_own on public.wishlist_items
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists wishlist_items_delete_own on public.wishlist_items;
create policy wishlist_items_delete_own on public.wishlist_items
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- study_applications
-- ---------------------------------------------------------------------------
-- Shape follows what the old Study page rendered: program, university,
-- location, start date, duration, status. Denormalised on purpose, an
-- application is a record of what was applied for, it must not change when a
-- study_destinations row is edited later.
create table if not exists public.study_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  program_name text not null,
  university text not null default '',
  location text not null default '',
  start_date date,
  duration text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.study_applications is
  'A signed in user''s study abroad applications. Read by the owner, written by staff, since no application form exists on the site yet.';

create index if not exists study_applications_user_id_idx
  on public.study_applications (user_id, created_at desc);

drop trigger if exists study_applications_set_updated_at on public.study_applications;
create trigger study_applications_set_updated_at
  before update on public.study_applications
  for each row execute function public.set_updated_at();

alter table public.study_applications enable row level security;

drop policy if exists study_applications_select_own on public.study_applications;
create policy study_applications_select_own on public.study_applications
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists study_applications_insert_admin on public.study_applications;
create policy study_applications_insert_admin on public.study_applications
  for insert to authenticated with check (public.is_admin());

drop policy if exists study_applications_update_admin on public.study_applications;
create policy study_applications_update_admin on public.study_applications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists study_applications_delete_admin on public.study_applications;
create policy study_applications_delete_admin on public.study_applications
  for delete to authenticated using (public.is_admin());
