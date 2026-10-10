import Link from 'next/link';

import { BLOG_CATEGORIES, formatPostDate, initials, type BlogCategory } from '@/lib/content/blog';
import { cardStyle } from './ContentShell';
import PostCarousel from './PostCarousel';
import ShareButton from './ShareButton';

export interface PostSummary {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image_url: string;
  author: string;
  published_at: string | null;
}

export function PostCard({ post, stacked = false }: { post: PostSummary; stacked?: boolean }) {
  const href = `/blog/${post.category}/${post.slug}`;
  return (
    <article className={`flex h-full flex-col gap-4 rounded-3xl p-3 transition hover:shadow-lg ${stacked ? '' : 'sm:flex-row'}`} style={cardStyle}>
      <Link href={href} tabIndex={-1} aria-hidden="true" className={`relative block aspect-[16/10] overflow-hidden rounded-2xl ${stacked ? '' : 'sm:aspect-square sm:w-56 sm:flex-shrink-0 lg:w-60'}`}
        style={{ background: 'var(--sp-border)' }}>
        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {BLOG_CATEGORIES[post.category as BlogCategory]?.label ?? post.category}
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-1 sm:py-2 sm:pr-3">
        <div>
          <h2 className="text-lg font-bold leading-snug sm:text-xl">
            <Link href={href} className="hover:underline">{post.title}</Link>
          </h2>
          {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{post.excerpt}</p>}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--sp-primary)' }}>
              {initials(post.author)}
            </span>
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold">By {post.author}</p>
              {post.published_at && <p style={{ color: 'var(--sp-text-muted)' }}>{formatPostDate(post.published_at)}</p>}
            </div>
          </div>
                    <ShareButton path={href} title={post.title} />
        </div>
      </div>
    </article>
  );
}

function FeaturedPost({ post }: { post: PostSummary }) {
  const href = `/blog/${post.category}/${post.slug}`;
  return (
    <article className="group grid overflow-hidden rounded-3xl lg:grid-cols-2" style={cardStyle}>
      <Link href={href} tabIndex={-1} aria-hidden="true" className="relative block aspect-[16/10] lg:aspect-auto lg:min-h-[20rem]" style={{ background: 'var(--sp-border)' }}>
        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
      </Link>
      <div className="flex flex-col justify-center gap-4 p-6 lg:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>Latest, {BLOG_CATEGORIES[post.category as BlogCategory]?.label ?? post.category}</p>
        <h2 className="text-2xl font-bold leading-tight lg:text-3xl"><Link href={href} className="hover:underline">{post.title}</Link></h2>
        {post.excerpt && <p className="line-clamp-4 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{post.excerpt}</p>}
        <p className="text-sm" style={{ color: 'var(--sp-text-muted)' }}>By {post.author}{post.published_at ? `, ${formatPostDate(post.published_at)}` : ''}</p>
        <Link href={href} className="text-sm font-semibold" style={{ color: 'var(--sp-primary)' }}>Read the article</Link>
      </div>
    </article>
  );
}

export function Pagination({ page, pages, basePath, q = '' }: { page: number; pages: number; basePath: string; q?: string }) {
  if (pages <= 1) return null;
  const href = (n: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (n > 1) params.set('page', String(n));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const box = (active: boolean) => ({ background: active ? 'var(--sp-primary)' : 'var(--sp-bg-card)', color: active ? 'var(--brand-white)' : 'var(--sp-text-secondary)', border: '1px solid var(--sp-border)' });
  return (
    <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && <Link href={href(page - 1)} rel="prev" className="rounded-full px-4 py-2 text-sm font-medium" style={box(false)}>Previous</Link>}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link key={n} href={href(n)} aria-current={n === page ? 'page' : undefined} className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium" style={box(n === page)}>{n}</Link>
      ))}
      {page < pages && <Link href={href(page + 1)} rel="next" className="rounded-full px-4 py-2 text-sm font-medium" style={box(false)}>Next</Link>}
    </nav>
  );
}

export default function PostList({ posts, featureFirst = false, query = '' }: { posts: PostSummary[]; featureFirst?: boolean; query?: string }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center" style={cardStyle}>
        <h2 className="mb-2 text-xl font-semibold">{query ? 'No stories match' : 'No stories yet'}</h2>
        <p style={{ color: 'var(--sp-text-secondary)' }}>{query ? `Nothing found for "${query}". Try a different word.` : 'We are working on new articles. Please check back soon.'}</p>
      </div>
    );
  }
  // Desktop: every post as a wide card. Tablet and phone: the first post as the
  // wide featured card, the rest as a sliding row of portrait cards.
  const [featured, ...rest] = posts;
  return (
    <>
      <div className="hidden lg:block">
        {featureFirst && posts.length > 1 ? (
          <>
            <FeaturedPost post={featured!} />
            <ul className="mt-6 grid grid-cols-2 gap-5">{rest.map((post) => <li key={post.slug}><PostCard post={post} stacked /></li>)}</ul>
          </>
        ) : (
          <ul className="grid grid-cols-2 gap-5">{posts.map((post) => <li key={post.slug}><PostCard post={post} stacked /></li>)}</ul>
        )}
      </div>
      <div className="lg:hidden">
        <PostCard post={featured!} />
        <PostCarousel posts={rest} label="More stories" />
      </div>
    </>
  );
}
