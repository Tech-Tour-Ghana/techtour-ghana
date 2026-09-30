'use client';

// The per-content SEO form, shared by the blog editor, the destination editor
// and the blog category editor. Plain language first, technical term second.

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImages, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { ReactNode } from 'react';

import { fieldStyle } from '@/components/admin/ui';
import { isValidCanonical, type SeoFields } from '@/lib/seo/resolve';
import RobotsControl from './RobotsControl';

export type SeoImageField = 'og_image_url' | 'twitter_image_url';

interface Props {
  value: SeoFields;
  onChange: (patch: Partial<SeoFields>) => void;
  /** What is used when a field is left empty, shown as placeholders. */
  fallback: { title: string; description: string; image: string; canonicalPath: string };
  onPickImage: (field: SeoImageField) => void;
  hideFocus?: boolean;
}

const counter = (n: number, low: number, high: number) => ({
  text: `${n} characters`,
  color: n === 0 ? 'var(--adm-muted)' : n >= low && n <= high ? 'var(--adm-success)' : '#B45309',
});

function Field({ id, label, help, children, meta }: { id: string; label: string; help?: string; children: ReactNode; meta?: { text: string; color: string } }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>{label}</label>
        {meta && <span className="text-[11px] font-medium" style={{ color: meta.color }}>{meta.text}</span>}
      </div>
      {children}
      {help && <p className="mt-1 text-[11px]" style={{ color: 'var(--adm-muted)' }}>{help}</p>}
    </div>
  );
}

function ImageRow({ id, label, value, placeholder, onPick, onClear }: { id: string; label: string; value: string; placeholder: string; onPick: () => void; onClear: () => void }) {
  const shown = value || placeholder;
  return (
    <Field id={id} label={label}>
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md" style={{ background: 'var(--adm-track)' }}>
          {shown && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-cover" style={{ opacity: value ? 1 : 0.45 }} />
          )}
        </div>
        <button type="button" id={id} onClick={onPick} className="px-3 py-2 text-xs font-semibold" style={{ ...fieldStyle, color: 'var(--adm-primary)' }}>
          <FontAwesomeIcon icon={faImages} className="mr-1.5 h-3 w-3" />{value ? 'Change' : 'Choose'} image
        </button>
        {value && (
          <button type="button" onClick={onClear} aria-label={`Remove ${label}`} className="p-1" style={{ color: 'var(--adm-muted)' }}>
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {!value && placeholder && <p className="mt-1 text-[11px]" style={{ color: 'var(--adm-muted)' }}>Using the featured image (shown faded).</p>}
    </Field>
  );
}

export default function SEOEditor({ value, onChange, fallback, onPickImage, hideFocus = false }: Props) {
  const input = 'w-full px-3 py-2 text-sm';
  const canonicalOk = isValidCanonical(value.canonical_url.trim());

  return (
    <div className="space-y-4">
      <Field id="seo-title" label="SEO title" help="The headline shown in search results. Leave empty to use the article title." meta={counter((value.seo_title || fallback.title).length, 30, 65)}>
        <input id="seo-title" value={value.seo_title} placeholder={fallback.title} onChange={(e) => onChange({ seo_title: e.target.value })} className={input} style={fieldStyle} />
      </Field>
      <Field id="seo-desc" label="Meta description" help="The summary shown under the title in search results. About 140 to 160 characters works well." meta={counter((value.meta_description || fallback.description).length, 120, 170)}>
        <textarea id="seo-desc" rows={3} value={value.meta_description} placeholder={fallback.description} onChange={(e) => onChange({ meta_description: e.target.value })} className={input} style={fieldStyle} />
      </Field>
      {!hideFocus && (
        <Field id="seo-focus" label="Focus topic" help="The main thing people would search for, for example “Cape Coast Castle”. Only used for the checks here, it is not published.">
          <input id="seo-focus" value={value.focus_keyword} onChange={(e) => onChange({ focus_keyword: e.target.value })} className={input} style={fieldStyle} />
        </Field>
      )}
      <Field id="seo-canonical" label="Canonical URL" help="The preferred address search engines should use for this page. Leave empty unless the content also lives somewhere else.">
        <input
          id="seo-canonical"
          value={value.canonical_url}
          placeholder={fallback.canonicalPath}
          onChange={(e) => onChange({ canonical_url: e.target.value })}
          aria-invalid={!canonicalOk}
          className={input}
          style={{ ...fieldStyle, ...(canonicalOk ? {} : { borderColor: 'var(--adm-error)' }) }}
        />
        {!canonicalOk && <p role="alert" className="mt-1 text-[11px]" style={{ color: 'var(--adm-error)' }}>Enter a full web address (https://…) or a path starting with /.</p>}
      </Field>
      <RobotsControl index={value.robots_index} follow={value.robots_follow} onChange={onChange} />

      <details className="rounded-[var(--adm-radius-control)] p-3" style={{ border: '1px solid var(--adm-border)' }}>
        <summary className="cursor-pointer text-xs font-bold" style={{ color: 'var(--adm-text)' }}>Social sharing</summary>
        <div className="mt-3 space-y-4">
          <Field id="og-title" label="Sharing title" help="Facebook, LinkedIn, WhatsApp and similar. Empty uses the SEO title.">
            <input id="og-title" value={value.og_title} placeholder={value.seo_title || fallback.title} onChange={(e) => onChange({ og_title: e.target.value })} className={input} style={fieldStyle} />
          </Field>
          <Field id="og-desc" label="Sharing description" help="Empty uses the meta description.">
            <textarea id="og-desc" rows={2} value={value.og_description} placeholder={value.meta_description || fallback.description} onChange={(e) => onChange({ og_description: e.target.value })} className={input} style={fieldStyle} />
          </Field>
          <ImageRow id="og-image" label="Social sharing image" value={value.og_image_url} placeholder={fallback.image} onPick={() => onPickImage('og_image_url')} onClear={() => onChange({ og_image_url: '' })} />
          <p className="text-[11px] font-semibold" style={{ color: 'var(--adm-text-2)' }}>X (Twitter) overrides</p>
          <Field id="tw-title" label="X title" help="Empty uses the sharing title.">
            <input id="tw-title" value={value.twitter_title} onChange={(e) => onChange({ twitter_title: e.target.value })} className={input} style={fieldStyle} />
          </Field>
          <Field id="tw-desc" label="X description">
            <textarea id="tw-desc" rows={2} value={value.twitter_description} onChange={(e) => onChange({ twitter_description: e.target.value })} className={input} style={fieldStyle} />
          </Field>
          <ImageRow id="tw-image" label="X image" value={value.twitter_image_url} placeholder="" onPick={() => onPickImage('twitter_image_url')} onClear={() => onChange({ twitter_image_url: '' })} />
        </div>
      </details>
    </div>
  );
}
