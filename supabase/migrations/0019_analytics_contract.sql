-- 0019_analytics_contract.sql
-- Server-side aggregation for the admin Analytics page. The agreed metric
-- definitions live here, so the browser only ever receives small aggregates.
--
--   Visitors        COUNT(DISTINCT session_id) over valid views
--   Page views      COUNT(*) of valid 'view' events
--   Orders          successful checkouts, one per paid transaction, NOT order rows
--   Revenue         SUM of paid transaction amounts, already GHS (never / 100)
--   Conversion      successful checkouts / visitors * 100
--   Growth          current vs the immediately preceding period of equal length
--   New customers   first ever successful checkout falls in the period
--   Returning       checkout in the period with an earlier successful checkout
--   Repeat rate     returning purchasers / purchasers * 100
--
-- "Valid" traffic excludes admin and staff, development and test hosts, empty
-- or automated-looking user agents, and admin or API paths.
--
-- Everything is SECURITY INVOKER, so the existing RLS (admin-only reads on the
-- analytics and payment tables) stays the authorization boundary, and each
-- function also refuses non-admins outright so the failure is explicit rather
-- than an empty result.

-- ---------------------------------------------------------------------------
-- Mark test traffic at write time
-- ---------------------------------------------------------------------------
-- app/api/analytics/events sets this when the request host is not the
-- production host (localhost, Vercel previews). Rows written before this
-- column existed carry false, there is no way to know their host.
alter table public.analytics_user_activities
  add column if not exists is_test boolean not null default false;

comment on column public.analytics_user_activities.is_test is
  'True when the event came from a non-production host (localhost, preview deploys). Excluded from analytics.';

create index if not exists analytics_user_activities_view_created_idx
  on public.analytics_user_activities (created_at) where action = 'view';

-- ---------------------------------------------------------------------------
-- Valid page views
-- ---------------------------------------------------------------------------
create or replace view public.analytics_valid_views
with (security_invoker = true) as
select a.id, a.session_id, a.user_id, a.page_visited, a.created_at
from public.analytics_user_activities a
where a.action = 'view'
  and not a.is_test
  and a.user_agent <> ''
  and a.user_agent !~* '(bot|crawl|spider|slurp|headless|lighthouse|pagespeed|curl|wget|python|node-fetch|axios|go-http|java/|monitor|uptime|preview|facebookexternalhit|whatsapp)'
  and a.page_visited !~ '^/(admin|api)($|[/?])'
  and not exists (
    select 1 from public.profiles p where p.id = a.user_id and p.is_admin
  );

comment on view public.analytics_valid_views is
  'Page views that count toward analytics: no staff, no test hosts, no automated user agents, no admin or API paths. security_invoker, so admin-only through RLS.';

-- ---------------------------------------------------------------------------
-- Paid checkouts
-- ---------------------------------------------------------------------------
-- A checkout is one paystack_transactions row. Revenue is only summed in GHS,
-- summing mixed currencies would be meaningless.
create or replace view public.analytics_paid_checkouts
with (security_invoker = true) as
select t.id as checkout_id,
       t.user_id,
       t.amount,
       t.currency,
       coalesce(t.paid_at, t.created_at) as paid_at
from public.paystack_transactions t
where t.status = 'success';

comment on view public.analytics_paid_checkouts is
  'Successful checkouts, one row per paid transaction. Amount is in major units (GHS).';

revoke all on public.analytics_valid_views, public.analytics_paid_checkouts from public, anon;
grant select on public.analytics_valid_views, public.analytics_paid_checkouts to authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.analytics_require_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
end;
$$;

-- Growth of `cur` over `prev`. previous = 0 with current > 0 is 'new', not an
-- invented +100%, and changePercent is null so the UI must handle it. Both
-- zero is a flat 0%.
create or replace function public.analytics_growth(cur numeric, prev numeric)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'current', cur,
    'previous', prev,
    'changePercent',
      case when prev = 0 then (case when cur = 0 then 0 else null end)
           else round(((cur - prev) / prev) * 100, 2) end,
    'changeState',
      case when prev = 0 and cur = 0 then 'flat'
           when prev = 0 then 'new'
           when cur > prev then 'increase'
           when cur < prev then 'decrease'
           else 'flat' end
  );
$$;

