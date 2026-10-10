-- 0039_helpdesk_and_notices.sql
-- Helpdesk tickets (customers raise and follow them, staff work them on a kanban
-- board) and the notice board (staff publish notices for visitors and customers).
--
-- Customers never write to the ticket tables directly. They go through three
-- SECURITY DEFINER functions that validate the input, check ownership and rate
-- limit, the same shape as create_tour_booking in 0028. Staff use the admin
-- policies. Internal staff notes are invisible to customers by policy.

-- ---------------------------------------------------------------------------
-- Tickets
-- ---------------------------------------------------------------------------
create sequence if not exists public.support_ticket_seq start 1001;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('HD-' || nextval('public.support_ticket_seq')),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 140),
  category text not null default 'other'
    check (category in ('booking', 'payment', 'order', 'study', 'account', 'technical', 'other')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  -- Booking or order number the customer is asking about. Free text, optional.
  reference text not null default '' check (char_length(reference) <= 80),
  assigned_to uuid references public.profiles (id) on delete set null,
  last_activity_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.support_tickets is
  'Helpdesk tickets. Created and replied to through the support_* functions, worked by staff on the admin kanban board.';

create index if not exists support_tickets_user_idx on public.support_tickets (user_id, last_activity_at desc);
create index if not exists support_tickets_status_idx on public.support_tickets (status, last_activity_at desc);
create index if not exists support_tickets_assigned_idx on public.support_tickets (assigned_to) where assigned_to is not null;

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  is_staff boolean not null default false,
  -- Staff-only note. Never shown to the customer.
  is_internal boolean not null default false check (not is_internal or is_staff),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists support_messages_ticket_idx on public.support_messages (ticket_id, created_at);

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

-- Tickets: owners read their own, staff read and update everything. Nobody inserts
-- or deletes directly.
drop policy if exists support_tickets_select_own on public.support_tickets;
create policy support_tickets_select_own on public.support_tickets
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists support_tickets_select_admin on public.support_tickets;
create policy support_tickets_select_admin on public.support_tickets
  for select to authenticated using (public.is_admin());
drop policy if exists support_tickets_update_admin on public.support_tickets;
create policy support_tickets_update_admin on public.support_tickets
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke insert, update, delete on public.support_tickets from anon, authenticated;
grant select on public.support_tickets to authenticated;
-- Staff may change only the working fields.
grant update (status, priority, category, assigned_to, resolved_at, closed_at, last_activity_at, updated_at) on public.support_tickets to authenticated;

-- Messages: owners read the public thread, staff read everything and post as staff.
drop policy if exists support_messages_select_own on public.support_messages;
create policy support_messages_select_own on public.support_messages
  for select to authenticated using (
    not is_internal
    and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = (select auth.uid()))
  );
drop policy if exists support_messages_select_admin on public.support_messages;
create policy support_messages_select_admin on public.support_messages
  for select to authenticated using (public.is_admin());
drop policy if exists support_messages_insert_admin on public.support_messages;
create policy support_messages_insert_admin on public.support_messages
  for insert to authenticated with check (public.is_admin() and is_staff and author_id = (select auth.uid()));

revoke insert, update, delete on public.support_messages from anon, authenticated;
grant select on public.support_messages to authenticated;
grant insert on public.support_messages to authenticated;

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();
drop trigger if exists audit_admin_change on public.support_tickets;
create trigger audit_admin_change after update on public.support_tickets
  for each row execute function public.audit_admin_change();

