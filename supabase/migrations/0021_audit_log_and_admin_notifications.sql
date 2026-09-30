-- 0021_audit_log_and_admin_notifications.sql
-- Two gaps from the old Django admin.
--
-- 1. Audit log. The old admin recorded staff activity (AdminActivityLog). Here
--    it is done in the database, by triggers on the tables staff edit, so it
--    cannot be skipped by forgetting to log in some page. Only changes made by
--    a signed-in admin are recorded. It stores who, what, which row and which
--    columns changed, never the values, because several of these tables hold
--    personal data.
--
-- 2. Sending notifications. 0017 lets customers read and mark their own
--    notifications, this lets an admin create them for any user and read what
--    was sent.

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  table_name text not null,
  record_id text not null default '',
  -- A short human label (title, name, label, order number or slug) so the log
  -- reads without a lookup. Never an email or a message body.
  summary text not null default '',
  changed_columns text[] not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.audit_log is
  'Admin activity, written by the audit_admin_change trigger. Admin read only, nothing writes it from the client. Records which columns changed, never their values.';

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_table_idx on public.audit_log (table_name, created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists audit_log_select_admin on public.audit_log;
create policy audit_log_select_admin on public.audit_log
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Trigger function
-- ---------------------------------------------------------------------------
create or replace function public.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_row jsonb;
  old_row jsonb;
  changed text[] := '{}';
  key text;
begin
  -- Customers editing their own rows and system writes (no session) are not
  -- staff activity.
  if auth.uid() is null or not public.is_admin() then
    return null;
  end if;

  if tg_op = 'DELETE' then
    new_row := to_jsonb(old);
  else
    new_row := to_jsonb(new);
  end if;

  if tg_op = 'UPDATE' then
    old_row := to_jsonb(old);
    for key in select jsonb_object_keys(new_row) loop
      if key <> 'updated_at' and (new_row -> key) is distinct from (old_row -> key) then
        changed := changed || key;
      end if;
    end loop;
    -- An update that changed nothing meaningful is not worth a row.
    if cardinality(changed) = 0 then
      return null;
    end if;
  end if;

  insert into public.audit_log (actor_id, action, table_name, record_id, summary, changed_columns)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(new_row ->> 'id', ''),
    left(coalesce(new_row ->> 'title', new_row ->> 'name', new_row ->> 'label', new_row ->> 'order_number', new_row ->> 'slug', ''), 200),
    changed
  );
  return null;
end;
$$;

revoke all on function public.audit_admin_change() from public, anon, authenticated;

-- Attach to the tables staff manage. Skips any that do not exist.
do $$
declare t text;
begin
  foreach t in array array[
    'market_products', 'market_categories', 'product_gallery', 'artisans', 'artisan_products',
    'team_members', 'job_categories', 'job_openings', 'testimonials', 'study_destinations',
    'scholarships', 'tech_innovations', 'tech_events', 'tech_resources', 'homepage_slides',
    'homepage_sections', 'main_feature_cards', 'small_glass_cards', 'video_sections',
    'navbar_menus', 'navbar_dropdowns', 'footer_settings', 'footer_features', 'footer_quick_links',
    'footer_contacts', 'social_links', 'legal_links', 'site_settings', 'shipping_settings',
    'blog_posts', 'destinations', 'tours', 'tour_categories', 'tour_schedules', 'tour_reviews',
    'bookings', 'orders', 'contact_messages', 'newsletter_subscribers', 'suggestions',
    'issue_reports', 'profiles', 'study_applications', 'media_folders', 'media_assets',
    'vacation_rentals', 'vacation_bookings'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists audit_admin_change on public.%I', t);
      execute format(
        'create trigger audit_admin_change after insert or update or delete on public.%I for each row execute function public.audit_admin_change()',
        t
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Admins send notifications
-- ---------------------------------------------------------------------------
drop policy if exists notifications_insert_admin on public.notifications;
create policy notifications_insert_admin on public.notifications
  for insert to authenticated with check (public.is_admin());

drop policy if exists notifications_select_admin on public.notifications;
create policy notifications_select_admin on public.notifications
  for select to authenticated using (public.is_admin());
