'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPencil,
  faTrash,
  faMicrochip,
  faCalendarAlt,
  faBookOpen,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import AdminLayout from '@/components/AdminLayout';
import { Button, IconButton, ListSkeleton, Modal, SearchInput, StatusPill, TableCard, Tabs, Toolbar, confirmAction, fmtDate, reportError, rowClass, type Tone } from '@/components/admin/ui';

const toSlug = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Types ────────────────────────────────────────────────────────────────────

interface TechInnovation {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'ai' | 'vr' | 'cloud' | 'mobile' | 'blockchain' | 'iot' | 'web3' | 'other';
  status: 'active' | 'development' | 'completed' | 'planned';
  icon: string;
  image_url: string;
  is_active: boolean;
}

interface TechEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_type: 'workshop' | 'hackathon' | 'seminar' | 'conference' | 'meetup' | 'webinar';
  starts_at: string;
  ends_at: string | null;
  location: string;
  is_active: boolean;
}

interface TechResource {
  id: string;
  title: string;
  slug: string;
  description: string;
  resource_type: 'article' | 'video' | 'tutorial' | 'tool' | 'course' | 'podcast';
  url: string;
  thumbnail_url: string;
  is_active: boolean;
}

type Tab = 'innovations' | 'events' | 'resources';

const CATEGORIES = [
  { value: 'ai', label: 'AI' },
  { value: 'vr', label: 'VR' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'blockchain', label: 'Blockchain' },
  { value: 'iot', label: 'IoT' },
  { value: 'web3', label: 'Web3' },
  { value: 'other', label: 'Other' },
] as const;

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'development', label: 'Development' },
  { value: 'completed', label: 'Completed' },
  { value: 'planned', label: 'Planned' },
] as const;

const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'conference', label: 'Conference' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'webinar', label: 'Webinar' },
] as const;

// ─── Blank forms ──────────────────────────────────────────────────────────────

const blankInnovation = (): Omit<TechInnovation, 'id'> => ({
  title: '', slug: '', description: '', category: 'ai', status: 'planned',
  icon: '', image_url: '', is_active: true,
});

const blankEvent = (): Omit<TechEvent, 'id'> => ({
  title: '', slug: '', description: '', event_type: 'meetup',
  starts_at: '', ends_at: null, location: '', is_active: true,
});

const blankResource = (): Omit<TechResource, 'id'> => ({
  title: '', slug: '', description: '', resource_type: 'article',
  url: '', thumbnail_url: '', is_active: true,
});

// ─── Category / status colour chips ──────────────────────────────────────────

const CATEGORY_TONE: Record<string, Tone> = { ai: 'info', vr: 'warning', cloud: 'info', mobile: 'success', blockchain: 'warning', iot: 'success', web3: 'info', other: 'neutral' };

