import Link from 'next/link';

import { BLOG_CATEGORIES, formatPostDate, type BlogCategory } from '@/lib/content/blog';
import { cardStyle } from './ContentShell';
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

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || 'T';

export function PostCard({ post }: { post: PostSummary }) {
  const href = `/blog/${post.category}/${post.slug}`;
  return (
    <article className="flex flex-col gap-4 rounded-3xl p-3 transition hover:shadow-lg sm:flex-row" style={cardStyle}>
      <Link href={href} tabIndex={-1} aria-hidden="true" className="relative block aspect-[16/10] overflow-hidden rounded-2xl sm:aspect-square sm:w-56 sm:flex-shrink-0 lg:w-60"
        style={{ background: 'var(--sp-border)' }}>
        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          #{post.category}
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
          <span className="ml-auto hidden text-xs md:block" style={{ color: 'var(--sp-text-muted)' }}>{BLOG_CATEGORIES[post.category as BlogCategory]?.label}</span>
          <ShareButton path={href} title={post.title} />
        </div>
      </div>
    </article>
  );
}

export function Pagination({ page, pages, basePath }: { page: number; pages: number; basePath: string }) {
  if (pages <= 1) return null;
  const href = (n: number) => (n === 1 ? basePath : `${basePath}?page=${n}`);
  const box = (active: boolean) => ({ background: active ? 'var(--sp-primary)' : 'var(--sp-bg-card)', color: active ? '#fff' : 'var(--sp-text-secondary)', border: '1px solid var(--sp-border)' });
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

export default function PostList({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center" style={cardStyle}>
        <h2 className="mb-2 text-xl font-semibold">No stories yet</h2>
        <p style={{ color: 'var(--sp-text-secondary)' }}>We are working on new articles. Please check back soon.</p>
      </div>
    );
  }
  return <div className="flex flex-col gap-5">{posts.map((post) => <PostCard key={post.slug} post={post} />)}</div>;
}