-- Raw metric values for one window [p_from, p_to).
create or replace function public.analytics_window_metrics(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_visitors numeric;
  v_views numeric;
  v_orders numeric;
  v_revenue numeric;
  v_purchasers numeric;
  v_new numeric;
  v_returning numeric;
  v_registrations numeric;
begin
  select count(distinct session_id), count(*)
    into v_visitors, v_views
  from public.analytics_valid_views
  where created_at >= p_from and created_at < p_to;

  select count(distinct checkout_id),
         coalesce(sum(amount) filter (where currency = 'GHS'), 0),
         count(distinct user_id)
    into v_orders, v_revenue, v_purchasers
  from public.analytics_paid_checkouts
  where paid_at >= p_from and paid_at < p_to;

  -- New: the customer's first ever successful checkout is inside the window.
  select count(*) into v_new
  from (
    select user_id, min(paid_at) as first_paid
    from public.analytics_paid_checkouts
    where user_id is not null
    group by user_id
  ) f
  where f.first_paid >= p_from and f.first_paid < p_to;

  -- Returning: a checkout in the window that has an earlier successful one.
  select count(distinct c.user_id) into v_returning
  from public.analytics_paid_checkouts c
  where c.user_id is not null
    and c.paid_at >= p_from and c.paid_at < p_to
    and exists (
      select 1 from public.analytics_paid_checkouts e
      where e.user_id = c.user_id
        and (e.paid_at, e.checkout_id) < (c.paid_at, c.checkout_id)
    );

  select count(*) into v_registrations
  from public.profiles
  where created_at >= p_from and created_at < p_to and not is_admin;

  return jsonb_build_object(
    'visitors', v_visitors,
    'page_views', v_views,
    'orders', v_orders,
    'revenue', v_revenue,
    'conversion_rate', case when v_visitors = 0 then 0 else round((v_orders / v_visitors) * 100, 2) end,
    'average_order_value', case when v_orders = 0 then 0 else round(v_revenue / v_orders, 2) end,
    'purchasing_customers', v_purchasers,
    'new_customers', v_new,
    'returning_customers', v_returning,
    'repeat_customer_rate', case when v_purchasers = 0 then 0 else round((v_returning / v_purchasers) * 100, 2) end,
    'new_registrations', v_registrations
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Public functions
-- ---------------------------------------------------------------------------
-- KPIs for the window and for the preceding window of identical length.
create or replace function public.analytics_kpis(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_prev_from timestamptz := p_from - (p_to - p_from);
  cur jsonb;
  prev jsonb;
  k text;
  result jsonb := '{}'::jsonb;
begin
  perform public.analytics_require_admin();
  if p_to <= p_from then
    raise exception 'p_to must be after p_from' using errcode = '22023';
  end if;

  cur := public.analytics_window_metrics(p_from, p_to);
  prev := public.analytics_window_metrics(v_prev_from, p_from);

  foreach k in array array[
    'visitors', 'page_views', 'orders', 'revenue', 'conversion_rate',
    'average_order_value', 'purchasing_customers', 'new_customers',
    'returning_customers', 'repeat_customer_rate', 'new_registrations'
  ] loop
    result := result || jsonb_build_object(
      k, public.analytics_growth((cur ->> k)::numeric, (prev ->> k)::numeric)
    );
  end loop;

  return result || jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'previousPeriod', jsonb_build_object('from', v_prev_from, 'to', p_from),
    'currency', 'GHS'
  );
end;
$$;

-- One value per bucket, gaps filled with real zeros. Hourly buckets for windows
-- of 48 hours or less (Today), daily otherwise, in Ghana time.
create or replace function public.analytics_timeseries(p_from timestamptz, p_to timestamptz, p_metric text)
returns table (date text, value numeric)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_unit text := case when (p_to - p_from) <= interval '48 hours' then 'hour' else 'day' end;
  v_tz constant text := 'Africa/Accra';
begin
  perform public.analytics_require_admin();
  if p_metric not in ('revenue', 'orders', 'visitors', 'page_views') then
    raise exception 'unknown metric %', p_metric using errcode = '22023';
  end if;
  if p_to <= p_from then
    raise exception 'p_to must be after p_from' using errcode = '22023';
  end if;

  return query
  with buckets as (
    select gs as bucket
    from generate_series(
      date_trunc(v_unit, p_from at time zone v_tz),
      date_trunc(v_unit, (p_to - interval '1 microsecond') at time zone v_tz),
      ('1 ' || v_unit)::interval
    ) gs
  ),
  views as (
    select date_trunc(v_unit, created_at at time zone v_tz) as bucket,
           count(*) as page_views,
           count(distinct session_id) as visitors
    from public.analytics_valid_views
    where created_at >= p_from and created_at < p_to
    group by 1
  ),
  sales as (
    select date_trunc(v_unit, paid_at at time zone v_tz) as bucket,
           count(distinct checkout_id) as orders,
           coalesce(sum(amount) filter (where currency = 'GHS'), 0) as revenue
    from public.analytics_paid_checkouts
    where paid_at >= p_from and paid_at < p_to
    group by 1
  )
  select to_char(b.bucket, case when v_unit = 'hour' then 'YYYY-MM-DD"T"HH24":00"' else 'YYYY-MM-DD' end),
         case p_metric
           when 'revenue' then coalesce(s.revenue, 0)
           when 'orders' then coalesce(s.orders, 0)
           when 'visitors' then coalesce(v.visitors, 0)
           else coalesce(v.page_views, 0)
         end::numeric
  from buckets b
  left join views v on v.bucket = b.bucket
  left join sales s on s.bucket = b.bucket
  order by b.bucket;
end;
$$;

-- All seven weekdays (Sunday first) with valid page views, peak flagged.
create or replace function public.analytics_weekday_activity(p_from timestamptz, p_to timestamptz)
returns table (weekday integer, name text, page_views bigint, is_peak boolean)
language plpgsql
stable
set search_path = ''
as $$
begin
  perform public.analytics_require_admin();
  if p_to <= p_from then
    raise exception 'p_to must be after p_from' using errcode = '22023';
  end if;

  return query
  with counts as (
    select extract(dow from created_at at time zone 'Africa/Accra')::integer as dow, count(*) as n
    from public.analytics_valid_views
    where created_at >= p_from and created_at < p_to
    group by 1
  ),
  days as (
    select d as dow,
           (array['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])[d + 1] as day_name,
           coalesce(c.n, 0) as n
    from generate_series(0, 6) d
    left join counts c on c.dow = d
  )
  select days.dow, days.day_name, days.n,
         days.n > 0 and days.n = max(days.n) over ()
  from days
  order by days.dow;
end;
$$;

-- Best sellers by units from successful checkouts, revenue and checkout count
-- alongside. Ratings and product views are deliberately not used.
create or replace function public.analytics_top_products(p_from timestamptz, p_to timestamptz, p_limit integer default 10)
returns table (product_id uuid, title text, units_sold bigint, revenue numeric, checkouts bigint)
language plpgsql
stable
set search_path = ''
as $$
begin
  perform public.analytics_require_admin();
  if p_to <= p_from then
    raise exception 'p_to must be after p_from' using errcode = '22023';
  end if;

  return query
  select o.product_id,
         p.title,
         sum(o.quantity)::bigint,
         coalesce(sum(o.total_price) filter (where o.currency = 'GHS'), 0),
         count(distinct c.checkout_id)
  from public.orders o
  join public.analytics_paid_checkouts c on c.checkout_id = o.paystack_transaction_id
  join public.market_products p on p.id = o.product_id
  where c.paid_at >= p_from and c.paid_at < p_to
  group by o.product_id, p.title
  order by 3 desc, 4 desc
  limit greatest(p_limit, 1);
end;
$$;

revoke all on function
  public.analytics_require_admin(),
  public.analytics_growth(numeric, numeric),
  public.analytics_window_metrics(timestamptz, timestamptz),
  public.analytics_kpis(timestamptz, timestamptz),
  public.analytics_timeseries(timestamptz, timestamptz, text),
  public.analytics_weekday_activity(timestamptz, timestamptz),
  public.analytics_top_products(timestamptz, timestamptz, integer)
from public, anon;

grant execute on function
  public.analytics_require_admin(),
  public.analytics_growth(numeric, numeric),
  public.analytics_window_metrics(timestamptz, timestamptz),
  public.analytics_kpis(timestamptz, timestamptz),
  public.analytics_timeseries(timestamptz, timestamptz, text),
  public.analytics_weekday_activity(timestamptz, timestamptz),
  public.analytics_top_products(timestamptz, timestamptz, integer)
to authenticated;
