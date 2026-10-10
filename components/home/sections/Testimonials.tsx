'use client';

import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faStar } from '@fortawesome/free-solid-svg-icons';

import type { Testimonial } from '@/lib/home/map';

// Renders nothing until there is at least one active testimonial.
export default function Testimonials({ items }: { items: Testimonial[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  // Controls only matter when the cards do not all fit on screen.
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const check = () => setOverflowing((track.current?.scrollWidth ?? 0) > (track.current?.clientWidth ?? 0) + 4);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [items.length]);

  // Width of one card plus the gap, read from the DOM so it follows the breakpoint.
  const step = () => {
    const first = track.current?.children[0] as HTMLElement | undefined;
    const second = track.current?.children[1] as HTMLElement | undefined;
    return first ? (second ? second.offsetLeft - first.offsetLeft : first.offsetWidth) : 0;
  };
  const goTo = (i: number) => track.current?.scrollTo({ left: i * step(), behavior: 'smooth' });
  const onScroll = () => {
    const w = step();
    if (w) setActive(Math.min(items.length - 1, Math.round((track.current?.scrollLeft ?? 0) / w)));
  };
  // Next wraps to the first card, previous wraps to the last.
  const next = () => goTo(active >= items.length - 1 ? 0 : active + 1);
  const prev = () => goTo(active <= 0 ? items.length - 1 : active - 1);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="testimonials-heading" aria-roledescription="carousel" className="py-12 md:py-16 px-4" style={{ background: 'var(--sp-bg-secondary)' }}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 md:mb-8 flex items-end justify-between gap-4">
          <h2 id="testimonials-heading" className="font-bold"  style={{ color: 'var(--sp-text-primary)', fontSize: 'clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)' }}>
            What travellers say
          </h2>
          {items.length > 1 && overflowing && (
            <div className="hidden md:flex gap-2">
              <button type="button" onClick={prev} aria-label="Previous testimonial" className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: 'var(--sp-border)', color: 'var(--sp-text-primary)' }}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button type="button" onClick={next} aria-label="Next testimonial" className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: 'var(--sp-border)', color: 'var(--sp-text-primary)' }}>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}
        </div>
        <ul ref={track} onScroll={onScroll} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-6">
          {items.map((t, i) => {
            const initials = t.author_name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
            const stars = Math.min(5, Math.max(0, t.rating));
            return (
              <li key={t.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}`} className="w-full flex-shrink-0 snap-start sm:w-[calc(50%-0.5rem)] md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                <figure className="h-full flex flex-col rounded-xl border p-5" style={{ background: 'var(--sp-bg-card)', borderColor: 'var(--sp-border)' }}>
                  {stars > 0 && (
                    <div className="flex gap-0.5 mb-3" role="img" aria-label={`Rated ${stars} out of 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <FontAwesomeIcon key={n} icon={faStar} className="w-3.5 h-3.5" style={{ color: n <= stars ? 'var(--sp-primary)' : 'var(--sp-border)' }} />
                      ))}
                    </div>
                  )}
                  <blockquote className="flex-1 text-sm md:text-base leading-relaxed" style={{ color: 'var(--sp-text-primary)' }}>
                    {t.content}
                  </blockquote>
                  <figcaption className="flex items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--sp-border)' }}>
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold" style={{ background: 'var(--sp-primary-light)', color: 'var(--sp-primary)' }}>
                      {t.author_image_path
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={t.author_image_path} alt="" className="h-full w-full object-cover" loading="lazy" />
                        : initials}
                    </span>
                    <span className="min-w-0 text-sm">
                      <span className="block font-semibold truncate" style={{ color: 'var(--sp-text-primary)' }}>{t.author_name}</span>
                      {t.author_position && <span className="block truncate" style={{ color: 'var(--sp-text-secondary)' }}>{t.author_position}</span>}
                    </span>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
        {items.length > 1 && overflowing && (
          <div className="mt-4 flex justify-center gap-2">
            {items.map((t, i) => (
              <button key={t.id} type="button" onClick={() => goTo(i)} aria-label={`Show testimonial ${i + 1}`} aria-current={i === active} className="h-2 rounded-full transition-all" style={{ width: i === active ? 24 : 8, background: i === active ? 'var(--sp-primary)' : 'var(--sp-border)' }} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
