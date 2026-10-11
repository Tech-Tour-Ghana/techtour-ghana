-- 0046_study_abroad_pipeline.sql
-- Study abroad for Ghanaian students going to universities overseas, handled by
-- TechTour on their behalf: partner institutions and programmes, an application
-- that moves through stages, a document checklist, and a timeline the student
-- can follow in their dashboard.
--
-- Stages (study_applications.status), in order:
--   enquiry, documents, submitted, offer, accepted, visa, enrolled
-- and two ends: rejected, withdrawn.
-- The old values map across: pending -> enquiry, reviewing -> documents,
-- approved -> offer, completed -> enrolled.

-- ---------------------------------------------------------------------------
-- Partner institutions and programmes
-- ---------------------------------------------------------------------------
create table if not exists public.study_institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  destination_id uuid references public.study_destinations (id) on delete set null,
  city text not null default '',
  logo_url text not null default '',
  image_url text not null default '',
  website text not null default '',
  description text not null default '',
  is_partner boolean not null default true,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_programs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.study_institutions (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  level text not null default 'bachelor' check (level in ('foundation', 'certificate', 'diploma', 'bachelor', 'master', 'phd')),
  field text not null default '',
  duration text not null default '',
  tuition_amount numeric(12, 2) check (tuition_amount is null or tuition_amount >= 0),
  tuition_currency text not null default 'USD',
  application_fee numeric(10, 2) check (application_fee is null or application_fee >= 0),
  intakes text not null default '',
  requirements text not null default '',
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, slug)
);

create index if not exists study_programs_institution_idx on public.study_programs (institution_id);
create index if not exists study_institutions_destination_idx on public.study_institutions (destination_id);

drop trigger if exists study_institutions_updated on public.study_institutions;
create trigger study_institutions_updated before update on public.study_institutions for each row execute function public.set_updated_at();
drop trigger if exists study_programs_updated on public.study_programs;
create trigger study_programs_updated before update on public.study_programs for each row execute function public.set_updated_at();

alter table public.study_institutions enable row level security;
alter table public.study_programs enable row level security;

drop policy if exists study_institutions_select on public.study_institutions;
create policy study_institutions_select on public.study_institutions for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists study_institutions_write_admin on public.study_institutions;
create policy study_institutions_write_admin on public.study_institutions for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists study_programs_select on public.study_programs;
create policy study_programs_select on public.study_programs for select to anon, authenticated
  using ((is_active and exists (select 1 from public.study_institutions i where i.id = institution_id and i.is_active)) or public.is_admin());
drop policy if exists study_programs_write_admin on public.study_programs;
create policy study_programs_write_admin on public.study_programs for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Applications: stages, programme link, reference, what happens next
-- ---------------------------------------------------------------------------
alter table public.study_applications
  add column if not exists institution_id uuid references public.study_institutions (id) on delete set null,
  add column if not exists program_id uuid references public.study_programs (id) on delete set null,
  add column if not exists intake text not null default '',
  add column if not exists reference text not null default ('SA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  add column if not exists assigned_to uuid references public.profiles (id) on delete set null,
  add column if not exists next_step text not null default '',
  add column if not exists last_activity_at timestamptz not null default now();

create unique index if not exists study_applications_reference_key on public.study_applications (reference);

alter table public.study_applications drop constraint if exists study_applications_status_valid;
update public.study_applications set status = case status
  when 'pending' then 'enquiry' when 'reviewing' then 'documents' when 'approved' then 'offer' when 'completed' then 'enrolled' else status end
  where status in ('pending', 'reviewing', 'approved', 'completed');
alter table public.study_applications alter column status set default 'enquiry';
alter table public.study_applications add constraint study_applications_status_valid
  check (status in ('enquiry', 'documents', 'submitted', 'offer', 'accepted', 'visa', 'enrolled', 'rejected', 'withdrawn'));

-- ---------------------------------------------------------------------------
-- Documents the student must provide, and what staff made of them
-- ---------------------------------------------------------------------------
create table if not exists public.study_application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.study_applications (id) on delete cascade,
  label text not null check (char_length(label) between 2 and 160),
  description text not null default '',
  required boolean not null default true,
  status text not null default 'requested' check (status in ('requested', 'uploaded', 'approved', 'rejected')),
  file_path text not null default '',
  file_name text not null default '',
  mime_type text not null default '',
  size_bytes bigint not null default 0,
  staff_note text not null default '',
  sort_order integer not null default 0,
  uploaded_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists study_docs_application_idx on public.study_application_documents (application_id, sort_order);

-- The timeline the student sees. Staff can also keep internal notes (is_public false).
create table if not exists public.study_application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.study_applications (id) on delete cascade,
  kind text not null default 'note' check (kind in ('stage', 'document', 'note', 'system')),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 2000),
  is_public boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists study_events_application_idx on public.study_application_events (application_id, created_at desc);

