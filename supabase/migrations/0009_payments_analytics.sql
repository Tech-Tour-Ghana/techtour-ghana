-- 0009_payments_analytics.sql
-- Payments and analytics, from paystack_paystacktransaction,
-- paystack_paystackwebhooklog, analytics_useractivity, analytics_usersession,
-- analytics_userlike, analytics_socialshare, analytics_tourbooking,
-- analytics_marketpurchase, analytics_contactsubmission and
-- analytics_useranalytics, plus the merged email_log required by
-- architecture.md section 5.
--
-- Two things in this file behave differently from every migration before it.
--
-- 1. The payments tables are not built from extracted-schema.sql, because
--    neither paystack table is in it. See the note above paystack_transactions.
-- 2. The analytics tables keep their analytics_ prefix instead of dropping it,
--    which is a deliberate exception to the architecture.md section 5 naming
--    convention. Dropping it produces tour_bookings beside bookings,
--    market_purchases beside orders, contact_submissions beside
--    contact_messages and sessions beside user_sessions. Those are not
--    synonyms, they are a denormalised dashboard feed sitting next to the
--    record of truth, and a name that invites the confusion is a name that
--    eventually gets a revenue report run off the wrong table. The prefix here
--    is a domain, not a Django app name.
--
-- Every analytics table in this file takes inserts from anyone, signed in or
-- not, and is read only by admins. That is architecture.md section 6 and it is
-- repeated in each table comment for task 1.6. None of them has a self-read
-- case: analytics rows are not user-owned data the user gets to browse.
--
-- No RLS policies in this file. That is task 1.6.


-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
-- Same idempotent DO block form as 0001.
--
-- public.payment_status and public.currency_code from 0001 are REUSED by
-- paystack_transactions. No parallel payment or currency enum is created here.
-- 0001 derived both of those value sets from PaystackTransaction itself, so
-- this file is the table they were written for.

