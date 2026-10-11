-- 0044_trash_media_and_more.sql
-- Media files and a few more admin tables now go to Trash when deleted.
--
-- The files themselves are moved in storage to _trash/<original path> by the
-- admin screens (so they can be previewed and put back), this only makes sure
-- the library entry is captured. Tables that do not exist are skipped.

do $$
declare t text;
begin
  foreach t in array array['media_assets', 'media_folders', 'vacation_rentals', 'notices', 'vacation_bookings'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists trash_capture on public.%I', t);
      execute format('create trigger trash_capture before delete on public.%I for each row execute function public.trash_capture()', t);
    end if;
  end loop;
end $$;

-- The label for a media entry is its file name, not an id.
create or replace function public.trash_capture() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  j jsonb := to_jsonb(old);
  v_label text;
begin
  v_label := case tg_table_name
    when 'bookings' then 'Booking ' || coalesce(nullif(j->>'booking_reference', ''), j->>'id')
    when 'vacation_bookings' then 'Stay ' || coalesce(nullif(j->>'booking_number', ''), j->>'id')
    when 'tour_schedules' then 'Departure ' || to_char((j->>'start_date')::date, 'DD Mon YYYY')
    when 'tour_reviews' then 'Review by ' || coalesce(nullif(j->>'user_name', ''), 'a guest')
    when 'media_assets' then coalesce(nullif(j->>'title', ''), nullif(j->>'name', ''), j->>'id')
    else coalesce(nullif(j->>'title',''), nullif(j->>'name',''), nullif(j->>'full_name',''), nullif(j->>'subject',''),
                  nullif(j->>'email',''), nullif(j->>'user_name',''), nullif(j->>'slug',''), j->>'id', '')
  end;
  insert into public.trash_items (table_name, record_id, label, data, batch, deleted_by)
  values (tg_table_name, coalesce(j->>'id', ''), left(v_label, 200), j, txid_current(), auth.uid());
  return old;
end $$;
revoke all on function public.trash_capture() from public, anon, authenticated;
