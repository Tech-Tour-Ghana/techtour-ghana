'use client';

// Brand colours for the light and dark themes, with live contrast checks and a
// preview. Edits are held by the settings page and saved with its Save button.

import { useState } from 'react';

import { Card, Field } from '@/components/admin/settings/parts';
import { Button, fieldStyle } from '@/components/admin/ui';
import {
  THEME_DEFAULTS, THEME_KEYS, THEME_LABELS, checkPalette, diffFromDefaults, isHex, normaliseHex, onColor, paletteFor, themeVars,
  type DefaultTheme, type ThemeKey, type ThemeMode, type ThemeOverrides, type ThemePalette,
} from '@/lib/theme/tokens';

interface Props {
  overrides: ThemeOverrides;
  defaultTheme: DefaultTheme;
  onOverrides: (next: ThemeOverrides) => void;
  onDefaultTheme: (next: DefaultTheme) => void;
}

const MODES: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: 'Light theme' },
  { key: 'dark', label: 'Dark theme' },
];

function ColorRow({ id, k, value, fallback, onChange }: { id: string; k: ThemeKey; value: string; fallback: string; onChange: (hex: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;
  const invalid = draft !== null && !isHex(draft);
  const changed = normaliseHex(value) !== fallback;
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
      <input
        type="color"
        aria-label={`${THEME_LABELS[k].label} colour picker`}
        value={isHex(value) ? value.toLowerCase() : '#000000'}
        onChange={(e) => { setDraft(null); onChange(normaliseHex(e.target.value)); }}
        className="h-10 w-12 cursor-pointer rounded border p-0.5"
        style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-bg)' }}
      />
      <div className="min-w-0">
        <label htmlFor={id} className="block text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>{THEME_LABELS[k].label}</label>
        <input
          id={id}
          value={shown}
          maxLength={7}
          spellCheck={false}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
            setDraft(v);
            if (isHex(v)) { onChange(normaliseHex(v)); }
          }}
          onBlur={() => setDraft(null)}
          className="mt-0.5 w-28 rounded border px-2 py-1 font-mono text-xs uppercase"
          style={{ ...fieldStyle, borderColor: invalid ? 'var(--adm-error)' : undefined }}
        />
        <span className="ml-2 text-[11px]" style={{ color: 'var(--adm-muted)' }}>{THEME_LABELS[k].hint}</span>
      </div>
      <button type="button" disabled={!changed} onClick={() => { setDraft(null); onChange(fallback); }} className="text-xs font-semibold underline disabled:opacity-30" style={{ color: 'var(--adm-text-2)' }}>
        Reset
      </button>
    </div>
  );
}

function Preview({ mode, palette }: { mode: ThemeMode; palette: ThemePalette }) {
  const vars = themeVars(mode, palette);
  const style = Object.fromEntries(Object.entries(vars)) as React.CSSProperties;
  return (
    <div className="overflow-hidden rounded-xl border" style={{ ...style, borderColor: 'var(--adm-border)', background: palette.background, color: palette.text }} aria-label={`${mode} theme preview`} role="img">
      <div className="px-4 py-3" style={{ background: `linear-gradient(135deg, ${vars['--sp-hero-from']}, ${vars['--sp-hero-to']})`, color: '#FFFFFF' }}>
        <p className="text-sm font-bold">Page header band</p>
        <p className="text-xs opacity-95">White text on the brand shades</p>
      </div>
      <div className="space-y-2 p-4" style={{ background: palette.background }}>
        <p className="text-sm font-bold" style={{ color: palette.text }}>Heading text</p>
        <p className="text-xs" style={{ color: palette.textSecondary }}>Body text sits here and describes things in a sentence or two.</p>
        <p className="text-[11px]" style={{ color: palette.muted }}>Muted caption, 12 October 2026</p>
        <div className="rounded-lg p-3" style={{ background: palette.card, border: `1px solid ${palette.primary}33` }}>
          <p className="text-xs font-semibold" style={{ color: palette.text }}>Card</p>
          <p className="text-[11px]" style={{ color: palette.primary }}>Brand colour link</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: palette.primary, color: onColor(palette.primary) }}>Button</span>
          <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: palette.accent, color: onColor(palette.accent) }}>Accent</span>
        </div>
      </div>
      <div className="px-4 py-2" style={{ background: palette.backgroundAlt }}>
        <p className="text-[11px]" style={{ color: palette.textSecondary }}>Alternate section</p>
      </div>
    </div>
  );
}

