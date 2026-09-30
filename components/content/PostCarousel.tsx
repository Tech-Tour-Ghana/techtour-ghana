'use client';

// Portrait post cards in a row that slides by itself, left to right, and can be
// moved by hand with the arrows or by swiping. Auto-sliding pauses while the
// reader is touching or pointing at it, and is off for reduced-motion users.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

import { formatPostDate, initials } from '@/lib/content/blog';
import ShareButton from './ShareButton';
import type { PostSummary } from './PostList';

const INTERVAL_MS = 4500;

function PortraitCard({ post }: { post: PostSummary }) {
  const href = `/blog/${post.category}/${post.slug}`;
  return (
    <article className="flex h-full flex-col rounded-3xl p-3" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
      <Link href={href} tabIndex={-1} aria-hidden="true" className="relative block aspect-[4/5] overflow-hidden rounded-2xl" style={{ background: 'var(--sp-border)' }}>
        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image_url} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">#{post.category}</span>
      </Link>
      <div className="flex flex-1 flex-col justify-between gap-4 px-1 pb-1 pt-4">
        <div>
          <h3 className="line-clamp-2 text-base font-bold leading-snug"><Link href={href} className="hover:underline">{post.title}</Link></h3>
          {post.excerpt && <p className="mt-2 line-clamp-2 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{post.excerpt}</p>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden="true" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--sp-primary)' }}>{initials(post.author)}</span>
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold">{post.author}</p>
              {post.published_at && <p style={{ color: 'var(--sp-text-muted)' }}>{formatPostDate(post.published_at)}</p>}
            </div>
          </div>
          <ShareButton path={href} title={post.title} />
        </div>
      </div>
    </article>
  );
}

export default function PostCarousel({ posts, label }: { posts: PostSummary[]; label: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);

  const slide = useCallback((direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const step = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? el.clientWidth;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const atStart = el.scrollLeft <= 4;
    if (direction === 1 && atEnd) el.scrollTo({ left: 0, behavior: 'smooth' });
    else if (direction === -1 && atStart) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    else el.scrollBy({ left: direction * (step + 16), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (paused || posts.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => slide(1), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, posts.length, slide]);

  if (posts.length === 0) return null;

  const arrow = 'flex h-10 w-10 items-center justify-center rounded-full transition hover:opacity-80';
  const arrowStyle = { background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', color: 'var(--sp-text-primary)' };

  return (
    <section aria-roledescription="carousel" aria-label={label} className="mt-6"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)} onTouchEnd={() => setTimeout(() => setPaused(false), 6000)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{label}</h2>
        <div className="flex gap-2">
          <button type="button" className={arrow} style={arrowStyle} aria-label="Previous posts" onClick={() => slide(-1)}><FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" /></button>
          <button type="button" className={arrow} style={arrowStyle} aria-label="Next posts" onClick={() => slide(1)}><FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <ul ref={track} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {posts.map((post) => (
          <li key={post.slug} className="w-[72%] flex-shrink-0 snap-start sm:w-[44%] md:w-[31%]">
            <PortraitCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
