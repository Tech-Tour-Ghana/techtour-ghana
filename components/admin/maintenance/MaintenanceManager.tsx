'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useMemo, useState } from 'react';

import { Button, ListSkeleton, Modal, Surface, fieldStyle } from '@/components/admin/ui';
import { notify } from '@/components/admin/toast';
import MaintenanceView from '@/components/maintenance/MaintenanceView';
import { DEFAULT_MAINTENANCE, MAX_MESSAGE, MAX_TITLE, isValidEmail, maintenanceFrom, type MaintenanceSettings } from '@/lib/maintenance';
import { createBrowserClient } from '@/lib/supabase/client';

const PRESETS: { label: string; title: string; message: string }[] = [
  { label: 'Scheduled upgrade', title: 'Upgrading your TechTour experience', message: 'We are rolling out improvements to TechTour Ghana. Bookings and the marketplace will be back shortly.' },
  { label: 'Quick fix', title: 'Back in a few minutes', message: 'We are fixing something behind the scenes and will be right back. Thanks for your patience.' },
  { label: 'Longer work', title: 'We are making TechTour better', message: 'TechTour Ghana is undergoing planned maintenance. We expect to be back later today. Thank you for bearing with us.' },
];

/** datetime-local value in the browser's own zone. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function MaintenanceManager() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [rowId, setRowId] = useState<string | null>(null);
  const [saved, setSaved] = useState<MaintenanceSettings>(DEFAULT_MAINTENANCE);
  const [title, setTitle] = useState(DEFAULT_MAINTENANCE.title);
  const [message, setMessage] = useState(DEFAULT_MAINTENANCE.message);
  const [eta, setEta] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmOn, setConfirmOn] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('site_settings').select('*').limit(1).maybeSingle().then(({ data, error: err }) => {
      if (err || !data) { setError('Could not load the maintenance settings.'); setLoading(false); return; }
      const m = maintenanceFrom(data);
      setRowId(data.id);
      setSaved(m);
      setTitle(m.title); setMessage(m.message); setEta(toLocalInput(m.eta)); setEmail(m.contactEmail);
      setLoading(false);
    });
  }, [supabase]);

  const draft: MaintenanceSettings = {
    enabled: saved.enabled,
    title: title.trim() || DEFAULT_MAINTENANCE.title,
    message: message.trim(),
    eta: eta ? new Date(eta).toISOString() : null,
    contactEmail: email.trim(),
  };
  const dirty = draft.title !== saved.title || draft.message !== saved.message || draft.eta !== saved.eta || draft.contactEmail !== saved.contactEmail;

  function validate(): string[] {
    const out: string[] = [];
    if (!title.trim()) out.push('Add a title.');
    if (title.length > MAX_TITLE) out.push(`The title must be ${MAX_TITLE} characters or fewer.`);
    if (message.length > MAX_MESSAGE) out.push(`The message must be ${MAX_MESSAGE} characters or fewer.`);
    if (eta && Number.isNaN(new Date(eta).getTime())) out.push('The expected return time is not a valid date.');
    if (!isValidEmail(email.trim())) out.push('The contact email is not a valid address.');
    return out;
  }

  async function persist(enabled: boolean) {
    const found = validate();
    setProblems(found);
    if (found.length || !rowId) return false;
    setBusy(true);
    const { error: err } = await supabase
      .from('site_settings')
      .update({
        maintenance_enabled: enabled,
        maintenance_title: draft.title,
        maintenance_message: draft.message,
        maintenance_eta: draft.eta,
        maintenance_contact_email: draft.contactEmail,
      })
      .eq('id', rowId);
    setBusy(false);
    if (err) { notify('Could not save. Please try again.'); return false; }
    setSaved({ ...draft, enabled });
    return true;
  }

  async function saveMessage() {
    if (await persist(saved.enabled)) notify(saved.enabled ? 'Saved. Visitors see the new message within about 10 seconds.' : 'Message saved.', 'success');
  }

  async function turnOn() {
    setConfirmOn(false);
    if (await persist(true)) notify('Maintenance mode is ON. Visitors now see the maintenance page.', 'success');
  }

  async function turnOff() {
    if (await persist(false)) notify('Maintenance mode is OFF. The site is live again.', 'success');
  }

  if (loading) return <ListSkeleton />;
  if (error) return <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>;

  const on = saved.enabled;
  const label = 'mb-1 block text-xs font-semibold';

  return (
    <div className="space-y-6">
      {/* Status and switch */}
      <Surface className="p-5" style={on ? { borderColor: 'var(--adm-error)' } : undefined}>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full" style={{ background: on ? 'var(--adm-error-soft)' : 'var(--adm-success-soft)', color: on ? 'var(--adm-error)' : 'var(--adm-success)' }}>
            <FontAwesomeIcon icon={faScrewdriverWrench} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold" style={{ color: 'var(--adm-text)' }}>
              {on ? 'Maintenance mode is ON' : 'The site is live'}
            </p>
            <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>
              {on
                ? 'Visitors see the maintenance page. You and other signed-in admins still see the whole site.'
                : 'Turn maintenance mode on to show visitors a maintenance page while you work.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Maintenance mode"
            disabled={busy}
            onClick={() => (on ? turnOff() : setConfirmOn(true))}
            className="relative h-8 w-14 flex-shrink-0 rounded-full transition-colors disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: on ? 'var(--adm-error)' : 'var(--adm-track)', border: '1px solid var(--adm-border)' }}
          >
            <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all" style={{ left: on ? '1.75rem' : '0.125rem' }} />
          </button>
        </div>
        <ul className="mt-4 grid gap-1 text-[11px] sm:grid-cols-2" style={{ color: 'var(--adm-muted)' }}>
          <li>Takes effect within about 10 seconds.</li>
          <li>Visitors and search engines get a temporary “503” notice, so rankings are not harmed.</li>
          <li>Payments are never blocked, so a payment in progress still completes.</li>
          <li>The admin area and admin sign-in keep working.</li>
        </ul>
      </Surface>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Message form */}
        <Surface className="space-y-4 p-5">
          <h2 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>Maintenance page message</h2>

          <div>
            <p className={label} style={{ color: 'var(--adm-text-2)' }}>Start from a template</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => { setTitle(p.title); setMessage(p.message); }}
                  className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="mm-title-input" className={label} style={{ color: 'var(--adm-text-2)' }}>Title</label>
              <span className="text-[11px]" style={{ color: title.length > MAX_TITLE ? 'var(--adm-error)' : 'var(--adm-muted)' }}>{title.length}/{MAX_TITLE}</span>
            </div>
            <input id="mm-title-input" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="mm-message-input" className={label} style={{ color: 'var(--adm-text-2)' }}>Message</label>
              <span className="text-[11px]" style={{ color: message.length > MAX_MESSAGE ? 'var(--adm-error)' : 'var(--adm-muted)' }}>{message.length}/{MAX_MESSAGE}</span>
            </div>
            <textarea id="mm-message-input" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
            <p className="mt-1 text-[11px]" style={{ color: 'var(--adm-muted)' }}>Line breaks are kept. This is exactly what visitors read.</p>
          </div>

          <div>
            <label htmlFor="mm-eta-input" className={label} style={{ color: 'var(--adm-text-2)' }}>Expected back (optional)</label>
            <div className="flex gap-2">
              <input id="mm-eta-input" type="datetime-local" value={eta} onChange={(e) => setEta(e.target.value)} className="min-w-0 flex-1 px-3 py-2 text-sm" style={fieldStyle} />
              {eta && <Button variant="secondary" onClick={() => setEta('')}>Clear</Button>}
            </div>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--adm-muted)' }}>Your local time. Visitors see it in Ghana time (GMT). It is hidden once the time has passed.</p>
          </div>

          <div>
            <label htmlFor="mm-email-input" className={label} style={{ color: 'var(--adm-text-2)' }}>Contact email (optional)</label>
            <input id="mm-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@techtourghana.com" className="w-full px-3 py-2 text-sm" style={fieldStyle} />
          </div>

          {problems.length > 0 && (
            <ul role="alert" className="space-y-1 rounded-[var(--adm-radius-control)] p-3 text-xs" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>
              {problems.map((p) => <li key={p}>{p}</li>)}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={saveMessage} disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save message'}</Button>
            {dirty && <span className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>Unsaved changes</span>}
          </div>
        </Surface>

        {/* Live preview */}
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>Preview</h2>
            <a href="/maintenance?preview=1" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: 'var(--adm-primary)' }}>
              Open full page <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-1 h-3 w-3" />
            </a>
          </div>
          <MaintenanceView settings={draft} preview />
          <p className="mt-2 text-[11px]" style={{ color: 'var(--adm-muted)' }}>Updates as you type. It follows the site&apos;s bright or dim theme.</p>
        </div>
      </div>

      {confirmOn && (
        <Modal
          title="Turn on maintenance mode?"
          maxWidth="max-w-md"
          onClose={() => setConfirmOn(false)}
          footer={<><Button variant="secondary" onClick={() => setConfirmOn(false)}>Cancel</Button><Button variant="danger" onClick={turnOn} disabled={busy}>Turn on</Button></>}
        >
          <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>
            Every visitor will see the maintenance page instead of the website, including customers who are browsing right now. You stay signed in and can keep using the site and the admin area.
          </p>
        </Modal>
      )}
    </div>
  );
}
