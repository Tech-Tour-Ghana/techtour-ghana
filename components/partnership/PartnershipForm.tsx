'use client';

// Partnership enquiry. It is saved as a contact message with the subject
// "Partnership enquiry", the same path as the contact form (/api/contact).

import { useId, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

import Button from '@/components/ui/Button';

export const PARTNER_TYPES = [
  { slug: 'hotels', label: 'Hotels and resorts' },
  { slug: 'tour-operators', label: 'Tour operators and guides' },
  { slug: 'artisans', label: 'Artisans and creators' },
  { slug: 'educational', label: 'Educational institutions' },
  { slug: 'ngos', label: 'NGOs and community organizations' },
  { slug: 'travel-agencies', label: 'Travel agencies' },
  { slug: 'other', label: 'Something else' },
] as const;

export default function PartnershipForm({ defaultType = '' }: { defaultType?: string }) {
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const [f, setF] = useState({ name: '', email: '', company: '', type: PARTNER_TYPES.some((t) => t.slug === defaultType) ? defaultType : '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const typeLabel = PARTNER_TYPES.find((t) => t.slug === f.type)?.label ?? 'Not specified';
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: f.name, email: f.email, subject: 'Partnership enquiry', message: `Organization: ${f.company}\nPartner type: ${typeLabel}\n\n${f.message}`.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const fields = data?.errors ? Object.values(data.errors as Record<string, string>).join(' ') : '';
        setError(fields || data?.error || 'We could not send your enquiry. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  const field = { background: 'var(--sp-bg-primary)', border: '1px solid var(--sp-border)', color: 'var(--sp-text-primary)' };
  const input = 'min-h-[2.75rem] w-full rounded-xl px-4 text-sm';
  const label = 'mb-1.5 block text-sm font-semibold';

  if (done) {
    return (
      <div className="rounded-3xl p-8 text-center" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)' }}>
        <FontAwesomeIcon icon={faCheckCircle} className="h-10 w-10 text-emerald-500" />
        <h3 className="mt-3 text-xl font-bold">Enquiry received</h3>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--sp-text-secondary)' }}>Thank you. Our team will read it and reply to {f.email}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl p-5 sm:p-8" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id('name')} className={label}>Your name</label>
          <input id={id('name')} required autoComplete="name" value={f.name} onChange={set('name')} className={input} style={field} />
        </div>
        <div>
          <label htmlFor={id('email')} className={label}>Email</label>
          <input id={id('email')} type="email" required autoComplete="email" value={f.email} onChange={set('email')} className={input} style={field} />
        </div>
        <div>
          <label htmlFor={id('company')} className={label}>Organization</label>
          <input id={id('company')} required autoComplete="organization" value={f.company} onChange={set('company')} className={input} style={field} />
        </div>
        <div>
          <label htmlFor={id('type')} className={label}>Type of partner</label>
          <select id={id('type')} value={f.type} onChange={set('type')} className={input} style={field}>
            <option value="">Choose one</option>
            {PARTNER_TYPES.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id('msg')} className={label}>How would you like to work together?</label>
          <textarea id={id('msg')} required rows={5} minLength={10} value={f.message} onChange={set('message')} className="w-full rounded-xl px-4 py-3 text-sm" style={field} />
        </div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#B91C1C' }}>{error}</p>}
      <div className="mt-6"><Button type="submit" loading={busy}>{busy ? 'Sending...' : 'Send enquiry'}</Button></div>
    </form>
  );
}
