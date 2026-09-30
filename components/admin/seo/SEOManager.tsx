'use client';

// SEO Manager: an on-site health check plus the site-wide SEO settings and
// redirects. Per-article editing happens in the blog editor.

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ListSkeleton, Surface, Tabs } from '@/components/admin/ui';
import { env } from '@/lib/env';
import { BLOG_CATEGORIES, type BlogCategory } from '@/lib/content/blog';
import { SITE_LINK_GROUPS } from '@/lib/content/site-links';
import { auditContent, type AuditInput } from '@/lib/seo/audit';
import { seoFieldsFrom, siteSeoFrom } from '@/lib/seo/site';
import type { SeoFields } from '@/lib/seo/resolve';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import ContentSeoTable from './ContentSeoTable';
import RedirectsManager, { type RedirectRow } from './RedirectsManager';
import SEOOverview from './SEOOverview';
import SeoSettingsForm from './SeoSettingsForm';

type Tab = 'overview' | 'blog' | 'destinations' | 'sitemap' | 'redirects' | 'settings';
type Settings = Database['public']['Tables']['site_settings']['Row'];

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'blog', label: 'Blog' },
  { key: 'destinations', label: 'Destinations' },
  { key: 'sitemap', label: 'Sitemap' },
  { key: 'redirects', label: 'Redirects' },
  { key: 'settings', label: 'Settings' },
];