const STATUS_TONE: Record<string, Tone> = { active: 'success', development: 'warning', completed: 'info' };

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminTechPage() {
  const [tab, setTab] = useState<Tab>('innovations');
  const [search, setSearch] = useState('');

  const [innovations, setInnovations] = useState<TechInnovation[]>([]);
  const [events, setEvents] = useState<TechEvent[]>([]);
  const [resources, setResources] = useState<TechResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [innovationModal, setInnovationModal] = useState<{ open: boolean; data: Omit<TechInnovation, 'id'>; id: string | null }>({ open: false, data: blankInnovation(), id: null });
  const [eventModal, setEventModal] = useState<{ open: boolean; data: Omit<TechEvent, 'id'>; id: string | null }>({ open: false, data: blankEvent(), id: null });
  const [resourceModal, setResourceModal] = useState<{ open: boolean; data: Omit<TechResource, 'id'>; id: string | null }>({ open: false, data: blankResource(), id: null });

  const supabase = useMemo(() => createBrowserClient(), []);

  const ts = {
    cardBg: 'var(--adm-card)',
    textPrimary: 'var(--adm-text)',
    textSecondary: 'var(--adm-text-2)',
    textMuted: 'var(--adm-muted)',
    border: 'var(--adm-border)',
    inputBg: 'var(--adm-bg)',
    inputBorder: 'var(--adm-border)',
    rowHover: 'var(--adm-track)',
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [inn, ev, res] = await Promise.all([
      supabase.from('tech_innovations').select('*').order('title'),
      supabase.from('tech_events').select('*').order('starts_at', { ascending: false }),
      supabase.from('tech_resources').select('*').order('title'),
    ]);
    setInnovations((inn.data ?? []) as unknown as TechInnovation[]);
    setEvents((ev.data ?? []) as unknown as TechEvent[]);
    setResources((res.data ?? []) as unknown as TechResource[]);
    setLoading(false);
  }, [supabase]); // ponytail: supabase ref is stable

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Delete helpers ─────────────────────────────────────────────────────────

  const deleteInnovation = async (id: string, title: string) => {
    if (!(await confirmAction({ message: `Delete innovation "${title}"?`, danger: true }))) return;
    if (reportError((await supabase.from('tech_innovations').delete().eq('id', id)).error)) { return; }
    fetchAll();
  };

  const deleteEvent = async (id: string, title: string) => {
    if (!(await confirmAction({ message: `Delete event "${title}"?`, danger: true }))) return;
    if (reportError((await supabase.from('tech_events').delete().eq('id', id)).error)) { return; }
    fetchAll();
  };

  const deleteResource = async (id: string, title: string) => {
    if (!(await confirmAction({ message: `Delete resource "${title}"?`, danger: true }))) return;
    if (reportError((await supabase.from('tech_resources').delete().eq('id', id)).error)) { return; }
    fetchAll();
  };

  // ── Save helpers ───────────────────────────────────────────────────────────

  const saveInnovation = async () => {
    setSaving(true);
    const d = innovationModal.data;
    if (innovationModal.id) {
      if (reportError((await supabase.from('tech_innovations').update(d).eq('id', innovationModal.id)).error)) { setSaving(false); return; }
    } else {
      if (reportError((await supabase.from('tech_innovations').insert(d)).error)) { setSaving(false); return; }
    }
    setSaving(false);
    setInnovationModal({ open: false, data: blankInnovation(), id: null });
    fetchAll();
  };

  const saveEvent = async () => {
    setSaving(true);
    const d = eventModal.data;
    if (eventModal.id) {
      if (reportError((await supabase.from('tech_events').update(d).eq('id', eventModal.id)).error)) { setSaving(false); return; }
    } else {
      if (reportError((await supabase.from('tech_events').insert(d)).error)) { setSaving(false); return; }
    }
    setSaving(false);
    setEventModal({ open: false, data: blankEvent(), id: null });
    fetchAll();
  };

  const saveResource = async () => {
    setSaving(true);
    const d = resourceModal.data;
    if (resourceModal.id) {
      if (reportError((await supabase.from('tech_resources').update(d).eq('id', resourceModal.id)).error)) { setSaving(false); return; }
    } else {
      if (reportError((await supabase.from('tech_resources').insert(d)).error)) { setSaving(false); return; }
    }
    setSaving(false);
    setResourceModal({ open: false, data: blankResource(), id: null });
    fetchAll();
  };

  // ── Shared UI bits ─────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    background: ts.inputBg, border: `1px solid ${ts.inputBorder}`, color: ts.textPrimary,
    borderRadius: 8, padding: '6px 10px', fontSize: 13, width: '100%', outline: 'none',
  };

  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: ts.textSecondary, marginBottom: 4, display: 'block' };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );

  if (loading) {
    return (
      <AdminLayout title="Tech Hub" subtitle="Manage tech innovations, events and resources">
        <ListSkeleton />
      </AdminLayout>
    );
  }

  const q = search.trim().toLowerCase();
  const has = (...t: (string | null | undefined)[]) => !q || t.some((x) => (x ?? '').toLowerCase().includes(q));
  const vInnovations = innovations.filter((n) => has(n.title, n.category, n.status));
  const vEvents = events.filter((e) => has(e.title, e.event_type, e.location));
  const vResources = resources.filter((r) => has(r.title, r.resource_type));

  const tabs: { key: Tab; label: string; icon: typeof faMicrochip; count: number }[] = [
    { key: 'innovations', label: 'Innovations', icon: faMicrochip, count: innovations.length },
    { key: 'events', label: 'Events', icon: faCalendarAlt, count: events.length },
    { key: 'resources', label: 'Resources', icon: faBookOpen, count: resources.length },
  ];

  return (
    <AdminLayout title="Tech Hub" subtitle="Manage tech innovations, events and resources">
      <Toolbar
        actions={
          <Button onClick={() => (tab === 'innovations' ? setInnovationModal({ open: true, data: blankInnovation(), id: null }) : tab === 'events' ? setEventModal({ open: true, data: blankEvent(), id: null }) : setResourceModal({ open: true, data: blankResource(), id: null }))}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />{tab === 'innovations' ? 'Add innovation' : tab === 'events' ? 'Add event' : 'Add resource'}
          </Button>
        }
      >
        <Tabs value={tab} onChange={(t) => { setTab(t); setSearch(''); }} tabs={tabs.map((t) => ({ key: t.key, label: t.label, count: t.count }))} />
        <SearchInput className="min-w-[12rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search" label="Search" />
      </Toolbar>

      {tab === 'innovations' && (
        <TableCard loading={false} empty={vInnovations.length === 0} emptyTitle={innovations.length === 0 ? 'No innovations yet' : 'No innovations match'} headers={['Innovation', 'Category', 'Stage', 'Visible', '']}>
          {vInnovations.map((n) => (
            <tr key={n.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{n.title}</td>
              <td className="px-4 py-3"><StatusPill tone={CATEGORY_TONE[n.category] ?? 'neutral'}><span className="capitalize">{n.category}</span></StatusPill></td>
              <td className="px-4 py-3"><StatusPill tone={STATUS_TONE[n.status] ?? 'neutral'}><span className="capitalize">{n.status}</span></StatusPill></td>
              <td className="px-4 py-3"><StatusPill tone={n.is_active ? 'success' : 'neutral'}>{n.is_active ? 'Visible' : 'Hidden'}</StatusPill></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => setInnovationModal({ open: true, data: { title: n.title, slug: n.slug, description: n.description, category: n.category, status: n.status, icon: n.icon, image_url: n.image_url, is_active: n.is_active }, id: n.id })}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => deleteInnovation(n.id, n.title)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {tab === 'events' && (
        <TableCard loading={false} empty={vEvents.length === 0} emptyTitle={events.length === 0 ? 'No events yet' : 'No events match'} headers={['Event', 'Type', 'Starts', 'Visible', '']}>
          {vEvents.map((ev) => (
            <tr key={ev.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{ev.title}</td>
              <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--adm-text-2)' }}>{ev.event_type}</td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{ev.starts_at ? fmtDate(ev.starts_at) : '-'}</td>
              <td className="px-4 py-3"><StatusPill tone={ev.is_active ? 'success' : 'neutral'}>{ev.is_active ? 'Visible' : 'Hidden'}</StatusPill></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => setEventModal({ open: true, data: { title: ev.title, slug: ev.slug, description: ev.description, event_type: ev.event_type, starts_at: ev.starts_at, ends_at: ev.ends_at, location: ev.location, is_active: ev.is_active }, id: ev.id })}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => deleteEvent(ev.id, ev.title)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {tab === 'resources' && (
        <TableCard loading={false} empty={vResources.length === 0} emptyTitle={resources.length === 0 ? 'No resources yet' : 'No resources match'} headers={['Resource', 'Type', 'Visible', '']}>
          {vResources.map((r) => (
            <tr key={r.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{r.title}</td>
              <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--adm-text-2)' }}>{r.resource_type ?? '-'}</td>
              <td className="px-4 py-3"><StatusPill tone={r.is_active ? 'success' : 'neutral'}>{r.is_active ? 'Visible' : 'Hidden'}</StatusPill></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => setResourceModal({ open: true, data: { title: r.title, slug: r.slug, description: r.description, resource_type: r.resource_type, url: r.url, thumbnail_url: r.thumbnail_url, is_active: r.is_active }, id: r.id })}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => deleteResource(r.id, r.title)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {/* ═══════════════════════════════════════════════
          Modal: Innovation
      ═══════════════════════════════════════════════ */}
      {innovationModal.open && (
        <Modal title={innovationModal.id ? 'Edit Innovation' : 'Add Innovation'} maxWidth="max-w-lg" onClose={() => setInnovationModal({ open: false, data: blankInnovation(), id: null })}
          footer={
            <>
                <Button variant="secondary" onClick={() => setInnovationModal({ open: false, data: blankInnovation(), id: null })}>
Cancel
</Button>
                <Button onClick={saveInnovation} disabled={saving}>
{saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {innovationModal.id ? 'Save Changes' : 'Add Innovation'}
</Button>
              
            </>
          }
        >
<div className="">
              <Field label="Title *">
                <input
                  style={inputStyle}
                  value={innovationModal.data.title}
                  onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, title: e.target.value, slug: toSlug(e.target.value) } }))}
                />
              </Field>
              <Field label="Slug (auto-generated)">
                <input style={{ ...inputStyle, color: ts.textMuted }} value={innovationModal.data.slug} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, slug: e.target.value } }))} />
              </Field>
              <Field label="Description">
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={innovationModal.data.description ?? ''} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, description: e.target.value } }))} />
              </Field>
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Category">
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={innovationModal.data.category} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, category: e.target.value as TechInnovation['category'] } }))}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={innovationModal.data.status} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, status: e.target.value as TechInnovation['status'] } }))}>
                    {STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Image URL">
                <UrlWithPicker inputStyle={inputStyle} value={innovationModal.data.image_url ?? ''} onChange={v => setInnovationModal(s => ({ ...s, data: { ...s.data, image_url: v } }))} />
              </Field>
              <Field label="Icon (emoji or CSS class)">
                <input style={inputStyle} value={innovationModal.data.icon ?? ''} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, icon: e.target.value } }))} />
              </Field>
              <Field label="Active">
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id="inn-active" checked={innovationModal.data.is_active} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: 'var(--adm-primary)' }} />
                  <label htmlFor="inn-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                </div>
              </Field>
              
            
