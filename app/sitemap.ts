import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';
import { SITE_LINK_GROUPS } from '@/lib/content/site-links';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const supabase = await createClient();
  const [destinations, posts] = await Promise.all([
    supabase.from('destinations').select('slug, updated_at').eq('is_active', true),
    supabase.from('blog_posts').select('slug, category, updated_at').eq('is_published', true),
  ]);

  return [
    ...SITE_LINK_GROUPS.flatMap((g) => g.links).map((l) => ({ url: `${base}${l.href}` })),
    { url: `${base}/blog/culture` },
    { url: `${base}/blog/destinations` },
    { url: `${base}/blog/student-stories` },
    { url: `${base}/blog/travel-tips` },
    ...(destinations.data ?? []).map((d) => ({ url: `${base}/destinations/${d.slug}`, lastModified: d.updated_at })),
    ...(posts.data ?? []).map((p) => ({ url: `${base}/blog/${p.category}/${p.slug}`, lastModified: p.updated_at })),
  ];
}
