-- Study abroad, phase 2: student messages to their counsellor, payment
-- instructions staff can edit, and scholarships tied to a university or programme.

-- ---------------------------------------------------------------------------
-- Messages. A student writes on their own application; staff answer with a public
-- update, which the student already gets as a notification. Stored as timeline
-- events so one list shows the whole conversation.
-- ---------------------------------------------------------------------------
alter table public.study_application_events drop constraint if exists study_application_events_kind_check;
alter table public.study_application_events add constraint study_application_events_kind_check
  check (kind in ('stage', 'document', 'note', 'system', 'message'));

create or replace function public.send_study_message(p_application_id uuid, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  a record;
  v_body text := btrim(coalesce(p_body, ''));
  new_id uuid;
begin
  if uid is null then raise exception 'Please sign in.' using errcode = 'P0001'; end if;
  select id, user_id, full_name, assigned_to, reference into a from public.study_applications where id = p_application_id;
  if not found or a.user_id <> uid then raise exception 'We could not find that application.' using errcode = 'P0001'; end if;
  if char_length(v_body) < 2 then raise exception 'Write your message first.' using errcode = 'P0001'; end if;
  if char_length(v_body) > 1500 then raise exception 'Please keep a message under 1500 characters.' using errcode = 'P0001'; end if;
  if (select count(*) from public.study_application_events
        where application_id = p_application_id and kind = 'message' and created_at > now() - interval '1 day') >= 20 then
    raise exception 'You have sent a lot of messages today. We will reply as soon as we can.' using errcode = 'P0001';
  end if;

  insert into public.study_application_events (application_id, kind, title, body, is_public, created_by)
  values (p_application_id, 'message', 'Message', v_body, true, uid)
  returning id into new_id;

  if a.assigned_to is not null then
    insert into public.notifications (user_id, type, title, message, link)
    values (a.assigned_to, 'general', 'New message from a student', left(coalesce(a.full_name, 'A student') || ': ' || v_body, 300), '/admin/applications');
  else
    perform public.notify_admins('general', 'New message from a student', left(coalesce(a.full_name, 'A student') || ': ' || v_body, 300), '/admin/applications');
  end if;
  update public.study_applications set last_activity_at = now() where id = p_application_id;
  return new_id;
end $$;
revoke all on function public.send_study_message(uuid, text) from public, anon;
grant execute on function public.send_study_message(uuid, text) to authenticated;

-- Applications whose last word was the student's: a message newer than any public update.
create or replace view public.study_awaiting_reply with (security_invoker = true) as
select a.id as application_id
from public.study_applications a
where exists (
  select 1 from public.study_application_events m
  where m.application_id = a.id and m.kind = 'message'
    and m.created_at > coalesce((select max(n.created_at) from public.study_application_events n
                                  where n.application_id = a.id and n.kind = 'note' and n.is_public), '-infinity'::timestamptz)
);
grant select on public.study_awaiting_reply to authenticated;

-- The Study Applications badge also counts students waiting for a reply.
create or replace function public.admin_sidebar_counts() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return jsonb_build_object(
    'trash', (select count(distinct batch) from trash_items),
    'helpdesk', (select count(*) from support_tickets where status = 'open'),
    'contacts', (select count(*) from contact_messages where not is_read),
    'orders', (select count(*) from orders where payment_status = 'success' and order_status in ('pending', 'processing')),
    'tours', (select count(*) from bookings where status = 'pending') + (select count(*) from tour_reviews where status = 'pending'),
    'rentals', (select count(*) from vacation_bookings where status = 'pending'),
    'applications', (select count(*) from study_applications where status = 'enquiry')
                  + (select count(*) from study_application_documents where status = 'uploaded')
                  + (select count(*) from study_awaiting_reply),
    'feedback', (select count(*) from suggestions where not is_read) + (select count(*) from issue_reports where not is_read),
    'testimonials', (select count(*) from testimonials where status = 'pending'),
    'emails', (select count(*) from email_log where status in ('failed', 'bounced') and created_at > now() - interval '7 days'),
    'notifications', (select count(*) from notifications where user_id = auth.uid() and not is_read)
  );
end $$;

-- ---------------------------------------------------------------------------
-- Payment instructions. Shown to students who owe a balance. Not in site_settings,
-- which anyone can read: only signed-in users can read this.
-- ---------------------------------------------------------------------------
create table if not exists public.study_settings (
  id boolean primary key default true check (id),
  payment_instructions text not null default '' check (char_length(payment_instructions) <= 2000),
  updated_at timestamptz not null default now()
);
insert into public.study_settings (id) values (true) on conflict do nothing;
alter table public.study_settings enable row level security;
create policy study_settings_select on public.study_settings for select to authenticated using (true);
create policy study_settings_update_admin on public.study_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke all on public.study_settings from anon;
grant select, update on public.study_settings to authenticated;
create trigger study_settings_updated before update on public.study_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Scholarships can belong to one university or one programme. Both optional: a
-- scholarship for a whole country keeps working as before.
-- ---------------------------------------------------------------------------
alter table public.scholarships
  add column if not exists institution_id uuid references public.study_institutions(id) on delete set null,
  add column if not exists program_id uuid references public.study_programs(id) on delete set null;
create index if not exists scholarships_institution_idx on public.scholarships (institution_id) where institution_id is not null;
create index if not exists scholarships_program_idx on public.scholarships (program_id) where program_id is not null;
