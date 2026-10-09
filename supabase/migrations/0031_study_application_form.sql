-- 0031_study_application_form.sql
-- A real study abroad application: applicants submit from the site through one
-- SECURITY DEFINER function, so they cannot set their own status or user_id,
-- and staff get the applicant's details and a notes field.

alter table public.study_applications
  add column if not exists destination_id uuid references public.study_destinations (id) on delete set null,
  add column if not exists scholarship_id uuid references public.scholarships (id) on delete set null,
  add column if not exists full_name text not null default '',
  add column if not exists email text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists nationality text not null default '',
  add column if not exists education_level text not null default '',
  add column if not exists intended_level text not null default '',
  add column if not exists field_of_study text not null default '',
  add column if not exists message text not null default '',
  add column if not exists admin_notes text not null default '';

create index if not exists study_applications_destination_idx on public.study_applications (destination_id);
create index if not exists study_applications_status_idx on public.study_applications (status, created_at desc);

alter table public.study_applications drop constraint if exists study_applications_status_valid;
alter table public.study_applications add constraint study_applications_status_valid
  check (status in ('pending', 'reviewing', 'approved', 'rejected', 'completed'));

create or replace function public.submit_study_application(
  p_destination_id uuid,
  p_scholarship_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_nationality text,
  p_education_level text,
  p_intended_level text,
  p_field_of_study text,
  p_start_date date,
  p_message text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  dest public.study_destinations%rowtype;
  new_id uuid;
begin
  if uid is null then raise exception 'Please sign in to apply.'; end if;
  if length(btrim(coalesce(p_full_name, ''))) < 2 then raise exception 'Enter your full name.'; end if;
  if coalesce(p_email, '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address.'; end if;
  if length(btrim(coalesce(p_phone, ''))) < 6 then raise exception 'Enter a phone number we can reach you on.'; end if;
  if length(coalesce(p_message, '')) > 2000 then raise exception 'Your message is too long (2000 characters at most).'; end if;
  if p_start_date is not null and p_start_date < current_date then raise exception 'Choose a start date in the future.'; end if;

  select * into dest from public.study_destinations where id = p_destination_id and is_active;
  if not found then raise exception 'That destination is not open for applications.'; end if;

  if p_scholarship_id is not null and not exists (
    select 1 from public.scholarships where id = p_scholarship_id and destination_id = dest.id and is_active
  ) then raise exception 'That scholarship is not available for this destination.'; end if;

  if exists (
    select 1 from public.study_applications
    where user_id = uid and destination_id = dest.id and status in ('pending', 'reviewing')
  ) then raise exception 'You already have an application for % in progress.', dest.country_name; end if;

  insert into public.study_applications (
    user_id, destination_id, scholarship_id, program_name, university, location, start_date, duration,
    full_name, email, phone, nationality, education_level, intended_level, field_of_study, message
  ) values (
    uid, dest.id, p_scholarship_id,
    coalesce(nullif(btrim(p_field_of_study), ''), 'Study in ' || dest.country_name),
    '', dest.country_name, p_start_date, '',
    btrim(p_full_name), btrim(p_email), btrim(p_phone), btrim(coalesce(p_nationality, '')),
    btrim(coalesce(p_education_level, '')), btrim(coalesce(p_intended_level, '')),
    btrim(coalesce(p_field_of_study, '')), btrim(coalesce(p_message, ''))
  ) returning id into new_id;

  return new_id;
end $$;
revoke all on function public.submit_study_application(uuid, uuid, text, text, text, text, text, text, text, date, text) from public, anon;
grant execute on function public.submit_study_application(uuid, uuid, text, text, text, text, text, text, text, date, text) to authenticated;

-- Deleted applications go to the trash like the other admin content.
drop trigger if exists trash_capture on public.study_applications;
create trigger trash_capture before delete on public.study_applications
  for each row execute function public.trash_capture();
