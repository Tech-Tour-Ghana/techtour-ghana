import type { Metadata } from 'next';
import Link from 'next/link';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import { SITE_LINK_GROUPS } from '@/lib/content/site-links';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Sitemap',
  description: 'A list of every public page on TechTour Ghana.',
  alternates: { canonical: '/sitemap' },
};

export const dynamic = 'force-dynamic';

export default async function SitemapPage() {
  const supabase = await createClient();
  const { data: destinations } = await supabase.from('destinations').select('slug, name').eq('is_active', true).order('sort_order');

  const groups = [
    ...SITE_LINK_GROUPS,
    ...(destinations?.length
      ? [{ title: 'Destination pages', links: destinations.map((d) => ({ label: d.name, href: `/destinations/${d.slug}` })) }]
      : []),
  ];

  return (
    <ContentShell title="Site" titleAccent="Map" description="Every public page on TechTour Ghana in one place.">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <section key={group.title} className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-lg font-bold mb-3">{group.title}</h2>
            <ul className="space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} style={{ color: 'var(--sp-primary)' }}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ContentShell>
  );
}
