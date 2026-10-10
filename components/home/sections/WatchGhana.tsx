'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlay } from '@fortawesome/free-solid-svg-icons';
import Button from '@/components/ui/Button';
import { parseYouTubeId, youTubeEmbed, youTubeThumb } from '@/lib/video/youtube';

export interface WatchVideo {
  id: string;
  title: string;
  description: string;
  category: string;
  video_url: string;
  image_url: string;
}

const arrowCls =
  'hidden h-11 w-11 items-center justify-center rounded-full border md:flex transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export default function WatchGhana({ videos }: { videos: WatchVideo[] }) {
  const items = useMemo(
    () => videos.flatMap((v) => { const yt = parseYouTubeId(v.video_url); return yt ? [{ ...v, yt }] : []; }),
    [videos],
  );
  const categories = useMemo(() => [...new Set(items.map((v) => v.category.trim()).filter(Boolean))], [items]);
  const [cat, setCat] = useState('All');
  const [playing, setPlaying] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  // Dots follow the real scroll stops, which depend on how many cards fit.
  const [stops, setStops] = useState(1);
  const track = useRef<HTMLDivElement>(null);

  const shown = cat === 'All' ? items : items.filter((v) => v.category.trim() === cat);

  const step = useCallback(() => {
    const first = track.current?.children[0] as HTMLElement | undefined;
    return first ? first.offsetWidth + 16 : 0;
  }, []);

  const onScroll = () => {
    const el = track.current, s = step();
    if (el && s) setActive(Math.round(el.scrollLeft / s));
  };

  const goTo = (i: number) => track.current?.scrollTo({ left: i * step(), behavior: 'smooth' });

  const move = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir === 1 && atEnd) goTo(0);
    else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    else el.scrollBy({ left: dir * step(), behavior: 'smooth' });
  };

  useEffect(() => {
    const measure = () => {
      const el = track.current, s = step();
      if (el && s) setStops(Math.max(1, Math.ceil((el.scrollWidth - el.clientWidth - 4) / s) + 1));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [shown.length, step]);

  useEffect(() => {
    track.current?.scrollTo({ left: 0 });
    setActive(0);
    setPlaying(null);
  }, [cat]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="watch-h" className="px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--sp-primary)' }}>Watch Ghana</p>
            <h2 id="watch-h" className="mt-2 font-bold leading-tight" style={{ fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)', color: 'var(--sp-text-primary)' }}>
              See it before you go
            </h2>
            <p className="mt-3" style={{ color: 'var(--sp-text-secondary)' }}>
              Tours, conversations and real experiences from across Ghana, a short watch away.
            </p>
          </div>
          <div className="hidden gap-2 md:flex">
            <button type="button" aria-label="Previous video" onClick={() => move(-1)} className={arrowCls} style={{ borderColor: 'var(--sp-border)', color: 'var(--sp-text-primary)', background: 'var(--sp-bg-card)' }}>
              <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" />
            </button>
            <button type="button" aria-label="Next video" onClick={() => move(1)} className={arrowCls} style={{ borderColor: 'var(--sp-border)', color: 'var(--sp-text-primary)', background: 'var(--sp-bg-card)' }}>
              <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {categories.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter videos by category">
            {['All', ...categories].map((c) => {
              const on = c === cat;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCat(c)}
                  className="min-h-[2.75rem] rounded-full border px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    background: on ? 'var(--sp-primary)' : 'var(--sp-bg-card)',
                    color: on ? 'var(--brand-white)' : 'var(--sp-text-primary)',
                    borderColor: on ? 'var(--sp-primary)' : 'var(--sp-border)',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        <div
          ref={track}
          onScroll={onScroll}
          className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {shown.map((v) => (
            <article
              key={v.id}
              className="w-[82%] flex-none snap-start overflow-hidden rounded-2xl border sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
              style={{ background: 'var(--sp-bg-card)', borderColor: 'var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}
            >
              <div className="relative aspect-video bg-black">
                {playing === v.id ? (
                  <iframe
                    src={youTubeEmbed(v.yt)}
                    title={v.title}
                    allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.image_url || youTubeThumb(v.yt)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Play: ${v.title}`}
                      onClick={() => setPlaying(v.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg">
                        <FontAwesomeIcon icon={faPlay} className="ml-0.5 h-5 w-5" />
                      </span>
                    </button>
                  </>
                )}
              </div>
              <div className="p-4">
                {v.category && (
                  <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: 'var(--sp-primary)', color: 'var(--brand-white)' }}>
                    {v.category}
                  </span>
                )}
                <h3 className="mt-2 text-base font-semibold leading-snug" style={{ color: 'var(--sp-text-primary)' }}>{v.title}</h3>
                {v.description && (
                  <p className="mt-1 line-clamp-2 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{v.description}</p>
                )}
              </div>
            </article>
          ))}
        </div>

        {stops > 1 && (
          <div className="mt-4 flex justify-center">
            {Array.from({ length: stops }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                onClick={() => goTo(i)}
                className="flex h-11 w-6 items-center justify-center"
              >
                <span
                  className="block h-2 rounded-full transition-all"
                  style={{ width: i === active ? 20 : 8, background: i === active ? 'var(--sp-primary)' : 'var(--sp-border)' }}
                />
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Button href="/tours">Browse tours</Button>
        </div>
      </div>
    </section>
  );
}
