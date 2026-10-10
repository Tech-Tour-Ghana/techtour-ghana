'use client';

// Home hero: admin-managed background slider, fixed copy (so the h1 never
// changes), trust points, and a search card that overlaps the hero's bottom
// edge. The search is a plain GET form to /tours, so it works without JS.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faLock, faHandshake, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Button from '@/components/ui/Button';
import type { Slide } from '@/lib/home/map';

export interface HeroDestination { slug: string; name: string }

const TRUST = [
  { icon: faCalendarCheck, text: 'Dated departures you can book online' },
  { icon: faLock, text: 'Secure card and mobile money payment' },
  { icon: faHandshake, text: 'Local guides and artisans' },
];

export default function Hero({ slides, destinations = [] }: { slides: Slide[]; destinations?: HeroDestination[] }) {
  const n = slides.length;
  // The track is [last, ...slides, first]. Sliding onto a clone is followed by
  // a silent jump to the real slide, so the slider never rewinds.
  const [pos, setPos] = useState(n > 1 ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => { setAnimate(false); setPos(n > 1 ? 1 : 0); }, [n]);

  const next = useCallback(() => { setAnimate(true); setPos((p) => Math.min(p + 1, n + 1)); }, [n]);
  const prev = () => { setAnimate(true); setPos((p) => Math.max(p - 1, 0)); };
  const goTo = (i: number) => { setAnimate(true); setPos(i + 1); };

  useEffect(() => {
    if (n <= 1 || paused || reduced) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [n, paused, reduced, next]);

  const settle = () => {
    if (n < 2) return;
    if (pos === n + 1) { setAnimate(false); setPos(1); }
    else if (pos === 0) { setAnimate(false); setPos(n); }
  };

  const first = slides[0];
  const last = slides[n - 1];
  const track = n > 1 && first && last ? [last, ...slides, first] : slides;
  const current = n > 1 ? (pos - 1 + n) % n : 0;
  const cur = slides[current];
  const caption = cur ? [cur.title, cur.subtitle].filter(Boolean).join(', ') : '';

  return (
    <section aria-label="Welcome">
      <div
        className="relative min-h-[34rem] h-[78svh] max-h-[52rem] overflow-hidden bg-neutral-900 text-white"
        aria-roledescription="carousel"
        aria-label="Featured places"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div
          className={`flex h-full ${animate && !reduced ? 'transition-transform duration-700 ease-out' : ''}`}
          style={{ transform: `translateX(-${pos * 100}%)` }}
          onTransitionEnd={(e) => { if (e.target === e.currentTarget) settle(); }}
        >
          {track.map((s, idx) => {
            const isClone = n > 1 && (idx === 0 || idx === track.length - 1);
            return (
              <div
                key={`${s.id}-${idx}`}
                aria-hidden={isClone || undefined}
                role="group"
                aria-roledescription="slide"
                className="h-full w-full flex-shrink-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${s.image})` }}
              />
            );
          })}
        </div>

        {/* Dark overlay keeps white copy above 4.5:1 on any photo */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30" />

        <div className="absolute inset-0 z-10 mx-auto flex max-w-7xl flex-col justify-center px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 sm:text-sm">Tours, study abroad, stays and crafts</p>
          <h1 className="max-w-3xl text-[clamp(2.25rem,1.4rem+4vw,4.25rem)] font-bold leading-[1.05]">Discover Ghana with local experts</h1>
          <p className="mt-4 max-w-xl text-[clamp(1rem,0.9rem+0.5vw,1.25rem)] leading-relaxed text-white/90">
            Book guided tours, apply to study abroad, find a place to stay and shop authentic crafts, all in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/tours" variant="accent" size="lg">Browse tours</Button>
            <Button href="/services/study-abroad" variant="onDark" size="lg">Study abroad</Button>
          </div>
          <ul className="mt-6 grid gap-2 text-sm text-white/90 sm:grid-cols-3 sm:gap-6">
            {TRUST.map((t) => (
              <li key={t.text} className="flex items-center gap-2">
                <FontAwesomeIcon icon={t.icon} className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--sp-accent, var(--brand-white))' }} />
                {t.text}
              </li>
            ))}
          </ul>
        </div>

        {n > 1 && (
          <>
            <button type="button" aria-label="Previous slide" onClick={prev} className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60 md:flex">
              <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Next slide" onClick={next} className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60 md:flex">
              <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
            </button>
            <div className="absolute bottom-14 left-1/2 z-20 flex -translate-x-1/2 items-center sm:left-6 sm:translate-x-0 lg:left-8">
              {slides.map((s, i) => (
                <button key={s.id} type="button" aria-label={`Go to slide ${i + 1}`} aria-current={current === i} onClick={() => goTo(i)} className="group flex h-11 w-5 items-center justify-center">
                  <span className={`block h-1.5 rounded-full transition-all duration-300 ${current === i ? 'w-6' : 'w-2 bg-white/60 group-hover:bg-white/80'}`} style={current === i ? { background: 'var(--sp-accent, var(--brand-white))' } : undefined} />
                </button>
              ))}
            </div>
          </>
        )}

        {caption && (
          <p className="absolute bottom-14 right-4 z-20 hidden max-w-[40%] truncate text-xs text-white/90 sm:block sm:right-6 lg:right-8">
            {cur?.button_link ? <Link href={cur.button_link} className="hover:underline">{caption}</Link> : caption}
          </p>
        )}
      </div>

      <div className="relative z-30 mx-auto -mt-12 max-w-5xl px-4 sm:px-6">
        <form action="/tours" method="get" role="search" className="grid gap-3 rounded-2xl p-4 shadow-xl ring-1 ring-black/5 sm:p-5 md:grid-cols-[1fr_auto_auto] md:items-end" style={{ background: 'var(--sp-bg-card)', color: 'var(--sp-text-primary)' }}>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-text-secondary)' }}>Where do you want to go?</span>
            <input type="search" name="q" placeholder="Try Kakum or Cape Coast" className="min-h-[2.75rem] w-full rounded-lg border px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1" style={{ outlineColor: 'var(--sp-primary, var(--brand-black))', background: 'var(--sp-bg-input)', color: 'var(--sp-text-primary)', borderColor: 'var(--sp-border-strong)' }} />
          </label>
          {destinations.length > 0 && (
            <label className="block md:w-56">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-text-secondary)' }}>Destination</span>
              <select name="destination" defaultValue="" className="min-h-[2.75rem] w-full rounded-lg border px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1" style={{ outlineColor: 'var(--sp-primary, var(--brand-black))', background: 'var(--sp-bg-input)', color: 'var(--sp-text-primary)', borderColor: 'var(--sp-border-strong)' }}>
                <option value="">All destinations</option>
                {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
              </select>
            </label>
          )}
          <Button type="submit" variant="accent" size="lg" full>Search</Button>
        </form>
      </div>
    </section>
  );
}