-- email_status. Merged value set for the merged email_log table below. The two
-- old columns were pages_emaillog.status character varying(20) default
-- 'queued' and analytics_emaillog.status character varying(20). Values from
-- both choices lists:
--   pages.EmailLog.STATUS_CHOICES:     sent, failed, queued, opened, clicked,
--                                      bounced, unsubscribed
--   analytics.EmailLog.STATUS_CHOICES: sent, failed, pending
-- The union, minus the one collision. analytics 'pending' and pages 'queued'
-- are the same state under two spellings, so the enum keeps 'queued' and the
-- import maps analytics 'pending' -> 'queued'.
do $$ begin
  create type public.email_status as enum
    ('queued', 'sent', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed');
exception when duplicate_object then null;
end $$;

-- activity_action. The old column was analytics_useractivity.action character
-- varying(100). Values from UserActivity.ACTION_CHOICES in analytics/models.py:
--   view, login, google_login, email_login, logout, click, purchase, booking,
--   contact, export, import, delete, edit, create
-- 'import' and 'delete' are not reserved as enum labels, they are quoted here
-- only for consistency with the rest of the list.
do $$ begin
  create type public.activity_action as enum
    ('view', 'login', 'google_login', 'email_login', 'logout', 'click',
     'purchase', 'booking', 'contact', 'export', 'import', 'delete',
     'edit', 'create');
exception when duplicate_object then null;
end $$;

-- share_platform. NOT public.social_platform, which 0007 already created for
-- pages_sociallink with a different value set. Naming both the same would have
-- been swallowed silently by the idempotent DO block below, leaving this column
-- unable to record email or copy_link.
-- The old column was analytics_socialshare.platform character
-- varying(50). Values from the inline choices list on SocialShare.platform in
-- analytics/models.py:
--   facebook, twitter, linkedin, whatsapp, email, copy_link, other
--
-- Deliberately NOT shared with pages_sociallink.platform, which is a different
-- list on a different model (it enumerates the company's own profile links,
-- and has no copy_link or email because you cannot have a footer icon for
-- those). 0007 owns that one.
do $$ begin
  create type public.share_platform as enum
    ('facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'copy_link', 'other');
exception when duplicate_object then null;
end $$;

-- Deliberately NOT enums, and this is the interesting call in the file:
-- analytics_tourbooking.status and analytics_marketpurchase.status. Both are
-- character varying(50) with a Python default of 'pending' and NO choices list
-- on the Django field. They are copies of a status that was read off
-- tours_booking and pages_order at the moment the analytics row was written,
-- which means the authoritative sets are public.booking_status and
-- public.order_status from 0001 and 0005. They stay text anyway, because these
-- are snapshot rows recording what the source said at the time, an unconstrained
-- varchar for years means the dump can hold anything including values those
-- enums never had, and failing the import of an analytics mirror over a stale
-- status string would be the tail wagging the dog. If the dump turns out to be
-- clean, tightening them later is one ALTER TABLE per column.
-- Same reasoning applies to analytics_marketpurchase.payment_method, which had
-- no choices list either.


-- ---------------------------------------------------------------------------
-- paystack_transactions, from paystack_paystacktransaction
-- ---------------------------------------------------------------------------
-- SOURCE NOTE, read this before importing.
-- Neither paystack_paystacktransaction nor paystack_paystackwebhooklog appears
-- in docs/old-database-to-transfer-to-supabase/extracted-schema.sql. The app is
-- in INSTALLED_APPS and the models are complete, but the tables are not in the
-- dump, so either the Django migration never ran against the production
-- database or the app was added after the dump was taken. The definitions below
-- are therefore built from paystack/models.py, which is the only source there
-- is, and there is nothing to import into them. Expect these two tables to be
-- empty after the migration and do not treat that as a failed import.
-- Consequence: every column comment about old nullability below describes what
-- Django WOULD have created, not a column that was observed.
--
-- This is a financial record. Both of the delete rules and the state machine
-- trigger below follow from that and from design.md B6.

create table if not exists public.paystack_transactions (
  id uuid primary key default gen_random_uuid(),
  -- TEMPORARY as everywhere else, and almost certainly unused here given the
  -- source note above. Kept so the shape matches the other tables and so a
  -- later-discovered dump of these rows has somewhere to land.
  legacy_id bigint,

  -- The Paystack reference. unique=True and db_index=True on the Django field,
  -- and design.md B6 requires it to be unique and indexed because the webhook
  -- looks a transaction up by exactly this. The unique index below is the
  -- structural half of webhook idempotency, see the comment there.
  reference text not null,

  -- Money. design.md B6: numeric(10,2) in the database, minor units on the
  -- wire, never a float. The Django field had no default and neither does this.
  amount numeric(10,2) not null,
  currency public.currency_code not null default 'GHS',

  -- public.payment_status from 0001, whose value set was taken from this
  -- model's own STATUS_CHOICES. Movement between values is enforced by the
  -- trigger below, not by convention.
  status public.payment_status not null default 'pending',

  -- RESTRICT, deliberately, and this is a DEVIATION from the Django field,
  -- which declared on_delete=SET_NULL. A Paystack transaction is a financial
  -- record and gets the same treatment bookings in 0003 and orders in 0005
  -- got: deleting a profile must not quietly rewrite the payment history that
  -- profile is part of. SET_NULL does not destroy the row, but it does destroy
  -- the link between a charge and the person charged, which is the part a
  -- chargeback or a tax question needs. A right-to-erasure request is satisfied
  -- by anonymising the profile row, scrubbing name, email, phone and avatar,
  -- and leaving the transaction in place.
  -- The column stays NULLABLE because a guest checkout genuinely has no
  -- profile. NULL here means "there was never a user", it does not mean
  -- "the user was deleted", and RESTRICT is what keeps those two apart.
  user_id uuid references public.profiles (id) on delete restrict,

  -- Paystack requires an email on every charge, so this is NOT NULL with no
  -- default even for guest checkout.
  email text not null,

  -- blank=True null=True on the Django field. Normalised to NOT NULL DEFAULT ''
  -- per the 0005 convention, import must coalesce NULL to ''.
  name text not null default '',
  phone text not null default '',

  -- Everything Paystack returns about how the money actually moved. All
  -- blank=True null=True, all normalised the same way. These are populated by
  -- the webhook on success and stay '' on a transaction that never completed.
  channel text not null default '',
  authorization_code text not null default '',
  card_type text not null default '',
  bank text not null default '',
  last4 text not null default '',

  -- Django JSONField(default=dict) and JSONField(default=list). The defaults
  -- move into the column so a row written from SQL gets the same shape the
  -- application expects.
  metadata jsonb not null default '{}'::jsonb,
  product_ids jsonb not null default '[]'::jsonb,

  -- Kept as plain text with no foreign key, matching the old model. It held
  -- whatever reference the calling flow had, an order number or a booking
  -- reference, with nothing saying which. Turning it into a real key is not a
  -- schema decision, it is a data-cleaning job. See the foreign key note at
  -- the end of this section.
  order_id text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Set by the state machine trigger when status first reaches 'success'.
  -- Replaces PaystackTransaction.mark_paid() in Python.
  paid_at timestamptz,

  -- The old system enforced nothing here. Paystack will not process a zero or
  -- negative charge, so a row holding one is a bug upstream, not a transaction.
  -- Strictly positive, unlike the >= 0 used on bookings and orders totals,
  -- because a zero-total order is a plausible thing (a full discount) while a
  -- zero-amount charge is not.
  constraint paystack_transactions_amount_positive check (amount > 0),

  -- Paystack returns exactly four digits or nothing at all.
  constraint paystack_transactions_last4_format check (last4 ~ '^([0-9]{4})?$'),

  -- paid_at exists if and only if the charge succeeded. The trigger maintains
  -- this on the settle path, the constraint is what catches a hand-written
  -- UPDATE that does not, and an INSERT, which the trigger does not see.
  -- Consequence, deliberately: a row INSERTed straight into 'success', which is
  -- what a charge initiated from the Paystack dashboard would produce, must
  -- supply paid_at in the same statement. That is one extra column on an
  -- uncommon path, in exchange for the two columns never disagreeing.
  constraint paystack_transactions_paid_at_matches_status
    check ((status = 'success') = (paid_at is not null))
);

comment on table public.paystack_transactions is
  'Paystack charges. From paystack_paystacktransaction, which is NOT in the extracted schema, see the source note in 0009. A financial record, RESTRICT on user_id.';
comment on column public.paystack_transactions.legacy_id is
  'TEMPORARY. Old paystack_paystacktransaction.id. Drop after import. Likely unused, the source table is not in the dump.';
comment on column public.paystack_transactions.reference is
  'Paystack reference. Unique. The webhook looks a transaction up by this and it is the idempotency key.';
comment on column public.paystack_transactions.status is
  'public.payment_status from 0001. Moves one way only, enforced by paystack_transactions_status_transition.';
comment on column public.paystack_transactions.paid_at is
  'Stamped by the status trigger when status first reaches success. Replaces PaystackTransaction.mark_paid().';
comment on column public.paystack_transactions.order_id is
  'Free text. Held an order number or a booking reference with nothing recording which. No foreign key, see the note in 0009.';

create unique index if not exists paystack_transactions_legacy_id_key
  on public.paystack_transactions (legacy_id);

-- design.md B6: the webhook is idempotent, keyed on the Paystack reference, and
-- a Paystack retry must never create a second order. This index is the half of
-- that which the database can guarantee. With it, the handler is written as
--
--   insert into public.paystack_transactions (reference, ...) values (...)
--   on conflict (reference) do nothing;
--
-- for the create path and
--
--   update public.paystack_transactions
--      set status = 'success', ...
--    where reference = $1 and status = 'pending';
--
-- for the settle path. A retry of a charge that already settled updates zero
-- rows, and zero rows is the signal to stop rather than an error to retry.
-- The other half is the transition trigger below, which makes a retry that
-- tries to move a settled transaction fail loudly instead of rewriting it.
-- Neither half is optional, and neither depends on the handler remembering to
-- check first.
create unique index if not exists paystack_transactions_reference_key
  on public.paystack_transactions (reference);

-- Old Meta.indexes on the Django model, and what happened to each:
--   Index(fields=['reference', 'status']). NOT carried. reference is unique,
--     so the unique index above already resolves any lookup by reference to at
--     most one row, and a second column after a unique leading column cannot
--     narrow anything. It would only add write cost.
--   Index(fields=['user', 'status']). Carried, widened with created_at, since
--     Meta.ordering was ['-created_at'] and the account payments list reads one
--     user newest first.
--   Index(fields=['order_id']). Carried, partial. The column is NOT NULL
--     DEFAULT '' and a guest cart flow may never set it, so indexing the empty
--     string is dead weight. Same shape as bookings_transaction_id_idx in 0003.
create index if not exists paystack_transactions_user_id_status_idx
  on public.paystack_transactions (user_id, status, created_at desc);
create index if not exists paystack_transactions_order_id_idx
  on public.paystack_transactions (order_id) where order_id <> '';
-- Addition. The admin payments screen and the reconciliation job both read by
-- status over a date window with no user in hand, which nothing above serves.
create index if not exists paystack_transactions_status_created_at_idx
  on public.paystack_transactions (status, created_at desc);

drop trigger if exists paystack_transactions_set_updated_at on public.paystack_transactions;
create trigger paystack_transactions_set_updated_at
  before update on public.paystack_transactions
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- Payment state machine
-- ---------------------------------------------------------------------------
-- design.md B6: payment state moves in one direction only, pending to success,
-- failed or abandoned, and a terminal state never moves again.
--
-- WHY A TRIGGER AND NOT A CHECK CONSTRAINT.
-- A CHECK constraint is evaluated against one row in isolation and can only see
-- the values that row now holds. It has no access to OLD, so it cannot express
-- a rule about a change. "status must be one of four values" is a CHECK, and
-- the enum already is one. "status must not have been success a moment ago" is
-- not expressible as a CHECK at all, because the constraint is handed the new
-- row with no memory of the old one. The rule here is entirely about the
-- transition, so it needs something that sees both versions, and in Postgres
-- that is a row-level BEFORE UPDATE trigger.
--
-- This also has to be in the database rather than in the webhook handler. The
-- service role key bypasses RLS, the webhook is the one place that uses it, and
-- a retried or replayed Paystack call is exactly the event that would try to
-- rewrite a settled charge. A rule enforced in the handler protects only the
-- paths that remember to call it, including the SQL console.
create or replace function public.enforce_payment_status_transition()
returns trigger
language plpgsql
-- Pinned and empty for the same reason 0004 pinned set_updated_at. The body
-- references nothing that needs resolving through search_path.
set search_path = ''
as $$
begin
  -- Nothing to check if the status did not move. This is what lets the webhook
  -- update channel, card_type, bank or metadata on an already settled
  -- transaction, and what makes a same-state write a harmless no-op rather than
  -- an error.
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- pending is the only state anything may leave.
  if old.status <> 'pending' then
    raise exception
      'payment status is terminal: % cannot change to %, transaction %',
      old.status, new.status, old.reference
      using errcode = 'check_violation';
  end if;

  -- Leaving pending means arriving somewhere terminal. The enum has exactly
  -- four values and pending is excluded above, so the three legal targets are
  -- whatever is left. Written out anyway so adding a fifth value to
  -- payment_status later forces a decision here instead of silently becoming
  -- legal.
  if new.status not in ('success', 'failed', 'abandoned') then
    raise exception
      'payment status % is not a legal transition from pending, transaction %',
      new.status, old.reference
      using errcode = 'check_violation';
  end if;

  -- Replaces PaystackTransaction.mark_paid(), which set status and paid_at
  -- together in Python. Doing it here means the two can never disagree, which
  -- is what paystack_transactions_paid_at_matches_status asserts.
  if new.status = 'success' and new.paid_at is null then
    new.paid_at = now();
  end if;

  return new;
end;
$$;

comment on function public.enforce_payment_status_transition() is
  'BEFORE UPDATE trigger function on paystack_transactions. Allows pending to success, failed or abandoned. Rejects every move out of a terminal state, and stamps paid_at on success.';

-- Same hardening 0004 applied. PostgREST exposes anything executable in public,
-- and a trigger function has no business being callable over the REST API.
-- Revoking EXECUTE does not stop the trigger firing, Postgres checks EXECUTE
-- when the trigger is created, not each time it runs.
revoke all on function public.enforce_payment_status_transition() from public, anon, authenticated;

drop trigger if exists paystack_transactions_status_transition on public.paystack_transactions;
create trigger paystack_transactions_status_transition
  before update of status on public.paystack_transactions
  for each row execute function public.enforce_payment_status_transition();


-- ---------------------------------------------------------------------------
-- A note on bookings.transaction_id, for a decision that is not mine to make
-- ---------------------------------------------------------------------------
-- NOTHING IN THIS MIGRATION ALTERS bookings OR orders. This is a written
-- recommendation, deliberately not executed.
--
-- bookings.transaction_id in 0003 is text NOT NULL DEFAULT '' with no foreign
-- key, because these tables did not exist yet. orders in 0005 has no equivalent
-- column at all: pages_order never had one, so the link from an order to its
-- charge exists only in the other direction, as
-- paystack_transactions.order_id, and it is free text there too.
--
-- Recommendation: do not add a foreign key on bookings.transaction_id. Instead,
-- once the payments flow is rebuilt, add a nullable
--   booking_id uuid references public.bookings (id) on delete restrict
-- and a matching order_id uuid to paystack_transactions, and retire both free
-- text columns.
--
-- Reasons, in order of weight.
-- 1. Direction. One booking can produce several transactions, a failed attempt
--    then a successful retry. A foreign key on bookings.transaction_id models
--    the opposite, one transaction per booking, and forces the booking row to
--    be rewritten on every retry. The key belongs on the many side.
-- 2. Type. transaction_id holds a Paystack reference string, not a uuid. A
--    foreign key would have to target paystack_transactions.reference. That
--    works, it is unique, but it makes the reference a natural key that can
--    never be corrected, and it stores a vendor-format string in two places.
-- 3. Data. The column is NOT NULL DEFAULT '' and most bookings never get a
--    reference. A foreign key cannot tolerate '', so it would need the column
--    made nullable and every '' turned into NULL first. That is a data
--    migration with a decision in it, which is why it is not happening
--    silently in the middle of this one.
-- 4. Timing. paystack_paystacktransaction is not in the dump, so there is
--    nothing to point at yet. A key added now would be a key against an empty
--    table, and would block the import of any legacy booking whose reference
--    has no surviving transaction row, which is currently all of them.
--
-- What is worth doing regardless, and also not done here: check the dump for
-- bookings whose transaction_id is set and whose payment_status is still
-- pending. Those are charges that settled without the old system noticing.


-- ---------------------------------------------------------------------------
-- paystack_webhook_logs, from paystack_paystackwebhooklog
-- ---------------------------------------------------------------------------
-- design.md B6: every webhook call is logged before processing, matching the
-- existing PaystackWebhookLog behaviour, which was a good decision worth
-- keeping. Carried unchanged in intent.
--
-- The write order matters and is the whole point of the table: insert the log
-- row first, from the raw request, then process. If processing crashes, the
-- payload survives and can be replayed. If the signature fails, the row is
-- still written with is_processed false and an error_message, which is how a
-- forged or misconfigured caller becomes visible instead of silent.
--
-- This table is written by the service role only, from the webhook route.
-- Nothing else inserts, and nobody but an admin reads. It is the one table in
-- this file that anon must NOT be able to insert into, which makes it the
-- exception to the note at the top. Task 1.6: no anon insert policy here.

create table if not exists public.paystack_webhook_logs (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  event_type text not null,

  -- The Paystack reference the event is about. NOT a foreign key to
  -- paystack_transactions, deliberately. The log records what arrived, and
  -- what arrives may reference a transaction this system has never seen, from
  -- a test key, another environment, or an attacker. A foreign key here would
  -- reject exactly the payloads most worth keeping, and would make the log
  -- depend on the thing it exists to debug.
  reference text not null,

  -- Django JSONField with no default, so NOT NULL with none here either. The
  -- raw body as received.
  payload jsonb not null,

  -- The x-paystack-signature header. blank=True null=True on the Django field,
  -- normalised to NOT NULL DEFAULT '' per the 0005 convention. Empty means the
  -- header was absent, which is itself a finding.
  signature text not null default '',

  is_processed boolean not null default false,
  processed_at timestamptz,
  error_message text not null default '',

  created_at timestamptz not null default now(),
  -- Added for the architecture.md section 5 convention. The old model had
  -- created_at only. Unlike the analytics tables below this one is genuinely
  -- updated, is_processed and processed_at are written after the insert.
  updated_at timestamptz not null default now(),

  -- processed_at exists if and only if the row was processed. Same shape as
  -- the paid_at constraint on transactions, and for the same reason: two
  -- columns encoding one fact must not be allowed to disagree.
  constraint paystack_webhook_logs_processed_at_matches_flag
    check (is_processed = (processed_at is not null))
);

comment on table public.paystack_webhook_logs is
  'Raw inbound Paystack webhook calls, written before processing. From paystack_paystackwebhooklog. Service role writes, admins read. NOT anon insertable, unlike the analytics tables in this file.';
comment on column public.paystack_webhook_logs.legacy_id is
  'TEMPORARY. Old paystack_paystackwebhooklog.id. Drop after import. Likely unused, the source table is not in the dump.';
comment on column public.paystack_webhook_logs.reference is
  'Paystack reference from the payload. No foreign key, the log must accept references this system has never seen.';
comment on column public.paystack_webhook_logs.signature is
  'x-paystack-signature header as received. Empty means the header was absent.';
comment on column public.paystack_webhook_logs.updated_at is
  'Added in migration. paystack_paystackwebhooklog had created_at only.';

create unique index if not exists paystack_webhook_logs_legacy_id_key
  on public.paystack_webhook_logs (legacy_id);
-- Old Meta.indexes: Index(fields=['reference', 'is_processed']). Carried as is.
-- This is the replay query: everything that arrived for one reference and has
-- not been dealt with.
create index if not exists paystack_webhook_logs_reference_is_processed_idx
  on public.paystack_webhook_logs (reference, is_processed);
-- The Django field also carried db_index=True on reference, which would have
-- produced a bare index on (reference). Not carried, it is a strict prefix of
-- the composite above.
-- Addition. Meta.ordering was ['-created_at'], and the two questions asked of
-- this table in an incident are "what arrived recently" and "what is stuck".
-- The second is partial because the unprocessed set should be near empty, and
-- if it is not, that is the alert.
create index if not exists paystack_webhook_logs_created_at_idx
  on public.paystack_webhook_logs (created_at desc);
create index if not exists paystack_webhook_logs_unprocessed_idx
  on public.paystack_webhook_logs (created_at desc) where not is_processed;
-- No unique constraint on (reference, event_type) or anything like it, and
-- that is deliberate. Paystack legitimately sends several events for one
-- reference, and a retry of the SAME event is a fact worth recording, not a
-- duplicate to suppress. Idempotency lives on paystack_transactions.reference,
-- where it belongs. This table is an append-only record of what happened on
-- the wire, and deduplicating it would destroy the evidence it exists to hold.

drop trigger if exists paystack_webhook_logs_set_updated_at on public.paystack_webhook_logs;
create trigger paystack_webhook_logs_set_updated_at
  before update on public.paystack_webhook_logs
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- email_log, merged from pages_emaillog and analytics_emaillog
-- ---------------------------------------------------------------------------
-- architecture.md section 5 requires these two to land as a single email_log
-- table. Singular, as named there.
--
-- WHICH COLUMNS CAME FROM WHERE.
--
-- In both, identically or near enough:
--   recipient, subject, content, status, error_message, sent_at, metadata,
--   template_id
--
-- From pages_emaillog only:
--   template_name, recipient_name, opened_at, clicked_at, ip_address,
--   user_agent, tracking_id
-- pages_emaillog was the later and richer of the two. It carried delivery
-- tracking, analytics_emaillog did not.
--
-- From analytics_emaillog only:
--   created_at
-- Nothing else. analytics_emaillog is a strict subset of pages_emaillog once
-- the disagreements below are resolved.
--
-- WHERE THEY DISAGREED, AND WHAT WAS DONE.
--
-- 1. status value set. pages had seven values defaulting to 'queued', analytics
--    had three defaulting to 'pending'. Merged into public.email_status as the
--    union, with analytics 'pending' mapped to 'queued' because they are the
--    same state spelled differently. See the enum section above. Default
--    'queued', from the pages side, since that is the state a row is actually
--    in when it is written.
--
-- 2. sent_at. analytics had it nullable, meaning "not sent yet". pages had it
--    NOT NULL DEFAULT now(), which is a Django auto_now_add and therefore held
--    the CREATION time, not the send time, and was populated even on rows that
--    were never sent. The analytics meaning is the correct one and is what is
--    kept: sent_at is NULLABLE here and NULL means not sent. The import must
--    NOT copy pages_emaillog.sent_at into it blindly. Copy it into created_at
--    and set sent_at only where status is one of sent, opened, clicked. This is
--    the one place the merge changes the meaning of an existing column, and it
--    is changed because the old meaning was wrong, not merely different.
--
-- 3. created_at. Only analytics had one. For pages rows it comes from
--    pages_emaillog.sent_at per the point above, which is what that column
--    actually held.
--
-- 4. error_message. pages had it nullable, analytics had it NOT NULL. Kept NOT
--    NULL DEFAULT '' per the 0005 convention, import coalesces the pages side.
--
-- 5. metadata. pages defaulted to '{}' and was nullable, analytics was NOT
--    NULL. Kept NOT NULL DEFAULT '{}'.
--
-- 6. tracking_id. Only pages had it, UNIQUE, defaulting to gen_random_uuid().
--    Kept, but NULLABLE, because every imported analytics row has none and
--    minting fake tracking ids for emails that were never tracked would invent
--    data. The unique index tolerates NULLs. New rows get one from the default.
--
-- 7. template_id. Both had a foreign key to their own app's email template
--    table. NEITHER is carried as a key, and the column is NOT carried at all.
--    architecture.md section 5 retires pages_emailtemplate,
--    pages_emailtemplate_default_attachments, pages_emailattachment and
--    analytics_emailtemplate, because Resend owns templates now. A foreign key
--    to a table that does not exist is not an option, and a dangling integer
--    is worse than nothing. template_name, which pages carried as free text
--    beside the key, survives and is where the import should land a readable
--    name for both sides. Read the template copy out of the archive before it
--    is retired, per architecture.md, it is the only record of the wording.
--
-- Read by admins only. Not anon insertable either, the same exception as the
-- webhook log: emails are sent by the server, so the server writes this.

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),

  -- Two legacy id columns, because this table has two parents and their id
  -- sequences overlap. A single legacy_id could not tell pages row 41 from
  -- analytics row 41. Both are TEMPORARY and both are dropped together.
  legacy_pages_id bigint,
  legacy_analytics_id bigint,

  -- Free text, from pages_emaillog.template_name. See point 7 above.
  template_name text not null default '',

  recipient text not null,
  recipient_name text not null default '',
  subject text not null,
  content text not null,

  status public.email_status not null default 'queued',
  error_message text not null default '',

  -- NULL means not sent. See point 2 above, this is the analytics meaning and
  -- it is deliberately not the pages one.
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,

  -- Open and click tracking context, pages side only. Genuinely unknown for
  -- untracked rows, so nullable rather than NOT NULL DEFAULT ''.
  ip_address inet,
  user_agent text,

  -- Nullable, unlike the old pages column. See point 6 above.
  tracking_id uuid default gen_random_uuid(),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  -- Added. Neither parent had one. This table is updated in place by delivery
  -- webhooks, so it is not append only.
  updated_at timestamptz not null default now()
);

