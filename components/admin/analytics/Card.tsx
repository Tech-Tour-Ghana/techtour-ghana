'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

import { fadeVariants, panelVariants } from './motion';

/** Analytics card surface. Takes its entrance from the parent's stagger and lifts 2px on hover. */
export default function Card({
  children,
  className = '',
  variants = panelVariants,
  style,
  lift = true,
}: {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  style?: CSSProperties;
  lift?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={reduce ? fadeVariants : variants}
      whileHover={reduce || !lift ? undefined : { y: -2, transition: { duration: 0.18 } }}
      className={`rounded-[var(--adm-radius-card)] ${className}`}
      style={{
        background: 'var(--adm-card)',
        border: '1px solid var(--adm-border)',
        boxShadow: 'var(--adm-shadow)',
        color: 'var(--adm-text)',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