alter table public.study_application_documents enable row level security;
alter table public.study_application_events enable row level security;

drop policy if exists study_docs_select on public.study_application_documents;
create policy study_docs_select on public.study_application_documents for select to authenticated
  using (public.is_admin() or exists (select 1 from public.study_applications a where a.id = application_id and a.user_id = (select auth.uid())));
drop policy if exists study_docs_write_admin on public.study_application_documents;
create policy study_docs_write_admin on public.study_application_documents for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists study_events_select on public.study_application_events;
create policy study_events_select on public.study_application_events for select to authenticated
  using (public.is_admin() or (is_public and exists (select 1 from public.study_applications a where a.id = application_id and a.user_id = (select auth.uid()))));
drop policy if exists study_events_write_admin on public.study_application_events;
create policy study_events_write_admin on public.study_application_events for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Private storage for the documents
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-documents', 'study-documents', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Files live under <user id>/<application id>/<file>. A student reaches only their own folder.
drop policy if exists study_docs_objects_insert on storage.objects;
create policy study_docs_objects_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'study-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
drop policy if exists study_docs_objects_select on storage.objects;
create policy study_docs_objects_select on storage.objects for select to authenticated
  using (bucket_id = 'study-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
drop policy if exists study_docs_objects_update on storage.objects;
create policy study_docs_objects_update on storage.objects for update to authenticated
  using (bucket_id = 'study-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
drop policy if exists study_docs_objects_delete on storage.objects;
create policy study_docs_objects_delete on storage.objects for delete to authenticated
  using (bucket_id = 'study-documents' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.study_stage_label(p_status text) returns text
language sql immutable as $$
  select case p_status
    when 'enquiry' then 'Enquiry received'
    when 'documents' then 'Collecting documents'
    when 'submitted' then 'Application submitted'
    when 'offer' then 'Offer received'
    when 'accepted' then 'Offer accepted'
    when 'visa' then 'Visa stage'
    when 'enrolled' then 'Ready to enrol'
    when 'rejected' then 'Not successful'
    when 'withdrawn' then 'Withdrawn'
    else p_status end
$$;

-- A new application gets the standard checklist and its first timeline entry.
create or replace function public.study_application_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.study_application_documents (application_id, label, description, required, sort_order) values
    (new.id, 'Passport (photo page)', 'A clear scan or photo of the page with your photo and details.', true, 1),
    (new.id, 'Academic transcripts', 'Results from your most recent school or university.', true, 2),
    (new.id, 'Certificates', 'WASSCE, diploma or degree certificates you have.', true, 3),
    (new.id, 'CV', 'Your up to date CV.', true, 4),
    (new.id, 'Statement of purpose', 'Why you want to study this programme. We can help you shape it.', true, 5),
    (new.id, 'Recommendation letters', 'Usually one or two, from a teacher or employer.', false, 6),
    (new.id, 'Proof of funds', 'Bank statements or a sponsor letter showing how tuition and living costs are covered.', false, 7),
    (new.id, 'English test result', 'IELTS, TOEFL or Duolingo, if you already have one.', false, 8);
  insert into public.study_application_events (application_id, kind, title, body, is_public)
  values (new.id, 'stage', public.study_stage_label(new.status), 'We have received your application and a counsellor will review it.', true);
  perform public.notify_admins('general', 'New study application', left(coalesce(new.full_name, 'An applicant') || ', ' || coalesce(nullif(new.program_name, ''), 'study abroad'), 140), '/admin/applications');
  return new;
end $$;
revoke all on function public.study_application_after_insert() from public, anon, authenticated;
drop trigger if exists study_application_after_insert on public.study_applications;
create trigger study_application_after_insert after insert on public.study_applications
  for each row execute function public.study_application_after_insert();

-- The admin_alert trigger from 0040 would notify twice for the same insert.
drop trigger if exists admin_alert on public.study_applications;

create or replace function public.study_application_stage_changed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.last_activity_at := now();
  if new.status is distinct from old.status then
    insert into public.study_application_events (application_id, kind, title, is_public, created_by)
    values (new.id, 'stage', public.study_stage_label(new.status), true, auth.uid());
  end if;
  return new;
end $$;
revoke all on function public.study_application_stage_changed() from public, anon, authenticated;
drop trigger if exists study_application_stage_changed on public.study_applications;
create trigger study_application_stage_changed before update on public.study_applications
  for each row execute function public.study_application_stage_changed();

-- Friendly wording for the customer notification on a stage change (replaces the generic one for applications).
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
  v_title text;
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
    v_old := old.status::text; v_new := new.status::text; v_ref := coalesce(nullif(new.program_name, ''), new.reference);
    v_type := 'general'; v_link := '/auth/study/' || new.id; v_what := 'Study application';
    v_title := 'Study application: ' || public.study_stage_label(v_new);
  end if;

  if v_new is distinct from v_old and v_new <> 'pending' then
    insert into public.notifications (user_id, type, title, message, link)
    values (v_user, v_type, coalesce(v_title, v_what || ' ' || replace(v_new, '_', ' ')), left(v_what || ' ' || v_ref || ' is now ' || replace(case when tg_table_name = 'study_applications' then lower(public.study_stage_label(v_new)) else v_new end, '_', ' ') || '.', 300), v_link);
  end if;
  return new;
end $$;
revoke all on function public.notify_status_change() from public, anon, authenticated;

-- Document review: tell the student, tell staff about uploads.
create or replace function public.study_document_changed() returns trigger
language plpgsql security definer set search_path = public as $$
declare a public.study_applications%rowtype;
begin
  select * into a from public.study_applications where id = new.application_id;
  if new.status is distinct from old.status then
    if new.status = 'uploaded' then
      insert into public.study_application_events (application_id, kind, title, is_public) values (new.application_id, 'document', 'You uploaded: ' || new.label, true);
      perform public.notify_admins('general', 'Document uploaded', left(coalesce(a.full_name, 'A student') || ': ' || new.label, 140), '/admin/applications');
    elsif new.status = 'approved' then
      new.reviewed_at := now();
      insert into public.study_application_events (application_id, kind, title, is_public) values (new.application_id, 'document', 'Document approved: ' || new.label, true);
    elsif new.status = 'rejected' then
      new.reviewed_at := now();
      insert into public.study_application_events (application_id, kind, title, body, is_public) values (new.application_id, 'document', 'Document needs attention: ' || new.label, new.staff_note, true);
      insert into public.notifications (user_id, type, title, message, link)
      values (a.user_id, 'general', 'A document needs attention', left(new.label || case when new.staff_note <> '' then ': ' || new.staff_note else '' end, 300), '/auth/study/' || a.id);
    end if;
    update public.study_applications set last_activity_at = now() where id = new.application_id;
  end if;
  return new;
end $$;
revoke all on function public.study_document_changed() from public, anon, authenticated;
drop trigger if exists study_document_changed on public.study_application_documents;
create trigger study_document_changed before update on public.study_application_documents
  for each row execute function public.study_document_changed();

-- A public note from staff reaches the student.
create or replace function public.study_event_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if new.kind = 'note' and new.is_public then
    select user_id into uid from public.study_applications where id = new.application_id;
    if uid is not null then
      insert into public.notifications (user_id, type, title, message, link)
      values (uid, 'general', 'New update on your application', left(new.title, 300), '/auth/study/' || new.application_id);
    end if;
    update public.study_applications set last_activity_at = now() where id = new.application_id;
  end if;
  return new;
end $$;
revoke all on function public.study_event_notify() from public, anon, authenticated;
drop trigger if exists study_event_notify on public.study_application_events;
create trigger study_event_notify after insert on public.study_application_events
  for each row execute function public.study_event_notify();

-- ---------------------------------------------------------------------------
-- Starting an application, and attaching a document
-- ---------------------------------------------------------------------------
create or replace function public.start_study_application(
  p_destination_id uuid,
  p_institution_id uuid,
  p_program_id uuid,
  p_intake text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_nationality text,
  p_education_level text,
  p_message text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  dest public.study_destinations%rowtype;
  inst public.study_institutions%rowtype;
  prog public.study_programs%rowtype;
  new_id uuid;
begin
  if uid is null then raise exception 'Please sign in to apply.'; end if;
  if length(btrim(coalesce(p_full_name, ''))) < 2 then raise exception 'Enter your full name.'; end if;
  if coalesce(p_email, '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address.'; end if;
  if length(btrim(coalesce(p_phone, ''))) < 6 then raise exception 'Enter a phone number we can reach you on.'; end if;
  if length(coalesce(p_message, '')) > 2000 then raise exception 'Your message is too long (2000 characters at most).'; end if;

  if p_program_id is not null then
    select * into prog from public.study_programs where id = p_program_id and is_active;
    if not found then raise exception 'That programme is not open for applications.'; end if;
    select * into inst from public.study_institutions where id = prog.institution_id and is_active;
    if not found then raise exception 'That institution is not open for applications.'; end if;
  elsif p_institution_id is not null then
    select * into inst from public.study_institutions where id = p_institution_id and is_active;
    if not found then raise exception 'That institution is not open for applications.'; end if;
  end if;

  select * into dest from public.study_destinations where id = coalesce(inst.destination_id, p_destination_id) and is_active;
  if not found then raise exception 'That destination is not open for applications.'; end if;

  if exists (
    select 1 from public.study_applications
    where user_id = uid and destination_id = dest.id
      and coalesce(institution_id, '00000000-0000-0000-0000-000000000000') = coalesce(inst.id, '00000000-0000-0000-0000-000000000000')
      and coalesce(program_id, '00000000-0000-0000-0000-000000000000') = coalesce(prog.id, '00000000-0000-0000-0000-000000000000')
      and status not in ('rejected', 'withdrawn', 'enrolled')
  ) then raise exception 'You already have an application like this in progress.'; end if;

  insert into public.study_applications (
    user_id, destination_id, institution_id, program_id, intake, program_name, university, location,
    full_name, email, phone, nationality, education_level, intended_level, field_of_study, message
  ) values (
    uid, dest.id, inst.id, prog.id, btrim(coalesce(p_intake, '')),
    coalesce(prog.title, 'Study in ' || dest.country_name), coalesce(inst.name, ''), dest.country_name,
    btrim(p_full_name), btrim(p_email), btrim(p_phone), btrim(coalesce(p_nationality, '')),
    btrim(coalesce(p_education_level, '')), coalesce(prog.level, ''), coalesce(prog.field, ''), btrim(coalesce(p_message, ''))
  ) returning id into new_id;
  return new_id;
end $$;
revoke all on function public.start_study_application(uuid, uuid, uuid, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.start_study_application(uuid, uuid, uuid, text, text, text, text, text, text, text) to authenticated;

-- The old form function keeps working with the new stages.
create or replace function public.submit_study_application(
  p_destination_id uuid, p_scholarship_id uuid, p_full_name text, p_email text, p_phone text, p_nationality text,
  p_education_level text, p_intended_level text, p_field_of_study text, p_start_date date, p_message text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  new_id := public.start_study_application(p_destination_id, null, null, '', p_full_name, p_email, p_phone, p_nationality, p_education_level, p_message);
  update public.study_applications set scholarship_id = p_scholarship_id, start_date = p_start_date,
    intended_level = btrim(coalesce(p_intended_level, '')), field_of_study = btrim(coalesce(p_field_of_study, '')),
    program_name = coalesce(nullif(btrim(p_field_of_study), ''), program_name)
  where id = new_id;
  return new_id;
end $$;
revoke all on function public.submit_study_application(uuid, uuid, text, text, text, text, text, text, text, date, text) from public, anon;
grant execute on function public.submit_study_application(uuid, uuid, text, text, text, text, text, text, text, date, text) to authenticated;

create or replace function public.attach_study_document(p_document_id uuid, p_path text, p_name text, p_mime text, p_size bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare d public.study_application_documents%rowtype; a public.study_applications%rowtype;
begin
  select * into d from public.study_application_documents where id = p_document_id;
  if not found then raise exception 'That document request does not exist.'; end if;
  select * into a from public.study_applications where id = d.application_id;
  if a.user_id is distinct from auth.uid() then raise exception 'Not allowed.'; end if;
  if a.status in ('rejected', 'withdrawn') then raise exception 'This application is closed.'; end if;
  if d.status = 'approved' then raise exception 'This document has already been approved.'; end if;
  if p_path not like auth.uid()::text || '/' || a.id::text || '/%' then raise exception 'Invalid file location.'; end if;
  if p_size is null or p_size < 1 or p_size > 10485760 then raise exception 'Files can be up to 10 MB.'; end if;
  update public.study_application_documents
    set status = 'uploaded', file_path = p_path, file_name = left(coalesce(p_name, ''), 200), mime_type = left(coalesce(p_mime, ''), 100),
        size_bytes = p_size, uploaded_at = now(), staff_note = '', reviewed_at = null
    where id = p_document_id;
end $$;
revoke all on function public.attach_study_document(uuid, text, text, text, bigint) from public, anon;
grant execute on function public.attach_study_document(uuid, text, text, text, bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- Existing applications get a checklist and timeline too; deletes go to Trash.
-- ---------------------------------------------------------------------------
insert into public.study_application_documents (application_id, label, description, required, sort_order)
select a.id, d.label, d.description, d.required, d.sort_order
from public.study_applications a
cross join (values
  ('Passport (photo page)', 'A clear scan or photo of the page with your photo and details.', true, 1),
  ('Academic transcripts', 'Results from your most recent school or university.', true, 2),
  ('Certificates', 'WASSCE, diploma or degree certificates you have.', true, 3),
  ('CV', 'Your up to date CV.', true, 4),
  ('Statement of purpose', 'Why you want to study this programme. We can help you shape it.', true, 5),
  ('Recommendation letters', 'Usually one or two, from a teacher or employer.', false, 6),
  ('Proof of funds', 'Bank statements or a sponsor letter showing how tuition and living costs are covered.', false, 7),
  ('English test result', 'IELTS, TOEFL or Duolingo, if you already have one.', false, 8)
) as d(label, description, required, sort_order)
where not exists (select 1 from public.study_application_documents x where x.application_id = a.id);

insert into public.study_application_events (application_id, kind, title, body, is_public, created_at)
select a.id, 'stage', public.study_stage_label(a.status), 'Application received.', true, a.created_at
from public.study_applications a
where not exists (select 1 from public.study_application_events e where e.application_id = a.id);

do $$
declare t text;
begin
  foreach t in array array['study_institutions', 'study_programs'] loop
    execute format('drop trigger if exists trash_capture on public.%I', t);
    execute format('create trigger trash_capture before delete on public.%I for each row execute function public.trash_capture()', t);
  end loop;
end $$;
