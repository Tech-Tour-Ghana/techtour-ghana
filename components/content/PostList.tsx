import Link from 'next/link';

import { BLOG_CATEGORIES, formatPostDate, type BlogCategory } from '@/lib/content/blog';
import { cardStyle } from './ContentShell';

export interface PostSummary {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image_url: string;
  author: string;
  published_at: string | null;
}

export default function PostList({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center" style={cardStyle}>
        <h2 className="text-xl font-semibold mb-2">No stories yet</h2>
        <p style={{ color: 'var(--sp-text-secondary)' }}>We are working on new articles. Please check back soon.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.category}/${post.slug}`}
          className="rounded-2xl overflow-hidden flex flex-col transition hover:-translate-y-1"
          style={cardStyle}
        >
          {post.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image_url} alt={post.title} className="w-full aspect-[16/9] object-cover" loading="lazy" />
          )}
          <div className="p-5 flex flex-col gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--sp-primary)' }}>
              {BLOG_CATEGORIES[post.category as BlogCategory]?.label ?? post.category}
            </span>
            <h2 className="text-lg font-bold">{post.title}</h2>
            {post.excerpt && <p className="text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{post.excerpt}</p>}
            <p className="text-xs mt-1" style={{ color: 'var(--sp-text-muted)' }}>
              {post.author}
              {post.published_at ? ` • ${formatPostDate(post.published_at)}` : ''}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
