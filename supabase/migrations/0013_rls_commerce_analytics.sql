-- 0013_rls_commerce_analytics.sql
-- Row level security for the financial records, the server only logs and the
-- analytics domain.
--
-- Depends on public.is_admin() from 0010.
--
-- Every table here had RLS enabled and zero policies after 0012, which denied
-- everything. Most of this file is about what is NOT granted:
--   Financial records. The owner reads, admins read and update. No client
--     inserts, no client deletes, no owner updates.
--   Server logs and the daily rollup. Admins read. Nothing else.
--   Behavioural analytics. Anyone inserts, within pinned limits. Admins read.
--   Analytics snapshots that carry money or personal data. Admins read.
--
-- Every write refused below is made by server code, either with the service
-- role key or through a security definer function. Neither is subject to RLS,
-- so neither needs a policy. A policy added "so the server can write" would be
-- a door for the browser as well, because the browser holds the same anon and
-- authenticated roles that policy would have to name.


-- ---------------------------------------------------------------------------
-- Financial records: bookings, orders, vacation_bookings, paystack_transactions
-- ---------------------------------------------------------------------------
-- One rule, applied by loop because it is identical on all four:
--   <table>_select_own    select  to authenticated  using user_id = auth.uid()
--   <table>_select_admin  select  to authenticated  using is_admin()
--   <table>_update_admin  update  to authenticated  using and with check is_admin()
-- paystack_transactions also gets column privileges, in the next section.
--
-- NO INSERT POLICY, for any role. design.md B6 requires the server to recompute
-- every total from the database before a charge. A client that could insert one
-- of these rows would choose its own total_price, unit_price or amount. The
-- CHECK constraints in 0003, 0005 and 0006 only prove a row is internally
-- consistent, for example total_price = unit_price * quantity. They do not
-- prove the price is the catalogue price, and a consistent forged price still
-- passes them. These rows are written by server code that reads the price from
-- tours, market_products or vacation_rentals itself.
--
-- NO DELETE POLICY, for any role, admins included. These records must survive.
-- The RESTRICT foreign keys already stop a parent delete from taking them, and
-- the missing policy stops a direct delete. A booking made in error is
-- cancelled by status, not removed.
--
-- NO OWNER UPDATE, so a user cannot cancel their own booking from the client.
-- This was considered and refused, for three reasons in order of weight.
--   1. It cannot be expressed safely. A with check that lets only status move
--      would have to pin every other column to its stored value, the way 0010
--      pins profiles.is_admin, with one subselect per column. That is about
--      twenty on bookings and vacation_bookings, and the list fails OPEN: the
--      next migration that adds a column leaves it writable by the owner with
--      nothing to report it. Column level UPDATE privileges are the proper tool
--      for "only this column", but they attach to a role, and admins run as the
--      same authenticated role. Restricting authenticated to update (status)
--      would strip admins of every other column too.
--   2. Cancellation is not a one column change. A cancelled paid booking needs
--      a refund decision. A cancelled tour booking releases spots on its
--      schedule, which design.md B8 treats as one operation with the booking
--      itself. A late cancellation may not be allowed at all. A bare row update
--      does none of that and would leave a booking cancelled with its money
--      still taken and its seats still held.
--   3. Unlike payment_status, the booking and order status columns have no
--      transition trigger. Nothing in the database would stop an owner moving
--      cancelled back to confirmed.
-- Cancellation belongs in a Route Handler or a security definer function that
-- checks ownership, checks the booking is still cancellable, and performs the
-- whole operation in one transaction.
--
-- ADMIN UPDATE is granted for staff correction, for example a tracking number
-- on an order or a confirmed status on a booking. The payment status trigger
-- from 0009 still fires for an admin, so a settled transaction cannot be
-- reopened through this policy either.
--
-- NULL OWNERS. paystack_transactions.user_id is nullable for guest checkout.
-- user_id = auth.uid() evaluates to NULL, not true, when user_id is NULL, so a
-- guest transaction matches no user's own row policy and only admins see it.
-- The three booking tables declare user_id NOT NULL, so the case cannot arise
-- there. Do not rewrite the predicate as "is not distinct from" or with
-- coalesce. auth.uid() is also NULL for anon, and either form would hand every
-- guest transaction to every logged out caller if the policy were ever widened
-- to anon.
do $$
declare t text;
begin
  foreach t in array array['bookings', 'orders', 'vacation_bookings', 'paystack_transactions'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))',
      t || '_select_own', t);
    execute format('comment on policy %I on public.%I is %L', t || '_select_own', t,
      'A signed in user reads their own rows. A NULL user_id matches nobody, so guest rows are admin only.');

    execute format('drop policy if exists %I on public.%I', t || '_select_admin', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_admin())',
      t || '_select_admin', t);
    execute format('comment on policy %I on public.%I is %L', t || '_select_admin', t,
      'Admins read every row, for staff tooling and reconciliation.');

    execute format('drop policy if exists %I on public.%I', t || '_update_admin', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_update_admin', t);
    execute format('comment on policy %I on public.%I is %L', t || '_update_admin', t,
      'Admins correct any row. No client insert, no owner update and no delete exist, see 0013.');
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- paystack_transactions.authorization_code, hidden from every client
-- ---------------------------------------------------------------------------
-- authorization_code is Paystack's reusable card token. Together with the secret
-- key it charges the same card again without the cardholder present. The owner
-- has no use for it: an account page shows card_type, bank and last4, which
-- Paystack returns for exactly that purpose. No staff screen needs it either.
-- Only a server side recurring charge does, and that runs with the service
-- role. So no anon or authenticated caller reads it, owner and admin alike. The
-- token is useless without the secret key, but a credential nobody needs to see
-- is not worth defending with an argument about who holds which key.
--
-- HOW, and why this does not copy 0011. A column level REVOKE has no effect
-- while the role still holds table level SELECT, because table level SELECT
-- covers every column. Supabase grants table level privileges on public tables
-- to anon and authenticated by default. So table level SELECT is revoked here,
-- and SELECT is granted back column by column on every column except
-- authorization_code. Revoking table level SELECT also clears any earlier
-- column grants, so rerunning this pair lands in the same state.
--
-- Consequences, all deliberate.
--   A column added to this table later is NOT readable by clients until it is
--   added to the grant below. That fails closed, which is the right direction
--   for a payments table.
--   Client queries must name their columns. select=*, or an admin update that
--   asks for every column back, is refused with a permission error. design.md
--   B8 already requires named columns.
--   The webhook handler must not copy Paystack's authorization object into
--   metadata, which stays readable by the owner.
revoke select on public.paystack_transactions from anon, authenticated;
grant select (
  id, legacy_id, reference, amount, currency, status, user_id,
  email, name, phone,
  channel, card_type, bank, last4,
  metadata, product_ids, order_id,
  created_at, updated_at, paid_at
) on public.paystack_transactions to authenticated;

comment on column public.paystack_transactions.authorization_code is
  'Reusable Paystack card token. Not readable by anon or authenticated, owner and admin included. Table level SELECT is revoked and every other column is granted back by name in 0013. Service role only.';


-- ---------------------------------------------------------------------------
-- Admin read, on every non financial table in this file
-- ---------------------------------------------------------------------------
-- One rule for ten tables: admins select, nobody else does. None of these rows
-- belongs to the visitor who caused it. 0009 records that analytics rows are
-- not user owned data a user gets to browse, and the two logs are server
-- records. Insert policies, where any exist, follow in the next section. No
-- table in this list has an update or delete policy for any role, admins
-- included. Logs and telemetry are evidence and are not edited from a client,
-- and the rollup is recomputed by its job, not patched by hand.
do $$
declare t text;
begin
  foreach t in array array[
    'paystack_webhook_logs', 'email_log',
    'analytics_sessions', 'analytics_user_activities', 'analytics_likes',
    'analytics_social_shares', 'analytics_tour_bookings',
    'analytics_market_purchases', 'analytics_contact_submissions',
    'analytics_daily_summary'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_admin', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_admin())',
      t || '_select_admin', t);
    execute format('comment on policy %I on public.%I is %L', t || '_select_admin', t,
      'Admins read. No other client access except any insert policy defined in 0013.');
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- Tables with NO client write at all
-- ---------------------------------------------------------------------------
-- paystack_webhook_logs. Written by the webhook route with the service role,
-- before the signature is even checked, per design.md B6. A client insert
-- would let anyone plant fake "arrived" events in the record used to replay
-- and debug payments. 0009 already marks it not anon insertable.
--
-- email_log. Emails are sent by the server, so the server records them. A
-- client insert could forge delivery history, and a client update could mark
-- a failed send as delivered.
--
-- analytics_daily_summary. Written by the rollup job as an upsert on
-- summary_date. A client insert would inject revenue and user counts straight
-- into the dashboard. The job's upsert would overwrite a forged row only for a
-- day it recomputes, and a forged row for any other day would stand. The
-- numbers are the job's to write.
--
-- analytics_tour_bookings and analytics_market_purchases. DEVIATION from the
-- "anyone inserts" rule in architecture.md section 6, deliberately. These rows
-- carry total_amount and amount, and 0009 records that the daily rollup sums
-- revenue from them. A client insert policy would let any visitor add revenue
-- to the dashboard, which is the same client supplied amount design.md B6
-- forbids, one table removed. It also has no legitimate caller: a snapshot is
-- taken when a real booking or order is written, the client cannot write those
-- (see above), and the code that can writes the snapshot in the same step. If
-- a client insert is ever wanted here, add these two tables to the insert loop
-- below. Do not do it without first moving the rollup's revenue figure onto
-- bookings, orders and vacation_bookings.
--
-- analytics_contact_submissions. DEVIATION from the "anyone inserts" rule,
-- deliberately. The row holds a name, an email, a phone number and a free text
-- message, which is column for column the same data contact_messages already
-- accepts from anyone under 0012. A second public insert would put every
-- visitor's personal data in two places with two retention stories, and open
-- a second unthrottled spam target with no is_read triage behind it. It also
-- adds nothing: the submissions per day panel is a count, and
-- contact_messages.created_at answers it. If this table must keep filling, the
-- contact form's Route Handler writes it with the service role in the same
-- step as contact_messages, so the two cannot diverge.


-- ---------------------------------------------------------------------------
-- Behavioural analytics: anyone inserts
-- ---------------------------------------------------------------------------
-- architecture.md section 6: analytics tables accept inserts from anyone. Both
-- roles are named, for the reason 0011 gives about public reads: a signed in
-- visitor is not anon, and a policy targeting anon alone would stop tracking
-- the moment someone logs in.
--
-- Each insert pins two things.
--   user_id is NULL or the caller's own id, so a visitor cannot attribute
--   activity to somebody else. For anon, auth.uid() is NULL, so the only value
--   anon can write is NULL.
--   legacy_id is NULL. legacy_id carries a unique index and is filled only by
--   the import. A client that could set it could plant rows that pass for
--   imported history, or take a legacy id before the import runs and make the
--   import fail on that index.
--
-- These rows are untrusted by nature. action, page_visited, ip_address,
-- user_agent and created_at are whatever the client sent, and RLS cannot rate
-- limit. Treat them as telemetry, never as evidence of a login or a purchase.
--
-- No update or delete policy. An update policy would need a way to tell whose
-- row it is, and on an anonymous row nothing in the row identifies the caller.

-- analytics_user_activities, analytics_likes, analytics_social_shares share
-- exactly the two pins above and nothing more.
do $$
declare t text;
begin
  foreach t in array array['analytics_user_activities', 'analytics_likes', 'analytics_social_shares'] loop
    execute format('drop policy if exists %I on public.%I', t || '_insert_public', t);
    execute format(
      'create policy %I on public.%I for insert to anon, authenticated with check ((user_id is null or user_id = (select auth.uid())) and legacy_id is null)',
      t || '_insert_public', t);
    execute format('comment on policy %I on public.%I is %L', t || '_insert_public', t,
      'Anyone records an event. user_id must be NULL or your own, and legacy_id must be NULL because only the import sets it.');
  end loop;
end $$;

-- analytics_sessions adds one pin: page_count starts at 0. Without it a visitor
-- could open a session already claiming thousands of page views.
--
-- Consequence worth knowing: with no client update policy, page_count and the
-- updated_at heartbeat cannot be advanced from the browser, so a session's
-- duration and page count stay at their insert values unless the server moves
-- them. Page views are also recorded one row each in
-- analytics_user_activities with action 'view', which is the reliable count.
drop policy if exists analytics_sessions_insert_public on public.analytics_sessions;
create policy analytics_sessions_insert_public on public.analytics_sessions
  for insert to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and legacy_id is null
    and page_count = 0
  );
comment on policy analytics_sessions_insert_public on public.analytics_sessions is
  'Anyone opens a session. user_id must be NULL or your own, legacy_id must be NULL, and page_count starts at 0.';
