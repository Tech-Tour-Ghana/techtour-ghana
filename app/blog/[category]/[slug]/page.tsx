import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import ArticleFaq from '@/components/content/ArticleFaq';
import JsonLd from '@/components/seo/JsonLd';
import { cleanFaqs, faqJsonLd } from '@/lib/seo/faq';
import { BLOG_CATEGORIES, formatPostDate, isBlogCategory } from '@/lib/content/blog';
import { articleJsonLd, breadcrumbJsonLd, resolveSeo } from '@/lib/seo/resolve';
import { sanitizeArticleHtml } from '@/lib/seo/sanitize.server';
import { getSeoFields, getSiteSeo, toMetadata } from '@/lib/seo/load.server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ category: string; slug: string }> };

const getPost = cache(async (category: string, slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, category, title, excerpt, content, image_url, image_alt, author, published_at, updated_at, faqs')
    .eq('slug', slug)
    .eq('category', category)
    .eq('is_published', true)
    .maybeSingle();
  return data;
});

const getResolved = cache(async (category: string, slug: string) => {
  const post = await getPost(category, slug);
  if (!post) return null;
  const [site, seo] = await Promise.all([getSiteSeo(), getSeoFields('blog_post', post.id)]);
  const resolved = resolveSeo({ path: `/blog/${category}/${slug}`, title: post.title, excerpt: post.excerpt, imageUrl: post.image_url, seo, site });
  return { post, site, resolved };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, slug } = await params;
  if (!isBlogCategory(category)) return {};
  const found = await getResolved(category, slug);
  if (!found) return {};
  return toMetadata(found.resolved, { type: 'article', publishedTime: found.post.published_at, modifiedTime: found.post.updated_at, siteName: found.site.siteName });
}

export default async function BlogPostPage({ params }: Params) {
  const { category, slug } = await params;
  if (!isBlogCategory(category)) notFound();
  const found = await getResolved(category, slug);
  if (!found) notFound();
  const { post, site, resolved } = found;

  const { label } = BLOG_CATEGORIES[category];
  const byline = `${label} • ${post.author}${post.published_at ? ` • ${formatPostDate(post.published_at)}` : ''}`;
  const html = sanitizeArticleHtml(post.content);
  const faqs = cleanFaqs(post.faqs);
  const faqLd = faqJsonLd(faqs);

  return (
    <ContentShell title={post.title} titleAccent="" description={byline}>
      <JsonLd
        data={[
          articleJsonLd({ resolved, headline: post.title, author: post.author, imageUrl: post.image_url, publishedAt: post.published_at, modifiedAt: post.updated_at, site }),
          ...(faqLd ? [faqLd] : []),
          breadcrumbJsonLd([{ name: 'Blog Updates', path: '/blog' }, { name: label, path: `/blog/${category}` }, { name: post.title, path: `/blog/${category}/${slug}` }], site),
        ]}
      />
      <article
        className="rounded-2xl p-6 md:p-10 max-w-3xl mx-auto"
        style={{
          ...cardStyle,
          ['--tt-prose-text' as string]: 'var(--sp-text-secondary)',
          ['--tt-prose-heading' as string]: 'var(--sp-text-primary)',
          ['--tt-prose-muted' as string]: 'var(--sp-text-muted)',
          ['--tt-prose-border' as string]: 'var(--sp-border)',
          ['--tt-prose-link' as string]: 'var(--sp-primary)',
        }}
      >
        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_url} alt={post.image_alt || post.title} className="w-full rounded-xl mb-8 object-cover" fetchPriority="high" />
        )}
        {/* Sanitised on the server (lib/seo/sanitize.server.ts), never raw editor output. */}
        <div className="tt-prose" dangerouslySetInnerHTML={{ __html: html }} />
        <ArticleFaq items={faqs} />
        <Link href={`/blog/${category}`} className="inline-block mt-10 text-sm font-semibold" style={{ color: 'var(--sp-primary)' }}>
          ← More in {label}
        </Link>
      </article>
    </ContentShell>
  );
}
