-- 0015_link_orders_to_transactions.sql
-- Links orders to the paystack_transactions row that paid for them.
--
-- 0009 wrote a deliberate recommendation and did not execute it: "once the
-- payments flow is rebuilt, add a nullable ... orders foreign key ... and
-- retire the free text column". This is that rebuild. The webhook and the
-- verify Route Handler both need a way to (a) tell whether an order was
-- already created for a settled transaction, so a Paystack retry cannot
-- double-charge a cart into two orders, and (b) let an admin trace a payment
-- to what it bought. Free text order_id on paystack_transactions cannot do
-- either.

alter table public.orders
  add column if not exists paystack_transaction_id uuid
    references public.paystack_transactions (id) on delete restrict;

comment on column public.orders.paystack_transaction_id is
  'The settled transaction that paid for this order line. Nullable: legacy orders and any order placed before this column existed have none. RESTRICT, same reasoning as user_id and product_id on this table, a financial record must not lose its payment link to a cascading delete.';

-- One order row per product per transaction. The cart at checkout is one
-- transaction with several product lines (paystack_transactions.product_ids),
-- and orders has no multi line concept of its own, so each line becomes one
-- order row carrying the same transaction id. This is the idempotency guard:
-- inserting the same (transaction, product) pair twice, whether from a
-- Paystack webhook retry or the client re-polling verify, is rejected by the
-- database rather than trusted to application logic that remembers to check
-- first. NULLs are distinct in a Postgres unique index, so orders with no
-- transaction (legacy, or a future non-Paystack payment path) are unaffected.
create unique index if not exists orders_paystack_transaction_id_product_id_key
  on public.orders (paystack_transaction_id, product_id)
  where paystack_transaction_id is not null;

create index if not exists orders_paystack_transaction_id_idx
  on public.orders (paystack_transaction_id)
  where paystack_transaction_id is not null;
