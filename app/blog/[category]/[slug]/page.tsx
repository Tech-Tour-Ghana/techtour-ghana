import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import { BLOG_CATEGORIES, formatPostDate, isBlogCategory } from '@/lib/content/blog';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ category: string; slug: string }> };

const getPost = cache(async (category: string, slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, category, title, excerpt, content, image_url, author, published_at')
    .eq('slug', slug)
    .eq('category', category)
    .eq('is_published', true)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, slug } = await params;
  const post = await getPost(category, slug);
  if (!isBlogCategory(category) || !post) return {};
  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { canonical: `/blog/${category}/${slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt || undefined,
      images: post.image_url ? [post.image_url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { category, slug } = await params;
  if (!isBlogCategory(category)) notFound();
  const post = await getPost(category, slug);
  if (!post) notFound();

  const paragraphs = post.content.split(/\n\s*\n/).filter(Boolean);
  const { label } = BLOG_CATEGORIES[category];
  const byline = `${label} • ${post.author}${post.published_at ? ` • ${formatPostDate(post.published_at)}` : ''}`;

  return (
    <ContentShell title={post.title} titleAccent="" description={byline}>
      <article className="rounded-2xl p-6 md:p-10 max-w-3xl mx-auto" style={cardStyle}>
        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_url} alt={post.title} className="w-full rounded-xl mb-6 object-cover" />
        )}
        <div className="space-y-4 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">{p}</p>
          ))}
        </div>
        <Link href={`/blog/${category}`} className="inline-block mt-8 text-sm font-semibold" style={{ color: 'var(--sp-primary)' }}>
          ← More in {label}
        </Link>
      </article>
    </ContentShell>
  );
}
