import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import BlogSearch from '@/components/content/BlogSearch';
import CategoryNav from '@/components/content/CategoryNav';
import ContentShell from '@/components/content/ContentShell';
import PostList, { Pagination } from '@/components/content/PostList';
import { BLOG_CATEGORIES, isBlogCategory } from '@/lib/content/blog';
import { getBlogListing } from '@/lib/content/blog.server';
import { resolveSeo } from '@/lib/seo/resolve';
import { getSeoFields, getSiteSeo, toMetadata } from '@/lib/seo/load.server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  if (!isBlogCategory(category)) return {};
  const { label, blurb } = BLOG_CATEGORIES[category];
  const [site, seo] = await Promise.all([getSiteSeo(), getSeoFields('blog_category', category)]);
  const resolved = resolveSeo({ path: `/blog/${category}`, title: label, excerpt: blurb, imageUrl: '', seo, site });
  return toMetadata(resolved, { type: 'website', siteName: site.siteName });
}

export default async function BlogCategoryPage({ params, searchParams }: Params & { searchParams: Promise<{ page?: string; q?: string }> }) {
  const { category } = await params;
  if (!isBlogCategory(category)) notFound();

  const sp = await searchParams;
  const { posts, counts, page, pages, q } = await getBlogListing(category, sp.page, sp.q);

  const { label, blurb } = BLOG_CATEGORIES[category];
  return (
    <ContentShell wide title={label} titleAccent="" description={blurb}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <CategoryNav active={category} counts={counts} />
        <div className="min-w-0">
          <BlogSearch action={`/blog/${category}`} q={q} />
          <PostList posts={posts} featureFirst={page === 1 && !q} query={q} />
          <Pagination page={page} pages={pages} basePath={`/blog/${category}`} q={q} />
        </div>
      </div>
    </ContentShell>
  );
}
