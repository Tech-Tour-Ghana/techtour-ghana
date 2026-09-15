-- 0011_rls_public_content.sql
-- Row level security for the content the public website displays.
--
-- Depends on public.is_admin() from 0010.
--
-- Roles. Public reads target BOTH anon and authenticated. A signed in visitor
-- browsing tours is not anon, so a policy targeting anon alone would show the
-- catalogue to logged out users and hide it from customers. Every public read
-- policy below therefore says "to anon, authenticated".
--
-- Writes are admin only, through is_admin(). Delete is granted alongside
-- insert and update because staff genuinely do remove rows that were created
-- by mistake. Retiring live content is still done with is_active, and the
-- foreign keys added in 0003 and 0005 already refuse a delete that would
-- destroy a financial record.


-- ---------------------------------------------------------------------------
-- The standard pattern, applied by loop
-- ---------------------------------------------------------------------------
-- Twenty nine tables share exactly one rule: anyone reads the active rows,
-- admins write. Writing that out longhand would be 116 near identical policies
-- and the one that differed by accident would be invisible in the noise.
-- Stating the rule once and listing the tables it applies to is easier to
-- audit, not harder. Tables that need anything different are handled
-- explicitly below and are deliberately absent from this list.
do $$
declare
  t text;
  standard_tables text[] := array[
    'tour_categories', 'tours', 'market_categories', 'market_products',
    'artisans', 'artisan_products', 'shipping_settings',
    'study_destinations', 'scholarships', 'vacation_rentals',
    'tech_innovations', 'tech_events', 'tech_resources',
    'navbar_menus', 'homepage_sections', 'homepage_slides',
    'main_feature_cards', 'video_sections', 'testimonials', 'team_members',
    'footer_features', 'footer_quick_links', 'footer_contacts',
    'social_links', 'legal_links'
  ];
begin
  foreach t in array standard_tables loop
    execute format('drop policy if exists %I on public.%I', t || '_select_public', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (is_active)',
      t || '_select_public', t);

    execute format('drop policy if exists %I on public.%I', t || '_insert_admin', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
      t || '_insert_admin', t);

    execute format('drop policy if exists %I on public.%I', t || '_update_admin', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_update_admin', t);

    execute format('drop policy if exists %I on public.%I', t || '_delete_admin', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_admin())',
      t || '_delete_admin', t);
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- Child tables, where the parent must be checked too
-- ---------------------------------------------------------------------------
-- These four hang off a parent row. Checking only the child leaves the child
-- readable when the parent is hidden, which leaks both the content and the
-- fact that a hidden parent exists. Every one of these subqueries hits an
-- indexed foreign key, so the cost is a single index lookup per row.

-- tour_schedules. Departures of a retired tour must not be listed.
drop policy if exists tour_schedules_select_public on public.tour_schedules;
create policy tour_schedules_select_public on public.tour_schedules
  for select to anon, authenticated
  using (
    exists (select 1 from public.tours t where t.id = tour_id and t.is_active)
  );
comment on policy tour_schedules_select_public on public.tour_schedules is
  'Anyone reads departures, but only for an active tour. A schedule has no is_active of its own, is_cancelled is a display state and cancelled departures are still shown as cancelled.';

-- product_gallery. Gallery media of a withdrawn product must not be readable.
drop policy if exists product_gallery_select_public on public.product_gallery;
create policy product_gallery_select_public on public.product_gallery
  for select to anon, authenticated
  using (
    is_active
    and exists (select 1 from public.market_products p where p.id = product_id and p.is_active)
  );
comment on policy product_gallery_select_public on public.product_gallery is
  'Anyone reads gallery media that is itself active and belongs to an active product.';

-- navbar_dropdowns. A dropdown under a hidden menu must not appear.
drop policy if exists navbar_dropdowns_select_public on public.navbar_dropdowns;
create policy navbar_dropdowns_select_public on public.navbar_dropdowns
  for select to anon, authenticated
  using (
    is_active
    and exists (select 1 from public.navbar_menus m where m.id = parent_menu_id and m.is_active)
  );
comment on policy navbar_dropdowns_select_public on public.navbar_dropdowns is
  'Anyone reads active dropdown items whose parent menu is also active.';

-- small_glass_cards. main_card_id is nullable and a null means an unattached
-- draft, which must NOT be public. The old table allowed drafts to sit around
-- unlinked, so requiring a live parent is the correct reading.
drop policy if exists small_glass_cards_select_public on public.small_glass_cards;
create policy small_glass_cards_select_public on public.small_glass_cards
  for select to anon, authenticated
  using (
    is_active
    and main_card_id is not null
    and exists (select 1 from public.main_feature_cards c where c.id = main_card_id and c.is_active)
  );
