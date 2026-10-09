'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faPlus, faStar, faTrash } from '@fortawesome/free-solid-svg-icons';

import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { notify } from '@/components/admin/toast';
import { Avatar, Button, IconButton, Modal, SearchInput, TableCard, Toggle, Toolbar, confirmAction, fieldStyle, fmtDate, reportError, rowClass } from '@/components/admin/ui';
import { Field, Section, inputCls } from '@/components/admin/tours/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

export type Testimonial = Database['public']['Tables']['testimonials']['Row'];

interface Form { author_name: string; author_position: string; author_image_path: string; content: string; rating: string; is_active: boolean; is_featured: boolean }
const EMPTY: Form = { author_name: '', author_position: '', author_image_path: '', content: '', rating: '5', is_active: true, is_featured: false };

const toForm = (t: Testimonial): Form => ({
  author_name: t.author_name, author_position: t.author_position, author_image_path: t.author_image_path ?? '', content: t.content,
  rating: String(t.rating), is_active: t.is_active, is_featured: t.is_featured,
});

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FontAwesomeIcon key={n} icon={faStar} className="h-3 w-3" style={{ color: n <= rating ? 'var(--adm-accent, #E6A64D)' : 'var(--adm-track)' }} />
      ))}
    </span>
  );
}

export default function TestimonialsPanel({ rows, loading, reload }: { rows: Testimonial[]; loading: boolean; reload: () => Promise<void> }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<'new' | Testimonial | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const q = search.trim().toLowerCase();
  const shown = rows.filter((t) => {
    if (statusFilter === 'active' && !t.is_active) return false;
    if (statusFilter === 'inactive' && t.is_active) return false;
    if (statusFilter === 'featured' && !t.is_featured) return false;
    if (ratingFilter !== 'all' && t.rating !== Number(ratingFilter)) return false;
    return !q || [t.author_name, t.author_position, t.content].some((x) => x.toLowerCase().includes(q));
  });
  const allShownSelected = shown.length > 0 && shown.every((t) => selected.has(t.id));
  const chosen = rows.filter((t) => selected.has(t.id));
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  function open(t: 'new' | Testimonial) {
    setEditing(t);
    setForm(t === 'new' ? EMPTY : toForm(t));
  }

  async function save() {
    const rating = Number(form.rating);
    if (!form.author_name.trim()) return notify('Add the name of the person who said it.');
    if (!form.content.trim()) return notify('Add what they said.');
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) return notify('The rating must be a whole number from 0 to 5.');
    const row = {
      author_name: form.author_name.trim(), author_position: form.author_position.trim(), author_image_path: form.author_image_path.trim() || null,
      content: form.content.trim(), rating, is_active: form.is_active, is_featured: form.is_featured,
    };
    setSaving(true);
    const { error } = editing && editing !== 'new' ? await supabase.from('testimonials').update(row).eq('id', editing.id) : await supabase.from('testimonials').insert(row);
    setSaving(false);
    if (reportError(error)) return;
    notify('Testimonial saved.', 'success');
    setEditing(null);
    await reload();
  }

  async function patch(t: Testimonial, change: Partial<Pick<Testimonial, 'is_active' | 'is_featured'>>) {
    if (reportError((await supabase.from('testimonials').update(change).eq('id', t.id)).error)) return;
    await reload();
  }

  async function remove(list: Testimonial[]) {
    const names = list.length === 1 ? `the testimonial from "${list[0]!.author_name}"` : `${list.length} testimonials`;
    if (!(await confirmAction({ title: 'Delete testimonials?', message: `Delete ${names}? You can restore it from Trash. To just hide it from the homepage, make it inactive instead.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('testimonials').delete().in('id', list.map((t) => t.id))).error)) return;
    setSelected(new Set());
    notify('Deleted.', 'success');
    await reload();
  }

  async function bulkActive(active: boolean) {
    if (reportError((await supabase.from('testimonials').update({ is_active: active }).in('id', chosen.map((t) => t.id))).error)) return;
    setSelected(new Set());
    await reload();
  }

  return (
    <>
      <Toolbar actions={<Button onClick={() => open('new')}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add testimonial</Button>}>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search name, role or quote" label="Search testimonials" />
        <select aria-label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Hidden</option>
          <option value="featured">Featured</option>
        </select>
        <select aria-label="Rating" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">Any rating</option>
          {[5, 4, 3, 2, 1, 0].map((n) => <option key={n} value={n}>{n} out of 5</option>)}
        </select>
      </Toolbar>

      <div className="mb-3 flex min-h-[2.25rem] flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2" style={{ color: 'var(--adm-text-2)' }}>
          <input type="checkbox" checked={allShownSelected} onChange={() => setSelected(allShownSelected ? new Set() : new Set(shown.map((t) => t.id)))} style={{ accentColor: 'var(--adm-primary)' }} />
          Select all shown ({shown.length})
        </label>
        {chosen.length > 0 && (
          <>
            <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{chosen.length} selected</span>
            <Button variant="secondary" onClick={() => bulkActive(true)}>Activate</Button>
            <Button variant="secondary" onClick={() => bulkActive(false)}>Deactivate</Button>
            <Button variant="danger" onClick={() => remove(chosen)}><FontAwesomeIcon icon={faTrash} className="mr-2 h-3 w-3" />Delete</Button>
          </>
        )}
      </div>

      <TableCard
        loading={loading}
        empty={shown.length === 0}
        emptyTitle={rows.length === 0 ? 'No testimonials yet' : 'No testimonials match'}
        emptyBody={rows.length === 0 ? 'Add a customer quote to show it on the homepage.' : 'Try a different search or filter.'}
        headers={['', 'Author', 'Quote', 'Rating', 'Status', 'Added', '']}
      >
        {shown.map((t) => (
          <tr key={t.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="w-8 px-4 py-3"><input type="checkbox" aria-label={`Select testimonial from ${t.author_name}`} checked={selected.has(t.id)} onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n; })} style={{ accentColor: 'var(--adm-primary)' }} /></td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={t.author_name} src={t.author_image_path} size={36} />
                <div className="min-w-0">
                  <p className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>{t.author_name}</p>
                  <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{t.author_position || '-'}</p>
                </div>
              </div>
            </td>
            <td className="min-w-[14rem] max-w-md px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}><p className="line-clamp-2">{t.content}</p></td>
            <td className="px-4 py-3"><Stars rating={t.rating} /></td>
            <td className="px-4 py-3">
              <div className="flex gap-1.5">
                <Toggle on={t.is_active} label={t.is_active ? 'Active' : 'Hidden'} onClick={() => patch(t, { is_active: !t.is_active })} />
                <Toggle on={t.is_featured} label="Featured" onClick={() => patch(t, { is_featured: !t.is_featured })} />
              </div>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{fmtDate(t.created_at)}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => open(t)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove([t])}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add testimonial' : 'Edit testimonial'}
          subtitle={editing === 'new' ? undefined : editing.author_name}
          maxWidth="max-w-2xl"
          onClose={() => setEditing(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save testimonial'}</Button>
          </>}
        >
          <Section title="Quote">
            <Field label="What they said" className="sm:col-span-2"><textarea rows={4} className={inputCls} style={fieldStyle} value={form.content} onChange={(e) => set('content', e.target.value)} /></Field>
            <Field label="Rating" hint="0 to 5 stars."><input type="number" min={0} max={5} step={1} className={inputCls} style={fieldStyle} value={form.rating} onChange={(e) => set('rating', e.target.value)} /></Field>
          </Section>

          <Section title="Author">
            <Field label="Name"><input className={inputCls} style={fieldStyle} value={form.author_name} onChange={(e) => set('author_name', e.target.value)} /></Field>
            <Field label="Role or location" hint="For example Traveller from London."><input className={inputCls} style={fieldStyle} value={form.author_position} onChange={(e) => set('author_position', e.target.value)} /></Field>
            <Field label="Photo (optional)" hint="Without a photo, initials are shown." className="sm:col-span-2"><UrlWithPicker inputStyle={fieldStyle} value={form.author_image_path} onChange={(v) => set('author_image_path', v)} /></Field>
          </Section>

          <Section title="Preview">
            <figure className="rounded-[var(--adm-radius-card)] p-4 sm:col-span-2" style={{ background: 'var(--adm-bg)', border: '1px solid var(--adm-border)' }}>
              <Stars rating={Math.min(5, Math.max(0, Number(form.rating) || 0))} />
              <blockquote className="mt-2 text-sm" style={{ color: 'var(--adm-text)' }}>{form.content.trim() || 'Their words will appear here.'}</blockquote>
              <figcaption className="mt-3 flex items-center gap-3">
                <Avatar name={form.author_name || '?'} src={form.author_image_path.trim() || null} size={36} />
                <span className="text-xs">
                  <span className="block font-semibold" style={{ color: 'var(--adm-text)' }}>{form.author_name.trim() || 'Author name'}</span>
                  <span style={{ color: 'var(--adm-muted)' }}>{form.author_position.trim()}</span>
                </span>
              </figcaption>
            </figure>
          </Section>

          <Section title="Visibility">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Active (visible on the homepage)</label>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Featured (shown first)</label>
          </Section>
        </Modal>
      )}
    </>
  );
}
