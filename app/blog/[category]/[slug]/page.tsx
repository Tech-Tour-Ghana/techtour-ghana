import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import ArticleFaq from '@/components/content/ArticleFaq';
import { cardStyle } from '@/components/content/ContentShell';
import { PostCard, type PostSummary } from '@/components/content/PostList';
import ShareLinks from '@/components/content/ShareLinks';
import JsonLd from '@/components/seo/JsonLd';
import { CrumbLabel } from '@/components/SiteBreadcrumbs';
import { ServiceTheme } from '@/components/ServiceTheme';
import { BLOG_CATEGORIES, formatPostDate, initials, isBlogCategory } from '@/lib/content/blog';
import { readMinutes, withHeadingIds } from '@/lib/content/toc';
import { cleanFaqs, faqJsonLd } from '@/lib/seo/faq';
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
  // Sanitised on the server (lib/seo/sanitize.server.ts), never raw editor output.
  const { html, toc } = withHeadingIds(sanitizeArticleHtml(post.content));
  const minutes = readMinutes(html);
  const faqs = cleanFaqs(post.faqs);
  const faqLd = faqJsonLd(faqs);

  const supabase = await createClient();
  const { data: relatedRows } = await supabase
    .from('blog_posts')
    .select('slug, category, title, excerpt, image_url, author, published_at')
    .eq('is_published', true)
    .eq('category', category)
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3);
  const related = (relatedRows ?? []) as PostSummary[];

  const muted = { color: 'var(--sp-text-muted)' };

  return (
    <ServiceTheme>
      <div style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
        <JsonLd
          data={[
            articleJsonLd({ resolved, headline: post.title, author: post.author, imageUrl: post.image_url, publishedAt: post.published_at, modifiedAt: post.updated_at, site }),
            ...(faqLd ? [faqLd] : []),
            breadcrumbJsonLd([{ name: 'Blog Updates', path: '/blog' }, { name: label, path: `/blog/${category}` }, { name: post.title, path: `/blog/${category}/${slug}` }], site),
          ]}
        />

        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8">
          <CrumbLabel label={post.title} />

          <header className="mx-auto max-w-3xl text-center">
            <Link href={`/blog/${category}`} className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', color: 'var(--sp-primary)' }}>
              {label}
            </Link>
            <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">{post.title}</h1>
            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm" style={muted}>
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--sp-primary)' }}>{initials(post.author)}</span>
                {post.author}
              </span>
              {post.published_at && <span>· {formatPostDate(post.published_at)}</span>}
              <span>· {minutes} min read</span>
            </p>
          </header>

          {post.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image_url} alt={post.image_alt || post.title} fetchPriority="high"
              className="mt-8 aspect-[16/8] w-full rounded-3xl object-cover" />
          )}

          <div className="mt-10 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              {toc.length > 0 && (
                <>
                  <details className="rounded-2xl p-4 lg:hidden" style={cardStyle}>
                    <summary className="cursor-pointer text-sm font-semibold">Contents</summary>
                    <ul className="mt-3 space-y-2 text-sm">
                      {toc.map((t) => <li key={t.id} className={t.level === 3 ? 'pl-4' : ''}><a href={`#${t.id}`} style={{ color: 'var(--sp-text-secondary)' }}>{t.text}</a></li>)}
                    </ul>
                  </details>
                  <nav aria-label="Contents" className="hidden lg:block">
                    <h2 className="mb-3 text-lg font-semibold">Contents</h2>
                    <ul className="space-y-2 border-l text-sm" style={{ borderColor: 'var(--sp-border)' }}>
                      {toc.map((t) => (
                        <li key={t.id} className={t.level === 3 ? 'pl-7' : 'pl-3'}>
                          <a href={`#${t.id}`} className="hover:underline" style={{ color: 'var(--sp-text-secondary)' }}>{t.text}</a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </>
              )}
              <div className={toc.length > 0 ? 'mt-6' : ''}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={muted}>Share this post</p>
                <ShareLinks url={resolved.canonical} title={post.title} />
              </div>
            </aside>

            <article
              style={{
                ['--tt-prose-text' as string]: 'var(--sp-text-secondary)',
                ['--tt-prose-heading' as string]: 'var(--sp-text-primary)',
                ['--tt-prose-muted' as string]: 'var(--sp-text-muted)',
                ['--tt-prose-border' as string]: 'var(--sp-border)',
                ['--tt-prose-link' as string]: 'var(--sp-primary)',
              }}
            >
              <div className="tt-prose" style={{ marginInline: 0, maxWidth: '46rem' }} dangerouslySetInnerHTML={{ __html: html }} />
              <div style={{ maxWidth: '46rem' }}><ArticleFaq items={faqs} /></div>
            </article>
          </div>

          {related.length > 0 && (
            <section className="mt-16" aria-labelledby="more">
              <div className="mb-5 flex items-end justify-between">
                <h2 id="more" className="text-2xl font-bold">More in {label}</h2>
                <Link href={`/blog/${category}`} className="text-sm font-semibold" style={{ color: 'var(--sp-primary)' }}>View all</Link>
              </div>
              <div className="flex flex-col gap-5">{related.map((r) => <PostCard key={r.slug} post={r} />)}</div>
            </section>
          )}
        </div>
      </div>
    </ServiceTheme>
  );
}
