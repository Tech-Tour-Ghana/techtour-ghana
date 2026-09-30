// sitemap.xml as a Route Handler rather than app/sitemap.ts. The metadata file
// convention and the HTML page at /sitemap clash under Turbopack ("Conflicting
// page and metadata at /sitemap"), which is what the production build uses.

import { env } from '@/lib/env';
import { BLOG_CATEGORIES } from '@/lib/content/blog';
import { SITE_LINK_GROUPS } from '@/lib/content/site-links';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function GET() {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const supabase = await createClient();
  const [destinations, posts, noindex, redirected] = await Promise.all([
    supabase.from('destinations').select('id, slug, updated_at').eq('is_active', true),
    supabase.from('blog_posts').select('id, slug, category, updated_at').eq('is_published', true),
    supabase.from('seo_metadata').select('entity_type, entity_key').eq('robots_index', false),
    supabase.from('redirects').select('source_path').eq('is_active', true),
  ]);

  // Content set to noindex, and paths that now redirect elsewhere, stay out of the sitemap.
  const hidden = new Set((noindex.data ?? []).map((r) => `${r.entity_type}:${r.entity_key}`));
  const moved = new Set((redirected.data ?? []).map((r) => r.source_path));

  const entries: { path: string; lastmod?: string }[] = [
    ...SITE_LINK_GROUPS.flatMap((g) => g.links).map((l) => ({ path: l.href })),
    ...Object.keys(BLOG_CATEGORIES).filter((c) => !hidden.has(`blog_category:${c}`)).map((c) => ({ path: `/blog/${c}` })),
    ...(destinations.data ?? []).filter((d) => !hidden.has(`destination:${d.id}`)).map((d) => ({ path: `/destinations/${d.slug}`, lastmod: d.updated_at })),
    ...(posts.data ?? []).filter((p) => !hidden.has(`blog_post:${p.id}`)).map((p) => ({ path: `/blog/${p.category}/${p.slug}`, lastmod: p.updated_at })),
  ].filter((e) => !moved.has(e.path));

  const body = entries
    .map((e) => `<url><loc>${escapeXml(base + e.path)}</loc>${e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ''}</url>`)
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
