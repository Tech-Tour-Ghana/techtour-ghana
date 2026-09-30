import type { Metadata } from 'next';

import CategoryNav from '@/components/content/CategoryNav';
import ContentShell from '@/components/content/ContentShell';
import PostList, { Pagination } from '@/components/content/PostList';
import { getBlogListing } from '@/lib/content/blog.server';

export const metadata: Metadata = {
  title: 'Blog Updates',
  description: 'Stories, destination guides, student experiences and travel tips from TechTour Ghana.',
  alternates: { canonical: '/blog' },
};

export const dynamic = 'force-dynamic';

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { posts, counts, page, pages } = await getBlogListing(undefined, (await searchParams).page);

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
          <PostList posts={posts} />
          <Pagination page={page} pages={pages} basePath="/blog" />
        </div>
      </div>
    </ContentShell>
  );
}
