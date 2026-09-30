import Link from 'next/link';

import { BLOG_CATEGORIES, type BlogCategory } from '@/lib/content/blog';

/** Category list for the blog. A left column on desktop, a wrapping row of chips on small screens. */
export default function CategoryNav({ active, counts }: { active?: BlogCategory; counts: Partial<Record<BlogCategory, number>> }) {
  const slugs = Object.keys(BLOG_CATEGORIES) as BlogCategory[];
  const total = slugs.reduce((sum, s) => sum + (counts[s] ?? 0), 0);

  const row = (href: string, label: string, count: number, isActive: boolean) => (
    <li key={href}>
      <Link href={href} aria-current={isActive ? 'page' : undefined}
        className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:opacity-90"
        style={{ background: isActive ? 'var(--sp-primary)' : 'transparent', color: isActive ? '#FFFFFF' : 'var(--sp-text-secondary)' }}>
        <span>{label}</span>
        <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(128,128,128,0.15)' }}>{count}</span>
      </Link>
    </li>
  );

  return (
    <aside aria-label="Blog categories" className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl p-3" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
        <h2 className="px-4 pb-2 pt-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sp-text-muted)' }}>Categories</h2>
        <ul className="flex flex-wrap gap-1 lg:flex-col">
          {row('/blog', 'All posts', total, !active)}
          {slugs.map((s) => row(`/blog/${s}`, BLOG_CATEGORIES[s].label, counts[s] ?? 0, active === s))}
        </ul>
      </div>
    </aside>
  );
}
