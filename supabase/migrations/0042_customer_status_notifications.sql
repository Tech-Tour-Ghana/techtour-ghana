-- 0042_customer_status_notifications.sql
-- Tell customers what happened to their booking, order or application.
--
-- Before this, a customer reserved a tour or stay and then heard nothing when
-- staff confirmed or cancelled it. Staff change the status from the admin
-- screens, so the database does the notifying: it cannot be forgotten by a
-- screen that forgets to call something.
--
--   bookings            tour booking: received, then confirmed, cancelled, completed
--   vacation_bookings   rental stay: received, then confirmed, cancelled, completed, refunded
--   orders              marketplace order: processing, shipped, delivered, cancelled, refunded
--   study_applications  any change of status

create or replace function public.notify_booking_received() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.user_id is null then return new; end if;
  if tg_table_name = 'bookings' then
    insert into public.notifications (user_id, type, title, message, link)
    values (new.user_id, 'tour', 'Reservation received', 'Your tour request ' || new.booking_reference || ' is pending. We will confirm your place by email.', '/auth/tours');
  else
    insert into public.notifications (user_id, type, title, message, link)
    values (new.user_id, 'tour', 'Stay requested', 'Your stay request ' || new.booking_number || ' is pending. We will confirm availability by email.', null);
  end if;
  return new;
end $$;
revoke all on function public.notify_booking_received() from public, anon, authenticated;

create or replace function public.notify_status_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_old text;
  v_new text;
  v_ref text;
  v_user uuid;
  v_type text := 'general';
  v_link text;
  v_what text;
begin
  v_user := new.user_id;
  if v_user is null then return new; end if;

  if tg_table_name = 'bookings' then
    v_old := old.status::text; v_new := new.status::text; v_ref := new.booking_reference;
    v_type := 'tour'; v_link := '/auth/tours'; v_what := 'Tour booking';
  elsif tg_table_name = 'vacation_bookings' then
    v_old := old.status::text; v_new := new.status::text; v_ref := new.booking_number;
    v_type := 'tour'; v_link := null; v_what := 'Stay';
  elsif tg_table_name = 'orders' then
    v_old := old.order_status::text; v_new := new.order_status::text; v_ref := new.order_number;
    v_type := 'order'; v_link := '/auth/orders'; v_what := 'Order';
  else
    v_old := old.status::text; v_new := new.status::text; v_ref := coalesce(new.program_name, 'application');
    v_type := 'general'; v_link := '/auth/study'; v_what := 'Study application';
  end if;

  if v_new is distinct from v_old and v_new <> 'pending' then
    insert into public.notifications (user_id, type, title, message, link)
    values (v_user, v_type, v_what || ' ' || replace(v_new, '_', ' '), left(v_what || ' ' || v_ref || ' is now ' || replace(v_new, '_', ' ') || '.', 300), v_link);
  end if;
  return new;
end $$;
revoke all on function public.notify_status_change() from public, anon, authenticated;

drop trigger if exists bookings_notify_received on public.bookings;
create trigger bookings_notify_received after insert on public.bookings
  for each row execute function public.notify_booking_received();
drop trigger if exists vacation_bookings_notify_received on public.vacation_bookings;
create trigger vacation_bookings_notify_received after insert on public.vacation_bookings
  for each row execute function public.notify_booking_received();

drop trigger if exists bookings_notify_status on public.bookings;
create trigger bookings_notify_status after update of status on public.bookings
  for each row execute function public.notify_status_change();
drop trigger if exists vacation_bookings_notify_status on public.vacation_bookings;
create trigger vacation_bookings_notify_status after update of status on public.vacation_bookings
  for each row execute function public.notify_status_change();
drop trigger if exists orders_notify_status on public.orders;
create trigger orders_notify_status after update of order_status on public.orders
  for each row execute function public.notify_status_change();
drop trigger if exists study_applications_notify_status on public.study_applications;
create trigger study_applications_notify_status after update of status on public.study_applications
  for each row execute function public.notify_status_change();
