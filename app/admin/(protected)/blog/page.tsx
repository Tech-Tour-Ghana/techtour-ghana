'use client';

// Blog Updates articles. Public pages show published posts only (0018).
// Writing happens in the editor at /admin/blog/new and /admin/blog/[id].

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faEye, faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import { Button, IconButton, Modal, TableCard, Toggle, fieldStyle, fmtDate, reportError, rowClass, useAdminTheme } from '@/components/admin/ui';
import { notify } from '@/components/admin/toast';
import { env } from '@/lib/env';
import { BLOG_CATEGORIES, type BlogCategory } from '@/lib/content/blog';
import { SEO_COLUMNS, seoFieldsFrom, siteSeoFrom } from '@/lib/seo/site';
import { analyzeSeo } from '@/lib/seo/score';
import type { SeoFields } from '@/lib/seo/resolve';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Post = Database['public']['Tables']['blog_posts']['Row'];
type SeoFilter = 'all' | 'good' | 'improve' | 'missing';

interface Row { post: Post; score: number; label: string; missing: boolean }

const BADGE: Record<string, { color: string; bg: string }> = {
  'Needs Work': { color: 'var(--adm-error)', bg: 'var(--adm-error-soft)' },
  Fair: { color: '#B45309', bg: 'rgba(245, 158, 11, 0.15)' },
  Good: { color: 'var(--adm-primary)', bg: 'var(--adm-primary-soft)' },
  Excellent: { color: 'var(--adm-success)', bg: 'var(--adm-success-soft)' },
};

