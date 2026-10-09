'use client';

// Study abroad application. Everything is validated again inside the database
// function submit_study_application(), which also decides user_id and status.

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

import Button from '@/components/ui/Button';
import { getAuthStatus } from '@/lib/api';
import { createBrowserClient } from '@/lib/supabase/client';

interface Props {
  destination: { id: string; country_name: string };
  scholarships: { id: string; title: string }[];
}

const EDUCATION = ['High school', 'Diploma', 'Bachelor degree', 'Master degree', 'Other'];
const TARGET = [{ v: 'bachelor', l: 'Bachelor' }, { v: 'master', l: 'Master' }, { v: 'phd', l: 'PhD' }, { v: 'diploma', l: 'Diploma or short course' }];

const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); };

export default function StudyApplicationForm({ destination, scholarships }: Props) {
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [f, setF] = useState({ full_name: '', email: '', phone: '', nationality: '', education: '', target: 'bachelor', field: '', start: '', scholarship: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
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
    const { error: err } = await createBrowserClient().rpc('submit_study_application', {
      p_destination_id: destination.id,
      p_scholarship_id: f.scholarship || null,
      p_full_name: f.full_name,
      p_email: f.email,
      p_phone: f.phone,
      p_nationality: f.nationality,
      p_education_level: f.education,
      p_intended_level: f.target,
      p_field_of_study: f.field,
      p_start_date: f.start || null,
      p_message: f.message,
    });
    setBusy(false);
    if (err) return setError(err.message || 'We could not send your application. Please try again.');
    setDone(true);
  }

  const panel = { background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' };
  const field = { background: 'var(--sp-bg-primary)', border: '1px solid var(--sp-border)', color: 'var(--sp-text-primary)' };
  const input = 'min-h-[2.75rem] w-full rounded-xl px-4 text-sm';
  const label = 'mb-1.5 block text-sm font-semibold';

  if (done) {
    return (
      <div className="rounded-3xl p-6 text-center sm:p-8" style={panel}>
        <FontAwesomeIcon icon={faCheckCircle} className="h-10 w-10 text-emerald-500" />
        <h2 className="mt-3 text-xl font-bold">Application received</h2>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
          Thank you. Our study abroad team will review your application for {destination.country_name} and contact you at {f.email}. You can follow its status in your account.
        </p>
        <div className="mt-5 flex justify-center"><Button href="/auth/study">View my applications</Button></div>
      </div>
    );
  }

  if (signedIn === false) {
    return (
      <div className="rounded-3xl p-6 text-center sm:p-8" style={panel}>
        <h2 className="text-xl font-bold">Sign in to apply</h2>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
          Create a free account or sign in so you can track your application for {destination.country_name}.
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
      <h2 className="text-xl font-bold">Apply to study in {destination.country_name}</h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>It takes about two minutes. There is no application fee.</p>

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
          <label htmlFor={id('target')} className={label}>What do you want to study?</label>
          <select id={id('target')} value={f.target} onChange={set('target')} className={input} style={field}>
            {TARGET.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={id('field')} className={label}>Field of study</label>
          <input id={id('field')} value={f.field} onChange={set('field')} placeholder="e.g. Computer Science" className={input} style={field} />
        </div>
        <div>
          <label htmlFor={id('start')} className={label}>Preferred start date</label>
          <input id={id('start')} type="date" min={tomorrow()} value={f.start} onChange={set('start')} className={input} style={field} />
        </div>
        {scholarships.length > 0 && (
          <div className="sm:col-span-2">
            <label htmlFor={id('sch')} className={label}>Interested in a scholarship? (optional)</label>
            <select id={id('sch')} value={f.scholarship} onChange={set('scholarship')} className={input} style={field}>
              <option value="">No, or not sure yet</option>
              {scholarships.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label htmlFor={id('msg')} className={label}>Anything we should know? (optional)</label>
          <textarea id={id('msg')} rows={4} maxLength={2000} value={f.message} onChange={set('message')} className="w-full rounded-xl px-4 py-3 text-sm" style={field} />
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#B91C1C' }}>{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="submit" loading={busy} disabled={signedIn === null}>{busy ? 'Sending...' : 'Submit application'}</Button>
        <p className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>
          By applying you agree to our <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </div>
    </form>
  );
}