-- The delivery timeline has to run forwards. Nothing enforced this before, and
-- a clicked_at before a sent_at means a tracking pixel fired against the wrong
-- row. Both are declared NOT VALID so existing rows are not checked at load
-- time and legacy rows with a half-built timeline cannot block the import,
-- which matters more here than anywhere because point 2 above has the import
-- reconstructing sent_at rather than copying it. Every new or updated row is
-- still checked. Same pattern, and the same follow-up obligation, as
-- bookings_reference_format in 0003. AFTER the import has landed, run:
--
--   alter table public.email_log validate constraint email_log_opened_after_sent;
--   alter table public.email_log validate constraint email_log_clicked_after_opened;
--
-- and investigate whatever they reject.
do $$ begin
  alter table public.email_log
    add constraint email_log_opened_after_sent
    check (opened_at is null or (sent_at is not null and opened_at >= sent_at)) not valid;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.email_log
    add constraint email_log_clicked_after_opened
    check (clicked_at is null or (opened_at is not null and clicked_at >= opened_at)) not valid;
exception when duplicate_object then null;
end $$;

comment on table public.email_log is
  'Email delivery log. Merged from pages_emaillog and analytics_emaillog per architecture.md section 5. Server writes, admins read.';
comment on column public.email_log.legacy_pages_id is
  'TEMPORARY. Old pages_emaillog.id. Drop after import.';
