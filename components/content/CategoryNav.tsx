import Link from 'next/link';

import { BLOG_CATEGORIES, type BlogCategory } from '@/lib/content/blog';

export default function CategoryNav({ active }: { active?: BlogCategory }) {
  const chip = (isActive: boolean) => ({
    background: isActive ? 'var(--sp-primary)' : 'var(--sp-bg-card)',
    color: isActive ? '#FFFFFF' : 'var(--sp-text-secondary)',
    border: '1px solid var(--sp-border)',
  });
  return (
    <nav className="flex flex-wrap gap-2 mb-8" aria-label="Blog categories">
      <Link href="/blog" className="px-4 py-2 rounded-full text-sm font-medium" style={chip(!active)}>All</Link>
      {(Object.keys(BLOG_CATEGORIES) as BlogCategory[]).map((slug) => (
        <Link key={slug} href={`/blog/${slug}`} className="px-4 py-2 rounded-full text-sm font-medium" style={chip(active === slug)}>
          {BLOG_CATEGORIES[slug].label}
        </Link>
      ))}
    </nav>
  );
}