-- ---------------------------------------------------------------------------
-- Functions customers use
-- ---------------------------------------------------------------------------
create or replace function public.create_support_ticket(
  p_subject text, p_category text, p_message text, p_reference text default ''
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  t public.support_tickets;
begin
  if uid is null then raise exception 'Sign in to contact support' using errcode = '28000'; end if;
  p_subject := btrim(coalesce(p_subject, ''));
  p_message := btrim(coalesce(p_message, ''));
  p_reference := btrim(coalesce(p_reference, ''));
  if char_length(p_subject) < 3 or char_length(p_subject) > 140 then raise exception 'Subject must be 3 to 140 characters' using errcode = '22023'; end if;
  if char_length(p_message) < 10 or char_length(p_message) > 5000 then raise exception 'Message must be 10 to 5000 characters' using errcode = '22023'; end if;
  if p_category is null or p_category not in ('booking', 'payment', 'order', 'study', 'account', 'technical', 'other') then p_category := 'other'; end if;
  if (select count(*) from public.support_tickets where user_id = uid and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'You have opened several tickets recently. Please wait a little before opening another.' using errcode = '54000';
  end if;
  if (select count(*) from public.support_tickets where user_id = uid and status <> 'closed') >= 20 then
    raise exception 'You have many open tickets. Please wait for a reply or close some first.' using errcode = '54000';
  end if;

  insert into public.support_tickets (user_id, subject, category, reference)
  values (uid, p_subject, p_category, left(p_reference, 80)) returning * into t;
  insert into public.support_messages (ticket_id, author_id, is_staff, body) values (t.id, uid, false, p_message);
  return jsonb_build_object('id', t.id, 'ticket_number', t.ticket_number);
end $$;

create or replace function public.reply_support_ticket(p_ticket_id uuid, p_body text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  t public.support_tickets;
begin
  if uid is null then raise exception 'Sign in to reply' using errcode = '28000'; end if;
  p_body := btrim(coalesce(p_body, ''));
  if char_length(p_body) < 1 or char_length(p_body) > 5000 then raise exception 'Reply must be 1 to 5000 characters' using errcode = '22023'; end if;
  select * into t from public.support_tickets where id = p_ticket_id and user_id = uid;
  if not found then raise exception 'Ticket not found' using errcode = 'P0002'; end if;
  if t.status = 'closed' then raise exception 'This ticket is closed. Open a new ticket for further help.' using errcode = '22023'; end if;
  if (select count(*) from public.support_messages where author_id = uid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Too many messages. Please wait a little.' using errcode = '54000';
  end if;
  insert into public.support_messages (ticket_id, author_id, is_staff, body) values (t.id, uid, false, p_body);
end $$;

-- Customers can mark a ticket resolved, reopen a resolved one, or close it.
create or replace function public.customer_update_support_ticket(p_ticket_id uuid, p_action text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  t public.support_tickets;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  select * into t from public.support_tickets where id = p_ticket_id and user_id = uid;
  if not found then raise exception 'Ticket not found' using errcode = 'P0002'; end if;
  if p_action = 'resolve' and t.status <> 'closed' then
    update public.support_tickets set status = 'resolved', resolved_at = now(), last_activity_at = now() where id = t.id;
  elsif p_action = 'reopen' and t.status = 'resolved' then
    update public.support_tickets set status = 'open', resolved_at = null, last_activity_at = now() where id = t.id;
  elsif p_action = 'close' then
    update public.support_tickets set status = 'closed', closed_at = now(), last_activity_at = now() where id = t.id;
  else
    raise exception 'That change is not allowed' using errcode = '22023';
  end if;
end $$;

revoke all on function public.create_support_ticket(text, text, text, text) from public, anon;
revoke all on function public.reply_support_ticket(uuid, text) from public, anon;
revoke all on function public.customer_update_support_ticket(uuid, text) from public, anon;
grant execute on function public.create_support_ticket(text, text, text, text) to authenticated;
grant execute on function public.reply_support_ticket(uuid, text) to authenticated;
grant execute on function public.customer_update_support_ticket(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Keep the ticket in step with its messages, and tell the customer
-- ---------------------------------------------------------------------------
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('order', 'tour', 'promotion', 'wishlist', 'general', 'support'));

create or replace function public.support_message_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare t public.support_tickets;
begin
  select * into t from public.support_tickets where id = new.ticket_id;
  if new.is_internal then
    update public.support_tickets set last_activity_at = now() where id = t.id;
  elsif new.is_staff then
    -- First staff reply picks the ticket up. Resolved and closed stay as they are.
    update public.support_tickets
      set last_activity_at = now(), status = case when status = 'open' then 'in_progress' else status end
      where id = t.id;
    insert into public.notifications (user_id, type, title, message)
    values (t.user_id, 'support', 'New reply on ' || t.ticket_number, left(new.body, 140));
  else
    -- A customer reply needs staff attention again.
    update public.support_tickets
      set last_activity_at = now(),
          status = case when status in ('waiting', 'resolved') then 'open' else status end,
          resolved_at = case when status = 'resolved' then null else resolved_at end
      where id = t.id;
  end if;
  return new;
end $$;
revoke all on function public.support_message_after_insert() from public, anon, authenticated;

drop trigger if exists support_message_after_insert on public.support_messages;
create trigger support_message_after_insert after insert on public.support_messages
  for each row execute function public.support_message_after_insert();

create or replace function public.support_ticket_status_notify() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and new.status in ('resolved', 'closed') and auth.uid() is distinct from new.user_id then
    insert into public.notifications (user_id, type, title, message)
    values (new.user_id, 'support', 'Ticket ' || new.ticket_number || ' is ' || new.status, left(new.subject, 140));
  end if;
  if new.status = 'resolved' and old.status is distinct from 'resolved' and new.resolved_at is null then new.resolved_at := now(); end if;
  if new.status = 'closed' and old.status is distinct from 'closed' and new.closed_at is null then new.closed_at := now(); end if;
  return new;
end $$;
revoke all on function public.support_ticket_status_notify() from public, anon, authenticated;

drop trigger if exists support_ticket_status_notify on public.support_tickets;
create trigger support_ticket_status_notify before update on public.support_tickets
  for each row execute function public.support_ticket_status_notify();

-- ---------------------------------------------------------------------------
-- Notice board
-- ---------------------------------------------------------------------------
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  body text not null default '' check (char_length(body) <= 2000),
  severity text not null default 'info' check (severity in ('info', 'success', 'warning', 'critical')),
  -- all: every visitor. customers: signed-in customers only.
  audience text not null default 'all' check (audience in ('all', 'customers')),
  is_pinned boolean not null default false,
  -- Also show as a banner across the top of the site.
  show_banner boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index if not exists notices_live_idx on public.notices (is_pinned desc, starts_at desc) where is_active;

alter table public.notices enable row level security;

drop policy if exists notices_select_public on public.notices;
create policy notices_select_public on public.notices
  for select to anon, authenticated using (
    is_active and starts_at <= now() and (ends_at is null or ends_at > now())
    and (audience = 'all' or (select auth.uid()) is not null)
  );
drop policy if exists notices_select_admin on public.notices;
create policy notices_select_admin on public.notices
  for select to authenticated using (public.is_admin());
drop policy if exists notices_insert_admin on public.notices;
create policy notices_insert_admin on public.notices
  for insert to authenticated with check (public.is_admin());
drop policy if exists notices_update_admin on public.notices;
create policy notices_update_admin on public.notices
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists notices_delete_admin on public.notices;
create policy notices_delete_admin on public.notices
  for delete to authenticated using (public.is_admin());

drop trigger if exists notices_set_updated_at on public.notices;
create trigger notices_set_updated_at before update on public.notices
  for each row execute function public.set_updated_at();
drop trigger if exists audit_admin_change on public.notices;
create trigger audit_admin_change after insert or update or delete on public.notices
  for each row execute function public.audit_admin_change();
drop trigger if exists trash_capture on public.notices;
create trigger trash_capture before delete on public.notices
  for each row execute function public.trash_capture();