comment on column public.email_log.legacy_analytics_id is
  'TEMPORARY. Old analytics_emaillog.id. Drop after import.';
comment on column public.email_log.sent_at is
  'NULL means not sent. The analytics_emaillog meaning. pages_emaillog.sent_at was auto_now_add and held the creation time, import it into created_at instead.';
comment on column public.email_log.template_name is
  'Free text from pages_emaillog.template_name. The template_id foreign keys are not carried, Resend owns templates now.';
comment on column public.email_log.tracking_id is
  'Open and click tracking token. Nullable, imported analytics rows have none.';

create unique index if not exists email_log_legacy_pages_id_key
  on public.email_log (legacy_pages_id);
create unique index if not exists email_log_legacy_analytics_id_key
  on public.email_log (legacy_analytics_id);
-- Old: UNIQUE (tracking_id), pages_emaillog_tracking_id_key. Carried. NULLs are
-- distinct in a Postgres unique index by default, so the analytics rows that
-- have none do not collide.
create unique index if not exists email_log_tracking_id_key
  on public.email_log (tracking_id);
-- Old, all from pages_emaillog, all carried in some form:
--   idx_pages_emaillog_recipient ON (recipient). Carried, widened with
--     created_at. "What did we send this address" is always newest first.
--   idx_pages_emaillog_sent_at ON (sent_at). Replaced by created_at desc.
--     created_at is now the column that is always populated, sent_at is not.
--   idx_pages_emaillog_status ON (status). Carried, widened with created_at.
--     The queue that matters is failed or queued within a window.
--   idx_pages_emaillog_tracking_id ON (tracking_id). NOT carried, it duplicates
--     the unique index above exactly. Same call 0005 made on
--     idx_pages_marketcategory_slug.
--   idx_pages_emaillog_template_id ON (template_id). NOT carried, the column is
--     gone. See point 7 above.
-- Also not carried: analytics_emaillog_template_id_4d387263 ON (template_id),
-- for the same reason. analytics_emaillog had no other index.
create index if not exists email_log_recipient_created_at_idx
  on public.email_log (lower(recipient), created_at desc);
