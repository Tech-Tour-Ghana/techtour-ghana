-- 0024_content_studio.sql
-- Media Library metadata, blog SEO, redirects and site SEO settings.
--
-- Also closes a hole found while inspecting the media tables: media_assets,
-- media_folders and the media storage bucket allowed ANY authenticated user to
-- write (policy "true"). Only admins should upload, edit or delete media.

-- ---------------------------------------------------------------------------
-- Storage bucket: drop SVG (scriptable when opened directly), allow AVIF
-- ---------------------------------------------------------------------------
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'video/mp4', 'application/pdf']
where id = 'media';

-- ---------------------------------------------------------------------------
-- Media RLS: public read stays, writes become admin only
-- ---------------------------------------------------------------------------
drop policy if exists auth_manage_assets on public.media_assets;
drop policy if exists auth_manage_folders on public.media_folders;

create policy media_assets_write_admin on public.media_assets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy media_folders_write_admin on public.media_folders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists auth_upload_media_objects on storage.objects;
drop policy if exists auth_delete_media_objects on storage.objects;

create policy media_objects_insert_admin on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy media_objects_update_admin on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
create policy media_objects_delete_admin on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Media metadata
-- ---------------------------------------------------------------------------
alter table public.media_assets
  add column if not exists width integer check (width is null or width > 0),
  add column if not exists height integer check (height is null or height > 0),
  add column if not exists alt_text text not null default '',
  add column if not exists title text not null default '',
  add column if not exists caption text not null default '',
  add column if not exists description text not null default '',
  add column if not exists is_decorative boolean not null default false,
  add column if not exists uploaded_by uuid references auth.users (id) on delete set null;

create index if not exists media_assets_created_at_idx on public.media_assets (created_at desc);
create index if not exists media_assets_folder_idx on public.media_assets (folder_id, created_at desc);

-- Uploads from the editor need somewhere to land.
insert into public.media_folders (name, slug, description)
select 'General', 'general', 'Default folder for uploads'
where not exists (select 1 from public.media_folders where slug = 'general');

-- ---------------------------------------------------------------------------
-- Blog: featured image alt text
-- ---------------------------------------------------------------------------
alter table public.blog_posts
  add column if not exists image_alt text not null default '';

-- ---------------------------------------------------------------------------
-- Site-wide SEO settings live on the existing site_settings singleton
-- ---------------------------------------------------------------------------
alter table public.site_settings
  add column if not exists seo_site_name text not null default 'TechTour Ghana',
  add column if not exists seo_title_pattern text not null default '%s | TechTour Ghana',
  add column if not exists seo_default_description text not null default '',
  add column if not exists seo_default_image_url text not null default '',
  add column if not exists seo_org_name text not null default 'TechTour Ghana',
  add column if not exists seo_org_logo_url text not null default '',
  add column if not exists seo_social_profiles text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- seo_metadata: one row per SEO-managed thing (blog post, destination, blog
-- category). entity_key is the row id, or the slug for categories.
-- ---------------------------------------------------------------------------
create table if not exists public.seo_metadata (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('blog_post', 'destination', 'blog_category')),
  entity_key text not null,
  seo_title text not null default '',
  meta_description text not null default '',
  focus_keyword text not null default '',
  canonical_url text not null default '',
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  og_title text not null default '',
  og_description text not null default '',
  og_image_url text not null default '',
  twitter_title text not null default '',
  twitter_description text not null default '',
  twitter_image_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_key)
);

comment on table public.seo_metadata is
  'Per-content SEO fields. Public can read rows for published/active content and blog categories, admin reads and writes all. The SEO score is never stored: it is computed from the current content.';

drop trigger if exists seo_metadata_set_updated_at on public.seo_metadata;
create trigger seo_metadata_set_updated_at before update on public.seo_metadata
  for each row execute function public.set_updated_at();

alter table public.seo_metadata enable row level security;

create policy seo_metadata_select_public on public.seo_metadata
  for select to anon, authenticated
  using (
    public.is_admin()
    or entity_type = 'blog_category'
    or (entity_type = 'blog_post' and exists (
      select 1 from public.blog_posts b where b.id::text = entity_key and b.is_published))
    or (entity_type = 'destination' and exists (
      select 1 from public.destinations d where d.id::text = entity_key and d.is_active))
  );
create policy seo_metadata_write_admin on public.seo_metadata
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Drop the SEO row with its content so nothing is orphaned.
create or replace function public.delete_seo_metadata()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.seo_metadata where entity_type = tg_argv[0] and entity_key = old.id::text;
  return old;
end $$;
revoke all on function public.delete_seo_metadata() from public, anon, authenticated;

drop trigger if exists blog_posts_delete_seo on public.blog_posts;
create trigger blog_posts_delete_seo after delete on public.blog_posts
  for each row execute function public.delete_seo_metadata('blog_post');
drop trigger if exists destinations_delete_seo on public.destinations;
create trigger destinations_delete_seo after delete on public.destinations
  for each row execute function public.delete_seo_metadata('destination');

-- ---------------------------------------------------------------------------
-- Redirects
-- ---------------------------------------------------------------------------
create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique check (source_path like '/%' and source_path !~ '\s' and source_path not like '/admin%'),
  destination text not null check (destination like '/%' or destination ~ '^https?://'),
  status_code integer not null default 301 check (status_code in (301, 302)),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_path <> destination)
);

comment on table public.redirects is
  'Path redirects applied in middleware. Public may read active rows (middleware uses the anon key), admin writes.';

drop trigger if exists redirects_set_updated_at on public.redirects;
create trigger redirects_set_updated_at before update on public.redirects
  for each row execute function public.set_updated_at();

alter table public.redirects enable row level security;
create policy redirects_select_active on public.redirects
  for select to anon, authenticated using (is_active or public.is_admin());
create policy redirects_write_admin on public.redirects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Audit trail for the new admin tables
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['seo_metadata', 'redirects'] loop
    execute format('drop trigger if exists audit_admin_change on public.%I', t);
    execute format(
      'create trigger audit_admin_change after insert or update or delete on public.%I for each row execute function public.audit_admin_change()',
      t
    );
  end loop;
end $$;
