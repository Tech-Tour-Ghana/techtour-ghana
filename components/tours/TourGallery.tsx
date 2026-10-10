'use client';

import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faImage } from '@fortawesome/free-solid-svg-icons';

/** Swipeable photo strip with a counter and thumbnails. Scroll-snap, so touch works natively. */
export default function TourGallery({ images, title }: { images: string[]; title: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const list = images;

  function go(i: number) {
    const el = track.current;
    if (!el) return;
    const next = (i + list.length) % list.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    setIndex(next);
  }

  // No photos yet: a short branded banner instead of an empty grey block.
  if (list.length === 0) {
    return (
      <div className="flex aspect-[16/6] items-center justify-center gap-3 rounded-3xl text-sm font-medium" style={{ background: 'linear-gradient(135deg, var(--sp-hero-from, var(--brand-primary)), var(--sp-hero-to, var(--brand-primary-dark)))', color: 'var(--brand-white)' }}>
        <FontAwesomeIcon icon={faImage} className="h-5 w-5" aria-hidden="true" />
        Photos coming soon
      </div>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl" style={{ background: 'var(--sp-border)' }}>
        <ul ref={track} onScroll={(e) => { const el = e.currentTarget; setIndex(Math.round(el.scrollLeft / el.clientWidth)); }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {list.map((src, i) => (
            <li key={`${src}-${i}`} className="aspect-[4/3] w-full flex-shrink-0 snap-center sm:aspect-[16/10]">
              {src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={`${title} photo ${i + 1}`} className="h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : undefined} draggable={false} />
              )}
            </li>
          ))}
        </ul>
        {list.length > 1 && (
          <>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">{index + 1} / {list.length}</span>
            <button type="button" aria-label="Previous photo" onClick={() => go(index - 1)} className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow sm:flex"><FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label="Next photo" onClick={() => go(index + 1)} className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow sm:flex"><FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" /></button>
          </>
        )}
      </div>
      {list.length > 1 && (
        <ul className="mt-3 hidden gap-2 overflow-x-auto sm:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {list.map((src, i) => (
            <li key={`t-${src}-${i}`}>
              <button type="button" onClick={() => go(i)} aria-label={`Show photo ${i + 1}`} className="h-16 w-24 overflow-hidden rounded-xl"
                style={{ outline: i === index ? '2px solid var(--sp-primary)' : '1px solid var(--sp-border)', outlineOffset: 1, opacity: i === index ? 1 : 0.7 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${title} photo ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
