'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { notify } from '@/components/admin/toast';
import { Avatar, Button, IconButton, Modal, SearchInput, TableCard, Toggle, Toolbar, confirmAction, fieldStyle, reportError, rowClass } from '@/components/admin/ui';
import { Field, Section, inputCls } from '@/components/admin/tours/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { isEmail, isUrl, type Member } from './shared';

interface Form { name: string; position: string; email: string; linkedin: string; bio: string; image_path: string; sort_order: string; is_active: boolean }
const EMPTY: Form = { name: '', position: '', email: '', linkedin: '', bio: '', image_path: '', sort_order: '0', is_active: true };

const toForm = (m: Member): Form => ({
  name: m.name, position: m.position, email: m.email, linkedin: m.linkedin, bio: m.bio, image_path: m.image_path ?? '',
  sort_order: String(m.sort_order), is_active: m.is_active,
});

export default function MembersPanel({ members, loading, reload }: { members: Member[]; loading: boolean; reload: () => Promise<void> }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<'new' | Member | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const q = search.trim().toLowerCase();
  const shown = members.filter((m) => !q || [m.name, m.position, m.email].some((x) => x.toLowerCase().includes(q)));
  const allShownSelected = shown.length > 0 && shown.every((m) => selected.has(m.id));
  const chosen = members.filter((m) => selected.has(m.id));
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  function open(m: 'new' | Member) {
    setEditing(m);
    setForm(m === 'new' ? { ...EMPTY, sort_order: String(members.reduce((n, x) => Math.max(n, x.sort_order), -1) + 1) } : toForm(m));
  }

  async function save() {
    const sort = Number(form.sort_order);
    if (!form.name.trim()) return notify('Give the team member a name.');
    if (form.email.trim() && !isEmail(form.email.trim())) return notify('That email address does not look right.');
    if (form.linkedin.trim() && !isUrl(form.linkedin.trim())) return notify('The LinkedIn link must start with https://');
    if (!Number.isInteger(sort) || sort < 0) return notify('Sort order must be a whole number, 0 or higher.');
    const row = {
      name: form.name.trim(), position: form.position.trim(), email: form.email.trim(), linkedin: form.linkedin.trim(), bio: form.bio.trim(),
      image_path: form.image_path.trim() || null, sort_order: sort, is_active: form.is_active,
    };
    setSaving(true);
    const { error } = editing && editing !== 'new' ? await supabase.from('team_members').update(row).eq('id', editing.id) : await supabase.from('team_members').insert(row);
    setSaving(false);
    if (reportError(error)) return;
    notify('Team member saved.', 'success');
    setEditing(null);
    await reload();
  }

  async function patch(m: Member, change: Partial<Pick<Member, 'is_active'>>) {
    if (reportError((await supabase.from('team_members').update(change).eq('id', m.id)).error)) return;
    await reload();
  }

  // Renumbers the whole list 0..n so members that share an order still move.
  async function move(m: Member, dir: -1 | 1) {
    const list = [...members];
    const i = list.findIndex((x) => x.id === m.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j]!, list[i]!];
    const changed = list.map((x, n) => ({ x, n })).filter(({ x, n }) => x.sort_order !== n);
    const results = await Promise.all(changed.map(({ x, n }) => supabase.from('team_members').update({ sort_order: n }).eq('id', x.id)));
    if (results.some((r) => reportError(r.error))) return;
    await reload();
  }

  async function remove(list: Member[]) {
    const names = list.length === 1 ? `"${list[0]!.name}"` : `${list.length} team members`;
    if (!(await confirmAction({ title: 'Delete team members?', message: `Delete ${names}? You can restore them from Trash. To just hide them from the site, make them inactive instead.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('team_members').delete().in('id', list.map((m) => m.id))).error)) return;
    setSelected(new Set());
    notify('Deleted.', 'success');
    await reload();
  }

  async function bulkActive(active: boolean) {
    if (reportError((await supabase.from('team_members').update({ is_active: active }).in('id', chosen.map((m) => m.id))).error)) return;
    setSelected(new Set());
    await reload();
  }

  const canReorder = !q;

  return (
    <>
      <Toolbar actions={<Button onClick={() => open('new')}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add member</Button>}>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search name, role or email" label="Search team members" />
        {!canReorder && <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>Clear the search to reorder.</span>}
      </Toolbar>

      <div className="mb-3 flex min-h-[2.25rem] flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2" style={{ color: 'var(--adm-text-2)' }}>
          <input type="checkbox" checked={allShownSelected} onChange={() => setSelected(allShownSelected ? new Set() : new Set(shown.map((m) => m.id)))} style={{ accentColor: 'var(--adm-primary)' }} />
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
        emptyTitle={members.length === 0 ? 'No team members yet' : 'No team members match'}
        emptyBody={members.length === 0 ? 'Add the first person to show on the Our Team page.' : 'Try a different search.'}
        headers={['', 'Member', 'Contact', 'Order', 'Status', '']}
      >
        {shown.map((m) => {
          const idx = members.indexOf(m);
          return (
            <tr key={m.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="w-8 px-4 py-3"><input type="checkbox" aria-label={`Select ${m.name}`} checked={selected.has(m.id)} onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; })} style={{ accentColor: 'var(--adm-primary)' }} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} src={m.image_path} size={40} />
                  <div className="min-w-0">
                    <p className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>{m.name}</p>
                    <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{m.position || 'No position set'}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{m.email || '-'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-xs" style={{ color: 'var(--adm-text-2)' }}>{m.sort_order}</span>
                  <IconButton title="Move up" disabled={!canReorder || idx <= 0} onClick={() => move(m, -1)}><FontAwesomeIcon icon={faArrowUp} className="h-3 w-3" /></IconButton>
                  <IconButton title="Move down" disabled={!canReorder || idx >= members.length - 1} onClick={() => move(m, 1)}><FontAwesomeIcon icon={faArrowDown} className="h-3 w-3" /></IconButton>
                </div>
              </td>
              <td className="px-4 py-3"><Toggle on={m.is_active} label={m.is_active ? 'Active' : 'Hidden'} onClick={() => patch(m, { is_active: !m.is_active })} /></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => open(m)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove([m])}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          );
        })}
      </TableCard>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add team member' : 'Edit team member'}
          subtitle={editing === 'new' ? undefined : editing.name}
          maxWidth="max-w-2xl"
          onClose={() => setEditing(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save member'}</Button>
          </>}
        >
          <Section title="Person">
            <Field label="Name"><input className={inputCls} style={fieldStyle} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Position"><input className={inputCls} style={fieldStyle} value={form.position} placeholder="e.g. Head of Operations" onChange={(e) => set('position', e.target.value)} /></Field>
            <Field label="Email"><input type="email" className={inputCls} style={fieldStyle} value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label="LinkedIn"><input className={inputCls} style={fieldStyle} value={form.linkedin} placeholder="https://www.linkedin.com/in/..." onChange={(e) => set('linkedin', e.target.value)} /></Field>
            <Field label="Bio" className="sm:col-span-2"><textarea rows={4} className={inputCls} style={fieldStyle} value={form.bio} onChange={(e) => set('bio', e.target.value)} /></Field>
          </Section>

          <Section title="Photo">
            <div className="flex items-start gap-4 sm:col-span-2">
              <Avatar name={form.name || '?'} src={form.image_path.trim() || null} size={88} />
              <Field label="Photo" hint="Pick from the media library or paste an image address. Without a photo, initials are shown." className="min-w-0 flex-1">
                <UrlWithPicker inputStyle={fieldStyle} value={form.image_path} onChange={(v) => set('image_path', v)} />
              </Field>
            </div>
          </Section>

          <Section title="Visibility">
            <Field label="Sort order" hint="Whole number, 0 or higher. You can also use the arrows in the list."><input type="number" min={0} step={1} className={inputCls} style={fieldStyle} value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></Field>
            <label className="flex items-center gap-2 self-end text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Active (visible on the site)</label>
          </Section>
        </Modal>
      )}
    </>
  );
}