export default function SEOManager() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    posts: Database['public']['Tables']['blog_posts']['Row'][];
    destinations: Database['public']['Tables']['destinations']['Row'][];
    seo: Map<string, SeoFields>;
    settings: Settings | null;
    redirects: RedirectRow[];
  } | null>(null);

  const load = useCallback(async () => {
    const [posts, destinations, seoRows, settings, redirects] = await Promise.all([
      supabase.from('blog_posts').select('*').limit(1000),
      supabase.from('destinations').select('*').order('sort_order'),
      supabase.from('seo_metadata').select('*'),
      supabase.from('site_settings').select('*').limit(1).maybeSingle(),
      supabase.from('redirects').select('*').order('created_at', { ascending: false }),
    ]);
    if (posts.error || destinations.error || seoRows.error || redirects.error) { setError('Could not load SEO data.'); setLoading(false); return; }
    setData({
      posts: posts.data ?? [],
      destinations: destinations.data ?? [],
      seo: new Map((seoRows.data ?? []).map((r) => [`${r.entity_type}:${r.entity_key}`, seoFieldsFrom(r)])),
      settings: settings.data,
      redirects: redirects.data ?? [],
    });
    setError('');
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const site = useMemo(() => siteSeoFrom(data?.settings, env.NEXT_PUBLIC_SITE_URL), [data?.settings]);

  const report = useMemo(() => {
    if (!data) return null;
    const seoOf = (kind: string, key: string) => data.seo.get(`${kind}:${key}`) ?? seoFieldsFrom(null);
    const inputs: AuditInput[] = [
      ...data.posts.map((p): AuditInput => ({
        kind: 'blog_post', key: p.id, name: p.title, href: `/admin/blog/${p.id}`, live: p.is_published, slug: p.slug,
        path: `/blog/${p.category}/${p.slug}`, excerpt: p.excerpt, contentHtml: p.content, imageUrl: p.image_url, imageAlt: p.image_alt, seo: seoOf('blog_post', p.id),
      })),
      ...data.destinations.map((d): AuditInput => ({
        kind: 'destination', key: d.id, name: d.name, href: '/admin/destinations', live: d.is_active, slug: d.slug,
        path: `/destinations/${d.slug}`, excerpt: d.tagline, contentHtml: `<p>${d.description.replace(/</g, '&lt;')}</p>`, imageUrl: d.image_url, imageAlt: d.name, seo: seoOf('destination', d.id),
      })),
      ...(Object.keys(BLOG_CATEGORIES) as BlogCategory[]).map((c): AuditInput => ({
        kind: 'blog_category', key: c, name: BLOG_CATEGORIES[c].label, href: '/admin/seo', live: true, slug: c,
        path: `/blog/${c}`, excerpt: BLOG_CATEGORIES[c].blurb, contentHtml: '', imageUrl: '', imageAlt: '', seo: seoOf('blog_category', c),
      })),
    ];
    return auditContent(inputs, site);
  }, [data, site]);

  const onSeoSaved = (kind: string, key: string, seo: SeoFields) =>
    setData((d) => (d ? { ...d, seo: new Map(d.seo).set(`${kind}:${key}`, seo) } : d));

  if (loading) return <ListSkeleton />;
  if (error || !data || !report) return <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error || 'Could not load SEO data.'}</p>;

  const drafts = data.posts.filter((p) => !p.is_published).length;
  const inSitemap = report.live.filter((i) => i.seo.robots_index).length + SITE_LINK_GROUPS.flatMap((g) => g.links).length;
  const excluded = [
    ...report.noindex.map((i) => ({ label: i.name, reason: 'Set to noindex' })),
    ...data.posts.filter((p) => !p.is_published).map((p) => ({ label: p.title || 'Untitled', reason: p.scheduled_at ? 'Scheduled, not live yet' : 'Draft' })),
    ...data.destinations.filter((d) => !d.is_active).map((d) => ({ label: d.name, reason: 'Inactive destination' })),
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === 'overview' && <SEOOverview report={report} draftCount={drafts} />}

      {tab === 'blog' && (
        <div className="space-y-6">
          <ContentSeoTable items={report.items.filter((i) => i.kind === 'blog_post')} site={site} editInline={false} emptyTitle="No articles yet" onSaved={onSeoSaved} />
          <div>
            <h3 className="mb-2 text-sm font-bold" style={{ color: 'var(--adm-text)' }}>Category pages</h3>
            <ContentSeoTable items={report.items.filter((i) => i.kind === 'blog_category')} site={site} editInline emptyTitle="No categories" onSaved={onSeoSaved} />
          </div>
        </div>
      )}

      {tab === 'destinations' && (
        <ContentSeoTable items={report.items.filter((i) => i.kind === 'destination')} site={site} editInline emptyTitle="No destinations yet" onSaved={onSeoSaved} />
      )}

      {tab === 'sitemap' && (
        <div className="space-y-4">
          <Surface className="p-4">
            <p className="text-sm" style={{ color: 'var(--adm-text)' }}>
              <strong>{inSitemap}</strong> addresses are listed in the sitemap. It updates automatically when content is published, hidden or redirected.
            </p>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold" style={{ color: 'var(--adm-primary)' }}>Open sitemap.xml →</a>
          </Surface>
          <Surface className="p-4">
            <h3 className="mb-2 text-sm font-bold" style={{ color: 'var(--adm-text)' }}>Left out of the sitemap ({excluded.length})</h3>
            {excluded.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>Everything published is included.</p>
            ) : (
              <ul className="space-y-1">
                {excluded.map((e, i) => (
                  <li key={i} className="flex justify-between gap-3 text-xs"><span style={{ color: 'var(--adm-text-2)' }}>{e.label}</span><span style={{ color: 'var(--adm-muted)' }}>{e.reason}</span></li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px]" style={{ color: 'var(--adm-muted)' }}>Admin, account and sign-in pages, preview addresses and paths that redirect elsewhere are never listed.</p>
          </Surface>
        </div>
      )}

      {tab === 'redirects' && <RedirectsManager rows={data.redirects} onChange={(redirects) => setData((d) => (d ? { ...d, redirects } : d))} />}

      {tab === 'settings' && <SeoSettingsForm settings={data.settings} onSaved={(settings) => setData((d) => (d ? { ...d, settings } : d))} />}
    </div>
  );
}
