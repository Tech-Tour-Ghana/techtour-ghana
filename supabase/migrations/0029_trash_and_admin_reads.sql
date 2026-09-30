-- 0029_trash_and_admin_reads.sql
-- 1. Trash: every admin delete on the listed tables is copied into trash_items
--    first, so it can be restored. Existing delete buttons keep working.
-- 2. Admin read fixes for the Tours admin page (inactive rows, tour_reviews).

-- ---------------------------------------------------------------- trash
create table if not exists public.trash_items (
  id          bigint generated always as identity primary key,
  table_name  text        not null,
  record_id   text        not null,
  label       text        not null default '',
  data        jsonb       not null,
  batch       bigint      not null,          -- rows removed by one delete (parent + cascaded children)
  deleted_by  uuid,
  deleted_at  timestamptz not null default now()
);
create index if not exists trash_items_deleted_at_idx on public.trash_items (deleted_at desc);
create index if not exists trash_items_batch_idx on public.trash_items (batch, id);

alter table public.trash_items enable row level security;
drop policy if exists trash_items_select_admin on public.trash_items;
create policy trash_items_select_admin on public.trash_items
  for select to authenticated using (public.is_admin());
revoke all on public.trash_items from anon, authenticated;
grant select on public.trash_items to authenticated;

create or replace function public.trash_capture() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jsonb := to_jsonb(old);
begin
  insert into public.trash_items (table_name, record_id, label, data, batch, deleted_by)
  values (
    tg_table_name, coalesce(j->>'id', ''),
    left(coalesce(nullif(j->>'title',''), nullif(j->>'name',''), nullif(j->>'full_name',''), nullif(j->>'subject',''),
                  nullif(j->>'email',''), nullif(j->>'user_name',''), nullif(j->>'slug',''), j->>'id', ''), 200),
    j, txid_current(), auth.uid()
  );
  return old;
end $$;
revoke all on function public.trash_capture() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'tours','tour_categories','tour_schedules','tour_reviews','bookings',
    'blog_posts','market_products','market_categories','artisans','destinations','testimonials',
    'team_members','job_openings','tech_innovations','tech_events','tech_resources',
    'study_destinations','scholarships','contact_messages','newsletter_subscribers'
  ] loop
    execute format('drop trigger if exists trash_capture on public.%I', t);
    execute format('create trigger trash_capture before delete on public.%I for each row execute function public.trash_capture()', t);
  end loop;
end $$;

-- Restore one item and everything deleted with it (same batch), parents first.
create or replace function public.restore_trash(p_id bigint) returns integer
language plpgsql security definer set search_path = public as $$
declare b bigint; r record; cols text; n integer := 0; c integer;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  select batch into b from public.trash_items where id = p_id;
  if b is null then raise exception 'Item not found'; end if;
  for r in select * from public.trash_items where batch = b order by id loop
    select string_agg(quote_ident(column_name), ',' order by ordinal_position) into cols
      from information_schema.columns
      where table_schema = 'public' and table_name = r.table_name and is_generated = 'NEVER';
    execute format('alter table public.%I disable trigger trash_capture', r.table_name);
    execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I, $1) on conflict do nothing',
                   r.table_name, cols, cols, r.table_name) using r.data;
    get diagnostics c = row_count;
    execute format('alter table public.%I enable trigger trash_capture', r.table_name);
    n := n + c;
  end loop;
  delete from public.trash_items where batch = b;
  return n;
end $$;
revoke all on function public.restore_trash(bigint) from public, anon;
grant execute on function public.restore_trash(bigint) to authenticated;

-- p_id null empties the whole trash.
create or replace function public.purge_trash(p_id bigint default null) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  delete from public.trash_items where p_id is null or id = p_id;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.purge_trash(bigint) from public, anon;
grant execute on function public.purge_trash(bigint) to authenticated;

-- ------------------------------------------------- tours admin reads
-- Admins could only see active tours, categories and departures.
drop policy if exists tours_select_admin on public.tours;
create policy tours_select_admin on public.tours for select to authenticated using (public.is_admin());
drop policy if exists tour_categories_select_admin on public.tour_categories;
create policy tour_categories_select_admin on public.tour_categories for select to authenticated using (public.is_admin());
drop policy if exists tour_schedules_select_admin on public.tour_schedules;
create policy tour_schedules_select_admin on public.tour_schedules for select to authenticated using (public.is_admin());

-- 0014 hid user_email, moderation_notes and is_flagged from client queries, so the
-- moderation screen reads reviews through this admin-only function.
create or replace function public.admin_tour_reviews() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return coalesce((
    select jsonb_agg(to_jsonb(r) || jsonb_build_object('tours', case when t.id is null then null else jsonb_build_object('title', t.title) end) order by r.created_at desc)
    from public.tour_reviews r left join public.tours t on t.id = r.tour_id
  ), '[]'::jsonb);
end $$;
revoke all on function public.admin_tour_reviews() from public, anon;
grant execute on function public.admin_tour_reviews() to authenticated;