export default function AdminBlogPage() {
  const t = useAdminTheme();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'scheduled' | 'draft'>('all');
  const [category, setCategory] = useState<'all' | BlogCategory>('all');
  const [seoFilter, setSeoFilter] = useState<SeoFilter>('all');
  const [toDelete, setToDelete] = useState<Post | null>(null);

  const load = useCallback(async () => {
    const [posts, seoRows, settings] = await Promise.all([
      supabase.from('blog_posts').select('*').order('updated_at', { ascending: false }).limit(500),
      supabase.from('seo_metadata').select(`entity_key, ${SEO_COLUMNS}`).eq('entity_type', 'blog_post'),
      supabase.from('site_settings').select('*').limit(1).maybeSingle(),
    ]);
    if (posts.error) { setError('Could not load articles.'); setLoading(false); return; }
    const site = siteSeoFrom(settings.data, env.NEXT_PUBLIC_SITE_URL);
    const seoByPost = new Map<string, SeoFields>((seoRows.data ?? []).map((r) => [r.entity_key, seoFieldsFrom(r)]));
    setRows((posts.data ?? []).map((post) => {
      const seo = seoByPost.get(post.id) ?? seoFieldsFrom(null);
      const a = analyzeSeo({
        title: post.title, slug: post.slug, path: `/blog/${post.category}/${post.slug}`, excerpt: post.excerpt,
        contentHtml: post.content, featuredImageUrl: post.image_url, featuredImageAlt: post.image_alt, seo, site,
      });
      return { post, score: a.score, label: a.label, missing: !seo.seo_title.trim() || !seo.meta_description.trim() };
    }));
    setError('');
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const visible = rows.filter(({ post, score, missing }) => {
    const state = post.is_published ? 'published' : post.scheduled_at ? 'scheduled' : 'draft';
    if (status !== 'all' && state !== status) return false;
    if (category !== 'all' && post.category !== category) return false;
    if (search.trim() && !post.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (seoFilter === 'good' && score < 70) return false;
    if (seoFilter === 'improve' && (score >= 70 || missing)) return false;
    if (seoFilter === 'missing' && !missing) return false;
    return true;
  });

  async function togglePublished(post: Post) {
    const publishing = !post.is_published;
    if (publishing && !post.content.replace(/<[^>]*>/g, '').trim()) return notify('Add content in the editor before publishing.');
    const patch = { is_published: publishing, published_at: publishing ? post.published_at ?? new Date().toISOString() : post.published_at, scheduled_at: null };
    const { error: err } = await supabase.from('blog_posts').update(patch).eq('id', post.id);
    if (err) return notify('Could not update the article.');
    setRows((prev) => prev.map((r) => (r.post.id === post.id ? { ...r, post: { ...r.post, ...patch } } : r)));
    notify(publishing ? 'Article published.' : 'Article unpublished.', 'success');
  }

  async function remove(post: Post) {
    const { error: err } = await supabase.from('blog_posts').delete().eq('id', post.id);
    reportError(err);
    if (err) return;
    setRows((prev) => prev.filter((r) => r.post.id !== post.id));
    setToDelete(null);
    notify('Article deleted.', 'success');
  }

  const selectClass = 'px-3 py-2 text-sm';

  return (
    <AdminLayout title="Blog" subtitle="Articles for the Blog Updates section">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input aria-label="Search articles" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title" className={`${selectClass} min-w-[12rem] flex-1`} style={fieldStyle} />
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={selectClass} style={fieldStyle}>
            <option value="all">All statuses</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="draft">Draft</option>
          </select>
          <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className={selectClass} style={fieldStyle}>
            <option value="all">All categories</option>
            {(Object.keys(BLOG_CATEGORIES) as BlogCategory[]).map((c) => <option key={c} value={c}>{BLOG_CATEGORIES[c].label}</option>)}
          </select>
          <select aria-label="SEO" value={seoFilter} onChange={(e) => setSeoFilter(e.target.value as SeoFilter)} className={selectClass} style={fieldStyle}>
            <option value="all">All SEO</option><option value="good">Good</option><option value="improve">Needs improvement</option><option value="missing">Missing SEO</option>
          </select>
          <Link href="/admin/blog/new" className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white" style={{ background: 'var(--adm-primary)', borderRadius: 'var(--adm-radius-control)' }}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />New article
          </Link>
        </div>

        {error ? (
          <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>
        ) : (
          <TableCard
            loading={loading}
            empty={visible.length === 0}
            emptyTitle={rows.length === 0 ? 'No articles yet' : 'No articles match'}
            emptyBody={rows.length === 0 ? 'Write your first article to get started.' : 'Try a different search or filter.'}
            headers={['Title', 'Category', 'Author', 'Status', 'SEO', 'Published', 'Updated', '']}
          >
            {visible.map(({ post, score, label, missing }) => {
              const b = BADGE[label] ?? BADGE['Needs Work']!;
              return (
                <tr key={post.id} className={rowClass} style={{ borderColor: t.border }}>
                  <td className="max-w-[18rem] px-4 py-3 font-medium" style={{ color: t.textPrimary }}>
                    <Link href={`/admin/blog/${post.id}`} className="line-clamp-2 hover:underline">{post.title || 'Untitled'}</Link>
                  </td>
                  <td className="px-4 py-3" style={{ color: t.textSecondary }}>{BLOG_CATEGORIES[post.category as BlogCategory]?.label ?? post.category}</td>
                  <td className="px-4 py-3" style={{ color: t.textSecondary }}>{post.author}</td>
                  <td className="px-4 py-3"><Toggle on={post.is_published} label={post.is_published ? 'Published' : post.scheduled_at ? 'Scheduled' : 'Draft'} onClick={() => togglePublished(post)} />{!post.is_published && post.scheduled_at && <div className="mt-1 text-[11px]" style={{ color: t.textMuted }}>{new Date(post.scheduled_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: b.bg, color: b.color }} title={missing ? 'SEO title or description not set' : undefined}>
                      {score} · {missing && score < 70 ? 'Missing SEO' : label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{post.published_at ? fmtDate(post.published_at) : '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{fmtDate(post.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/blog/${post.id}`} title="Edit" aria-label={`Edit ${post.title}`} className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}>
                        <FontAwesomeIcon icon={faPen} className="h-3 w-3" />
                      </Link>
                      {post.is_published ? (
                        <a href={`/blog/${post.category}/${post.slug}`} target="_blank" rel="noopener noreferrer" title="View live" aria-label={`View ${post.title} live`} className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}>
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3 w-3" />
                        </a>
                      ) : (
                        <Link href={`/admin/blog/${post.id}?preview=1`} title="Preview" aria-label={`Preview ${post.title}`} className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}>
                          <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                        </Link>
                      )}
                      <IconButton title="Delete" color="var(--adm-error)" onClick={() => setToDelete(post)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </TableCard>
        )}
      </div>

      {toDelete && (
        <Modal title="Delete article?" maxWidth="max-w-sm" onClose={() => setToDelete(null)}
          footer={<><Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button><Button variant="danger" onClick={() => remove(toDelete)}>Delete</Button></>}>
          <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>“{toDelete.title}” and its SEO settings will be permanently deleted.{toDelete.is_published && ' It is live: its address will stop working unless you add a redirect.'}</p>
        </Modal>
      )}
    </AdminLayout>
  );
}
