'use client';

// Everything deleted in the admin lands here first (database trigger, 0029).
// Restoring an item also brings back what was deleted with it, e.g. a tour's
// departures. Permanent delete and Empty trash cannot be undone.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faTrash, faTrashCan } from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import { notify } from '@/components/admin/toast';
import { Button, IconButton, SearchInput, StatTile, StatusPill, TableCard, Toolbar, confirmAction, fieldStyle, fmtDate, rowClass } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';

interface Item { id: number; table_name: string; record_id: string; label: string; batch: number; deleted_at: string }

const KINDS: Record<string, string> = {
  tours: 'Tour', tour_categories: 'Tour category', tour_schedules: 'Departure', tour_reviews: 'Review', bookings: 'Booking',
  blog_posts: 'Blog post', market_products: 'Product', market_categories: 'Product category', artisans: 'Artisan',
  destinations: 'Destination', testimonials: 'Testimonial', team_members: 'Team member', job_openings: 'Job opening',
  tech_innovations: 'Innovation', tech_events: 'Tech event', tech_resources: 'Tech resource', study_destinations: 'Study destination',
  scholarships: 'Scholarship', contact_messages: 'Contact message', newsletter_subscribers: 'Subscriber',
  artisan_private_contacts: 'Artisan contacts', artisan_products: 'Artisan product', product_gallery: 'Product image', seo_metadata: 'SEO settings',
  main_feature_cards: 'Homepage card', video_sections: 'Video section', homepage_slides: 'Hero slide', small_glass_cards: 'Small card',
  navbar_menus: 'Menu item', navbar_dropdowns: 'Dropdown item', footer_quick_links: 'Footer link', social_links: 'Social link', legal_links: 'Legal link',
  job_categories: 'Job category', suggestions: 'Suggestion', issue_reports: 'Issue report', vacation_rentals: 'Vacation rental',
};
const kind = (t: string) => KINDS[t] ?? t;

export default function AdminTrashPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('trash_items').select('id, table_name, record_id, label, batch, deleted_at').order('deleted_at', { ascending: false }).limit(1000);
    if (err) setError('Could not load the trash.');
    else { setItems((data as Item[]) ?? []); setError(''); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function restore(it: Item) {
    const also = items.filter((x) => x.batch === it.batch && x.id !== it.id).length;
    if (!(await confirmAction({ message: `Restore ${kind(it.table_name).toLowerCase()} "${it.label}"${also ? ` and the ${also} related item${also === 1 ? '' : 's'} deleted with it` : ''}?`, confirmLabel: 'Restore' }))) return;
    setBusyId(it.id);
    const { error: err } = await supabase.rpc('restore_trash', { p_id: it.id });
    setBusyId(null);
    if (err) return notify(err.message || 'Could not restore it. The item it belongs to may be missing.');
    notify('Restored.', 'success');
    load();
  }

  async function purge(it: Item | null) {
    const msg = it ? `Permanently delete "${it.label}"? This cannot be undone.` : `Permanently delete all ${items.length} items in the trash? This cannot be undone.`;
    if (!(await confirmAction({ message: msg, danger: true, confirmLabel: it ? 'Delete forever' : 'Empty trash' }))) return;
    setBusyId(it?.id ?? -1);
    const { error: err } = await supabase.rpc('purge_trash', it ? { p_id: it.id } : {});
    setBusyId(null);
    if (err) return notify('Could not delete it.');
    notify(it ? 'Deleted permanently.' : 'Trash emptied.', 'success');
    load();
  }

  const types = [...new Set(items.map((i) => i.table_name))].sort();
  const q = search.trim().toLowerCase();
  const visible = items.filter((i) => (type === 'all' || i.table_name === type) && (!q || i.label.toLowerCase().includes(q)));

  return (
    <AdminLayout title="Trash" subtitle="Deleted items can be restored or removed for good">
      <div className="mb-4 grid max-w-md grid-cols-2 gap-3">
        <StatTile icon={faTrashCan} label="Items in trash" value={items.length} tone="warning" />
        <StatTile icon={faRotateLeft} label="Types" value={types.length} tone="info" />
      </div>

      <Toolbar actions={<Button variant="secondary" disabled={items.length === 0 || busyId === -1} onClick={() => purge(null)}><FontAwesomeIcon icon={faTrash} className="mr-2 h-3 w-3" />Empty trash</Button>}>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm" value={search} onChange={setSearch} placeholder="Search deleted items" label="Search trash" />
        <select aria-label="Filter by type" value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">All types</option>
          {types.map((t) => <option key={t} value={t}>{kind(t)}</option>)}
        </select>
      </Toolbar>

      {error ? (
        <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>
      ) : (
        <TableCard loading={loading} empty={visible.length === 0} emptyTitle={items.length === 0 ? 'Trash is empty' : 'Nothing matches'} emptyBody={items.length === 0 ? 'Items you delete in the admin appear here.' : 'Try a different search or type.'} headers={['Item', 'Type', 'Deleted', '']}>
          {visible.map((it) => (
            <tr key={it.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{it.label || it.record_id}</td>
              <td className="px-4 py-3"><StatusPill tone="neutral">{kind(it.table_name)}</StatusPill></td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{fmtDate(it.deleted_at)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Restore" color="var(--adm-success)" disabled={busyId === it.id} onClick={() => restore(it)}><FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete forever" color="var(--adm-error)" disabled={busyId === it.id} onClick={() => purge(it)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}
    </AdminLayout>
  );
}
