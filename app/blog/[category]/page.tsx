import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import CategoryNav from '@/components/content/CategoryNav';
import ContentShell from '@/components/content/ContentShell';
import PostList from '@/components/content/PostList';
import { BLOG_CATEGORIES, isBlogCategory } from '@/lib/content/blog';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  if (!isBlogCategory(category)) return {};
  const { label, blurb } = BLOG_CATEGORIES[category];
  return { title: label, description: blurb, alternates: { canonical: `/blog/${category}` } };
}

export default async function BlogCategoryPage({ params }: Params) {
  const { category } = await params;
  if (!isBlogCategory(category)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, category, title, excerpt, image_url, author, published_at')
    .eq('is_published', true)
    .eq('category', category)
    .order('published_at', { ascending: false });

  const { label, blurb } = BLOG_CATEGORIES[category];
  return (
    <ContentShell title={label} titleAccent="" description={blurb}>
      <CategoryNav active={category} />
      <PostList posts={data ?? []} />
    </ContentShell>
  );
}
