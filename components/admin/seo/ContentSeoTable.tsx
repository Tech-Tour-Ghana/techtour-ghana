'use client';

// Lists SEO-managed content with its health and lets destinations and category
// pages be edited in place. Articles are edited in the blog editor, which has the
// live analysis.

import Link from 'next/link';
import { useState } from 'react';

import MediaPicker from '@/components/admin/media/MediaPicker';
import { Button, Modal, Surface, TableCard, rowClass } from '@/components/admin/ui';
import { notify } from '@/components/admin/toast';
import { healthOf, type AuditedItem, type Health } from '@/lib/seo/audit';
import { resolveSeo, type SeoFields, type SiteSeo } from '@/lib/seo/resolve';
import { analyzeSeo } from '@/lib/seo/score';
import { createBrowserClient } from '@/lib/supabase/client';
import SEOEditor, { type SeoImageField } from './SEOEditor';
import SEOScore from './SEOScore';
import SERPPreview from './SERPPreview';

const HEALTH: Record<Health, { color: string; bg: string }> = {
  Good: { color: 'var(--adm-success)', bg: 'var(--adm-success-soft)' },
  'Needs Improvement': { color: '#B45309', bg: 'rgba(245, 158, 11, 0.15)' },
  Missing: { color: 'var(--adm-error)', bg: 'var(--adm-error-soft)' },
};

interface Props {
  items: AuditedItem[];
  site: SiteSeo;
  /** Articles link to the editor, everything else edits in a dialog. */
  editInline: boolean;
  emptyTitle: string;
  onSaved: (kind: AuditedItem['kind'], key: string, seo: SeoFields) => void;
}

export default function ContentSeoTable({ items, site, editInline, emptyTitle, onSaved }: Props) {
  const [editing, setEditing] = useState<AuditedItem | null>(null);
  const [seo, setSeo] = useState<SeoFields | null>(null);
  const [pick, setPick] = useState<SeoImageField | null>(null);
  const [saving, setSaving] = useState(false);

  const open = (i: AuditedItem) => { setEditing(i); setSeo(i.seo); };

  async function save() {
    if (!editing || !seo) return;
    setSaving(true);
    const { error } = await createBrowserClient().from('seo_metadata').upsert({ entity_type: editing.kind, entity_key: editing.key, ...seo }, { onConflict: 'entity_type,entity_key' });
    setSaving(false);
    if (error) return notify('Could not save the SEO settings.');
    onSaved(editing.kind, editing.key, seo);
    setEditing(null);
    notify('SEO settings saved.', 'success');
  }

  const sorted = [...items].sort((a, b) => a.analysis.score - b.analysis.score);
  const live = editing && seo ? analyzeSeo({ title: editing.name, slug: editing.slug, path: editing.path, excerpt: editing.excerpt, contentHtml: editing.contentHtml, featuredImageUrl: editing.imageUrl, featuredImageAlt: editing.imageAlt, seo, site }) : null;
  const resolved = editing && seo ? resolveSeo({ path: editing.path, title: editing.name, excerpt: editing.excerpt, imageUrl: editing.imageUrl, seo, site }) : null;

  return (
    <>
      <TableCard loading={false} empty={sorted.length === 0} emptyTitle={emptyTitle} headers={['Name', 'SEO title', 'Description', 'Score', 'Status', '']}>
        {sorted.map((i) => {
          const h = healthOf(i);
          const look = HEALTH[h];
          return (
            <tr key={`${i.kind}:${i.key}`} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="max-w-[16rem] truncate px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{i.name || 'Untitled'}{!i.live && <span className="ml-2 text-[11px]" style={{ color: 'var(--adm-muted)' }}>(draft)</span>}</td>
              <td className="px-4 py-3 text-xs" style={{ color: i.seo.seo_title.trim() ? 'var(--adm-text-2)' : 'var(--adm-error)' }}>{i.seo.seo_title.trim() ? 'Set' : 'Missing'}</td>
              <td className="px-4 py-3 text-xs" style={{ color: i.seo.meta_description.trim() ? 'var(--adm-text-2)' : 'var(--adm-error)' }}>{i.seo.meta_description.trim() ? 'Set' : 'Missing'}</td>
              <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>{i.kind === 'blog_category' ? '-' : `${i.analysis.score}`}</td>
              <td className="px-4 py-3"><span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: look.bg, color: look.color }}>{h}</span></td>
              <td className="px-4 py-3">
                {editInline ? (
                  <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => open(i)}>Edit SEO</Button>
                ) : (
                  <Link href={i.href} className="text-xs font-semibold" style={{ color: 'var(--adm-primary)' }}>Open editor</Link>
                )}
              </td>
            </tr>
          );
        })}
      </TableCard>

      {editing && seo && resolved && (
        <Modal
          title={`SEO: ${editing.name}`}
          maxWidth="max-w-3xl"
          onClose={() => setEditing(null)}
          footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save SEO'}</Button></>}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <SEOEditor
              value={seo}
              onChange={(p) => setSeo((s) => (s ? { ...s, ...p } : s))}
              fallback={{ title: editing.name, description: editing.excerpt, image: editing.imageUrl, canonicalPath: `${site.baseUrl}${editing.path}` }}
              onPickImage={setPick}
              hideFocus={editing.kind === 'blog_category'}
            />
            <div className="space-y-4">
              <SERPPreview siteName={site.siteName} title={resolved.title} url={resolved.canonical} description={resolved.description} />
              {editing.kind !== 'blog_category' && live && <Surface className="p-4"><SEOScore analysis={live} compact /></Surface>}
            </div>
          </div>
          <MediaPicker open={!!pick} onClose={() => setPick(null)} onSelect={([a]) => { if (a && pick) setSeo((s) => (s ? { ...s, [pick]: a.public_url } : s)); setPick(null); }} />
        </Modal>
      )}
    </>
  );
}