comment on policy small_glass_cards_select_public on public.small_glass_cards is
  'Anyone reads active tiles attached to an active feature card. A null main_card_id is an unattached draft and stays private.';

do $$
declare t text;
begin
  foreach t in array array['tour_schedules','product_gallery','navbar_dropdowns','small_glass_cards'] loop
    execute format('drop policy if exists %I on public.%I', t || '_insert_admin', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', t || '_insert_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_admin', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_update_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_admin', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t || '_delete_admin', t);
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- The two settings singletons, which have no is_active column
-- ---------------------------------------------------------------------------
-- 0007 records that pages_sitesettings and pages_footersettings never had one.
-- They hold branding and page copy: a logo URL, a tagline, newsletter prompt
-- text. Every value in them is rendered on the public site by definition, so
-- there is nothing to gate and an is_active predicate would be inventing a
-- concept the table does not have. Readable unconditionally.

drop policy if exists site_settings_select_public on public.site_settings;
create policy site_settings_select_public on public.site_settings
  for select to anon, authenticated using (true);
comment on policy site_settings_select_public on public.site_settings is
  'Anyone reads site settings. No is_active column exists and every column is public branding copy.';

drop policy if exists footer_settings_select_public on public.footer_settings;
create policy footer_settings_select_public on public.footer_settings
  for select to anon, authenticated using (true);
comment on policy footer_settings_select_public on public.footer_settings is
  'Anyone reads footer settings. Same reasoning as site_settings.';

do $$
declare t text;
begin
  foreach t in array array['site_settings','footer_settings'] loop
    execute format('drop policy if exists %I on public.%I', t || '_insert_admin', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', t || '_insert_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_admin', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_update_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_admin', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t || '_delete_admin', t);
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- tour_reviews, which needs both a different predicate and column grants
-- ---------------------------------------------------------------------------
-- Two things make this table unlike the others.
--
-- First, it has no is_active column. Visibility is governed by status, and the
-- only publicly visible state is approved. Using is_active here would fail to
-- compile, and using "not is_flagged" would publish pending and rejected
-- reviews, which is unmoderated user content on a live site.
--
-- Second, RLS is row level, not column level. A public select policy exposes
-- every column of every matching row, and this table carries user_email, plus
-- moderation_notes and flags that are internal staff workings. No policy can
-- hide a column. Column privileges are the right tool, so they are revoked
-- from anon and authenticated below. Admins reach them through the service
-- role or through a query that names only the columns they are granted.

drop policy if exists tour_reviews_select_public on public.tour_reviews;
create policy tour_reviews_select_public on public.tour_reviews
  for select to anon, authenticated
  using (status = 'approved');
comment on policy tour_reviews_select_public on public.tour_reviews is
  'Anyone reads approved reviews only. Pending and rejected reviews are never publicly visible.';

drop policy if exists tour_reviews_select_admin on public.tour_reviews;
create policy tour_reviews_select_admin on public.tour_reviews
  for select to authenticated
  using (public.is_admin());
comment on policy tour_reviews_select_admin on public.tour_reviews is
  'Admins read every review, including the moderation queue.';

drop policy if exists tour_reviews_insert_admin on public.tour_reviews;
create policy tour_reviews_insert_admin on public.tour_reviews
  for insert to authenticated with check (public.is_admin());
drop policy if exists tour_reviews_update_admin on public.tour_reviews;
create policy tour_reviews_update_admin on public.tour_reviews
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists tour_reviews_delete_admin on public.tour_reviews;
create policy tour_reviews_delete_admin on public.tour_reviews
  for delete to authenticated using (public.is_admin());

-- Review submission is NOT granted to the public here, deliberately. The old
-- site accepted a name, an email and a comment from anyone with no account,
-- which is an unauthenticated write to a table that renders on the public
-- site. An insert policy could force status to pending, but it could not rate
-- limit, could not check the submitter is human, and could not stop the same
-- visitor filling the moderation queue. That belongs in a Route Handler which
-- can do all three and then write with the service role. Phase 4 owns it.

revoke select (user_email, moderation_notes, flags) on public.tour_reviews from anon, authenticated;

comment on column public.tour_reviews.user_email is
  'Not publicly readable. SELECT on this column is revoked from anon and authenticated, because RLS cannot hide a column and the public read policy would otherwise expose it.';
