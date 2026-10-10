-- 0043_trash_readable_labels.sql
-- Trash showed departures as raw ids and bookings as the guest email. Give the
-- label something a person recognises: a booking reference, or a departure date.

create or replace function public.trash_capture() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  j jsonb := to_jsonb(old);
  v_label text;
begin
  v_label := case tg_table_name
    when 'bookings' then 'Booking ' || coalesce(nullif(j->>'booking_reference', ''), j->>'id')
    when 'tour_schedules' then 'Departure ' || to_char((j->>'start_date')::date, 'DD Mon YYYY')
    when 'tour_reviews' then 'Review by ' || coalesce(nullif(j->>'user_name', ''), 'a guest')
    else coalesce(nullif(j->>'title',''), nullif(j->>'name',''), nullif(j->>'full_name',''), nullif(j->>'subject',''),
                  nullif(j->>'email',''), nullif(j->>'user_name',''), nullif(j->>'slug',''), j->>'id', '')
  end;
  insert into public.trash_items (table_name, record_id, label, data, batch, deleted_by)
  values (tg_table_name, coalesce(j->>'id', ''), left(v_label, 200), j, txid_current(), auth.uid());
  return old;
end $$;
revoke all on function public.trash_capture() from public, anon, authenticated;