create index if not exists email_log_status_created_at_idx
  on public.email_log (status, created_at desc);
create index if not exists email_log_created_at_idx
  on public.email_log (created_at desc);
-- lower(recipient) on the first one, not recipient, because a support question
-- is "what did we send to this person" and addresses are case insensitive in
-- practice. Same reasoning as the profiles.email index in 0002. Consequence:
-- query with lower(recipient) = lower($1).

drop trigger if exists email_log_set_updated_at on public.email_log;
create trigger email_log_set_updated_at
  before update on public.email_log
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- analytics_sessions, from analytics_usersession
-- ---------------------------------------------------------------------------
-- VERDICT ON THE OVERLAP WITH public.user_sessions FROM 0002: they are NOT the
-- same thing, so this table is created, under a name that cannot be mistaken
-- for the other one.
--
-- The evidence, comparing accounts_user_session (which became user_sessions)
-- with analytics_usersession:
--
--   Purpose. user_sessions is a device and login audit trail, one row per
--     authenticated device, retained so a user can see and revoke where they
--     are signed in. analytics_usersession is a visit counter, one row per
--     browsing session, retained so a dashboard can report visit counts and
--     durations.
--   device_type. On user_sessions only. It is an enum fed by
--     UserSession.DEVICE_TYPES in accounts/models.py. The analytics model has
--     no such field, it stores the raw user_agent and nothing parsed.
--   page_count. On analytics_usersession only, incremented on every page view.
--     There is no equivalent on the accounts side, and it is the column the
--     whole table exists for.
--   start_time and last_active, versus created_at and last_activity. Same
--     idea, and analytics adds get_duration() over the pair, which is the
--     dashboard metric. The accounts side never computed a duration.
--   Uniqueness. analytics_usersession.session_id is UNIQUE, accounts
--     session_key is not. 0002 explicitly left session_key non-unique so the
--     import could not fail on historical duplicates.
--   Identifier role. analytics_usersession.session_id is the join key for the
--     rest of the analytics domain. analytics_useractivity.session_id,
--     analytics_userlike.session_id and analytics_socialshare.session_id all
--     carry the same value, including on rows with no user at all. The
--     accounts session_key joins to nothing.
--   Nullability of the user. analytics_usersession.user_id is NOT NULL, which
--     is the one place the analytics model is the stricter of the two, and
--     which is itself suspicious given every sibling analytics table allows an
--     anonymous row. See the note below.
--
-- Merging them would mean giving every authenticated device a page_count it
-- does not have, giving every browsing session a device_type nobody parsed,
-- and either imposing uniqueness on the accounts side or dropping it from the
-- analytics side. Two tables.
--
-- The name. Not user_sessions, obviously, and not analytics_user_sessions
-- either, which differs from user_sessions by one word in the middle and would
-- be misread in a join. analytics_sessions shares no prefix with it.

create table if not exists public.analytics_sessions (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- The analytics session identifier, generated client side, carried on every
  -- other analytics row from the same visit. Unique, per the old constraint.
  -- Text and not uuid: the old column is character varying(255) with no format
  -- enforced, and whatever the old client generated needs to survive the
  -- import intact.
  session_id text not null,

  -- CASCADE. This is behavioural telemetry about a person, not a financial
  -- record, and deleting the account should take it with them. That matches
  -- the old Django on_delete=CASCADE and it is also what an erasure request
  -- expects. The contrast with paystack_transactions above is the point: money
  -- survives the account, browsing does not.
  --
  -- NULLABLE here, which is a DEVIATION. analytics_usersession.user_id is NOT
  -- NULL, but every sibling analytics table allows an anonymous row, and the
  -- session_id columns on those tables are documented as working for logged
  -- out visitors. A session table that cannot represent an anonymous visit
  -- means either the old system tracked nothing before login, or it attributed
  -- anonymous sessions to some placeholder account. Relaxed rather than
  -- tightened because tightening it would make anonymous tracking impossible
  -- going forward, and the import is unaffected either way, existing rows all
  -- have a user.
  user_id uuid references public.profiles (id) on delete cascade,

  ip_address inet,
  -- blank=True in Django, NOT NULL in the database. Already ''.
  user_agent text not null default '',

  -- Was start_time, a Django auto_now_add field, so it is the creation
  -- timestamp under another name. Renamed to created_at for the
  -- architecture.md section 5 convention, same call 0003 made on
  -- bookings.booking_date.
  created_at timestamptz not null default now(),
  -- Was last_active, a Django auto_now field, which is precisely what
  -- public.set_updated_at() does. Renamed to updated_at and given the standard
  -- trigger rather than kept as a third timestamp column. Session duration is
  -- updated_at minus created_at, which is what get_duration() computed.
  updated_at timestamptz not null default now(),

  is_active boolean not null default true,
  page_count integer not null default 0,

  constraint analytics_sessions_page_count_non_negative check (page_count >= 0)
);

comment on table public.analytics_sessions is
  'Browsing sessions for analytics. From analytics_usersession. NOT the same thing as public.user_sessions, see the comparison in 0009. Anyone inserts, only admins read.';
comment on column public.analytics_sessions.legacy_id is
  'TEMPORARY. Old analytics_usersession.id. Drop after import.';
comment on column public.analytics_sessions.session_id is
  'Client generated visit identifier. Joins to the session_id on the other analytics tables. Not related to user_sessions.session_key.';
comment on column public.analytics_sessions.created_at is
  'Was analytics_usersession.start_time, a Django auto_now_add field.';
comment on column public.analytics_sessions.updated_at is
  'Was analytics_usersession.last_active, a Django auto_now field. Session duration is updated_at minus created_at.';

create unique index if not exists analytics_sessions_legacy_id_key
  on public.analytics_sessions (legacy_id);
-- Old: UNIQUE (session_id), analytics_usersession_session_id_key. Carried.
create unique index if not exists analytics_sessions_session_id_key
  on public.analytics_sessions (session_id);
-- Old Meta.indexes and what happened to each:
--   Index(fields=['user', 'is_active']), as analytics_u_user_id_4b29ef_idx.
--     Carried, widened with created_at, since Meta.ordering was ['-start_time']
--     and the per-user read is newest first.
--   Index(fields=['session_id']), as analytics_u_session_1131bd_idx. NOT
--     carried, it duplicates the unique index above exactly.
-- Also not carried:
--   analytics_usersession_user_id_548abc25 ON (user_id). A strict prefix of the
--     composite below.
--   analytics_usersession_session_id_9392c55e_like ON (session_id
--     varchar_pattern_ops). Nothing does a prefix search on a session id, it is
--     looked up whole.
create index if not exists analytics_sessions_user_id_is_active_idx
  on public.analytics_sessions (user_id, is_active, created_at desc);
