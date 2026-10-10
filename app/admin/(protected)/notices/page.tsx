'use client';

// Notice board manager. Staff publish short announcements that show on the
// customer dashboard and, optionally, as a banner across the public site.
// Table, RLS and trash are in migration 0039.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import { notify } from '@/components/admin/toast';
import { Button, Modal, StatusPill, TableCard, Tabs, Toolbar, confirmAction, fieldStyle, reportError, rowClass, type Tone } from '@/components/admin/ui';
import { Field, Section, inputCls } from '@/components/admin/tours/shared';
import NoticeCard, { SEVERITY, severityOf } from '@/components/notices/NoticeCard';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Notice = Database['public']['Tables']['notices']['Row'];
type TabKey = 'live' | 'scheduled' | 'ended';

interface Form { title: string; body: string; severity: string; audience: string; is_pinned: boolean; show_banner: boolean; starts_at: string; ends_at: string; is_active: boolean }

const MAX_BODY = 2000;

// <input type="datetime-local"> works in local time without a zone.
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const blank = (): Form => ({ title: '', body: '', severity: 'info', audience: 'all', is_pinned: false, show_banner: false, starts_at: toLocalInput(new Date().toISOString()), ends_at: '', is_active: true });
const toForm = (n: Notice): Form => ({ title: n.title, body: n.body, severity: n.severity, audience: n.audience, is_pinned: n.is_pinned, show_banner: n.show_banner, starts_at: toLocalInput(n.starts_at), ends_at: toLocalInput(n.ends_at), is_active: n.is_active });

function tabOf(n: Notice, now: number): TabKey {
  if (!n.is_active) return 'ended';
  if (new Date(n.starts_at).getTime() > now) return 'scheduled';
  if (n.ends_at && new Date(n.ends_at).getTime() <= now) return 'ended';
  return 'live';
}

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No end');
const SEV_TONE: Record<string, Tone> = { info: 'info', success: 'success', warning: 'warning', critical: 'danger' };

