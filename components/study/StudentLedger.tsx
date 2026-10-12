// Fees and payments for one study application, as the student sees it.
// Presentational: the page loads the entries (RLS already hides voided ones).
// Students pay TechTour; TechTour pays the university and records that too.

import Link from 'next/link';

import { LEDGER_CATEGORIES, LEDGER_KINDS, formatMoney, ledgerBalances, type LedgerEntry } from '@/lib/study/meta';

const card = { background: 'var(--brand-card)', border: '1px solid var(--brand-line)' } as const;
const soft = (color: string, pct = 14) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
const day = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function StudentLedger({ entries, reference }: { entries: LedgerEntry[]; reference: string }) {
  if (entries.length === 0) return null;
  const balances = ledgerBalances(entries);

  return (
    <section className="mt-6 rounded-2xl p-5 sm:p-6" style={card} aria-labelledby="pay-h">
      <h2 id="pay-h" className="text-lg font-bold" style={{ color: 'var(--brand-text)' }}>Fees and payments</h2>
      <p className="mt-1 text-xs" style={{ color: 'var(--brand-muted)' }}>Every fee and every payment on this application is recorded here by our team.</p>

      {balances.map((b) => {
        const due = b.balance > 0;
        const over = b.balance < 0;
        return (
          <div key={b.currency} className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl p-4" style={{ border: '1px solid var(--brand-line)' }}>
              <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>Total fees</p>
              <p className="mt-1 text-lg font-bold" style={{ color: 'var(--brand-text)' }}>{formatMoney(b.charged - b.waived, b.currency)}</p>
            </div>
            <div className="rounded-xl p-4" style={{ border: '1px solid var(--brand-line)' }}>
              <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>You have paid</p>
              <p className="mt-1 text-lg font-bold" style={{ color: 'var(--brand-text)' }}>{formatMoney(b.paid - b.refunded, b.currency)}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: due ? soft('var(--brand-gold)', 16) : soft('var(--brand-success)', 10), border: `1px solid ${due ? soft('var(--brand-gold)', 40) : 'var(--brand-line)'}` }}>
              <p className="text-xs" style={{ color: 'var(--brand-text-2)' }}>{due ? 'Balance to pay' : over ? 'Credit on your account' : 'Balance'}</p>
              <p className="mt-1 text-lg font-bold" style={{ color: 'var(--brand-text)' }}>{formatMoney(Math.abs(b.balance), b.currency)}</p>
              {!due && !over && <p className="text-xs" style={{ color: 'var(--brand-text-2)' }}>Nothing to pay</p>}
            </div>
          </div>
        );
      })}

      {balances.some((b) => b.balance > 0) && (
        <p className="mt-4 text-sm" style={{ color: 'var(--brand-text-2)' }}>
          To pay, <Link href="/auth/support" className="font-semibold underline" style={{ color: 'var(--brand-teal)' }}>contact us</Link> and quote {reference}. We confirm each payment here as soon as we receive it.
        </p>
      )}

      <ul className="mt-5 divide-y" style={{ borderColor: 'var(--brand-line)' }}>
        {entries.map((en) => {
          const k = LEDGER_KINDS[en.kind];
          const name = en.description || LEDGER_CATEGORIES.find((c) => c.value === en.category)?.label || k.label;
          return (
            <li key={en.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3" style={{ borderColor: 'var(--brand-line)' }}>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{en.kind === 'payment' ? 'Payment received' : en.kind === 'remittance' ? `Paid to the university: ${name}` : `${k.label}: ${name}`}</p>
                <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>{[day(en.occurred_on), en.method, en.reference && `Ref ${en.reference}`].filter(Boolean).join(' · ')}</p>
              </div>
              <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--brand-text)' }}>{k.sign < 0 ? '-' : ''}{formatMoney(en.amount, en.currency)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