-- Addition. Inferred from get_user_activity_stats() in analytics/models.py,
-- which windows everything on created_at >= now() minus N days. Every dashboard
-- panel starts with that filter, and no old index served it.
create index if not exists analytics_sessions_created_at_idx
  on public.analytics_sessions (created_at desc);

drop trigger if exists analytics_sessions_set_updated_at on public.analytics_sessions;
create trigger analytics_sessions_set_updated_at
  before update on public.analytics_sessions
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- analytics_user_activities, from analytics_useractivity
-- ---------------------------------------------------------------------------
-- The highest volume table in the schema. One row per page view, per click,
-- per login. Index choices here matter more than anywhere else in this file,
-- and so does not adding any that are not read.

create table if not exists public.analytics_user_activities (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- CASCADE, same reasoning as analytics_sessions.user_id. Nullable in the old
  -- schema and kept so, anonymous activity is the common case.
  user_id uuid references public.profiles (id) on delete cascade,

  -- Plain text, NOT a foreign key to analytics_sessions.session_id. The old
  -- model had no relation either. Activity rows arrive before, or without, a
  -- session row, and a key here would drop exactly the anonymous traffic this
  -- table exists to count. The join is done in the query when it is wanted.
  session_id text not null default '',

  page_visited text not null default '',
  action public.activity_action not null default 'view',

  -- Django JSONField(default=dict). Default moved into the column.
  data jsonb not null default '{}'::jsonb,

  ip_address inet,
  user_agent text not null default '',

  created_at timestamptz not null default now(),
  -- Added for the architecture.md section 5 convention. Rows are append only,
  -- so in practice this never diverges from created_at. Same note as
  -- login_history in 0002.
  updated_at timestamptz not null default now()
);

comment on table public.analytics_user_activities is
  'Page views, clicks and logins. From analytics_useractivity. Anyone inserts, only admins read. Highest volume table in the schema.';
comment on column public.analytics_user_activities.legacy_id is
  'TEMPORARY. Old analytics_useractivity.id. Drop after import.';
comment on column public.analytics_user_activities.session_id is
  'Matches analytics_sessions.session_id by value. Deliberately not a foreign key, activity is recorded for visits that have no session row.';

create unique index if not exists analytics_user_activities_legacy_id_key
  on public.analytics_user_activities (legacy_id);
-- Old Meta.indexes, both carried with created_at descending rather than
-- ascending, since Meta.ordering was ['-created_at'] and every read is newest
-- first:
--   Index(fields=['user', 'created_at']), as analytics_u_user_id_630f80_idx.
--   Index(fields=['action', 'created_at']), as analytics_u_action_df6b3c_idx.
-- Not carried: analytics_useractivity_user_id_5018049a ON (user_id), a strict
-- prefix of the first.
create index if not exists analytics_user_activities_user_id_created_at_idx
  on public.analytics_user_activities (user_id, created_at desc);
create index if not exists analytics_user_activities_action_created_at_idx
  on public.analytics_user_activities (action, created_at desc);
-- Additions, and where each was inferred from. All three are in
-- analytics/models.py, in the helper functions the old dashboard called.
--   get_user_activity_stats(days) filters created_at >= a cutoff with no other
--     predicate, then groups by created_at::date. The action index cannot serve
--     that, its leading column is not in the query. Hence a bare created_at.
--   get_login_stats() filters action IN (login, google_login, email_login),
--     which the action index above already serves.
--   The session drilldown, joining activity to a session id, has nothing behind
--     it at all. Partial, because session_id is NOT NULL DEFAULT '' and
--     server-side rows never set one.
create index if not exists analytics_user_activities_created_at_idx
  on public.analytics_user_activities (created_at desc);
create index if not exists analytics_user_activities_session_id_idx
  on public.analytics_user_activities (session_id, created_at desc)
  where session_id <> '';
-- No index on page_visited. The old dashboard had no top-pages panel, nothing
-- queried it, and on the highest volume table in the schema an unread index is
-- the most expensive kind. Add it with the panel that needs it.

drop trigger if exists analytics_user_activities_set_updated_at on public.analytics_user_activities;
create trigger analytics_user_activities_set_updated_at
  before update on public.analytics_user_activities
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- analytics_likes, from analytics_userlike
-- ---------------------------------------------------------------------------
-- content_type and content_id are a loose polymorphic reference, a model name
-- as free text plus an integer primary key from the old schema. There is no
-- foreign key and there cannot be one, since the target varies per row. The
-- integers are legacy ids, so this table is only meaningful after the import
-- has finished rewriting them. That rewrite is import work, not schema work,
-- and it is flagged in the column comment so it cannot be forgotten.

create table if not exists public.analytics_likes (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- CASCADE, same reasoning as the other behavioural tables.
  user_id uuid references public.profiles (id) on delete cascade,

  -- Nullable in the old schema, kept nullable. An anonymous like is identified
  -- by session alone.
  session_id text,

  content_type text not null,
  content_id integer not null,

  created_at timestamptz not null default now(),
  -- Added, append only. Same note as above.
  updated_at timestamptz not null default now(),

  -- The old table had no bound. Django primary keys start at 1, so a
  -- non-positive content_id is a failed lookup that got written anyway.
  constraint analytics_likes_content_id_positive check (content_id > 0)
);

comment on table public.analytics_likes is
  'Content likes. From analytics_userlike. Anyone inserts, only admins read.';
comment on column public.analytics_likes.legacy_id is
  'TEMPORARY. Old analytics_userlike.id. Drop after import.';
comment on column public.analytics_likes.content_id is
  'LEGACY INTEGER ID of the liked row, paired with content_type. Not a foreign key, the target table varies. The import must rewrite these against the new uuid keys or this table is meaningless.';

create unique index if not exists analytics_likes_legacy_id_key
  on public.analytics_likes (legacy_id);
-- Old: UNIQUE (content_type, content_id, user_id),
-- analytics_userlike_content_type_content_id__2d7b67fa_uniq, from
-- unique_together on the model. Carried unchanged, INCLUDING its flaw: NULLs
-- are distinct in a Postgres unique index, so it never constrained anonymous
-- likes at all and one visitor could like the same thing repeatedly. Carried
-- as is rather than repaired, because repairing it means deciding what an
-- anonymous like is unique on, session_id most likely, and that decision would
-- reject legacy rows this migration has to accept. Worth fixing later with
-- a second partial unique index on (content_type, content_id, session_id)
-- where user_id is null, once the dump has been checked for rows that would
-- violate it.
create unique index if not exists analytics_likes_content_user_key
  on public.analytics_likes (content_type, content_id, user_id);
-- Not carried: analytics_userlike_user_id_8738d8dc ON (user_id). Superseded by
-- the composite below, which leads with the same column.
create index if not exists analytics_likes_user_id_created_at_idx
  on public.analytics_likes (user_id, created_at desc);
-- Addition. The only read that matters on this table from the public side is
-- the like count for one piece of content, which nothing indexed before.
create index if not exists analytics_likes_content_idx
  on public.analytics_likes (content_type, content_id);

drop trigger if exists analytics_likes_set_updated_at on public.analytics_likes;
create trigger analytics_likes_set_updated_at
  before update on public.analytics_likes
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- analytics_social_shares, from analytics_socialshare
-- ---------------------------------------------------------------------------
-- Same polymorphic content_type and content_id pair as analytics_likes, same
-- caveat about the legacy integers.

create table if not exists public.analytics_social_shares (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- CASCADE, same reasoning.
  user_id uuid references public.profiles (id) on delete cascade,
  session_id text,

  platform public.share_platform not null,
  content_type text not null,
  content_id integer not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint analytics_social_shares_content_id_positive check (content_id > 0)
);

