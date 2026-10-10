'use client';

import { useEffect, useRef } from 'react';

/** Thin bar under the navbar showing how far down the article the reader is. Decorative, so hidden from assistive tech. */
export default function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(targetId);
      if (!el || !bar.current) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.5;
      const done = Math.min(1, Math.max(0, -rect.top / Math.max(total, 1)));
      bar.current.style.transform = `scaleX(${done})`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [targetId]);

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-[var(--nav-height,68px)] z-30 h-[3px]">
      <div ref={bar} className="h-full origin-left" style={{ background: 'var(--sp-primary)', transform: 'scaleX(0)' }} />
    </div>
  );
}
