'use client';

// The article workspace: write in TinyMCE, pick images from the Media Library,
// see the SEO analysis update as you type, preview, save drafts and publish.
// Drafts autosave. Published articles never autosave, so nothing goes live by accident.

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import { Button, ListSkeleton, Modal, Surface, fieldStyle } from '@/components/admin/ui';
import { notify } from '@/components/admin/toast';
import MediaPicker from '@/components/admin/media/MediaPicker';
import SEOEditor, { type SeoImageField } from '@/components/admin/seo/SEOEditor';
import SEOScore from '@/components/admin/seo/SEOScore';
import SERPPreview from '@/components/admin/seo/SERPPreview';
import SocialPreview from '@/components/admin/seo/SocialPreview';
import { env } from '@/lib/env';
import { BLOG_CATEGORIES, type BlogCategory } from '@/lib/content/blog';
import { SITE_LINK_GROUPS } from '@/lib/content/site-links';
import type { MediaAsset } from '@/lib/media/client';
import { cleanFaqs, type FaqItem } from '@/lib/seo/faq';
import { EMPTY_SEO, isValidCanonical, resolveSeo, type SeoFields } from '@/lib/seo/resolve';
import { analyzeSeo } from '@/lib/seo/score';
import { SEO_COLUMNS, seoFieldsFrom, siteSeoFrom } from '@/lib/seo/site';
import { isValidSlug, slugify } from '@/lib/seo/slug';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Json } from '@/types/database';
import ArticleQuality from './ArticleQuality';
import FeaturedImagePicker from './FeaturedImagePicker';
import PublishingPanel, { type SaveState } from './PublishingPanel';
import FaqEditor from './FaqEditor';
import type { ImagePick, LinkItem } from './RichTextEditor';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false, loading: () => <ListSkeleton /> });

interface Draft {
  title: string;
  slug: string;
  category: BlogCategory;
  author: string;
  excerpt: string;
  content: string;
  image_url: string;
  image_alt: string;
  faqs: FaqItem[];
}

const NEW_DRAFT: Draft = { title: '', slug: '', category: 'culture', author: 'TechTour Ghana', excerpt: '', content: '', image_url: '', image_alt: '', faqs: [] };

interface Persisted {
  slug: string;
  category: string;
  published: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  updatedAt: string | null;
}

type SaveKind = 'draft' | 'auto' | 'publish' | 'unpublish' | 'schedule' | 'unschedule';

const AUTOSAVE_MS = 4000;

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <Surface className="p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--adm-text-2)' }}>{title}</h2>
      {children}
      {hint && <p className="mt-2 text-[11px]" style={{ color: 'var(--adm-muted)' }}>{hint}</p>}
    </Surface>
  );
}

