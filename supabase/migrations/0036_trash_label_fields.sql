-- 0036_trash_label_fields.sql
-- Trash rows for link tables showed their raw id because trash_capture() did
-- not look at label, platform, country_name, program_name or author_name.
create or replace function public.trash_capture() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(old);
begin
  insert into public.trash_items (table_name, record_id, label, data, batch, deleted_by)
  values (
    tg_table_name, coalesce(j->>'id', ''),
    left(coalesce(nullif(j->>'title',''), nullif(j->>'name',''), nullif(j->>'full_name',''), nullif(j->>'author_name',''),
                  nullif(j->>'label',''), nullif(j->>'country_name',''), nullif(j->>'program_name',''), nullif(j->>'subject',''),
                  nullif(j->>'email',''), nullif(j->>'user_name',''), nullif(j->>'platform',''), nullif(j->>'slug',''), j->>'id', ''), 200),
    j, txid_current(), auth.uid()
  );
  return old;
end $$;

update public.trash_items set label = coalesce(nullif(data->>'label',''), label) where label = record_id and data ? 'label';
