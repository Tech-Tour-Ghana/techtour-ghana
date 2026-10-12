-- Tell a counsellor when a study application is assigned to them.
-- Skipped when they assign it to themselves.
create or replace function public.study_application_stage_changed()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  new.last_activity_at := now();
  if new.status is distinct from old.status then
    insert into public.study_application_events (application_id, kind, title, is_public, created_by)
    values (new.id, 'stage', public.study_stage_label(new.status), true, auth.uid());
  end if;
  if new.assigned_to is not null
     and new.assigned_to is distinct from old.assigned_to
     and new.assigned_to is distinct from auth.uid() then
    insert into public.notifications (user_id, type, title, message, link)
    values (
      new.assigned_to, 'general', 'Application assigned to you',
      left(coalesce(new.full_name, 'A student') || ', ' || coalesce(nullif(new.program_name, ''), 'study abroad'), 140),
      '/admin/applications'
    );
  end if;
  return new;
end $$;
