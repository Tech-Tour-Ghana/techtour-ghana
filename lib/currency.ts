'use client';

// The currencies the shop shows prices in. Prices are stored and charged in
// cedis (GHS); every other currency is a display conversion. The rates here are
// the fallback used until (or unless) live rates load from /api/rates.

import { useEffect, useState } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

export const CURRENCIES: Currency[] = [
  { code: 'GHS', symbol: '₵', name: 'Ghana Cedi', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.085 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.078 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.067 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 130 },
];

export interface RatesInfo { live: boolean; updated: string | null }

let cached: Promise<{ currencies: Currency[]; info: RatesInfo }> | null = null;

function loadRates() {
  cached ??= fetch('/api/rates')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('rates unavailable'))))
    .then((data: { rates: Record<string, number>; live: boolean; updated: string | null }) => ({
      currencies: CURRENCIES.map((c) => ({ ...c, rate: c.code === 'GHS' ? 1 : data.rates[c.code] ?? c.rate })),
      info: { live: data.live, updated: data.updated },
    }))
    .catch(() => {
      cached = null; // try again on the next mount
      return { currencies: CURRENCIES, info: { live: false, updated: null } };
    });
  return cached;
}

/** The currency list with live rates once they arrive. Renders with the fallback rates first. */
export function useCurrencies(): { currencies: Currency[]; info: RatesInfo } {
  const [state, setState] = useState({ currencies: CURRENCIES, info: { live: false, updated: null } as RatesInfo });
  useEffect(() => {
    let cancelled = false;
    loadRates().then((r) => { if (!cancelled) setState(r); });
    return () => { cancelled = true; };
  }, []);
  return state;
}