</div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════
          Modal: Event
      ═══════════════════════════════════════════════ */}
      {eventModal.open && (
        <Modal title={eventModal.id ? 'Edit Event' : 'Add Event'} maxWidth="max-w-lg" onClose={() => setEventModal({ open: false, data: blankEvent(), id: null })}
          footer={
            <>
                <Button variant="secondary" onClick={() => setEventModal({ open: false, data: blankEvent(), id: null })}>
Cancel
</Button>
                <Button onClick={saveEvent} disabled={saving}>
{saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {eventModal.id ? 'Save Changes' : 'Add Event'}
</Button>
              
            </>
          }
        >
<div className="">
              <Field label="Title *">
                <input
                  style={inputStyle}
                  value={eventModal.data.title}
                  onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, title: e.target.value, slug: toSlug(e.target.value) } }))}
                />
              </Field>
              <Field label="Slug (auto-generated)">
                <input style={{ ...inputStyle, color: ts.textMuted }} value={eventModal.data.slug} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, slug: e.target.value } }))} />
              </Field>
              <Field label="Description">
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={eventModal.data.description ?? ''} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, description: e.target.value } }))} />
              </Field>
              <Field label="Event Type">
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={eventModal.data.event_type} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, event_type: e.target.value as TechEvent['event_type'] } }))}>
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Starts At">
                  <input type="datetime-local" style={inputStyle} value={eventModal.data.starts_at ?? ''} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, starts_at: e.target.value } }))} />
                </Field>
                <Field label="Ends At">
                  <input type="datetime-local" style={inputStyle} value={eventModal.data.ends_at ?? ''} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, ends_at: e.target.value } }))} />
                </Field>
              </div>
              <Field label="Location">
                <input style={inputStyle} value={eventModal.data.location ?? ''} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, location: e.target.value } }))} />
              </Field>
              <Field label="Active">
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id="ev-active" checked={eventModal.data.is_active} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: 'var(--adm-primary)' }} />
                  <label htmlFor="ev-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                </div>
              </Field>
              
            
