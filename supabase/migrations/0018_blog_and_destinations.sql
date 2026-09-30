-- 0018_blog_and_destinations.sql
-- Backs the Blog Updates and Destinations menus. Both menus were imported from
-- the old site's admin-managed navigation, but neither the old frontend nor
-- the old backend had pages or tables for them, so every link 404ed. These
-- tables give the new pages real, staff-editable content.

-- ---------------------------------------------------------------------------
-- blog_posts
-- ---------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  -- The four categories in the Blog Updates menu, so /blog/<category> works.
  category text not null
    check (category in ('culture', 'destinations', 'student-stories', 'travel-tips')),
  title text not null,
  excerpt text not null default '',
  -- Plain text, paragraphs separated by a blank line.
  content text not null default '',
  image_url text not null default '',
  author text not null default 'TechTour Ghana',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.blog_posts is
  'Blog Updates articles. Public reads published rows, admin reads and writes everything.';

create index if not exists blog_posts_category_published_idx
  on public.blog_posts (category, published_at desc) where is_published;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists blog_posts_select_public on public.blog_posts;
create policy blog_posts_select_public on public.blog_posts
  for select to anon, authenticated using (is_published or public.is_admin());

drop policy if exists blog_posts_insert_admin on public.blog_posts;
create policy blog_posts_insert_admin on public.blog_posts
  for insert to authenticated with check (public.is_admin());

drop policy if exists blog_posts_update_admin on public.blog_posts;
create policy blog_posts_update_admin on public.blog_posts
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists blog_posts_delete_admin on public.blog_posts;
create policy blog_posts_delete_admin on public.blog_posts
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- destinations
-- ---------------------------------------------------------------------------
create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  -- One highlight per line.
  highlights text not null default '',
  image_url text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.destinations is
  'Destination pages behind the Destinations menu. Public reads active rows, admin writes.';

drop trigger if exists destinations_set_updated_at on public.destinations;
create trigger destinations_set_updated_at
  before update on public.destinations
  for each row execute function public.set_updated_at();

alter table public.destinations enable row level security;

drop policy if exists destinations_select_public on public.destinations;
create policy destinations_select_public on public.destinations
  for select to anon, authenticated using (is_active or public.is_admin());

drop policy if exists destinations_insert_admin on public.destinations;
create policy destinations_insert_admin on public.destinations
  for insert to authenticated with check (public.is_admin());

drop policy if exists destinations_update_admin on public.destinations;
create policy destinations_update_admin on public.destinations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists destinations_delete_admin on public.destinations;
create policy destinations_delete_admin on public.destinations
  for delete to authenticated using (public.is_admin());

-- The five destinations the menu already links to. General, well known
-- attractions only, staff can refine the copy and add photos in the admin.
insert into public.destinations (slug, name, tagline, description, highlights, sort_order) values
  ('accra', 'Accra', 'Ghana''s vibrant capital on the Gulf of Guinea',
   'Accra blends colonial history, independence-era landmarks and a lively arts, food and nightlife scene. It is the usual first stop for visitors, with beaches, markets and museums within a short drive of each other.',
   E'Independence Arch and Black Star Square\nKwame Nkrumah Memorial Park and Mausoleum\nJamestown and Ussher Fort\nMakola Market\nLabadi Beach\nNational Museum and the W.E.B. Du Bois Centre', 1),
  ('cape-coast', 'Cape Coast', 'Castles, rainforest and the Central Region coast',
   'Cape Coast is the heart of Ghana''s heritage tourism. Its castle and the nearby Elmina Castle tell the story of the Atlantic slave trade, and Kakum National Park offers a rainforest canopy walk within an hour.',
   E'Cape Coast Castle\nElmina Castle and fishing harbour\nKakum National Park canopy walkway\nAssin Manso Ancestral Slave River Site\nPalm-fringed Central Region beaches', 2),
  ('kumasi', 'Kumasi', 'The Ashanti capital and home of kente',
   'Kumasi, the seat of the Ashanti Kingdom, is known for its royal heritage and craft villages. It is the best base for seeing kente weaving, adinkra printing and one of West Africa''s largest open-air markets.',
   E'Manhyia Palace Museum\nKejetia Market\nKente weaving at Bonwire\nAdinkra cloth at Ntonso\nLake Bosomtwe\nPrempeh II Jubilee Museum', 3),
  ('northern', 'Northern Region', 'Savannah wildlife and Sahelian architecture',
   'Ghana''s north is drier, wider and quieter than the coast. Tamale is the gateway to Mole National Park, where visitors can walk among elephants, and to some of the country''s oldest mud-and-timber mosques.',
   E'Mole National Park safaris\nLarabanga Mosque\nMognori Eco-Village\nTamale''s markets and craft traditions\nDamongo and the savannah landscape', 4),
  ('volta', 'Volta Region', 'Waterfalls, mountains and Lake Volta',
   'The Volta Region combines Ghana''s highest peaks with waterfalls, wildlife sanctuaries and the shores of Lake Volta. It is a strong choice for hiking, birdwatching and cultural villages.',
   E'Wli Waterfalls\nMount Afadja\nTafi Atome Monkey Sanctuary\nLake Volta cruises\nKeta Lagoon and beaches\nAmedzofe hill village', 5)
on conflict (slug) do nothing;
