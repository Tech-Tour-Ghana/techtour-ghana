'use client';

// Dates, guests and reserve for a rental. Availability, price and limits are
// checked again in create_rental_booking() on the server. A reservation is a
// request: staff confirm it by email and arrange payment.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

import { getAuthStatus } from '@/lib/api';
import { createBrowserClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { tourMoney } from '@/components/tours/TourCard';

interface Range { check_in: string; check_out: string }

const DAY = 86_400_000;
const isoOf = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => isoOf(new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY));
const nightsBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function RentalBooking({ rental }: {
  rental: { id: string; price_per_night: number; cleaning_fee: number; security_deposit: number; currency: string; max_guests: number; is_available: boolean };
}) {
  const today = isoOf(new Date());
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [booked, setBooked] = useState<Range[]>([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [requests, setRequests] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    getAuthStatus().then((a) => setSignedIn(a.is_authenticated)).catch(() => setSignedIn(false));
    createBrowserClient().rpc('rental_booked_ranges', { p_rental_id: rental.id }).then(({ data }) => setBooked((data ?? []) as Range[]));
  }, [rental.id]);

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const clash = useMemo(() => nights > 0 && booked.some((b) => b.check_in < checkOut && b.check_out > checkIn), [booked, checkIn, checkOut, nights]);
  const subtotal = nights > 0 ? rental.price_per_night * nights : 0;
  const total = subtotal + (nights > 0 ? rental.cleaning_fee : 0);
  const valid = nights >= 1 && nights <= 60 && !clash;

  async function reserve() {
    setError('');
    if (!valid) return setError(clash ? 'Those dates are already taken.' : 'Choose your check-in and check-out dates.');
    setBusy(true);
    const { data, error: err } = await createBrowserClient().rpc('create_rental_booking', {
      p_rental_id: rental.id, p_check_in: checkIn, p_check_out: checkOut, p_guests: guests,
      p_guest_name: name.trim(), p_phone: phone.trim(), p_special_requests: requests.trim(),
    });
    setBusy(false);
    if (err) return setError(err.message || 'We could not reserve that. Please try again.');
    setReference(data);
  }

  const panel = { background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' };
  const field = { background: 'var(--sp-bg-primary)', border: '1px solid var(--sp-border)', color: 'var(--sp-text-primary)' };
  const muted = { color: 'var(--sp-text-muted)' };

  if (reference) {
    return (
      <div className="rounded-3xl p-5 text-center" style={panel}>
        <FontAwesomeIcon icon={faCheckCircle} className="h-10 w-10" style={{ color: 'var(--brand-success)' }} />
        <h2 className="mt-3 text-xl font-bold">Stay requested</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>Booking reference</p>
        <p className="text-2xl font-bold tracking-wide" style={{ color: 'var(--sp-primary)' }}>{reference}</p>
        <p className="mt-3 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{fmt(checkIn)} to {fmt(checkOut)}, {guests} {guests === 1 ? 'guest' : 'guests'}. Our team will email you to confirm and arrange payment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-5" style={panel}>
      <p className="leading-tight"><span className="text-2xl font-bold" style={{ color: 'var(--sp-primary)' }}>{tourMoney(rental.price_per_night, rental.currency)}</span> <span className="text-sm" style={muted}>per night</span></p>

      {!rental.is_available ? (
        <p className="mt-4 rounded-xl p-4 text-sm font-semibold" style={{ background: 'var(--sp-bg-primary)', color: 'var(--brand-warning-text)' }}>
          Currently unavailable. <Link href="/about/contact-us" className="underline">Contact us</Link> about other dates.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold">
              Check-in
              <input type="date" min={today} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(''); }} className="mt-1 min-h-[2.75rem] w-full rounded-xl px-3 text-sm font-normal" style={field} />
            </label>
            <label className="block text-xs font-semibold">
              Check-out
              <input type="date" min={checkIn ? addDays(checkIn, 1) : addDays(today, 1)} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 min-h-[2.75rem] w-full rounded-xl px-3 text-sm font-normal" style={field} />
            </label>
          </div>
          {clash && <p role="alert" className="mt-2 text-xs font-semibold" style={{ color: 'var(--brand-error-text)' }}>Those dates are taken. Try different dates.</p>}
          {booked.length > 0 && (
            <p className="mt-2 text-[11px]" style={muted}>Already booked: {booked.slice(0, 3).map((b) => `${fmt(b.check_in).replace(/^\w+, /, '')} to ${fmt(b.check_out).replace(/^\w+, /, '')}`).join('; ')}{booked.length > 3 ? ' and more' : ''}.</p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-semibold">Guests</span>
            <div className="flex items-center rounded-full" style={{ border: '1px solid var(--sp-border)' }}>
              <button type="button" aria-label="Fewer guests" className="h-11 w-11" disabled={guests <= 1} onClick={() => setGuests(guests - 1)}><FontAwesomeIcon icon={faMinus} className="h-3 w-3" /></button>
              <span className="w-8 text-center font-semibold" aria-live="polite">{guests}</span>
              <button type="button" aria-label="More guests" className="h-11 w-11" disabled={guests >= rental.max_guests} onClick={() => setGuests(guests + 1)}><FontAwesomeIcon icon={faPlus} className="h-3 w-3" /></button>
            </div>
          </div>
          <p className="mt-1 text-right text-[11px]" style={muted}>Sleeps up to {rental.max_guests}</p>

          {signedIn && (
            <div className="mt-3 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name (optional)" autoComplete="name" className="min-h-[2.75rem] w-full rounded-xl px-4 text-sm" style={field} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (optional)" inputMode="tel" autoComplete="tel" className="min-h-[2.75rem] w-full rounded-xl px-4 text-sm" style={field} />
              <textarea value={requests} onChange={(e) => setRequests(e.target.value)} rows={2} maxLength={2000} placeholder="Arrival time or anything we should know? (optional)" className="w-full rounded-xl px-4 py-3 text-sm" style={field} />
            </div>
          )}

          {nights > 0 && (
            <dl className="mt-4 space-y-1 border-t pt-4 text-sm" style={{ borderColor: 'var(--sp-border)', color: 'var(--sp-text-secondary)' }}>
              <div className="flex justify-between gap-3"><dt>{tourMoney(rental.price_per_night, rental.currency)} x {nights} {nights === 1 ? 'night' : 'nights'}</dt><dd>{tourMoney(subtotal, rental.currency)}</dd></div>
              {rental.cleaning_fee > 0 && <div className="flex justify-between gap-3"><dt>Cleaning fee</dt><dd>{tourMoney(rental.cleaning_fee, rental.currency)}</dd></div>}
              <div className="flex justify-between gap-3 pt-1 text-base font-bold" style={{ color: 'var(--sp-text-primary)' }}><dt>Total</dt><dd>{tourMoney(total, rental.currency)}</dd></div>
              {rental.security_deposit > 0 && <p className="pt-1 text-[11px]" style={muted}>A refundable security deposit of {tourMoney(rental.security_deposit, rental.currency)} is arranged separately.</p>}
            </dl>
          )}

          {error && <p role="alert" className="mt-3 rounded-xl p-3 text-sm" style={{ background: 'rgba(var(--brand-error-rgb), 0.1)', color: 'var(--brand-error-text)' }}>{error}</p>}

          {signedIn === false ? (
            <Button href="/auth/login" full className="mt-4">Sign in to reserve</Button>
          ) : (
            <Button onClick={reserve} disabled={signedIn === null || !valid} loading={busy} full className="mt-4">{busy ? 'Reserving...' : 'Request this stay'}</Button>
          )}
          <p className="mt-3 text-center text-[11px]" style={muted}>You are not charged yet. We confirm availability by email first.</p>
        </>
      )}
    </div>
  );
}
