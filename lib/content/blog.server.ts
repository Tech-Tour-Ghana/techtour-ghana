import type { PostSummary } from '@/components/content/PostList';
import { createClient } from '@/lib/supabase/server';
import { BLOG_CATEGORIES, type BlogCategory } from './blog';

export const POSTS_PER_PAGE = 8;

/** One page of published posts (optionally one category) plus the per-category counts for the sidebar. */
export async function getBlogListing(category: BlogCategory | undefined, rawPage: string | undefined) {
  const supabase = await createClient();

  const { data: all } = await supabase.from('blog_posts').select('category').eq('is_published', true);
  const counts: Partial<Record<BlogCategory, number>> = {};
  for (const row of all ?? []) {
    if (row.category in BLOG_CATEGORIES) counts[row.category as BlogCategory] = (counts[row.category as BlogCategory] ?? 0) + 1;
  }

  const total = category ? (counts[category] ?? 0) : (all ?? []).length;
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1));

  let query = supabase
    .from('blog_posts')
    .select('slug, category, title, excerpt, image_url, author, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE - 1);
  if (category) query = query.eq('category', category);
  const { data } = await query;

  return { posts: (data ?? []) as PostSummary[], counts, page, pages };
}
