-- 0017_notifications.sql
-- Backs the account Notifications page. The old page rendered a hardcoded array
-- and had no table or endpoint behind it. Rows here are written by the database
-- itself, from two real events, so nothing in the application has to remember
-- to create them: a welcome note when a profile is created, and an order note
-- when an order row is inserted (the Paystack settlement path does that).
-- Wishlist price drops and tour reminders from the old mock are not created,
-- there is no event in the system that would produce them.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'general'
    check (type in ('order', 'tour', 'promotion', 'wishlist', 'general')),
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.notifications is
  'In-app notifications for a signed in user. Created by database triggers, read and marked read by the owner. Owners cannot create or edit anything but is_read.';

create index if not exists notifications_user_id_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Policies pick the rows, this picks the columns: an owner may flip is_read and
-- nothing else, so a notification's text cannot be rewritten from the browser.
revoke update on public.notifications from authenticated;
grant update (is_read) on public.notifications to authenticated;

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.notify_profile_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, message)
  values (new.id, 'general', 'Welcome to TechTour', 'Welcome to TechTour Ghana! Start exploring amazing tours and products.');
  return new;
end;
$$;

create or replace function public.notify_order_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, title, message)
  values (new.user_id, 'order', 'Order Confirmed', 'Your order ' || new.order_number || ' has been confirmed and is being processed.');
  return new;
end;
$$;

revoke all on function public.notify_profile_created() from public, anon, authenticated;
revoke all on function public.notify_order_created() from public, anon, authenticated;

drop trigger if exists profiles_notify_created on public.profiles;
create trigger profiles_notify_created
  after insert on public.profiles
  for each row execute function public.notify_profile_created();

drop trigger if exists orders_notify_created on public.orders;
create trigger orders_notify_created
  after insert on public.orders
  for each row execute function public.notify_order_created();
