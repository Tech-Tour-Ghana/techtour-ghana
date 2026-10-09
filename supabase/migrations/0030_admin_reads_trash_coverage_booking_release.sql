-- 0030_admin_reads_trash_coverage_booking_release.sql
-- 1. Admins could not see inactive rows on most content tables: the public
--    SELECT policy filters on is_active and there was no admin SELECT policy.
--    Switching an item off made it disappear from its own admin list.
-- 2. Extend the trash (0029) to the remaining content tables.
-- 3. Cancelling a booking gives its seats back to the departure.

-- ------------------------------------------------ 1. admin SELECT policies
do $$
declare t text;
begin
  foreach t in array array[
    'market_products','market_categories','artisans','artisan_products','product_gallery',
    'study_destinations','scholarships','team_members','job_categories','job_openings',
    'tech_innovations','tech_events','tech_resources','testimonials',
    'main_feature_cards','small_glass_cards','video_sections','homepage_slides','homepage_sections',
    'navbar_menus','navbar_dropdowns','footer_quick_links','footer_features','social_links','legal_links','footer_contacts',
    'vacation_rentals','shipping_settings'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists %I on public.%I', t || '_select_admin', t);
      execute format('create policy %I on public.%I for select to authenticated using (public.is_admin())', t || '_select_admin', t);
    end if;
  end loop;
end $$;

-- ------------------------------------------------ 2. trash coverage
do $$
declare t text;
begin
  foreach t in array array[
    'artisan_private_contacts','artisan_products','product_gallery','seo_metadata',
    'main_feature_cards','video_sections','homepage_slides','small_glass_cards',
    'navbar_menus','navbar_dropdowns','footer_quick_links','social_links','legal_links',
    'job_categories','suggestions','issue_reports'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists trash_capture on public.%I', t);
      execute format('create trigger trash_capture before delete on public.%I for each row execute function public.trash_capture()', t);
    end if;
  end loop;
end $$;

-- ------------------------------------------------ 3. release seats on cancel
create or replace function public.bookings_release_spots() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.schedule_id is null then return new; end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.tour_schedules set booked_spots = greatest(booked_spots - old.participants, 0) where id = new.schedule_id;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    update public.tour_schedules set booked_spots = booked_spots + new.participants where id = new.schedule_id;
  end if;
  return new;
end $$;
revoke all on function public.bookings_release_spots() from public, anon, authenticated;

drop trigger if exists bookings_release_spots on public.bookings;
create trigger bookings_release_spots
  after update of status on public.bookings
  for each row execute function public.bookings_release_spots();
