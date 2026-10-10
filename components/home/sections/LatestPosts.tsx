import Link from 'next/link';

import Button from '@/components/ui/Button';
import { BLOG_CATEGORIES, formatPostDate, isBlogCategory } from '@/lib/content/blog';
import { createClient } from '@/lib/supabase/server';

export default async function LatestPosts() {
  const supabase = await createClient();
  const { data } = await supabase.from('blog_posts').select('slug, category, title, excerpt, image_url, published_at').eq('is_published', true).order('published_at', { ascending: false }).limit(3);
  const posts = (data ?? []).flatMap((p) => (isBlogCategory(p.category) ? [{ ...p, label: BLOG_CATEGORIES[p.category].label }] : []));
  if (!posts.length) return null;

  return (
    <section aria-labelledby="home-blog" className="py-12 md:py-16" style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>From the blog</p>
        <h2 id="home-blog" className="mt-2 text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)] font-bold leading-tight">Stories and travel guides</h2>
        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {posts.map((p) => (
            <li key={`${p.category}/${p.slug}`}>
              <Link href={`/blog/${p.category}/${p.slug}`} className="group block h-full overflow-hidden rounded-3xl" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
                <div className="aspect-[16/10] overflow-hidden" style={{ background: 'var(--sp-border)' }}>
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span aria-hidden className="flex h-full w-full items-center justify-center text-5xl font-bold" style={{ color: 'var(--sp-primary)' }}>{p.title.charAt(0)}</span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>{p.label}</p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{p.excerpt}</p>}
                  {p.published_at && <p className="mt-3 text-xs" style={{ color: 'var(--sp-text-muted)' }}>{formatPostDate(p.published_at)}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8"><Button href="/blog">Read the blog</Button></div>
      </div>
    </section>
  );
}
