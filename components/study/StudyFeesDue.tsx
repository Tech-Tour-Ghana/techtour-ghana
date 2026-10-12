'use client';

// Study application fees the member still owes, on the Payments page. Online
// payments (Paystack) are listed below it; study fees are recorded by staff, so
// each row links to the application where the payment details are shown.
// Renders nothing when nothing is owed.

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { createBrowserClient } from '@/lib/supabase/client';
import { formatMoney } from '@/lib/study/meta';

interface Due { id: string; reference: string; program: string; amounts: string[] }

export default function StudyFeesDue() {
  const [due, setDue] = useState<Due[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      // Admins can read every application, so ask for this member's own.
      const { data: apps } = await supabase.from('study_applications').select('id, reference, program_name').eq('user_id', auth.user.id);
      if (!apps?.length) return;
      const { data: bal } = await supabase.from('study_application_balances').select('application_id, currency, balance').in('application_id', apps.map((a) => a.id)).gt('balance', 0);
      const rows: Due[] = [];
      for (const a of apps) {
        const mine = (bal ?? []).filter((b) => b.application_id === a.id);
        if (mine.length) rows.push({ id: a.id, reference: a.reference, program: a.program_name, amounts: mine.map((b) => formatMoney(b.balance ?? 0, b.currency ?? '')) });
      }
      setDue(rows);
    })();
  }, []);

  if (due.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl p-5" style={{ background: 'color-mix(in srgb, var(--brand-gold) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-gold) 40%, transparent)' }} aria-labelledby="study-fees-h">
      <h2 id="study-fees-h" className="text-base font-bold" style={{ color: 'var(--brand-text)' }}>Study fees to pay</h2>
      <ul className="mt-2 divide-y" style={{ borderColor: 'var(--brand-line)' }}>
        {due.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5" style={{ borderColor: 'var(--brand-line)' }}>
            <span className="min-w-0 text-sm" style={{ color: 'var(--brand-text)' }}>
              <span className="font-semibold">{d.program}</span>
              <span className="block text-xs" style={{ color: 'var(--brand-text-2)' }}>{d.reference}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: 'var(--brand-text)' }}>{d.amounts.join(', ')}</span>
              <Link href={`/auth/study/${d.id}`} className="inline-flex min-h-[2.75rem] items-center text-sm font-semibold underline" style={{ color: 'var(--brand-teal)' }}>How to pay</Link>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
