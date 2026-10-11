'use client';

// Applying to one programme. The server (start_study_application) validates everything
// again and decides the owner. On success the student lands on the application's
// progress page, where the document checklist is waiting.

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Button from '@/components/ui/Button';
import { getAuthStatus } from '@/lib/api';

interface Props {
  program: { id: string; title: string };
  institution: { id: string; name: string };
  destinationId: string;
  intakes: string[];
}

const EDUCATION = ['High school', 'Diploma', 'Bachelor degree', 'Master degree', 'Other'];

export default function ProgramApplyForm({ program, institution, destinationId, intakes }: Props) {
  const router = useRouter();
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [f, setF] = useState({ full_name: '', email: '', phone: '', nationality: 'Ghanaian', education: '', intake: intakes[0] ?? '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    getAuthStatus()
      .then((a) => {
        setSignedIn(a.is_authenticated);
        if (a.user) setF((s) => ({ ...s, full_name: s.full_name || a.user!.full_name || '', email: s.email || a.user!.email || '' }));
      })
      .catch(() => setSignedIn(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/study-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_id: destinationId, institution_id: institution.id, program_id: program.id, intake: f.intake,
          full_name: f.full_name, email: f.email, phone: f.phone, nationality: f.nationality, education_level: f.education, message: f.message,
        }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string; id?: string } | null;
      if (!res.ok || !body?.id) { setError(body?.error || 'We could not send your application. Please try again.'); setBusy(false); return; }
      router.push(`/auth/study/${body.id}`);
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  const panel = { background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' };
  const field = { background: 'var(--sp-bg-primary)', border: '1px solid var(--sp-border)', color: 'var(--sp-text-primary)' };
  const input = 'min-h-[2.75rem] w-full rounded-xl px-4 text-sm';
  const label = 'mb-1.5 block text-sm font-semibold';

  if (signedIn === false) {
    return (
      <div className="rounded-3xl p-6 text-center sm:p-8" style={panel}>
        <h2 className="text-xl font-bold">Sign in to apply</h2>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
          Create a free account or sign in. Your application, documents and progress live in your account, so you can follow every step.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button href="/auth/login" variant="accent">Sign in</Button>
          <Button href="/auth/register" variant="secondary" arrow={false}>Create account</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl p-5 sm:p-8" style={panel} noValidate>
      <h2 className="text-xl font-bold">Your details</h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>You will upload your documents on the next page.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id('name')} className={label}>Full name</label>
          <input id={id('name')} required autoComplete="name" value={f.full_name} onChange={set('full_name')} className={input} style={field} />
        </div>
        <div>
          <label htmlFor={id('email')} className={label}>Email</label>
          <input id={id('email')} type="email" required autoComplete="email" value={f.email} onChange={set('email')} className={input} style={field} />
        </div>
        <div>
          <label htmlFor={id('phone')} className={label}>Phone or WhatsApp</label>
          <input id={id('phone')} type="tel" required autoComplete="tel" inputMode="tel" value={f.phone} onChange={set('phone')} placeholder="+233 ..." className={input} style={field} />
        </div>
        <div>
          <label htmlFor={id('nat')} className={label}>Nationality</label>
          <input id={id('nat')} autoComplete="country-name" value={f.nationality} onChange={set('nationality')} className={input} style={field} />
        </div>
        <div>
          <label htmlFor={id('edu')} className={label}>Highest education so far</label>
          <select id={id('edu')} value={f.education} onChange={set('education')} className={input} style={field}>
            <option value="">Choose one</option>
            {EDUCATION.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={id('intake')} className={label}>Intake</label>
          {intakes.length > 0 ? (
            <select id={id('intake')} value={f.intake} onChange={set('intake')} className={input} style={field}>
              {intakes.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input id={id('intake')} value={f.intake} onChange={set('intake')} placeholder="e.g. September 2027" className={input} style={field} />
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id('msg')} className={label}>Anything we should know? (optional)</label>
          <textarea id={id('msg')} rows={4} maxLength={2000} value={f.message} onChange={set('message')} className="w-full rounded-xl px-4 py-3 text-sm" style={field} />
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'rgba(var(--brand-error-rgb), 0.1)', color: 'var(--brand-error-text)' }}>{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="submit" loading={busy} disabled={signedIn === null}>{busy ? 'Sending...' : `Apply to ${institution.name}`}</Button>
        <p className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>By applying you agree to our <Link href="/privacy" className="underline">privacy policy</Link>.</p>
      </div>
    </form>
  );
}
