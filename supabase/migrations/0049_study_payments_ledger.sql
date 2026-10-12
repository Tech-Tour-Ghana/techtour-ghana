-- Payments ledger for study applications.
--
-- Students pay TechTour; staff pay the university offline and record it here.
-- Nothing in this table moves money. It is the record both sides read from.
--
-- Entry kinds:
--   charge     a fee the student owes (application fee, tuition deposit, service fee...)
--   payment    money the student paid TechTour
--   refund     money TechTour paid back to the student
--   waiver     a fee TechTour removes from what the student owes
--   remittance money TechTour paid to the university on the student's behalf
--              (information for the student, it does not change what they owe)
--
-- Balance owed = charges - waivers - payments + refunds, per currency.
-- Entries are never deleted. A mistake is voided and disappears from the
-- student's view and from every total.

create table if not exists public.study_ledger (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.study_applications(id) on delete cascade,
  kind           text not null check (kind in ('charge', 'payment', 'refund', 'waiver', 'remittance')),
  category       text not null default 'other'
                   check (category in ('application_fee', 'tuition', 'deposit', 'service_fee', 'visa_fee', 'insurance', 'other')),
  description    text not null default '' check (char_length(description) <= 200),
  amount         numeric(12, 2) not null check (amount > 0),
  currency       text not null default 'GHS' check (currency ~ '^[A-Z]{3}$'),
  method         text not null default '' check (char_length(method) <= 40),
  reference      text not null default '' check (char_length(reference) <= 80),
  occurred_on    date not null default current_date,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  voided_at      timestamptz,
  voided_by      uuid references auth.users(id) on delete set null
);
create index if not exists study_ledger_application_idx on public.study_ledger (application_id, occurred_on desc, created_at desc);

alter table public.study_ledger enable row level security;

-- Staff read everything. A student reads their own live entries.
create policy study_ledger_select on public.study_ledger for select to authenticated
  using (public.is_admin() or (voided_at is null and exists (
    select 1 from public.study_applications a where a.id = application_id and a.user_id = (select auth.uid())
  )));
create policy study_ledger_insert_admin on public.study_ledger for insert to authenticated
  with check (public.is_admin());
create policy study_ledger_update_admin on public.study_ledger for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- No delete policy on purpose.

grant select, insert, update on public.study_ledger to authenticated;

-- ---------------------------------------------------------------------------
-- Entries are immutable. The only change allowed is voiding.
-- ---------------------------------------------------------------------------
create or replace function public.study_ledger_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.voided_at := null;
    new.voided_by := null;
    return new;
  end if;
  if old.voided_at is not null then
    raise exception 'This entry is already voided.' using errcode = 'P0001';
  end if;
  if new.voided_at is null
     or (new.application_id, new.kind, new.category, new.description, new.amount, new.currency, new.method, new.reference, new.occurred_on)
        is distinct from
        (old.application_id, old.kind, old.category, old.description, old.amount, old.currency, old.method, old.reference, old.occurred_on) then
    raise exception 'Ledger entries cannot be edited. Void the entry and add a new one.' using errcode = 'P0001';
  end if;
  new.voided_by := auth.uid();
  return new;
end $$;
revoke all on function public.study_ledger_guard() from public, anon, authenticated;
drop trigger if exists study_ledger_guard on public.study_ledger;
create trigger study_ledger_guard before insert or update on public.study_ledger
  for each row execute function public.study_ledger_guard();

-- ---------------------------------------------------------------------------
-- A new entry reaches the student's timeline and notifications. A void is
-- noted privately for staff.
-- ---------------------------------------------------------------------------
create or replace function public.study_ledger_after() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uid uuid;
  money text := new.currency || ' ' || to_char(new.amount, 'FM999,999,990.00');
  what text := coalesce(nullif(new.description, ''), initcap(replace(new.category, '_', ' ')));
  title text;
begin
  select user_id into uid from public.study_applications where id = new.application_id;

  if tg_op = 'INSERT' then
    title := case new.kind
      when 'charge'     then 'Fee added: ' || what || ', ' || money
      when 'payment'    then 'Payment received: ' || money
      when 'refund'     then 'Refund sent: ' || money
      when 'waiver'     then 'Fee waived: ' || what || ', ' || money
      else                   'Paid to the university: ' || what || ', ' || money
    end;
    insert into public.study_application_events (application_id, kind, title, body, is_public, created_by)
    values (new.application_id, 'system', title, case when new.reference <> '' then 'Reference ' || new.reference else '' end, true, new.created_by);
    if uid is not null then
      insert into public.notifications (user_id, type, title, message, link)
      values (uid, 'general', case new.kind when 'payment' then 'Payment received' when 'charge' then 'New fee on your application' else 'Payment update' end,
              left(title, 300), '/auth/study/' || new.application_id);
    end if;
    update public.study_applications set last_activity_at = now() where id = new.application_id;
  elsif new.voided_at is not null and old.voided_at is null then
    insert into public.study_application_events (application_id, kind, title, is_public, created_by)
    values (new.application_id, 'system', 'Ledger entry voided: ' || new.kind || ', ' || money, false, auth.uid());
  end if;
  return new;
end $$;
revoke all on function public.study_ledger_after() from public, anon, authenticated;
drop trigger if exists study_ledger_after on public.study_ledger;
create trigger study_ledger_after after insert or update on public.study_ledger
  for each row execute function public.study_ledger_after();

-- ---------------------------------------------------------------------------
-- Totals per application and currency. Reads obey the caller's RLS.
-- ---------------------------------------------------------------------------
create or replace view public.study_application_balances with (security_invoker = true) as
select
  application_id,
  currency,
  coalesce(sum(amount) filter (where kind = 'charge'), 0)     as charged,
  coalesce(sum(amount) filter (where kind = 'waiver'), 0)     as waived,
  coalesce(sum(amount) filter (where kind = 'payment'), 0)    as paid,
  coalesce(sum(amount) filter (where kind = 'refund'), 0)     as refunded,
  coalesce(sum(amount) filter (where kind = 'remittance'), 0) as remitted,
  coalesce(sum(amount) filter (where kind = 'charge'), 0)
    - coalesce(sum(amount) filter (where kind = 'waiver'), 0)
    - coalesce(sum(amount) filter (where kind = 'payment'), 0)
    + coalesce(sum(amount) filter (where kind = 'refund'), 0) as balance
from public.study_ledger
where voided_at is null
group by application_id, currency;
grant select on public.study_application_balances to authenticated;
