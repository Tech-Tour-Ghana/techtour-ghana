-- 0012_rls_engagement.sql
-- Row level security for careers and the inbound message tables.
--
-- Depends on public.is_admin() from 0010.
--
-- These tables invert the usual shape. Public content is read by everyone and
-- written by admins. These are written by everyone and read only by admins.
-- Getting the direction backwards here would publish the contact inbox.


-- ---------------------------------------------------------------------------
-- Careers, which is ordinary public content
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['job_categories','job_openings'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_public', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (is_active)', t || '_select_public', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_admin', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', t || '_insert_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_admin', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_update_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_admin', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t || '_delete_admin', t);
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- Inbound messages: anyone writes, only admins read
-- ---------------------------------------------------------------------------
-- There is deliberately NO select policy for anon or authenticated on any of
-- these. A submitter cannot read back what they sent, and that is correct:
-- these tables have no owner column to scope a read to, so any select policy
-- broad enough to show you your own message would show you everyone else's.
-- If a user facing "your submissions" view is ever wanted, it needs a user_id
-- column and a policy scoped to auth.uid(), not a relaxation of these.
--
-- The insert policies constrain what may be written, not just who may write.
-- Each one pins the staff workflow columns to their defaults so a visitor
-- cannot post a message that is already marked read, already resolved, or
-- carrying internal notes.

drop policy if exists contact_messages_insert_public on public.contact_messages;
create policy contact_messages_insert_public on public.contact_messages
  for insert to anon, authenticated
  with check (is_read = false);
comment on policy contact_messages_insert_public on public.contact_messages is
  'Anyone submits the contact form. is_read is pinned false so a submission cannot arrive pre-dismissed.';

drop policy if exists contact_messages_select_admin on public.contact_messages;
create policy contact_messages_select_admin on public.contact_messages
  for select to authenticated using (public.is_admin());

drop policy if exists contact_messages_update_admin on public.contact_messages;
create policy contact_messages_update_admin on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists contact_messages_delete_admin on public.contact_messages;
create policy contact_messages_delete_admin on public.contact_messages
  for delete to authenticated using (public.is_admin());


drop policy if exists newsletter_subscribers_insert_public on public.newsletter_subscribers;
create policy newsletter_subscribers_insert_public on public.newsletter_subscribers
  for insert to anon, authenticated
  with check (is_active = true);
comment on policy newsletter_subscribers_insert_public on public.newsletter_subscribers is
  'Anyone subscribes. No select policy exists for the public, so the subscriber list can never be enumerated, not even to check whether an address is already on it.';

drop policy if exists newsletter_subscribers_select_admin on public.newsletter_subscribers;
create policy newsletter_subscribers_select_admin on public.newsletter_subscribers
  for select to authenticated using (public.is_admin());

drop policy if exists newsletter_subscribers_update_admin on public.newsletter_subscribers;
create policy newsletter_subscribers_update_admin on public.newsletter_subscribers
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists newsletter_subscribers_delete_admin on public.newsletter_subscribers;
create policy newsletter_subscribers_delete_admin on public.newsletter_subscribers
  for delete to authenticated using (public.is_admin());


-- Suggestions and issue reports carry a nullable user_id. The insert policy
-- forces it to be either null or your own id, so a submission cannot be
-- attributed to somebody else. Status, votes and the internal notes are pinned
-- to their defaults for the same reason as above.
drop policy if exists suggestions_insert_public on public.suggestions;
create policy suggestions_insert_public on public.suggestions
  for insert to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and status = 'pending'
    and is_read = false
    and votes = 0
  );
comment on policy suggestions_insert_public on public.suggestions is
  'Anyone submits a suggestion. user_id must be null or your own, and status, is_read and votes are pinned so a submission cannot arrive pre-approved or pre-voted.';

drop policy if exists suggestions_select_admin on public.suggestions;
create policy suggestions_select_admin on public.suggestions
  for select to authenticated using (public.is_admin());

drop policy if exists suggestions_update_admin on public.suggestions;
create policy suggestions_update_admin on public.suggestions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists suggestions_delete_admin on public.suggestions;
create policy suggestions_delete_admin on public.suggestions
  for delete to authenticated using (public.is_admin());


drop policy if exists issue_reports_insert_public on public.issue_reports;
create policy issue_reports_insert_public on public.issue_reports
  for insert to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and status = 'new'
    and is_read = false
    and resolution_notes = ''
  );
comment on policy issue_reports_insert_public on public.issue_reports is
  'Anyone reports an issue. resolution_notes is pinned empty because it is internal staff writing, and priority is left free so a reporter can say how urgent it feels.';

drop policy if exists issue_reports_select_admin on public.issue_reports;
create policy issue_reports_select_admin on public.issue_reports
  for select to authenticated using (public.is_admin());

drop policy if exists issue_reports_update_admin on public.issue_reports;
create policy issue_reports_update_admin on public.issue_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists issue_reports_delete_admin on public.issue_reports;
create policy issue_reports_delete_admin on public.issue_reports
  for delete to authenticated using (public.is_admin());
