import type { Metadata } from 'next';

import BlogSearch from '@/components/content/BlogSearch';
import CategoryNav from '@/components/content/CategoryNav';
import ContentShell from '@/components/content/ContentShell';
import PostList, { Pagination } from '@/components/content/PostList';
import { getBlogListing } from '@/lib/content/blog.server';

const description = 'Stories, destination guides, student experiences and travel tips from TechTour Ghana.';

// Searched views canonicalise to /blog and stay out of the index.
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: 'Blog Updates', description, alternates: { canonical: '/blog' }, ...(q ? { robots: { index: false, follow: true } } : {}) };
}

export const dynamic = 'force-dynamic';

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const sp = await searchParams;
  const { posts, counts, page, pages, q } = await getBlogListing(undefined, sp.page, sp.q);

  return (
    <ContentShell
      wide
      title="Blog"
      titleAccent="Updates"
      description="Stories, destination guides, student experiences and travel tips from across Ghana."
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <CategoryNav counts={counts} />
        <div className="min-w-0">
          <BlogSearch action="/blog" q={q} />
          <PostList posts={posts} featureFirst={page === 1 && !q} query={q} />
          <Pagination page={page} pages={pages} basePath="/blog" q={q} />
        </div>
      </div>
    </ContentShell>
  );
}
