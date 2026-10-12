'use client';

// A member writes a testimonial and follows what happens to it. Nothing is public
// until an admin approves it (submit_testimonial and the status trigger, migration
// 0050). A pending one can be withdrawn, which is also how to fix a typo.

import { useCallback, useEffect, useId, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft, faStar } from '@fortawesome/free-solid-svg-icons';

import DashboardLayout from '@/components/DashboardLayout';
import Button from '@/components/ui/Button';
import { getAuthStatus } from '@/lib/api';
import { createBrowserClient } from '@/lib/supabase/client';

interface Mine { id: string; author_name: string; author_position: string; content: string; rating: number; status: string; created_at: string }

const STATUS = {
  pending: { label: 'Waiting for review', color: 'var(--brand-warning)' },
  approved: { label: 'Live on our website', color: 'var(--brand-success)' },
  rejected: { label: 'Not published', color: 'var(--brand-muted)' },
} as const;
const MIN = 20;
const MAX = 1000;

const card = { background: 'var(--brand-card)', border: '1px solid var(--brand-line)' } as const;
const soft = (color: string, pct = 16) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <FontAwesomeIcon key={i} icon={faStar} className="h-3.5 w-3.5" style={{ color: i <= n ? 'var(--brand-gold)' : 'var(--brand-line)' }} />)}
    </span>
  );
}

export default function TestimonialsPage() {
  const uid = useId();
  const [mine, setMine] = useState<Mine[] | null>(null);
  const [f, setF] = useState({ name: '', position: '', rating: 0, content: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    const supabase = createBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    // Published testimonials are readable by everyone, so ask for this member's own.
    if (!auth.user) return setMine([]);
    const { data } = await supabase.from('testimonials').select('id, author_name, author_position, content, rating, status, created_at').eq('user_id', auth.user.id).order('created_at', { ascending: false });
    setMine((data as Mine[] | null) ?? []);
  }, []);

  useEffect(() => {
    load();
    getAuthStatus().then((a) => { if (a.user?.full_name) setF((s) => ({ ...s, name: s.name || a.user!.full_name! })); }).catch(() => {});
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setSent(false);
    if (f.rating < 1) return setError('Choose a rating from 1 to 5 stars.');
    if (f.content.trim().length < MIN) return setError('Please write at least a couple of sentences.');
    setBusy(true);
    const { error: err } = await createBrowserClient().rpc('submit_testimonial', { p_author_name: f.name, p_author_position: f.position, p_rating: f.rating, p_content: f.content });
    setBusy(false);
    if (err) return setError(err.message || 'We could not send that. Please try again.');
    setF((s) => ({ ...s, position: '', rating: 0, content: '' }));
    setSent(true);
    await load();
  }

  async function withdraw(t: Mine) {
    if (!window.confirm('Withdraw this testimonial? You can write a new one afterwards.')) return;
    const { error: err } = await createBrowserClient().from('testimonials').delete().eq('id', t.id);
    if (err) return setError('We could not withdraw that. Please try again.');
    await load();
  }

  const field = { background: 'var(--brand-bg)', border: '1px solid var(--brand-line)', color: 'var(--brand-text)' } as const;
  const input = 'min-h-[2.75rem] w-full rounded-xl px-4 text-sm';
  const label = 'mb-1.5 block text-sm font-semibold';

  return (
    <DashboardLayout title="Testimonials" subtitle="Tell others about your experience with TechTour">
      <form onSubmit={submit} className="rounded-2xl p-5 sm:p-6" style={card} noValidate>
        <h2 className="text-lg font-bold" style={{ color: 'var(--brand-text)' }}>Share your experience</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--brand-text-2)' }}>A tour, a stay, a study application or an order. Our team reads every testimonial before it appears on the website, and we tell you when it does.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-name`} className={label} style={{ color: 'var(--brand-text)' }}>Your name</label>
            <input id={`${uid}-name`} required maxLength={80} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={input} style={field} />
            <p className="mt-1 text-xs" style={{ color: 'var(--brand-muted)' }}>Shown next to your testimonial.</p>
          </div>
          <div>
            <label htmlFor={`${uid}-pos`} className={label} style={{ color: 'var(--brand-text)' }}>Where you are from (optional)</label>
            <input id={`${uid}-pos`} maxLength={80} value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} placeholder="e.g. Traveller from London" className={input} style={field} />
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className={label} style={{ color: 'var(--brand-text)' }}>Your rating</legend>
          <div className="flex gap-1" role="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer">
                <input type="radio" name={`${uid}-rating`} value={n} checked={f.rating === n} onChange={() => setF({ ...f, rating: n })} className="peer sr-only" />
                <span className="sr-only">{n} {n === 1 ? 'star' : 'stars'}</span>
                <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-xl peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
                  <FontAwesomeIcon icon={faStar} className="h-6 w-6" style={{ color: n <= f.rating ? 'var(--brand-gold)' : 'var(--brand-line)' }} />
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <label htmlFor={`${uid}-text`} className={label} style={{ color: 'var(--brand-text)' }}>Your testimonial</label>
          <textarea id={`${uid}-text`} required rows={5} maxLength={MAX} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} placeholder="What did you do, and what stood out?" className="w-full rounded-xl px-4 py-3 text-sm" style={field} />
          <p className="mt-1 text-xs" style={{ color: 'var(--brand-muted)' }}>{f.content.trim().length} of {MAX} characters. At least {MIN}.</p>
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'rgba(var(--brand-error-rgb), 0.1)', color: 'var(--brand-error-text)' }}>{error}</p>}
        {sent && <p role="status" className="mt-4 rounded-xl p-3 text-sm" style={{ background: soft('var(--brand-success)', 12), color: 'var(--brand-text)' }}>Thank you. We will review it and let you know when it is live.</p>}

        <div className="mt-5"><Button type="submit" loading={busy}>{busy ? 'Sending...' : 'Send testimonial'}</Button></div>
      </form>

      {mine && mine.length > 0 && (
        <section className="mt-6" aria-labelledby={`${uid}-mine`}>
          <h2 id={`${uid}-mine`} className="mb-3 text-lg font-bold" style={{ color: 'var(--brand-text)' }}>Your testimonials</h2>
          <ul className="space-y-3">
            {mine.map((t) => {
              const s = STATUS[t.status as keyof typeof STATUS] ?? STATUS.pending;
              return (
                <li key={t.id} className="rounded-2xl p-5" style={card}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars n={t.rating} />
                    <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: soft(s.color), color: 'var(--brand-text)' }}>
                      <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: s.color }} />{s.label}
                    </span>
                  </div>
                  <p className="mt-3 flex gap-2 text-sm" style={{ color: 'var(--brand-text)' }}><FontAwesomeIcon icon={faQuoteLeft} aria-hidden className="mt-1 h-3 w-3 flex-shrink-0" style={{ color: 'var(--brand-muted)' }} /><span className="whitespace-pre-wrap">{t.content}</span></p>
                  <p className="mt-2 text-xs" style={{ color: 'var(--brand-muted)' }}>{[t.author_name, t.author_position, new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')}</p>
                  {t.status === 'pending' && <button type="button" onClick={() => withdraw(t)} className="mt-3 text-xs font-semibold underline" style={{ color: 'var(--brand-text-2)' }}>Withdraw</button>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </DashboardLayout>
  );
}
