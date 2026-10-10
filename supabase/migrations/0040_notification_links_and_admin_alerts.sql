-- 0040_notification_links_and_admin_alerts.sql
-- Notification centre for customers and staff.
--
-- 1. notifications.link: an optional in-site path the notification opens, so the
--    bell and the notifications page can take the reader to the thing it is about.
-- 2. Existing customer triggers now set a link.
-- 3. notify_admins(): staff get their own notifications for the events they act
--    on (new ticket, contact message, order, booking, study application, rental
--    booking). They read them in the admin bell and on /admin/notifications.
-- 4. notifications joins the realtime publication so the bell count updates
--    without a refresh. RLS still decides which rows a client may receive.

alter table public.notifications add column if not exists link text
  check (link is null or (link like '/%' and link not like '//%' and char_length(link) <= 200));

grant select (link), insert (link) on public.notifications to authenticated;

create index if not exists notifications_unread_idx
  on public.notifications (user_id) where not is_read;

-- Customer events now point somewhere.
create or replace function public.notify_order_created() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, type, title, message, link)
  values (new.user_id, 'order', 'Order Confirmed', 'Your order ' || new.order_number || ' has been confirmed and is being processed.', '/auth/orders');
  return new;
end $$;

create or replace function public.support_message_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t public.support_tickets;
begin
  select * into t from public.support_tickets where id = new.ticket_id;
  if new.is_internal then
    update public.support_tickets set last_activity_at = now() where id = t.id;
  elsif new.is_staff then
    update public.support_tickets
      set last_activity_at = now(), status = case when status = 'open' then 'in_progress' else status end
      where id = t.id;
    insert into public.notifications (user_id, type, title, message, link)
    values (t.user_id, 'support', 'New reply on ' || t.ticket_number, left(new.body, 140), '/auth/support/' || t.id);
  else
    update public.support_tickets
      set last_activity_at = now(),
          status = case when status in ('waiting', 'resolved') then 'open' else status end,
          resolved_at = case when status = 'resolved' then null else resolved_at end
      where id = t.id;
    -- The opening message of a ticket is covered by the "New ticket" alert.
    if exists (select 1 from public.support_messages where ticket_id = t.id and id <> new.id) then
      perform public.notify_admins('support', 'Customer replied on ' || t.ticket_number, left(new.body, 140), '/admin/helpdesk');
    end if;
  end if;
  return new;
end $$;

create or replace function public.support_ticket_status_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and new.status in ('resolved', 'closed') and auth.uid() is distinct from new.user_id then
    insert into public.notifications (user_id, type, title, message, link)
    values (new.user_id, 'support', 'Ticket ' || new.ticket_number || ' is ' || new.status, left(new.subject, 140), '/auth/support/' || new.id);
  end if;
  if new.status = 'resolved' and old.status is distinct from 'resolved' and new.resolved_at is null then new.resolved_at := now(); end if;
  if new.status = 'closed' and old.status is distinct from 'closed' and new.closed_at is null then new.closed_at := now(); end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Staff alerts
-- ---------------------------------------------------------------------------
create or replace function public.notify_admins(p_type text, p_title text, p_message text, p_link text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, type, title, message, link)
  select id, p_type, left(p_title, 120), left(p_message, 300), p_link
  from public.profiles where is_admin and is_active;
end $$;
revoke all on function public.notify_admins(text, text, text, text) from public, anon, authenticated;

create or replace function public.admin_alert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  case tg_table_name
    when 'support_tickets' then
      perform public.notify_admins('support', 'New ticket ' || new.ticket_number, left(new.subject, 140), '/admin/helpdesk');
    when 'contact_messages' then
      perform public.notify_admins('general', 'New contact message', left(coalesce(nullif(new.subject, ''), 'No subject') || ' from ' || new.name, 140), '/admin/contacts');
    when 'orders' then
      perform public.notify_admins('order', 'New order ' || new.order_number, 'A marketplace order was placed.', '/admin/orders');
    when 'bookings' then
      perform public.notify_admins('tour', 'New tour booking', 'Reference ' || new.booking_reference, '/admin/tours');
    when 'vacation_bookings' then
      perform public.notify_admins('tour', 'New rental booking', 'Booking ' || new.booking_number, '/admin/rentals');
    when 'study_applications' then
      perform public.notify_admins('general', 'New study application', left(coalesce(new.full_name, 'An applicant') || ', ' || coalesce(new.program_name, 'study abroad'), 140), '/admin/applications');
  end case;
  return new;
end $$;
revoke all on function public.admin_alert() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['support_tickets', 'contact_messages', 'orders', 'bookings', 'vacation_bookings', 'study_applications'] loop
    execute format('drop trigger if exists admin_alert on public.%I', t);
    execute format('create trigger admin_alert after insert on public.%I for each row execute function public.admin_alert()', t);
  end loop;
end $$;

-- Live bell counts.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
