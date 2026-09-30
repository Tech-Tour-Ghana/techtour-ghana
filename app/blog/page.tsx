import type { Metadata } from 'next';

import CategoryNav from '@/components/content/CategoryNav';
import ContentShell from '@/components/content/ContentShell';
import PostList from '@/components/content/PostList';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Blog Updates',
  description: 'Stories, destination guides, student experiences and travel tips from TechTour Ghana.',
  alternates: { canonical: '/blog' },
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, category, title, excerpt, image_url, author, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  return (
    <ContentShell
      title="Blog"
      titleAccent="Updates"
      description="Stories, destination guides, student experiences and travel tips from across Ghana."
    >
      <CategoryNav />
      <PostList posts={data ?? []} />
    </ContentShell>
  );
}
