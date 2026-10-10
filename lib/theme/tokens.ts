// Brand colours for both themes. Pure functions only (no server imports) so the
// admin editor, the root layout and tests share one definition.
//
// Only colours an admin changed are stored. buildThemeCss() turns them into CSS
// custom properties that override the built-in palette, and emits nothing at all
// when nothing was changed.

export const THEME_KEYS = ['primary', 'primaryDark', 'accent', 'background', 'backgroundAlt', 'card', 'text', 'textSecondary', 'muted'] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];
export type ThemePalette = Record<ThemeKey, string>;
export type ThemeMode = 'light' | 'dark';
export type ThemeOverrides = Partial<Record<ThemeMode, Partial<ThemePalette>>>;

export const THEME_LABELS: Record<ThemeKey, { label: string; hint: string }> = {
  primary: { label: 'Brand colour', hint: 'Buttons, links, highlights.' },
  primaryDark: { label: 'Brand colour, dark shade', hint: 'Hover states and header bands.' },
  accent: { label: 'Accent colour', hint: 'Secondary highlights and badges.' },
  background: { label: 'Page background', hint: 'Behind everything.' },
  backgroundAlt: { label: 'Alternate section background', hint: 'Every second section on a page.' },
  card: { label: 'Card background', hint: 'Cards, forms and menus.' },
  text: { label: 'Heading text', hint: 'Titles and main text.' },
  textSecondary: { label: 'Body text', hint: 'Paragraphs and descriptions.' },
  muted: { label: 'Muted text', hint: 'Captions, dates and small print.' },
};

// What the site ships with. These match components/ServiceTheme.tsx.
export const THEME_DEFAULTS: Record<ThemeMode, ThemePalette> = {
  light: {
    primary: '#0D7A7D', primaryDark: '#0A5F62', accent: '#E6A64D',
    background: '#F9F9F9', backgroundAlt: '#FFFFFF', card: '#FFFFFF',
    text: '#1A1A2E', textSecondary: '#4A4A4A', muted: '#6B7280',
  },
  dark: {
    primary: '#E6A64D', primaryDark: '#D4953A', accent: '#139EA2',
    background: '#0A0A0A', backgroundAlt: '#0F0F0F', card: '#1A1A1A',
    text: '#FFFFFF', textSecondary: '#B0B0B0', muted: '#9CA3AF',
  },
};

export type DefaultTheme = 'system' | 'light' | 'dark';
export const isDefaultTheme = (v: unknown): v is DefaultTheme => v === 'system' || v === 'light' || v === 'dark';

const HEX = /^#[0-9a-fA-F]{6}$/;
export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);
export const normaliseHex = (v: string) => v.trim().toUpperCase();

/** Keep only known keys with valid hex values. Anything else in the JSON is dropped. */
export function cleanOverrides(raw: unknown): ThemeOverrides {
  const out: ThemeOverrides = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const mode of ['light', 'dark'] as const) {
    const src = (raw as Record<string, unknown>)[mode];
    if (!src || typeof src !== 'object') continue;
    const picked: Partial<ThemePalette> = {};
    for (const key of THEME_KEYS) {
      const v = (src as Record<string, unknown>)[key];
      if (isHex(v)) picked[key] = normaliseHex(v);
    }
    if (Object.keys(picked).length) out[mode] = picked;
  }
  return out;
}

export const paletteFor = (mode: ThemeMode, overrides: ThemeOverrides): ThemePalette => ({ ...THEME_DEFAULTS[mode], ...(overrides[mode] ?? {}) });

/** Store only what differs from the defaults. */
export function diffFromDefaults(mode: ThemeMode, palette: ThemePalette): Partial<ThemePalette> {
  const out: Partial<ThemePalette> = {};
  for (const key of THEME_KEYS) if (normaliseHex(palette[key]) !== THEME_DEFAULTS[mode][key]) out[key] = normaliseHex(palette[key]);
  return out;
}

// ---- Contrast (WCAG 2.x) -------------------------------------------------

type Rgb = [number, number, number];
const toRgb = (hex: string): Rgb => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const toHex = ([r, g, b]: Rgb) => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

