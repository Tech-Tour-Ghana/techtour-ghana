'use client';

// The one button for the public site and dashboards. Renders a <button>, or a
// link when `href` is given, and ends in the circled arrow unless `arrow={false}`.
// Use it for actions with a text label. Icon-only controls (close, menu, toggle,
// tabs, filter chips) stay plain elements.

import Link from 'next/link';
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type ButtonVariant = 'primary' | 'accent' | 'gold' | 'secondary' | 'onDark' | 'light' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const TEAL = 'var(--sp-primary, #139EA2)';

// bg/fg style the pill, dot/dotFg style the arrow circle.
const VARIANTS: Record<ButtonVariant, { pill: CSSProperties; dot: string; dotFg: string }> = {
  primary: { pill: { background: 'linear-gradient(180deg, #2b2b2b 0%, #0b0b0b 100%)', color: '#fff' }, dot: '#fff', dotFg: '#000' },
  accent: { pill: { background: TEAL, color: '#fff' }, dot: '#fff', dotFg: '#0b0b0b' },
  gold: { pill: { background: '#E6A64D', color: '#1A1A2E' }, dot: '#1A1A2E', dotFg: '#fff' },
  onDark: { pill: { background: 'rgba(255,255,255,0.1)', color: '#fff', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.4)' }, dot: '#fff', dotFg: '#0b0b0b' },
  secondary: { pill: { background: 'transparent', color: 'inherit', boxShadow: 'inset 0 0 0 1.5px currentColor' }, dot: '#0b0b0b', dotFg: '#fff' },
  light: { pill: { background: '#fff', color: '#0b0b0b' }, dot: '#0b0b0b', dotFg: '#fff' },
  danger: { pill: { background: '#DC2626', color: '#fff' }, dot: '#fff', dotFg: '#DC2626' },
};

const SIZES: Record<ButtonSize, { pill: string; dot: string; icon: string }> = {
  sm: { pill: 'min-h-[2.25rem] py-1 pl-4 pr-1 text-xs', dot: 'h-6 w-6', icon: 'h-2.5 w-2.5' },
  md: { pill: 'min-h-[2.75rem] py-1.5 pl-5 pr-1.5 text-sm', dot: 'h-8 w-8', icon: 'h-3 w-3' },
  lg: { pill: 'min-h-[3.25rem] py-2 pl-6 pr-2 text-base', dot: 'h-9 w-9', icon: 'h-3.5 w-3.5' },
};

interface Common {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show the circled arrow. Default true. */
  arrow?: boolean;
  /** Stretch to the full width of the parent. */
  full?: boolean;
  /** Leading icon before the label. */
  icon?: IconDefinition;
  loading?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}
type AsButton = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Common> & { href?: undefined };
type AsLink = Common & { href: string; target?: string; rel?: string; onClick?: () => void; 'aria-label'?: string; disabled?: boolean };

export default function Button(props: AsButton | AsLink) {
  const { variant = 'primary', size = 'md', arrow = true, full, icon, loading, className = '', style, children } = props;
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const off = props.disabled || loading;
  const cls = `group inline-flex items-center ${arrow ? 'justify-between' : 'justify-center px-5'} gap-3 rounded-full font-semibold leading-none transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${off ? 'pointer-events-none opacity-60' : ''} ${full ? 'w-full' : ''} ${arrow ? s.pill : s.pill.replace(/pl-\d+ pr-[\d.]+/, '')} ${className}`;
  const body = (
    <>
      <span className="flex items-center gap-2">
        {icon && <FontAwesomeIcon icon={icon} className={s.icon} />}
        {children}
      </span>
      {arrow && (
        <span aria-hidden className={`inline-flex ${s.dot} flex-shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5`} style={{ background: v.dot, color: v.dotFg }}>
          <FontAwesomeIcon icon={loading ? faSpinner : faArrowRight} spin={!!loading} className={`${s.icon} ${loading ? '' : '-rotate-45'}`} />
        </span>
      )}
    </>
  );
  const css = { ...v.pill, ...style };

  if (props.href !== undefined) {
    const { href, target, rel, onClick } = props;
    const ariaLabel = props['aria-label'];
    return /^(https?:|mailto:|tel:)/.test(href)
      ? <a href={href} target={target} rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)} onClick={onClick} aria-label={ariaLabel} className={cls} style={css}>{body}</a>
      : <Link href={href} target={target} rel={rel} onClick={onClick} aria-label={ariaLabel} className={cls} style={css}>{body}</Link>;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _v, size: _s, arrow: _a, full: _f, icon: _i, loading: _l, className: _c, style: _st, children: _ch, href: _h, type = 'button', ...rest } = props;
  return <button type={type} {...rest} disabled={off} aria-busy={loading || undefined} className={cls} style={css}>{body}</button>;
}