export default function AdminNoticesPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [rows, setRows] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabKey>('live');
  const [editing, setEditing] = useState<'new' | Notice | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('notices').select('*').order('starts_at', { ascending: false });
    setError(err ? 'Notices could not be loaded. Please refresh.' : '');
    setRows(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const now = Date.now();
  const counts = { live: 0, scheduled: 0, ended: 0 };
  rows.forEach((n) => { counts[tabOf(n, now)] += 1; });
  const shown = rows.filter((n) => tabOf(n, now) === tab);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const open = (n: 'new' | Notice) => { setEditing(n); setForm(n === 'new' ? blank() : toForm(n)); };

  const startsOk = form.starts_at !== '' && !Number.isNaN(new Date(form.starts_at).getTime());
  const endBad = startsOk && form.ends_at !== '' && new Date(form.ends_at).getTime() <= new Date(form.starts_at).getTime();

  async function save() {
    const title = form.title.trim();
    if (title.length < 3 || title.length > 120) return notify('The title needs 3 to 120 characters.');
    if (form.body.length > MAX_BODY) return notify(`The message can be at most ${MAX_BODY} characters.`);
    if (!startsOk) return notify('Choose a start date and time.');
    if (endBad) return notify('The end must be after the start.');
    const row = {
      title, body: form.body.trim(), severity: form.severity, audience: form.audience, is_pinned: form.is_pinned, show_banner: form.show_banner,
      starts_at: new Date(form.starts_at).toISOString(), ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null, is_active: form.is_active,
    };
    setSaving(true);
    let failed: boolean;
    if (editing && editing !== 'new') {
      failed = reportError((await supabase.from('notices').update(row).eq('id', editing.id)).error);
    } else {
      const { data: auth } = await supabase.auth.getUser();
      failed = reportError((await supabase.from('notices').insert({ ...row, created_by: auth.user?.id ?? null })).error);
    }
    setSaving(false);
    if (failed) return;
    notify('Notice saved.', 'success');
    setEditing(null);
    await load();
  }

  async function patch(n: Notice, change: Partial<Pick<Notice, 'is_active' | 'is_pinned'>>) {
    if (reportError((await supabase.from('notices').update(change).eq('id', n.id)).error)) return;
    await load();
  }

  async function remove(n: Notice) {
    if (!(await confirmAction({ title: 'Delete notice?', message: `Delete "${n.title}"? You can restore it from Trash.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('notices').delete().eq('id', n.id)).error)) return;
    notify('Deleted.', 'success');
    await load();
  }

  const btn = 'min-h-[44px] whitespace-nowrap';

  return (
    <AdminLayout title="Notice Board" subtitle="Announcements for visitors and signed-in customers">
      {error && <p role="alert" className="mb-4 rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>}

      <Toolbar actions={<Button className="min-h-[44px]" onClick={() => open('new')}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />New notice</Button>}>
        <Tabs<TabKey>
          value={tab}
          onChange={setTab}
          tabs={[{ key: 'live', label: 'Live', count: counts.live }, { key: 'scheduled', label: 'Scheduled', count: counts.scheduled }, { key: 'ended', label: 'Expired / Inactive', count: counts.ended }]}
        />
      </Toolbar>

      <TableCard
        loading={loading}
        empty={shown.length === 0}
        emptyTitle="No notices here"
        emptyBody={rows.length === 0 ? 'Create a notice to show it to your visitors and customers.' : 'Nothing in this tab right now.'}
        headers={['Notice', 'Severity', 'Audience', 'Flags', 'Starts', 'Ends', 'Status', 'Actions']}
      >
        {shown.map((n) => {
          const sev = SEVERITY[severityOf(n.severity)];
          const t = tabOf(n, now);
          return (
            <tr key={n.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="min-w-[12rem] max-w-xs px-4 py-3">
                <p className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>{n.title}</p>
                <p className="line-clamp-1 text-xs" style={{ color: 'var(--adm-muted)' }}>{n.body}</p>
              </td>
              <td className="px-4 py-3"><StatusPill tone={SEV_TONE[n.severity] ?? 'info'} icon={sev.icon}>{sev.label}</StatusPill></td>
              <td className="whitespace-nowrap px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{n.audience === 'customers' ? 'Signed-in customers' : 'Everyone'}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {n.is_pinned && <StatusPill tone="neutral">Pinned</StatusPill>}
                  {n.show_banner && <StatusPill tone="neutral">Banner</StatusPill>}
                  {!n.is_pinned && !n.show_banner && <span style={{ color: 'var(--adm-muted)' }}>-</span>}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{when(n.starts_at)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{when(n.ends_at)}</td>
              <td className="px-4 py-3">
                <StatusPill tone={t === 'live' ? 'success' : t === 'scheduled' ? 'info' : 'neutral'}>
                  {!n.is_active ? 'Inactive' : t === 'live' ? 'Live' : t === 'scheduled' ? 'Scheduled' : 'Expired'}
                </StatusPill>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button variant="secondary" className={btn} onClick={() => patch(n, { is_active: !n.is_active })}>{n.is_active ? 'Deactivate' : 'Activate'}</Button>
                  <Button variant="secondary" className={btn} onClick={() => patch(n, { is_pinned: !n.is_pinned })}>{n.is_pinned ? 'Unpin' : 'Pin'}</Button>
                  <Button variant="secondary" className={btn} onClick={() => open(n)}>Edit</Button>
                  <Button variant="danger" className={btn} onClick={() => remove(n)}>Delete</Button>
                </div>
              </td>
            </tr>
          );
        })}
      </TableCard>

      {editing && (
        <Modal
          title={editing === 'new' ? 'New notice' : 'Edit notice'}
          subtitle={editing === 'new' ? undefined : editing.title}
          maxWidth="max-w-2xl"
          onClose={() => setEditing(null)}
          footer={<>
            <Button variant="secondary" className="min-h-[44px]" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="min-h-[44px]" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save notice'}</Button>
          </>}
        >
          <Section title="Message">
            <Field label="Title" hint="3 to 120 characters." className="sm:col-span-2">
              <input className={inputCls} style={fieldStyle} maxLength={120} value={form.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <Field label="Message" className="sm:col-span-2">
              <textarea rows={5} className={inputCls} style={fieldStyle} value={form.body} onChange={(e) => set('body', e.target.value)} aria-describedby="notice-count" />
              <span id="notice-count" aria-live="polite" className="mt-1 block text-right text-[11px]" style={{ color: form.body.length > MAX_BODY ? 'var(--adm-error)' : 'var(--adm-muted)' }}>{form.body.length} / {MAX_BODY}</span>
            </Field>
            <Field label="Severity">
              <select className={inputCls} style={fieldStyle} value={form.severity} onChange={(e) => set('severity', e.target.value)}>
                <option value="info">Info</option>
                <option value="success">Good news</option>
                <option value="warning">Heads up (warning)</option>
                <option value="critical">Important (critical)</option>
              </select>
            </Field>
            <Field label="Audience">
              <select className={inputCls} style={fieldStyle} value={form.audience} onChange={(e) => set('audience', e.target.value)}>
                <option value="all">Everyone</option>
                <option value="customers">Signed-in customers only</option>
              </select>
            </Field>
          </Section>

          <Section title="Display">
            <label className="flex min-h-[44px] items-center gap-3 text-sm" style={{ color: 'var(--adm-text)' }}>
              <input type="checkbox" className="h-5 w-5" checked={form.is_pinned} onChange={(e) => set('is_pinned', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />
              Pinned (listed first)
            </label>
            <label className="flex min-h-[44px] items-center gap-3 text-sm" style={{ color: 'var(--adm-text)' }}>
              <input type="checkbox" className="h-5 w-5" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />
              Active
            </label>
            <label className="flex min-h-[44px] items-center gap-3 text-sm sm:col-span-2" style={{ color: 'var(--adm-text)' }}>
              <input type="checkbox" className="h-5 w-5" checked={form.show_banner} onChange={(e) => set('show_banner', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />
              Show as a banner across the top of the site
            </label>
          </Section>

          <Section title="Schedule">
            <Field label="Start">
              <input type="datetime-local" className={inputCls} style={fieldStyle} value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
            </Field>
            <Field label="End (optional)" hint={endBad ? undefined : 'Leave empty to keep it up until you remove it.'}>
              <input type="datetime-local" className={inputCls} style={fieldStyle} value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} aria-invalid={endBad} />
              {endBad && <span role="alert" className="mt-1 block text-[11px]" style={{ color: 'var(--adm-error)' }}>The end must be after the start.</span>}
            </Field>
          </Section>

          <Section title="Preview">
            <div className="sm:col-span-2">
              <NoticeCard notice={{ title: form.title.trim(), body: form.body, severity: form.severity, is_pinned: form.is_pinned, starts_at: startsOk ? new Date(form.starts_at).toISOString() : new Date().toISOString() }} />
            </div>
          </Section>
        </Modal>
      )}
    </AdminLayout>
  );
}
