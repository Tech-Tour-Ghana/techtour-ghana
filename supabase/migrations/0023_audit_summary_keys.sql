-- 0023_audit_summary_keys.sql
-- Testimonials, study applications and social links have no title or name
-- column, so their audit rows had a blank summary. Look at author_name,
-- program_name and platform as well. Still never an email or message text.

create or replace function public.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_row jsonb;
  old_row jsonb;
  changed text[] := '{}';
  key text;
begin
  if auth.uid() is null or not public.is_admin() then
    return null;
  end if;

  if tg_op = 'DELETE' then
    new_row := to_jsonb(old);
  else
    new_row := to_jsonb(new);
  end if;

  if tg_op = 'UPDATE' then
    old_row := to_jsonb(old);
    for key in select jsonb_object_keys(new_row) loop
      if key <> 'updated_at' and (new_row -> key) is distinct from (old_row -> key) then
        changed := changed || key;
      end if;
    end loop;
    if cardinality(changed) = 0 then
      return null;
    end if;
  end if;

  insert into public.audit_log (actor_id, action, table_name, record_id, summary, changed_columns)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(new_row ->> 'id', ''),
    left(coalesce(
      new_row ->> 'title', new_row ->> 'name', new_row ->> 'label', new_row ->> 'order_number',
      new_row ->> 'slug', new_row ->> 'author_name', new_row ->> 'program_name', new_row ->> 'platform', ''
    ), 200),
    changed
  );
  return null;
end;
$$;

revoke all on function public.audit_admin_change() from public, anon, authenticated;
