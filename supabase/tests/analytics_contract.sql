-- Runnable check for migration 0019 (the analytics contract).
--
-- Inserts synthetic traffic and checkouts dated in 2030, calls every analytics
-- function as an admin, then raises on purpose so the whole block rolls back
-- and nothing reaches the real tables. Read the result in the error message.
--
-- Expected for the window 2030-01-08 to 2030-01-15 against the one before it:
--   visitors 2 (previous 1), page_views 4 (previous 2)   6 excluded views ignored
--   orders 2 (previous 1), revenue 250 GHS (previous 100)  failed payment ignored
--   conversion 100 / 100, average_order_value 125 (previous 100)
--   new_customers 1, returning_customers 1 (new state), repeat_customer_rate 50
--   growth helper: (5,0) new with null percent, (0,0) flat 0, (0,5) decrease -100
--   revenue series: 50 on 2030-01-10, 200 on 2030-01-12, zeros elsewhere, 7 points
--   one day of hourly buckets: 24 points
--   weekdays: Wednesday 3 (peak), Thursday 1
--   top products: first product units 4, revenue 200, checkouts 2

do $$
declare
  admin_id uuid; ua uuid; ub uuid; px uuid; py uuid; ta uuid; ta2 uuid; tb uuid;
  w_from timestamptz := '2030-01-08 00:00+00'; w_to timestamptz := '2030-01-15 00:00+00';
  o text := ''; r jsonb; rec record;
begin
  select id into admin_id from public.profiles where is_admin order by created_at limit 1;
  select id into ua from public.profiles order by created_at limit 1;
  select id into ub from public.profiles order by created_at offset 1 limit 1;
  select id into px from public.market_products order by created_at limit 1;
  select id into py from public.market_products order by created_at offset 1 limit 1;

  insert into public.analytics_user_activities (action, page_visited, session_id, user_id, user_agent, created_at) values
   ('view','/market','s1',null,'Mozilla/5.0 Chrome','2030-01-09 10:00+00'),
   ('view','/blog','s1',null,'Mozilla/5.0 Chrome','2030-01-09 10:05+00'),
   ('view','/faq','s1',null,'Mozilla/5.0 Chrome','2030-01-09 10:06+00'),
   ('view','/','s2',null,'Mozilla/5.0 Safari','2030-01-10 09:00+00');
  insert into public.analytics_user_activities (action, page_visited, session_id, user_id, user_agent, created_at, is_test) values
   ('view','/','bot1',null,'Googlebot/2.1','2030-01-09 11:00+00',false),
   ('view','/','bot2',null,'python-requests/2.0','2030-01-09 11:00+00',false),
   ('view','/','empty',null,'','2030-01-09 11:00+00',false),
   ('view','/','test1',null,'Mozilla/5.0 Chrome','2030-01-09 11:00+00',true),
   ('view','/','adm',admin_id,'Mozilla/5.0 Chrome','2030-01-09 11:00+00',false),
   ('view','/admin/orders','anonadmin',null,'Mozilla/5.0 Chrome','2030-01-09 11:00+00',false);
  insert into public.analytics_user_activities (action, page_visited, session_id, user_id, user_agent, created_at) values
   ('view','/','s3',null,'Mozilla/5.0 Chrome','2030-01-03 09:00+00'),
   ('view','/market','s3',null,'Mozilla/5.0 Chrome','2030-01-03 09:01+00');

  insert into public.paystack_transactions (reference, amount, currency, status, user_id, email, paid_at, created_at)
   values ('t-prev-a', 100, 'GHS', 'success', ua, 'a@test', '2030-01-03 12:00+00', '2030-01-03 12:00+00') returning id into ta;
  insert into public.paystack_transactions (reference, amount, currency, status, user_id, email, paid_at, created_at)
   values ('t-cur-a', 50, 'GHS', 'success', ua, 'a@test', '2030-01-10 12:00+00', '2030-01-10 12:00+00') returning id into ta2;
  insert into public.paystack_transactions (reference, amount, currency, status, user_id, email, paid_at, created_at)
   values ('t-cur-b', 200, 'GHS', 'success', coalesce(ub, admin_id), 'b@test', '2030-01-12 12:00+00', '2030-01-12 12:00+00') returning id into tb;
  insert into public.paystack_transactions (reference, amount, currency, status, user_id, email, created_at)
   values ('t-failed', 999, 'GHS', 'failed', ua, 'a@test', '2030-01-11 12:00+00');

  insert into public.orders (order_number, user_id, product_id, quantity, unit_price, total_price, currency, payment_status, paystack_transaction_id) values
   ('ORD-00000000000A', coalesce(ub, admin_id), px, 3, 50, 150, 'GHS', 'success', tb),
   ('ORD-00000000000B', coalesce(ub, admin_id), py, 1, 50, 50, 'GHS', 'success', tb),
   ('ORD-00000000000C', ua, px, 1, 50, 50, 'GHS', 'success', ta2);

  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;

  r := public.analytics_kpis(w_from, w_to);
  o := o || E'KPIS\n' || jsonb_pretty(r - 'period' - 'previousPeriod') || E'\n';
  o := o || E'GROWTH: ' || public.analytics_growth(5,0)::text || ' | ' || public.analytics_growth(0,0)::text || ' | ' || public.analytics_growth(0,5)::text || E'\n';
  o := o || E'REVENUE SERIES: ';
  for rec in select * from public.analytics_timeseries(w_from, w_to, 'revenue') loop o := o || rec.date || '=' || rec.value || ' '; end loop;
  o := o || E'\nHOURLY points for one day: ' || (select count(*) from public.analytics_timeseries('2030-01-09 00:00+00', '2030-01-10 00:00+00', 'page_views'))::text;
  o := o || E'\nWEEKDAYS: ';
  for rec in select * from public.analytics_weekday_activity(w_from, w_to) loop o := o || rec.name || '=' || rec.page_views || case when rec.is_peak then '*' else '' end || ' '; end loop;
  o := o || E'\nTOP PRODUCTS: ';
  for rec in select * from public.analytics_top_products(w_from, w_to, 10) loop o := o || rec.title || ' units=' || rec.units_sold || ' rev=' || rec.revenue || ' checkouts=' || rec.checkouts || ' | '; end loop;

  raise exception E'RESULT\n%', o;
end $$;