</div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════
          Modal: Resource
      ═══════════════════════════════════════════════ */}
      {resourceModal.open && (
        <Modal title={resourceModal.id ? 'Edit Resource' : 'Add Resource'} maxWidth="max-w-lg" onClose={() => setResourceModal({ open: false, data: blankResource(), id: null })}
          footer={
            <>
                <Button variant="secondary" onClick={() => setResourceModal({ open: false, data: blankResource(), id: null })}>
Cancel
</Button>
                <Button onClick={saveResource} disabled={saving}>
{saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {resourceModal.id ? 'Save Changes' : 'Add Resource'}
</Button>
              
            </>
          }
        >
<div className="">
              <Field label="Title *">
                <input
                  style={inputStyle}
                  value={resourceModal.data.title}
                  onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, title: e.target.value, slug: toSlug(e.target.value) } }))}
                />
              </Field>
              <Field label="Slug (auto-generated)">
                <input style={{ ...inputStyle, color: ts.textMuted }} value={resourceModal.data.slug} onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, slug: e.target.value } }))} />
              </Field>
              <Field label="Description">
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={resourceModal.data.description ?? ''} onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, description: e.target.value } }))} />
              </Field>
              <Field label="Resource Type">
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={resourceModal.data.resource_type} onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, resource_type: e.target.value as TechResource['resource_type'] } }))}>
                  {['article','video','tutorial','tool','course','podcast'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="URL *">
                <input style={inputStyle} value={resourceModal.data.url ?? ''} onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, url: e.target.value } }))} />
              </Field>
              <Field label="Thumbnail URL">
                <UrlWithPicker inputStyle={inputStyle} value={resourceModal.data.thumbnail_url ?? ''} onChange={v => setResourceModal(s => ({ ...s, data: { ...s.data, thumbnail_url: v } }))} />
              </Field>
              <Field label="Active">
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id="res-active" checked={resourceModal.data.is_active} onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: 'var(--adm-primary)' }} />
                  <label htmlFor="res-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                </div>
              </Field>
              
            
</div>
        </Modal>
      )}
    </AdminLayout>
  );
}
