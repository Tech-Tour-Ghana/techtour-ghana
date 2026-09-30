'use client';

// Blog Updates articles. Public pages show published posts only (0018).

import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { BRAND, IconButton, TableCard, Toggle, fmtDate, rowClass, useAdminTheme } from '@/components/admin/ui';
import { BLOG_CATEGORIES, type BlogCategory } from '@/lib/content/blog';
import type { Database } from '@/types/database';

type Post = Database['public']['Tables']['blog_posts']['Row'];

const EMPTY = { title: '', slug: '', category: 'culture' as BlogCategory, excerpt: '', content: '', image_url: '', author: 'TechTour Ghana' };
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminBlogPage() {
  const t = useAdminTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await createBrowserClient().from('blog_posts').select('*').order('created_at', { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createBrowserClient();
    const values = { ...form, title: form.title.trim(), slug: form.slug.trim() || slugify(form.title) };
    const { error } = editingId
      ? await supabase.from('blog_posts').update(values).eq('id', editingId)
      : await supabase.from('blog_posts').insert(values);
    if (error) return window.alert(`Could not save: ${error.message}`);
    setForm(EMPTY);
    setEditingId(null);
    load();
  }

  function edit(post: Post) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      category: post.category as BlogCategory,
      excerpt: post.excerpt,
      content: post.content,
      image_url: post.image_url,
      author: post.author,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function togglePublished(post: Post) {
    const publishing = !post.is_published;
    const patch = { is_published: publishing, published_at: publishing ? post.published_at ?? new Date().toISOString() : post.published_at };
    const { error } = await createBrowserClient().from('blog_posts').update(patch).eq('id', post.id);
    if (error) return window.alert(`Could not update: ${error.message}`);
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...patch } : p)));
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    const { error } = await createBrowserClient().from('blog_posts').delete().eq('id', id);
    if (error) return window.alert(`Could not delete: ${error.message}`);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  const input = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary };
  const cls = 'px-3 py-2 rounded-lg text-sm';

  return (
    <AdminLayout title="Blog" subtitle="Articles for the Blog Updates section">
      <div className="space-y-4">
        <form onSubmit={save} className="rounded-xl p-4 grid gap-3 md:grid-cols-3" style={{ background: t.cardBg, border: `1px solid ${t.border}` }}>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className={cls} style={input} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as BlogCategory })} className={cls} style={input}>
            {(Object.keys(BLOG_CATEGORIES) as BlogCategory[]).map((c) => <option key={c} value={c}>{BLOG_CATEGORIES[c].label}</option>)}
          </select>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug (auto from title)" className={cls} style={input} />
          <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author" className={cls} style={input} />
          <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Image URL" className={`${cls} md:col-span-2`} style={input} />
          <input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short excerpt" className={`${cls} md:col-span-3`} style={input} />
          <textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Article text. Separate paragraphs with a blank line." rows={8} className={`${cls} md:col-span-3`} style={input} />
          <div className="md:col-span-3 flex gap-3">
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: BRAND.teal }}>
              {editingId ? 'Save changes' : 'Add post (saved as draft)'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }} className="px-4 py-2 rounded-lg text-sm" style={{ background: t.chipBg, color: t.textSecondary }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <TableCard loading={loading} empty={posts.length === 0} headers={['Title', 'Category', 'Status', 'Published', '']}>
          {posts.map((p) => (
            <tr key={p.id} className={rowClass} style={{ borderColor: t.border }}>
              <td className="px-4 py-3 font-medium" style={{ color: t.textPrimary }}>{p.title}</td>
              <td className="px-4 py-3" style={{ color: t.textSecondary }}>{BLOG_CATEGORIES[p.category as BlogCategory]?.label ?? p.category}</td>
              <td className="px-4 py-3"><Toggle on={p.is_published} label={p.is_published ? 'Published' : 'Draft'} onClick={() => togglePublished(p)} /></td>
              <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{p.published_at ? fmtDate(p.published_at) : '-'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => edit(p)}><FontAwesomeIcon icon={faPen} className="w-3 h-3" /></IconButton>
                  <IconButton title="Delete" color={BRAND.red} onClick={() => remove(p.id)}><FontAwesomeIcon icon={faTrash} className="w-3 h-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      </div>
    </AdminLayout>
  );
}