export default function BrandColors({ overrides, defaultTheme, onOverrides, onDefaultTheme }: Props) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const palette = paletteFor(mode, overrides);
  const checks = checkPalette(palette, mode);
  const failing = checks.filter((c) => !c.pass);

  const setColor = (k: ThemeKey, hex: string) => {
    const next: ThemePalette = { ...palette, [k]: hex };
    const diff = diffFromDefaults(mode, next);
    const merged = { ...overrides };
    if (Object.keys(diff).length) merged[mode] = diff; else delete merged[mode];
    onOverrides(merged);
  };
  const resetMode = () => {
    const merged = { ...overrides };
    delete merged[mode];
    onOverrides(merged);
  };

  return (
    <>
      <Card title="Default theme" description="What first-time visitors see. People who pick Light or Dark with the switch in the menu keep their own choice.">
        <Field id="default-theme" label="Show first-time visitors">
          <select id="default-theme" className="w-full rounded-lg border px-3 py-2 text-sm" style={fieldStyle} value={defaultTheme} onChange={(e) => onDefaultTheme(e.target.value as DefaultTheme)}>
            <option value="system">Their device setting (recommended)</option>
            <option value="light">Light theme</option>
            <option value="dark">Dark theme</option>
          </select>
        </Field>
      </Card>

      <Card title="Brand colours" description="Colours apply to the whole public site and the customer area: pages, buttons, header, footer, market and account pages. Changes go live when you save. The admin area keeps its own look.">
        <div role="tablist" aria-label="Theme" className="flex gap-2">
          {MODES.map((m) => (
            <button key={m.key} role="tab" aria-selected={mode === m.key} type="button" onClick={() => setMode(m.key)} className="rounded-full border px-4 py-1.5 text-xs font-semibold" style={{ borderColor: 'var(--adm-border)', background: mode === m.key ? 'var(--adm-text)' : 'transparent', color: mode === m.key ? 'var(--adm-bg)' : 'var(--adm-text-2)' }}>
              {m.label}{overrides[m.key] ? ' (customised)' : ''}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-3">
            {THEME_KEYS.map((k) => (
              <ColorRow key={`${mode}-${k}`} id={`brand-${mode}-${k}`} k={k} value={palette[k]} fallback={THEME_DEFAULTS[mode][k]} onChange={(hex) => setColor(k, hex)} />
            ))}
            <div className="pt-2">
              <Button variant="secondary" onClick={resetMode} disabled={!overrides[mode]}>Reset {mode === 'light' ? 'light' : 'dark'} theme to defaults</Button>
            </div>
          </div>
          <Preview mode={mode} palette={palette} />
        </div>
      </Card>

      <Card title="Readability check" description="Text must be at least 4.5 to 1 against its background (WCAG AA). You cannot save while a check fails.">
        <p role="status" className="text-sm font-semibold" style={{ color: failing.length ? 'var(--adm-error)' : 'var(--adm-success)' }}>
          {failing.length ? `${failing.length} of ${checks.length} checks fail in the ${mode} theme.` : `All ${checks.length} checks pass in the ${mode} theme.`}
        </p>
        <ul className="mt-2 divide-y text-xs" style={{ borderColor: 'var(--adm-border)' }}>
          {checks.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2" style={{ borderColor: 'var(--adm-border)' }}>
              <span aria-hidden className="inline-flex h-7 w-10 flex-shrink-0 items-center justify-center rounded text-[11px] font-bold" style={{ background: c.bg, color: c.fg, border: '1px solid var(--adm-border)' }}>Aa</span>
              <span className="min-w-0 flex-1" style={{ color: 'var(--adm-text)' }}>{c.label}</span>
              <span className="font-mono" style={{ color: c.pass ? 'var(--adm-success)' : 'var(--adm-error)' }}>{c.ratio.toFixed(2)} : 1 {c.pass ? 'Pass' : 'Fail'}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
