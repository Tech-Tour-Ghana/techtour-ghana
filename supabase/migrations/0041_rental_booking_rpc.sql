-- 0041_rental_booking_rpc.sql
-- Dream Vacations: reserve a rental from the site.
--
-- Like create_tour_booking (0028), the price, the dates and the availability are
-- checked here, not in the browser. The booking starts as pending with payment
-- pending: staff confirm it and arrange payment, nothing is charged online.
-- Admins are told through the admin_alert trigger from 0040.
--
-- rental_booked_ranges() lets the page grey out dates that are taken. It returns
-- dates only, never who booked.

create or replace function public.create_rental_booking(
  p_rental_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests integer,
  p_guest_name text default '',
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
  v_rental public.vacation_rentals%rowtype;
  v_nights integer;
  v_subtotal numeric(10,2);
  v_ref text;
begin
  if v_user is null then
    raise exception 'Please sign in to reserve a stay.' using errcode = '28000';
  end if;
  if p_check_in is null or p_check_out is null or p_check_in < current_date then
    raise exception 'Choose a check-in date from today onwards.' using errcode = '22023';
  end if;
  v_nights := p_check_out - p_check_in;
  if v_nights < 1 or v_nights > 60 then
    raise exception 'Choose a stay of 1 to 60 nights.' using errcode = '22023';
  end if;

  select * into v_rental from public.vacation_rentals where id = p_rental_id and is_active for update;
  if not found or not v_rental.is_available then
    raise exception 'That rental is not available to book right now.' using errcode = '22023';
  end if;
  if p_guests is null or p_guests < 1 or p_guests > v_rental.max_guests then
    raise exception 'This place sleeps up to % guests.', v_rental.max_guests using errcode = '22023';
  end if;

  if exists (
    select 1 from public.vacation_bookings b
    where b.rental_id = v_rental.id
      and b.status in ('pending', 'confirmed')
      and b.check_in < p_check_out and b.check_out > p_check_in
  ) then
    raise exception 'Those dates are already taken. Try different dates.' using errcode = '22023';
  end if;

  select email into v_email from public.profiles where id = v_user;
  if v_email is null or v_email = '' then
    select email into v_email from auth.users where id = v_user;
  end if;

  v_subtotal := v_rental.price_per_night * v_nights;

  insert into public.vacation_bookings (
    user_id, rental_id, check_in, check_out, guests, total_nights,
    subtotal, cleaning_fee, total_price, currency,
    guest_name, guest_email, guest_phone, special_requests
  ) values (
    v_user, v_rental.id, p_check_in, p_check_out, p_guests, v_nights,
    v_subtotal, v_rental.cleaning_fee, v_subtotal + v_rental.cleaning_fee, v_rental.currency,
    left(coalesce(p_guest_name, ''), 120), coalesce(v_email, ''), left(coalesce(p_phone, ''), 40), left(coalesce(p_special_requests, ''), 2000)
  ) returning booking_number into v_ref;

  return v_ref;
end;
$$;

revoke all on function public.create_rental_booking(uuid, date, date, integer, text, text, text) from public, anon;
grant execute on function public.create_rental_booking(uuid, date, date, integer, text, text, text) to authenticated;

create or replace function public.rental_booked_ranges(p_rental_id uuid)
returns table (check_in date, check_out date)
language sql
stable
security definer
set search_path = public
as $$
  select b.check_in, b.check_out
  from public.vacation_bookings b
  where b.rental_id = p_rental_id and b.status in ('pending', 'confirmed') and b.check_out >= current_date
  order by b.check_in;
$$;

revoke all on function public.rental_booked_ranges(uuid) from public;
grant execute on function public.rental_booked_ranges(uuid) to anon, authenticated;
