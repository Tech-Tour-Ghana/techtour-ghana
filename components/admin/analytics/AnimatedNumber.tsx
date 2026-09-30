'use client';

import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { EASE } from './motion';

/**
 * Counts up to `value` when it first arrives (and eases between values when a
 * new range loads). Formatting is applied on every frame so separators and the
 * currency symbol never jump. With reduced motion it just shows the final value.
 */
export default function AnimatedNumber({
  value,
  format,
  duration = 0.9,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: EASE,
      // Whole targets tick through whole numbers, fractional ones through
      // pesewas, so the formatting does not flip between frames.
      onUpdate: (v) => setShown(Number.isInteger(value) ? Math.round(v) : Math.round(v * 100) / 100),
      onComplete: () => {
        from.current = value;
      },
    });
    return () => {
      from.current = value;
      controls.stop();
    };
  }, [value, reduce, duration]);

  return <>{format(shown)}</>;
}