export default function BlogEditor({ postId }: { postId: string | null }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [id] = useState(() => postId ?? crypto.randomUUID());
  const [loading, setLoading] = useState(!!postId);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState<Draft>(NEW_DRAFT);
  const [seo, setSeo] = useState<SeoFields>(EMPTY_SEO);
  const [slugTouched, setSlugTouched] = useState(!!postId);
  const [persisted, setPersisted] = useState<Persisted | null>(null);
  const [snapshot, setSnapshot] = useState(() => JSON.stringify({ d: NEW_DRAFT, s: EMPTY_SEO }));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [slugError, setSlugError] = useState('');
  const [busy, setBusy] = useState(false);
  const [site, setSite] = useState(() => siteSeoFrom(null, env.NEXT_PUBLIC_SITE_URL));
  const [linkItems, setLinkItems] = useState<LinkItem[]>([]);

  const [picker, setPicker] = useState<null | { target: 'featured' | 'editor' | SeoImageField }>(null);
  const editorPick = useRef<((p: ImagePick) => void) | null>(null);
  const [preview, setPreview] = useState<null | { html: string }>(null);
  const [slugPrompt, setSlugPrompt] = useState<null | { kind: SaveKind }>(null);

  const published = persisted?.published ?? false;
  const dirty = JSON.stringify({ d: draft, s: seo }) !== snapshot;

  // ---- Load ----------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
      if (!cancelled) setSite(siteSeoFrom(settings.data, env.NEXT_PUBLIC_SITE_URL));

      const [posts, dests] = await Promise.all([
        supabase.from('blog_posts').select('title, slug, category').eq('is_published', true).order('published_at', { ascending: false }).limit(200),
        supabase.from('destinations').select('name, slug').eq('is_active', true).order('sort_order'),
      ]);
      if (!cancelled) {
        setLinkItems([
          ...SITE_LINK_GROUPS.flatMap((g) => g.links).map((l) => ({ title: `Page: ${l.label}`, value: l.href })),
          ...(dests.data ?? []).map((d) => ({ title: `Destination: ${d.name}`, value: `/destinations/${d.slug}` })),
          ...(posts.data ?? []).map((p) => ({ title: `Article: ${p.title}`, value: `/blog/${p.category}/${p.slug}` })),
        ]);
      }

      if (!postId) return;
      const [post, seoRow] = await Promise.all([
        supabase.from('blog_posts').select('*').eq('id', postId).maybeSingle(),
        supabase.from('seo_metadata').select(SEO_COLUMNS).eq('entity_type', 'blog_post').eq('entity_key', postId).maybeSingle(),
      ]);
      if (cancelled) return;
      if (!post.data) { setLoadError('This article could not be found.'); setLoading(false); return; }
      const p = post.data;
      const loaded: Draft = {
        title: p.title, slug: p.slug, category: p.category as BlogCategory, author: p.author, excerpt: p.excerpt,
        content: p.content, image_url: p.image_url, image_alt: p.image_alt, faqs: cleanFaqs(p.faqs),
      };
      const loadedSeo = seoFieldsFrom(seoRow.data);
      setDraft(loaded);
      setSeo(loadedSeo);
      setPersisted({ slug: p.slug, category: p.category, published: p.is_published, publishedAt: p.published_at, scheduledAt: p.scheduled_at, updatedAt: p.updated_at });
      setSnapshot(JSON.stringify({ d: loaded, s: loadedSeo }));
      setLoading(false);
    })().catch(() => { if (!cancelled) { setLoadError('Could not load the article.'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [supabase, postId]);

  // ---- Derived SEO ------------------------------------------------------------
  const path = `/blog/${draft.category}/${draft.slug}`;
  const deferredContent = useDeferredValue(draft.content);
  const analysis = useMemo(
    () => analyzeSeo({ title: draft.title, slug: draft.slug, path, excerpt: draft.excerpt, contentHtml: deferredContent, featuredImageUrl: draft.image_url, featuredImageAlt: draft.image_alt, seo, site }),
    [draft.title, draft.slug, path, draft.excerpt, deferredContent, draft.image_url, draft.image_alt, seo, site],
  );
  const resolved = useMemo(
    () => resolveSeo({ path, title: draft.title, excerpt: draft.excerpt, imageUrl: draft.image_url, seo, site }),
    [path, draft.title, draft.excerpt, draft.image_url, seo, site],
  );

  // ---- Field updates -------------------------------------------------------------
  const patch = (change: Partial<Draft>) => setDraft((d) => ({ ...d, ...change }));
  const patchSeo = (change: Partial<SeoFields>) => setSeo((s) => ({ ...s, ...change }));

  function onTitle(title: string) {
    setDraft((d) => ({ ...d, title, ...(slugTouched ? {} : { slug: slugify(title) }) }));
    setSlugError('');
  }

  // ---- Validation -------------------------------------------------------------------
  const validate = useCallback((forPublish: boolean): string[] => {
    const out: string[] = [];
    if (!draft.title.trim()) out.push('Add a title.');
    if (!draft.slug) out.push('The URL slug is empty.');
    else if (!isValidSlug(draft.slug)) out.push('The URL slug can only use lowercase letters, numbers and single hyphens.');
    if (!isValidCanonical(seo.canonical_url.trim())) out.push('The canonical URL is not a valid address.');
    if (forPublish) {
      if (!draft.content.replace(/<[^>]*>/g, '').trim() && !/<img\b/i.test(draft.content)) out.push('The article has no content.');
      if (/<img\b[^>]*\ssrc\s*=\s*["']data:/i.test(draft.content)) out.push('Remove embedded (base64) images and insert them from the Media Library instead.');
    }
    return out;
  }, [draft.title, draft.slug, draft.content, seo.canonical_url]);

  // ---- Save ------------------------------------------------------------------------------
  const saveRef = useRef<(kind: SaveKind, redirect?: boolean) => Promise<boolean>>(async () => false);

  const save = useCallback(async (kind: SaveKind, redirect = false, scheduleIso?: string): Promise<boolean> => {
    const auto = kind === 'auto';
    if (kind === 'schedule' && (!scheduleIso || new Date(scheduleIso).getTime() < Date.now() + 60_000)) {
      setErrors(['Choose a publish time at least a minute in the future.']);
      return false;
    }
    const problems = validate(kind === 'publish' || kind === 'schedule');
    if (problems.length) {
      if (!auto) setErrors(problems);
      return false;
    }
    if (!auto) setErrors([]);
    setBusy(true);
    setSaveState('saving');
    try {
      const clash = await supabase.from('blog_posts').select('id').eq('slug', draft.slug).neq('id', id).maybeSingle();
      if (clash.data) {
        setSlugError('Another article already uses this slug. Choose a different one.');
        if (!auto) setErrors(['Another article already uses this slug.']);
        setSaveState('error');
        return false;
      }
      setSlugError('');

      // A scheduled post can go live while this editor is open, so the database, not this
      // screen, decides whether the post is published. Saving must never quietly unpublish it.
      const current = await supabase.from('blog_posts').select('is_published, published_at, scheduled_at').eq('id', id).maybeSingle();
      const livePublished = current.data?.is_published ?? false;
      if (kind === 'schedule' && livePublished) throw new Error('This article is already published.');
      if (auto && livePublished) {
        // It went live on schedule while the editor was open. Autosave must not touch a live article.
        setPersisted((p) => (p ? { ...p, published: true, publishedAt: current.data?.published_at ?? p.publishedAt, scheduledAt: null } : p));
        setSaveState('idle');
        notify('This article was published on schedule. Autosave is off. Use Save changes to update it.', 'success');
        return false;
      }

      const nowPublished = kind === 'publish' ? true : kind === 'unpublish' ? false : livePublished;
      const publishedAt = nowPublished ? current.data?.published_at ?? new Date().toISOString() : current.data?.published_at ?? null;
      const scheduledAt =
        nowPublished || kind === 'publish' || kind === 'unpublish' || kind === 'unschedule' ? null
        : kind === 'schedule' ? scheduleIso ?? null
        : current.data?.scheduled_at ?? null;
      const { faqs, ...fields } = draft;
      const { data: row, error } = await supabase
        .from('blog_posts')
        .upsert({ id, ...fields, faqs: cleanFaqs(faqs) as unknown as Json, title: draft.title.trim(), is_published: nowPublished, published_at: publishedAt, scheduled_at: scheduledAt })
        .select('slug, category, is_published, published_at, scheduled_at, updated_at')
        .single();
      if (error || !row) {
        throw new Error(error?.code === '23505' ? 'That slug is already used by another article.' : 'Could not save the article.');
      }

      const seoResult = await supabase.from('seo_metadata').upsert({ entity_type: 'blog_post', entity_key: id, ...seo }, { onConflict: 'entity_type,entity_key' });
      if (seoResult.error) throw new Error('The article saved but its SEO settings did not.');

      if (redirect && persisted && (persisted.slug !== row.slug || persisted.category !== row.category)) {
        const from = `/blog/${persisted.category}/${persisted.slug}`;
        const to = `/blog/${row.category}/${row.slug}`;
        const r = await supabase.from('redirects').upsert({ source_path: from, destination: to, status_code: 301, is_active: true }, { onConflict: 'source_path' });
        if (r.error) notify('The article saved, but the redirect from the old URL could not be created. Add it in SEO Manager > Redirects.');
        else notify(`Redirect created: ${from} → ${to}`, 'success');
      }

      setPersisted({ slug: row.slug, category: row.category, published: row.is_published, publishedAt: row.published_at, scheduledAt: row.scheduled_at, updatedAt: row.updated_at });
      setSnapshot(JSON.stringify({ d: draft, s: seo }));
      setSavedAt(new Date());
      setSaveState('saved');
      if (!postId && typeof window !== 'undefined') window.history.replaceState(null, '', `/admin/blog/${id}`);
      if (kind === 'publish') notify('Article published.', 'success');
      if (kind === 'unpublish') notify('Article unpublished. It is now a draft.', 'success');
      if (kind === 'schedule') notify('Article scheduled.', 'success');
      if (kind === 'unschedule') notify('Schedule removed. The article is a draft.', 'success');
      if (kind === 'draft') notify(row.is_published && !published ? 'Saved. The article had already gone live.' : 'Saved.', 'success');
      return true;
    } catch (e) {
      setSaveState('error');
      const message = e instanceof Error ? e.message : 'Could not save.';
      if (!auto) setErrors([message]);
      else notify(`Autosave failed: ${message}`);
      return false;
    } finally {
      setBusy(false);
    }
  }, [supabase, validate, id, draft, seo, published, persisted, postId]);
  saveRef.current = save;

  /** Saves, asking first when a live article's URL is about to change. */
  const requestSave = (kind: SaveKind, scheduleIso?: string) => {
    const urlChanged = persisted?.published && (persisted.slug !== draft.slug || persisted.category !== draft.category) && kind !== 'unpublish';
    if (urlChanged) { setSlugPrompt({ kind }); return; }
    void save(kind, false, scheduleIso);
  };

  // Autosave drafts only.
  useEffect(() => {
    if (loading || !dirty || published || busy || !draft.title.trim() || !isValidSlug(draft.slug)) return;
    const t = window.setTimeout(() => { void saveRef.current('auto'); }, AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [loading, dirty, published, busy, draft, seo]);

  // Warn before leaving with unsaved changes (tab close, reload and in-app links).
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.origin !== window.location.origin || a.pathname === window.location.pathname) return;
      if (!window.confirm('You have unsaved changes. Leave without saving?')) { e.preventDefault(); e.stopPropagation(); }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', onClick, true);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', onClick, true); };
  }, [dirty]);

  // ---- Images --------------------------------------------------------------------------------
  const onPickImage = useCallback((done: (p: ImagePick) => void) => {
    editorPick.current = done;
    setPicker({ target: 'editor' });
  }, []);

  function onAssets(assets: MediaAsset[]) {
    const a = assets[0];
    const target = picker?.target;
    setPicker(null);
    if (!a || !target) return;
    if (target === 'editor') editorPick.current?.({ src: a.public_url, alt: a.is_decorative ? '' : a.alt_text, title: a.title });
    else if (target === 'featured') patch({ image_url: a.public_url, image_alt: a.is_decorative ? '' : a.alt_text });
    else patchSeo({ [target]: a.public_url } as Partial<SeoFields>);
    editorPick.current = null;
  }

  async function openPreview() {
    try {
      const res = await fetch('/api/admin/blog/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html: draft.content }) });
      if (!res.ok) throw new Error();
      const { html } = (await res.json()) as { html: string };
      setPreview({ html });
    } catch {
      notify('Could not build the preview.');
    }
  }

  // Opened from the article list's Preview action.
  const autoPreviewed = useRef(false);
  useEffect(() => {
    if (loading || autoPreviewed.current || !postId || typeof window === 'undefined') return;
    autoPreviewed.current = true;
    if (new URLSearchParams(window.location.search).get('preview') === '1') void openPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, postId]);

  // ---- Render ------------------------------------------------------------------------------------
  if (loading) return <ListSkeleton />;
  if (loadError) {
    return (
      <Surface className="p-8 text-center">
        <p className="text-sm" style={{ color: 'var(--adm-text)' }}>{loadError}</p>
        <Link href="/admin/blog" className="mt-3 inline-block text-xs font-semibold" style={{ color: 'var(--adm-primary)' }}>← Back to articles</Link>
      </Surface>
    );
  }

  const slugHint = published ? 'This article is live. Changing its URL breaks existing links, you will be offered a redirect.' : 'Suggested from the title. You can edit it.';

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/blog" className="text-xs font-semibold" style={{ color: 'var(--adm-primary)' }}>← All articles</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        {/* ---------------- Main column ---------------- */}
        <div className="min-w-0 space-y-4">
          <div>
            <label htmlFor="article-title" className="sr-only">Article title</label>
            <input
              id="article-title"
              value={draft.title}
              onChange={(e) => onTitle(e.target.value)}
              placeholder="Article title"
              className="w-full bg-transparent px-1 py-2 text-3xl font-bold outline-none focus-visible:ring-2"
              style={{ color: 'var(--adm-text)', borderBottom: '2px solid var(--adm-border)' }}
            />
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs" style={{ color: 'var(--adm-muted)' }}>
              <span>{site.baseUrl.replace(/^https?:\/\//, '')}/blog/{draft.category}/</span>
              <label htmlFor="article-slug" className="sr-only">URL slug</label>
              <input
                id="article-slug"
                value={draft.slug}
                onChange={(e) => { setSlugTouched(true); setSlugError(''); patch({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-') }); }}
                onBlur={() => patch({ slug: slugify(draft.slug) })}
                aria-invalid={!!slugError}
                className="min-w-[10rem] flex-1 px-2 py-1 text-xs"
                style={{ ...fieldStyle, ...(slugError ? { borderColor: 'var(--adm-error)' } : {}) }}
              />
            </div>
            <p className="mt-1 text-[11px]" style={{ color: slugError ? 'var(--adm-error)' : 'var(--adm-muted)' }} role={slugError ? 'alert' : undefined}>{slugError || slugHint}</p>
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <label htmlFor="article-excerpt" className="text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Excerpt</label>
              <span className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>{draft.excerpt.length} characters</span>
            </div>
            <textarea id="article-excerpt" rows={3} value={draft.excerpt} onChange={(e) => patch({ excerpt: e.target.value })}
              placeholder="A short summary used on article cards and as the search description fallback." className="w-full px-3 py-2 text-sm" style={fieldStyle} />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Article</p>
            <p className="mb-2 text-[11px]" style={{ color: 'var(--adm-muted)' }}>
              The title above becomes the page heading. Start the article with an introduction, then organise it with Heading 2 sections (Heading 3 for sub-sections).
            </p>
            <RichTextEditor value={draft.content} onChange={(html) => patch({ content: html })} onPickImage={onPickImage} linkItems={linkItems} />
          </div>

          <Section title="FAQ (optional)">
            <FaqEditor items={draft.faqs} onChange={(faqs) => patch({ faqs })} />
          </Section>
        </div>

        {/* ---------------- Sidebar ---------------- */}
        <div className="min-w-0 space-y-4">
          <Section title="Publishing">
            <PublishingPanel
              published={published}
              persisted={!!persisted}
              dirty={dirty}
              saveState={saveState}
              savedAt={savedAt}
              updatedAt={persisted?.updatedAt ?? null}
              publishedAt={persisted?.publishedAt ?? null}
              scheduledAt={persisted?.scheduledAt ?? null}
              autosaveNote={!published}
              errors={errors}
              busy={busy}
              onSaveDraft={() => requestSave('draft')}
              onPublish={() => requestSave('publish')}
              onUnpublish={() => requestSave('unpublish')}
              onSchedule={(iso) => requestSave('schedule', iso)}
              onUnschedule={() => requestSave('unschedule')}
              onPreview={openPreview}
            />
          </Section>

          <Section title="Featured image">
            <FeaturedImagePicker url={draft.image_url} alt={draft.image_alt} onChange={({ url, alt }) => patch({ image_url: url, image_alt: alt })} onChoose={() => setPicker({ target: 'featured' })} />
          </Section>

          <Section title="Category and author">
            <div className="space-y-3">
              <div>
                <label htmlFor="article-category" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Category</label>
                <select id="article-category" value={draft.category} onChange={(e) => patch({ category: e.target.value as BlogCategory })} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
                  {(Object.keys(BLOG_CATEGORIES) as BlogCategory[]).map((c) => <option key={c} value={c}>{BLOG_CATEGORIES[c].label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="article-author" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Author</label>
                <input id="article-author" value={draft.author} onChange={(e) => patch({ author: e.target.value })} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
              </div>
            </div>
          </Section>

          <Section title="SEO score">
            <SEOScore analysis={analysis} />
          </Section>

          <Section title="Search settings">
            <SEOEditor
              value={seo}
              onChange={patchSeo}
              fallback={{ title: draft.title, description: draft.excerpt, image: draft.image_url, canonicalPath: `${site.baseUrl}${path}` }}
              onPickImage={(field) => setPicker({ target: field })}
            />
          </Section>

          <Section title="Search result preview">
            <SERPPreview siteName={site.siteName} title={resolved.title} url={resolved.canonical} description={resolved.description} />
          </Section>

          <Section title="Social preview">
            <SocialPreview image={resolved.og.image} title={resolved.og.title} description={resolved.og.description} domain={site.baseUrl.replace(/^https?:\/\//, '')} />
            <Button variant="secondary" className="mt-3" onClick={() => setPicker({ target: 'og_image_url' })}>Choose social image</Button>
          </Section>

          <Section title="Article quality">
            <ArticleQuality stats={analysis.stats} hasFeatured={!!draft.image_url} />
          </Section>
        </div>
      </div>

      <MediaPicker open={!!picker} mode="single" onClose={() => { setPicker(null); editorPick.current = null; }} onSelect={onAssets} />

      {preview && (
        <Modal title="Preview" subtitle="Approximately how the article will look. Nothing is published." maxWidth="max-w-4xl" onClose={() => setPreview(null)}>
          <article
            style={{
              ['--tt-prose-text' as string]: 'var(--adm-text-2)',
              ['--tt-prose-heading' as string]: 'var(--adm-text)',
              ['--tt-prose-muted' as string]: 'var(--adm-muted)',
              ['--tt-prose-border' as string]: 'var(--adm-border)',
            }}
          >
            <h1 className="mx-auto max-w-[44rem] text-3xl font-bold" style={{ color: 'var(--adm-text)' }}>{draft.title || 'Untitled'}</h1>
            <p className="mx-auto mb-6 mt-2 max-w-[44rem] text-xs" style={{ color: 'var(--adm-muted)' }}>{BLOG_CATEGORIES[draft.category].label} • {draft.author}</p>
            {draft.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.image_url} alt={draft.image_alt} className="mx-auto mb-6 max-h-96 w-full max-w-[44rem] rounded-xl object-cover" />
            )}
            <div className="tt-prose" dangerouslySetInnerHTML={{ __html: preview.html }} />
          </article>
        </Modal>
      )}

      {slugPrompt && (
        <Modal
          title="Change the URL of a live article?"
          maxWidth="max-w-md"
          onClose={() => setSlugPrompt(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setSlugPrompt(null)}>Cancel</Button>
              <Button variant="secondary" onClick={() => { const k = slugPrompt.kind; setSlugPrompt(null); void save(k, false); }}>Change without redirect</Button>
              <Button onClick={() => { const k = slugPrompt.kind; setSlugPrompt(null); void save(k, true); }}>Change and redirect</Button>
            </>
          }
        >
          <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>
            This article is published at <strong>/blog/{persisted?.category}/{persisted?.slug}</strong>. Anyone with the old link, and search engines, will get a “not found” page unless you add a permanent (301) redirect to <strong>{path}</strong>.
          </p>
        </Modal>
      )}
    </div>
  );
}
