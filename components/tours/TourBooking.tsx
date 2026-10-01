'use client';

// Date, group size and reserve. The price and the spots are checked again on the
// server inside create_tour_booking(), so nothing here can be used to change
// what a booking costs.

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';

import { getAuthStatus } from '@/lib/api';
import { createBrowserClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { tourMoney } from './TourCard';

export interface Departure { id: string; start_date: string; end_date: string; spots_left: number }

const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function TourBooking({ tour, departures }: {
  tour: { slug: string; title: string; price: number; discount_price: number | null; currency: string; min_group_size: number; max_group_size: number };
  departures: Departure[];
}) {
  const group = useId();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [departureId, setDepartureId] = useState(departures[0]?.id ?? '');
  const [people, setPeople] = useState(Math.max(1, tour.min_group_size));
  const [phone, setPhone] = useState('');
  const [requests, setRequests] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => { getAuthStatus().then((a) => setSignedIn(a.is_authenticated)).catch(() => setSignedIn(false)); }, []);

  const chosen = departures.find((d) => d.id === departureId);
  const maxPeople = Math.max(1, Math.min(tour.max_group_size, chosen?.spots_left ?? tour.max_group_size));
  const unit = tour.discount_price !== null && tour.discount_price < tour.price ? tour.discount_price : tour.price;
  const count = Math.min(Math.max(people, tour.min_group_size), maxPeople);

  async function reserve() {
    setError('');
    if (!chosen) return setError('Choose a date.');
    setBusy(true);
    const { data, error: err } = await createBrowserClient().rpc('create_tour_booking', { p_schedule_id: chosen.id, p_participants: count, p_phone: phone.trim(), p_special_requests: requests.trim() });
    setBusy(false);
    if (err) return setError(err.message || 'We could not reserve that. Please try again.');
    setReference(data);
  }

  const panel = { background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' };
  const field = { background: 'var(--sp-bg-primary)', border: '1px solid var(--sp-border)', color: 'var(--sp-text-primary)' };

  if (reference) {
    return (
      <div className="rounded-3xl p-5 text-center" style={panel}>
        <FontAwesomeIcon icon={faCheckCircle} className="h-10 w-10" style={{ color: '#10B981' }} />
        <h2 className="mt-3 text-xl font-bold">Your place is reserved</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>Booking reference</p>
        <p className="text-2xl font-bold tracking-wide" style={{ color: 'var(--sp-primary)' }}>{reference}</p>
        <p className="mt-3 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>We have your request for {count} {count === 1 ? 'person' : 'people'} on {chosen ? fmt(chosen.start_date) : 'the chosen date'}. Our team will email you to confirm and arrange payment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-5" style={panel}>
      <p className="text-sm" style={{ color: 'var(--sp-text-muted)' }}>From</p>
      <p className="flex items-baseline gap-2">
        <span className="text-3xl font-bold" style={{ color: 'var(--sp-primary)' }}>{tourMoney(unit, tour.currency)}</span>
        {unit < tour.price && <s className="text-sm" style={{ color: 'var(--sp-text-muted)' }}>{tourMoney(tour.price, tour.currency)}</s>}
        <span className="text-sm" style={{ color: 'var(--sp-text-muted)' }}>per person</span>
      </p>

      {departures.length === 0 ? (
        <p className="mt-4 rounded-xl p-4 text-sm" style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-secondary)' }}>No dates are open right now. <Link href="/about/contact-us" className="font-semibold underline">Contact us</Link> to ask about a private date.</p>
      ) : (
        <>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold">Choose a date</legend>
            <div className="space-y-2">
              {departures.map((d) => (
                <label key={d.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm" style={{ border: `1.5px solid ${departureId === d.id ? 'var(--sp-primary)' : 'var(--sp-border)'}`, background: departureId === d.id ? 'var(--sp-bg-primary)' : 'transparent' }}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name={group} value={d.id} checked={departureId === d.id} onChange={() => setDepartureId(d.id)} style={{ accentColor: 'var(--sp-primary)' }} />
                    <span className="font-medium">{fmt(d.start_date)}{d.end_date !== d.start_date && <span className="block text-xs font-normal" style={{ color: 'var(--sp-text-muted)' }}>to {fmt(d.end_date)}</span>}</span>
                  </span>
                  <span className="text-xs font-semibold" style={{ color: d.spots_left <= 5 ? '#C2410C' : 'var(--sp-text-muted)' }}>{d.spots_left} left</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-semibold">People</span>
            <div className="flex items-center rounded-full" style={{ border: '1px solid var(--sp-border)' }}>
              <button type="button" aria-label="Fewer people" className="h-11 w-11" disabled={count <= tour.min_group_size} onClick={() => setPeople(Math.max(tour.min_group_size, count - 1))}><FontAwesomeIcon icon={faMinus} className="h-3 w-3" /></button>
              <span className="w-8 text-center font-semibold" aria-live="polite">{count}</span>
              <button type="button" aria-label="More people" className="h-11 w-11" disabled={count >= maxPeople} onClick={() => setPeople(Math.min(maxPeople, count + 1))}><FontAwesomeIcon icon={faPlus} className="h-3 w-3" /></button>
            </div>
          </div>
          <p className="mt-1 text-right text-[11px]" style={{ color: 'var(--sp-text-muted)' }}>Groups of {tour.min_group_size} to {tour.max_group_size}</p>

          {signedIn && (
            <div className="mt-3 space-y-3">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (optional)" inputMode="tel" autoComplete="tel" className="min-h-[2.75rem] w-full rounded-xl px-4 text-sm" style={field} />
              <textarea value={requests} onChange={(e) => setRequests(e.target.value)} rows={2} maxLength={2000} placeholder="Anything we should know? (optional)" className="w-full rounded-xl px-4 py-3 text-sm" style={field} />
            </div>
          )}

          <div className="mt-4 flex items-baseline justify-between border-t pt-4" style={{ borderColor: 'var(--sp-border)' }}>
            <span className="text-sm">Total</span>
            <span className="text-xl font-bold">{tourMoney(unit * count, tour.currency)}</span>
          </div>

          {error && <p role="alert" className="mt-3 rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#B91C1C' }}>{error}</p>}

          {signedIn === false ? (
            <Button href="/auth/login" full className="mt-4">Sign in to reserve</Button>
          ) : (
            <Button onClick={reserve} disabled={signedIn === null} loading={busy} full className="mt-4">{busy ? 'Reserving…' : 'Reserve your booking'}</Button>
          )}
          <p className="mt-3 text-center text-[11px]" style={{ color: 'var(--sp-text-muted)' }}>You are not charged yet. We confirm your place by email first.</p>
        </>
      )}
    </div>
  );
}
