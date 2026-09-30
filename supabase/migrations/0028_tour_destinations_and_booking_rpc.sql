-- Public tour listings.
-- 1. Every tour belongs to one destination (Accra, Kumasi, Cape Coast, Volta
--    Region, Northern Region). The listing page filters on it.
-- 2. Customers reserve a place through create_tour_booking(). The function checks
--    the departure, works out the price on the server and takes the spots in
--    one locked step, so a client can never choose its own price or overbook.

alter table public.tours
  add column if not exists destination_id uuid references public.destinations (id) on delete set null;

create index if not exists tours_destination_id_idx on public.tours (destination_id);

update public.tours t set destination_id = d.id
from public.destinations d
where t.destination_id is null and (
  (d.slug = 'accra'       and (t.location ilike '%accra%'  or t.region ilike '%accra%')) or
  (d.slug = 'cape-coast'  and (t.location ilike '%cape coast%' or t.region ilike 'central')) or
  (d.slug = 'kumasi'      and (t.location ilike '%kumasi%' or t.region ilike 'ashanti')) or
  (d.slug = 'volta'       and (t.location ilike '%volta%'  or t.region ilike '%volta%')) or
  (d.slug = 'northern'    and (t.region ilike any (array['%northern%', 'savannah', 'upper%', 'north east'])))
);

create or replace function public.create_tour_booking(
  p_schedule_id uuid,
  p_participants integer,
  p_phone text default '',
  p_special_requests text default ''
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_sched public.tour_schedules%rowtype;
  v_tour public.tours%rowtype;
  v_unit numeric(10,2);
  v_ref text;
begin
  if v_user is null then
    raise exception 'Please sign in to reserve a tour.' using errcode = '28000';
  end if;
  if p_participants is null or p_participants < 1 or p_participants > 50 then
    raise exception 'Choose between 1 and 50 people.' using errcode = '22023';
  end if;

  select * into v_sched from public.tour_schedules where id = p_schedule_id for update;
  if not found then
    raise exception 'That departure does not exist.' using errcode = '22023';
  end if;
  if v_sched.is_cancelled or v_sched.start_date < current_date then
    raise exception 'That departure is no longer available.' using errcode = '22023';
  end if;
  if v_sched.available_spots - v_sched.booked_spots < p_participants then
    raise exception 'Only % spot(s) left on that date.', v_sched.available_spots - v_sched.booked_spots using errcode = '22023';
  end if;

  select * into v_tour from public.tours where id = v_sched.tour_id and is_active;
  if not found then
    raise exception 'That tour is not available.' using errcode = '22023';
  end if;
  if p_participants < v_tour.min_group_size or p_participants > v_tour.max_group_size then
    raise exception 'This tour takes % to % people.', v_tour.min_group_size, v_tour.max_group_size using errcode = '22023';
  end if;

  select email into v_email from public.profiles where id = v_user;
  if v_email is null or v_email = '' then
    select email into v_email from auth.users where id = v_user;
  end if;

  v_unit := coalesce(v_tour.discount_price, v_tour.price);

  insert into public.bookings (user_id, tour_id, schedule_id, email, phone, participants, special_requests, total_price, currency)
  values (v_user, v_tour.id, v_sched.id, coalesce(v_email, ''), left(coalesce(p_phone, ''), 40), p_participants, left(coalesce(p_special_requests, ''), 2000), v_unit * p_participants, v_tour.currency)
  returning booking_reference into v_ref;

  update public.tour_schedules set booked_spots = booked_spots + p_participants where id = v_sched.id;

  return v_ref;
end;
$$;

revoke all on function public.create_tour_booking(uuid, integer, text, text) from public, anon;
grant execute on function public.create_tour_booking(uuid, integer, text, text) to authenticated;
