import { NextResponse } from 'next/server';

// Live cedi exchange rates from the Exchange Rate API open endpoint (no key,
// refreshed daily upstream). Cached for an hour; if the provider is down the
// caller falls back to the fixed rates in lib/currency.ts.
export const revalidate = 3600;

const CODES = ['USD', 'EUR', 'GBP', 'NGN'];

export async function GET() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/GHS', { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`rates ${res.status}`);
    const data = (await res.json()) as { result: string; time_last_update_utc?: string; rates?: Record<string, number> };
    if (data.result !== 'success' || !data.rates) throw new Error('bad rates payload');
    const rates = Object.fromEntries(CODES.filter((c) => typeof data.rates![c] === 'number').map((c) => [c, data.rates![c]]));
    return NextResponse.json({ live: true, updated: data.time_last_update_utc ?? null, rates }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
  } catch {
    return NextResponse.json({ live: false, updated: null, rates: {} }, { status: 200, headers: { 'Cache-Control': 'public, s-maxage=300' } });
  }
}