comment on table public.analytics_social_shares is
  'Social share events. From analytics_socialshare. Anyone inserts, only admins read.';
comment on column public.analytics_social_shares.legacy_id is
  'TEMPORARY. Old analytics_socialshare.id. Drop after import.';
comment on column public.analytics_social_shares.content_id is
  'LEGACY INTEGER ID of the shared row, paired with content_type. Not a foreign key. The import must rewrite these against the new uuid keys.';

create unique index if not exists analytics_social_shares_legacy_id_key
  on public.analytics_social_shares (legacy_id);
-- Not carried: analytics_socialshare_user_id_11f801e2 ON (user_id), a strict
-- prefix of the composite below. The old table had no other index and no
-- unique constraint, a visitor sharing the same page twice is two real events.
create index if not exists analytics_social_shares_user_id_created_at_idx
  on public.analytics_social_shares (user_id, created_at desc);
-- Additions. The share panel on the old dashboard broke down by platform over
-- a date window, and the per-content share count is the same read
-- analytics_likes_content_idx serves.
create index if not exists analytics_social_shares_platform_created_at_idx
  on public.analytics_social_shares (platform, created_at desc);
create index if not exists analytics_social_shares_content_idx
  on public.analytics_social_shares (content_type, content_id);

drop trigger if exists analytics_social_shares_set_updated_at on public.analytics_social_shares;
create trigger analytics_social_shares_set_updated_at
  before update on public.analytics_social_shares
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- analytics_tour_bookings, from analytics_tourbooking
-- ---------------------------------------------------------------------------
-- A DENORMALISED SNAPSHOT, not a booking. public.bookings from 0003 is the
-- record of truth. This table stores the tour name and the amount as strings
-- and numbers copied at write time, so a dashboard could report without
-- joining. Never reconcile money against it, and never let a report that
-- matters read it instead of bookings.
--
-- It is kept because architecture.md section 5 lists it as migrated and because
-- its rows are the only surviving record of what a tour was called and cost on
-- the day it was booked. That is a real thing a historical report needs.

create table if not exists public.analytics_tour_bookings (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- SET NULL, and this is the one place the analytics tables differ from each
  -- other on delete behaviour. The behavioural tables CASCADE because a page
  -- view is worthless once the person is gone. This row carries an amount, and
  -- deleting a user must not silently reduce last year's revenue total. It is
  -- not the financial record, so RESTRICT would be wrong too, it would block
  -- an erasure request over a dashboard row. SET NULL keeps the number and
  -- drops the person, which is what an anonymised report wants.
  -- DEVIATION from the old Django on_delete=CASCADE, deliberately.
  user_id uuid references public.profiles (id) on delete set null,

  tour_name text not null,
  -- LEGACY INTEGER, same caveat as the content_id columns above.
  tour_id integer not null,

  booking_date date not null,
  participants integer not null default 1,
  total_amount numeric(10,2) not null,
  -- Addition. The old table had no currency column, and architecture.md
  -- section 5 requires money to carry one. Every historical row is GHS.
  currency public.currency_code not null default 'GHS',

  -- Text, not public.booking_status. See the enum section at the top.
  status text not null default 'pending',
  -- blank=True in Django, NOT NULL in the database. Already ''.
  booking_reference text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint analytics_tour_bookings_participants_positive check (participants > 0),
  constraint analytics_tour_bookings_total_amount_non_negative check (total_amount >= 0),
  constraint analytics_tour_bookings_tour_id_positive check (tour_id > 0)
);

comment on table public.analytics_tour_bookings is
  'Denormalised booking snapshots for reporting. From analytics_tourbooking. NOT the record of truth, public.bookings is. Anyone inserts, only admins read.';
comment on column public.analytics_tour_bookings.legacy_id is
  'TEMPORARY. Old analytics_tourbooking.id. Drop after import.';
comment on column public.analytics_tour_bookings.tour_id is
  'LEGACY INTEGER ID of the tour. Not a foreign key, the snapshot outlives the tour row. The import must rewrite these against the new uuid keys.';
comment on column public.analytics_tour_bookings.status is
  'Free text copied from the booking at write time. Not public.booking_status, the old field had no choices list.';

create unique index if not exists analytics_tour_bookings_legacy_id_key
  on public.analytics_tour_bookings (legacy_id);
-- Not carried: analytics_tourbooking_user_id_4863d548 ON (user_id), a strict
-- prefix of the composite below. The old table had no other index.
create index if not exists analytics_tour_bookings_user_id_created_at_idx
  on public.analytics_tour_bookings (user_id, created_at desc);
-- Additions, inferred from the daily rollup in analytics_daily_summary below,
-- which counts bookings and sums revenue per day, and from Meta.ordering
-- ['-created_at']. Neither had an index.
create index if not exists analytics_tour_bookings_created_at_idx
  on public.analytics_tour_bookings (created_at desc);
-- Partial, because booking_reference is NOT NULL DEFAULT '' and a snapshot
-- written before the reference was generated has none. Same shape as
-- bookings_transaction_id_idx in 0003. This is the column that lets a snapshot
-- be matched back to the real booking during reconciliation.
create index if not exists analytics_tour_bookings_reference_idx
  on public.analytics_tour_bookings (booking_reference) where booking_reference <> '';

drop trigger if exists analytics_tour_bookings_set_updated_at on public.analytics_tour_bookings;
create trigger analytics_tour_bookings_set_updated_at
  before update on public.analytics_tour_bookings
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- analytics_market_purchases, from analytics_marketpurchase
-- ---------------------------------------------------------------------------
-- The same denormalised snapshot arrangement as analytics_tour_bookings, one
-- domain over. public.orders from 0005 is the record of truth.

create table if not exists public.analytics_market_purchases (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- SET NULL, same reasoning as analytics_tour_bookings.user_id, and the same
  -- deliberate deviation from the old Django CASCADE.
  user_id uuid references public.profiles (id) on delete set null,

  product_name text not null,
  -- LEGACY INTEGER, same caveat.
  product_id integer not null,

  amount numeric(10,2) not null,
  -- Addition, same reason as the currency column on tour bookings.
  currency public.currency_code not null default 'GHS',
  quantity integer not null default 1,

  -- Text, not public.order_status. See the enum section at the top.
  status text not null default 'pending',
  -- blank=True in Django, NOT NULL in the database. Already ''. Holds a
  -- Paystack reference on the rows that have one. No foreign key to
  -- paystack_transactions, for the same reasons set out in the
  -- bookings.transaction_id note above, and with more force: this is a
  -- reporting snapshot, not something that should constrain payments.
  transaction_id text not null default '',
  payment_method text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint analytics_market_purchases_quantity_positive check (quantity > 0),
  constraint analytics_market_purchases_amount_non_negative check (amount >= 0),
  constraint analytics_market_purchases_product_id_positive check (product_id > 0)
);

comment on table public.analytics_market_purchases is
  'Denormalised purchase snapshots for reporting. From analytics_marketpurchase. NOT the record of truth, public.orders is. Anyone inserts, only admins read.';
comment on column public.analytics_market_purchases.legacy_id is
  'TEMPORARY. Old analytics_marketpurchase.id. Drop after import.';
comment on column public.analytics_market_purchases.product_id is
  'LEGACY INTEGER ID of the product. Not a foreign key, the snapshot outlives the product row. The import must rewrite these against the new uuid keys.';
comment on column public.analytics_market_purchases.transaction_id is
  'Paystack reference, free text. No foreign key, see the bookings.transaction_id note in 0009.';

create unique index if not exists analytics_market_purchases_legacy_id_key
  on public.analytics_market_purchases (legacy_id);