export function luminance(hex: string): number {
  const f = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = toRgb(hex);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** White or near-black, whichever reads better on this colour. */
export const onColor = (bg: string) => (contrast('#FFFFFF', bg) >= contrast('#1A1A2E', bg) ? '#FFFFFF' : '#1A1A2E');

/** Nudge a colour towards black or white until it reaches the ratio against `bg`. */
export function ensureContrast(fg: string, bg: string, min = 4.5): string {
  if (contrast(fg, bg) >= min) return fg;
  const towards: Rgb = luminance(bg) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  const base = toRgb(fg);
  for (let t = 0.05; t <= 1.001; t += 0.05) {
    const mixed = toHex([base[0] + (towards[0] - base[0]) * t, base[1] + (towards[1] - base[1]) * t, base[2] + (towards[2] - base[2]) * t]);
    if (contrast(mixed, bg) >= min) return mixed;
  }
  return toHex(towards);
}

/** Blend `a` towards `b` by t (0 to 1). */
export function mix(a: string, b: string, t: number): string {
  const x = toRgb(a), y = toRgb(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

/** Status colours. Not part of the brand palette, so they do not change with it, but they live here so no component hard-codes them. */
export const SEMANTIC = { success: '#10B981', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6', purple: '#8B5CF6' } as const;

export interface ContrastCheck { id: string; label: string; fg: string; bg: string; min: number; ratio: number; pass: boolean }

/** The pairs that must pass for the theme to be readable. */
export function checkPalette(p: ThemePalette, mode: ThemeMode): ContrastCheck[] {
  const pairs: Omit<ContrastCheck, 'ratio' | 'pass'>[] = [
    { id: 'text-bg', label: 'Heading text on page background', fg: p.text, bg: p.background, min: 4.5 },
    { id: 'text-card', label: 'Heading text on cards', fg: p.text, bg: p.card, min: 4.5 },
    { id: 'body-bg', label: 'Body text on page background', fg: p.textSecondary, bg: p.background, min: 4.5 },
    { id: 'body-card', label: 'Body text on cards', fg: p.textSecondary, bg: p.card, min: 4.5 },
    { id: 'body-alt', label: 'Body text on alternate sections', fg: p.textSecondary, bg: p.backgroundAlt, min: 4.5 },
    { id: 'muted-bg', label: 'Muted text on page background', fg: p.muted, bg: p.background, min: 4.5 },
    { id: 'muted-card', label: 'Muted text on cards', fg: p.muted, bg: p.card, min: 4.5 },
    { id: 'primary-bg', label: 'Brand colour as text on page background', fg: p.primary, bg: p.background, min: 4.5 },
    { id: 'primary-card', label: 'Brand colour as text on cards', fg: p.primary, bg: p.card, min: 4.5 },
    { id: 'on-primary', label: 'Button text on brand colour', fg: mode === 'light' ? '#FFFFFF' : onColor(p.primary), bg: p.primary, min: 4.5 },
    ...(mode === 'light' ? [{ id: 'on-primary-dark', label: 'White text on the dark brand shade (header bands)', fg: '#FFFFFF', bg: p.primaryDark, min: 4.5 }] : []),
  ];
  return pairs.map((c) => { const ratio = contrast(c.fg, c.bg); return { ...c, ratio, pass: ratio >= c.min }; });
}

/** Header band gradient. Light themes use the brand shades, dark themes a darkened accent so white text always reads. */
export function heroColors(mode: ThemeMode, p: ThemePalette): { from: string; to: string } {
  if (mode === 'light') return { from: p.primary, to: p.primaryDark };
  const from = ensureContrast(p.accent, '#FFFFFF');
  const [r, g, b] = toRgb(from);
  return { from, to: toHex([r * 0.75, g * 0.75, b * 0.75]) };
}

// ---- CSS -----------------------------------------------------------------

const rgbTriplet = (hex: string) => toRgb(hex).join(', ');

/** Variables for one theme. Every layer of the site (pages, navbar, footer, JS palettes) reads these. */
export function themeVars(mode: ThemeMode, p: ThemePalette): Record<string, string> {
  const dark = mode === 'dark';
  const rgb = rgbTriplet(p.primary);
  const accentRgb = rgbTriplet(p.accent);
  const hero = heroColors(mode, p);
  // Accent text is the "gold" colour made readable on cards (sale prices, small highlights).
  const accentText = ensureContrast(dark ? p.primary : p.accent, p.card);
  const line = mix(p.card, p.text, dark ? 0.08 : 0.1);
  const subtle = mix(p.background, p.text, dark ? 0.08 : 0.05);
  const teal = dark ? p.accent : p.primary;
  const gold = dark ? p.primary : p.accent;
  const tealDark = dark ? hero.to : p.primaryDark;
  const goldDark = dark ? p.primaryDark : mix(p.accent, '#000000', 0.08);
  const channels: Record<string, string> = {
    text: p.text, 'text-2': p.textSecondary, muted: p.muted, line, subtle, bg: p.background, card: p.card,
    teal, gold, white: '#FFFFFF', black: '#000000', ink: '#1A1A2E', ...SEMANTIC,
  };
  const extra: Record<string, string> = {
    '--brand-line': line, '--brand-subtle': subtle, '--brand-white': '#FFFFFF', '--brand-black': '#000000', '--brand-ink': '#1A1A2E',
    '--brand-teal-dark': tealDark, '--brand-gold-dark': goldDark,
  };
  for (const [name, hex] of Object.entries(channels)) extra[`--brand-${name}-rgb`] = rgbTriplet(hex);
  for (const [name, hex] of Object.entries(SEMANTIC)) {
    extra[`--brand-${name}`] = hex;
    extra[`--brand-${name}-text`] = ensureContrast(hex, p.card);
  }
  return {
    ...extra,
    '--brand-primary': p.primary, '--brand-primary-dark': p.primaryDark, '--brand-accent': p.accent, '--brand-accent-text': accentText,
    '--brand-bg': p.background, '--brand-bg-alt': p.backgroundAlt, '--brand-card': p.card,
    '--brand-text': p.text, '--brand-text-2': p.textSecondary, '--brand-muted': p.muted,
    '--brand-on-primary': onColor(p.primary),
    '--brand-teal': dark ? p.accent : p.primary, '--brand-gold': dark ? p.primary : p.accent,
    '--brand-primary-rgb': rgb, '--brand-accent-rgb': accentRgb,
    '--sp-bg-primary': p.background, '--sp-bg-secondary': p.backgroundAlt, '--sp-bg-card': p.card, '--sp-bg-card-hover': dark ? mix(p.card, p.text, 0.04) : p.background, '--sp-bg-input': p.card, '--sp-bg-elevated': p.card,
    '--sp-text-primary': p.text, '--sp-text-secondary': p.textSecondary, '--sp-text-muted': p.muted, '--sp-text-subtle': p.muted,
    '--sp-primary': p.primary, '--sp-primary-dark': p.primaryDark, '--sp-primary-light': `rgba(${rgb}, ${dark ? 0.15 : 0.08})`,
    '--sp-accent': p.accent, '--sp-accent-dark': p.accent, '--sp-accent-light': `rgba(${accentRgb}, 0.15)`, '--sp-accent-text': accentText,
    '--sp-on-primary': onColor(p.primary), '--sp-hero-from': hero.from, '--sp-hero-to': hero.to, '--sp-hero-accent': ensureContrast('#F5C875', hero.from, 3),
    '--sp-shadow-sm': dark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : `0 4px 12px rgba(${rgb}, 0.05)`,
    '--sp-shadow-md': dark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : `0 8px 24px rgba(${rgb}, 0.08)`,
    '--sp-shadow-lg': dark ? '0 20px 40px rgba(0, 0, 0, 0.5)' : `0 20px 40px rgba(${rgb}, 0.15)`,
    '--sp-tag-bg': dark ? 'rgba(255, 255, 255, 0.05)' : p.background,
    '--sp-tag-border': dark ? 'rgba(255, 255, 255, 0.05)' : `rgba(${rgb}, 0.06)`,
    '--sp-tag-text': p.textSecondary,
    '--sp-overlay-gradient': dark
      ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 40%, rgba(0, 0, 0, 0.7) 100%)'
      : 'linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.05) 40%, rgba(0, 0, 0, 0.5) 100%)',
    '--sp-border': `rgba(${rgb}, ${dark ? 0.1 : 0.08})`, '--sp-border-hover': `rgba(${rgb}, ${dark ? 0.25 : 0.2})`, '--sp-border-strong': `rgba(${rgb}, 0.15)`,
    '--primary': p.primary, '--primary-dark': p.primaryDark, '--primary-light': `rgba(${rgb}, 0.1)`,
    '--text': p.text, '--text-light': p.textSecondary, '--bg-solid': dark ? p.background : p.card, '--border': `rgba(${rgb}, 0.15)`,
    '--footer-bg': dark ? p.background : p.card, '--footer-text': p.text, '--footer-text-secondary': p.textSecondary, '--footer-text-muted': p.muted,
    '--footer-primary': p.primary, '--footer-primary-dark': p.primaryDark, '--footer-primary-light': `rgba(${rgb}, 0.1)`,
  };
}

const block = (selector: string, vars: Record<string, string>) => `${selector}{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}`;

/**
 * The theme stylesheet: both themes, built from the built-in palette plus any
 * overrides saved in Admin > Settings > Branding. This is the single source of
 * the brand variables, so no stylesheet or component needs its own copy of a colour.
 * Selectors are more specific than the built-in `:root` and `[data-theme]` rules.
 */
export function buildThemeCss(overrides: ThemeOverrides): string {
  const parts: string[] = [];
  const light = paletteFor('light', overrides);
  parts.push(block(':root,html:not([data-theme]),html[data-theme="bright"]', themeVars('light', light)));
  parts.push(`html:not([data-theme]) body,html[data-theme="bright"] body{background-color:${light.background};color:${light.text}}`);
  const dark = paletteFor('dark', overrides);
  parts.push(block('html[data-theme="dim"],html[data-theme="dark"]', themeVars('dark', dark)));
  parts.push(`html[data-theme="dim"] body,html[data-theme="dark"] body{background-color:${dark.background};color:${dark.text}}`);
  return parts.join('\n');
}