-- Not carried: analytics_marketpurchase_user_id_3299cb4e ON (user_id), a strict
-- prefix of the composite below. The old table had no other index.
create index if not exists analytics_market_purchases_user_id_created_at_idx
  on public.analytics_market_purchases (user_id, created_at desc);
-- Additions, same inference as on tour bookings: the daily rollup sums revenue
-- and counts purchases per day, and Meta.ordering was ['-created_at'].
create index if not exists analytics_market_purchases_created_at_idx
  on public.analytics_market_purchases (created_at desc);
create index if not exists analytics_market_purchases_transaction_id_idx
  on public.analytics_market_purchases (transaction_id) where transaction_id <> '';

drop trigger if exists analytics_market_purchases_set_updated_at on public.analytics_market_purchases;
create trigger analytics_market_purchases_set_updated_at
  before update on public.analytics_market_purchases
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- analytics_contact_submissions, from analytics_contactsubmission
-- ---------------------------------------------------------------------------
-- Column for column identical to pages_contactmessage, which became
-- contact_messages in 0008. They are NOT merged, for two reasons.
--
-- 1. architecture.md section 5 lists them separately, pages_contactmessage
--    under inbound messages and analytics_contactsubmission under analytics.
-- 2. They have different access rules and different lifetimes.
--    contact_messages is a staff mailbox that gets worked, with is_read as a
--    triage flag an admin writes. This one is a counter feeding the
--    submissions-per-day panel. Merging them would put an analytics feed and a
--    mailbox behind one policy, and the first RLS change that suited one would
--    silently loosen or break the other.
--
-- If the two turn out to hold duplicate rows for the same submission, which is
-- likely since the old frontend probably wrote both, that is a fact worth
-- knowing before either is reported on. Check the dump for rows matching on
-- email, subject and created_at across the two tables.

create table if not exists public.analytics_contact_submissions (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  name text not null,
  email text not null,
  -- blank=True in Django, NOT NULL in the database. Already ''.
  phone text not null default '',
  subject text not null,
  message text not null,

  is_read boolean not null default false,

  created_at timestamptz not null default now(),
  -- Added. The old table had created_at only.
  updated_at timestamptz not null default now()
);

comment on table public.analytics_contact_submissions is
  'Contact submissions recorded for reporting. From analytics_contactsubmission. Deliberately separate from public.contact_messages, see the note in 0009. Anyone inserts, only admins read.';
comment on column public.analytics_contact_submissions.legacy_id is
  'TEMPORARY. Old analytics_contactsubmission.id. Drop after import.';
comment on column public.analytics_contact_submissions.updated_at is
  'Added in migration. analytics_contactsubmission had created_at only.';

create unique index if not exists analytics_contact_submissions_legacy_id_key
  on public.analytics_contact_submissions (legacy_id);
-- The old table had no index beyond its primary key and no unique constraint.
-- One addition, matching Meta.ordering ['-created_at'] and the per-day count
-- the dashboard reported. No unread index here, unlike contact_messages in
-- 0008, because nothing works this table as a queue.
create index if not exists analytics_contact_submissions_created_at_idx
  on public.analytics_contact_submissions (created_at desc);

drop trigger if exists analytics_contact_submissions_set_updated_at on public.analytics_contact_submissions;
create trigger analytics_contact_submissions_set_updated_at
  before update on public.analytics_contact_submissions
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- analytics_daily_summary, from analytics_useranalytics
-- ---------------------------------------------------------------------------
-- One row per day, precomputed. The old name, UserAnalytics, said nothing
-- about what a row is. Renamed so it does.
--
-- This is the only table in the file that is not insert-from-anyone. It is
-- written by a scheduled rollup, not by a visitor, so task 1.6 should give it
-- admin and service role access and no anon insert. Grouped with the analytics
-- tables because it is derived from them.

create table if not exists public.analytics_daily_summary (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint,

  -- The day being summarised. In the old model this was auto_now_add, which
  -- means it recorded the day the row was WRITTEN rather than the day being
  -- reported, and a backfill or a retry would have silently mislabelled it.
  -- Kept as a plain date with no default so the rollup has to say which day it
  -- is summarising.
  summary_date date not null,

  total_users integer not null default 0,
  new_users integer not null default 0,
  active_users integer not null default 0,
  total_purchases integer not null default 0,
  -- numeric(12,2), not the numeric(10,2) used for money elsewhere. This is a
  -- sum of many amounts, not one amount, and the old column was already 12,2.
  -- Carried as is.
  total_revenue numeric(12,2) not null default 0,
  currency public.currency_code not null default 'GHS',
  total_bookings integer not null default 0,
  page_views integer not null default 0,
  email_logins integer not null default 0,
  google_logins integer not null default 0,

  -- Both added. analytics_useranalytics had NO timestamp columns at all, only
  -- the date. Added for the architecture.md section 5 convention, and they earn
  -- their keep here: a rollup that is recomputed needs to say when it last ran.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The old table bounded none of these. Every one of them is a count or a sum
  -- and cannot be negative.
  constraint analytics_daily_summary_counts_non_negative check (
    total_users >= 0 and new_users >= 0 and active_users >= 0
    and total_purchases >= 0 and total_bookings >= 0 and page_views >= 0
    and email_logins >= 0 and google_logins >= 0
  ),
  constraint analytics_daily_summary_total_revenue_non_negative
    check (total_revenue >= 0),
  -- New users are a subset of total users, and active users are too. The old
  -- rollup computed all three independently in Python with nothing checking
  -- they agreed.
  constraint analytics_daily_summary_new_users_within_total
    check (new_users <= total_users),
  constraint analytics_daily_summary_active_users_within_total
    check (active_users <= total_users)
);

comment on table public.analytics_daily_summary is
  'Precomputed daily analytics rollup, one row per day. From analytics_useranalytics. Written by the rollup job, read by admins. NOT anon insertable, unlike the other analytics tables in this file.';
comment on column public.analytics_daily_summary.legacy_id is
  'TEMPORARY. Old analytics_useranalytics.id. Drop after import.';
comment on column public.analytics_daily_summary.summary_date is
  'The day being summarised. Was analytics_useranalytics.date, which was auto_now_add and therefore recorded the write date instead.';
comment on column public.analytics_daily_summary.total_revenue is
  'numeric(12,2), wider than the numeric(10,2) used for single amounts. A daily sum needs the room. Carried from the old column.';

create unique index if not exists analytics_daily_summary_legacy_id_key
  on public.analytics_daily_summary (legacy_id);
-- ADDED UNIQUE CONSTRAINT, flagged because it is a change rather than a carry.
-- analytics_useranalytics had no unique constraint on date, so two rows could
-- claim the same day and every report reading it would double count without
-- any error. With the column having been auto_now_add, a rollup that ran twice
-- in one day produced exactly that. This makes the rollup an upsert:
--
--   insert into public.analytics_daily_summary (summary_date, ...) values (...)
--   on conflict (summary_date) do update set ...;
--
-- CHECK THE DUMP BEFORE IMPORTING. If it holds more than one row per date the
-- import will fail here, and the right fix is deciding which row is correct,
-- not dropping this index.
create unique index if not exists analytics_daily_summary_date_key
  on public.analytics_daily_summary (summary_date);
-- Meta.ordering was ['-date'] and every chart reads a contiguous range of days
-- newest first, which the unique index above already serves in both directions.
-- No further index. The table gains one row a day, so it will not outgrow that
-- for a very long time.

drop trigger if exists analytics_daily_summary_set_updated_at on public.analytics_daily_summary;
create trigger analytics_daily_summary_set_updated_at
  before update on public.analytics_daily_summary
  for each row execute function public.set_updated_at();
