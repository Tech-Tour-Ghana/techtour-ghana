'use client';

/** How a link to this page looks when shared on social media. */
export default function SocialPreview({ image, title, description, domain }: { image: string; title: string; description: string; domain: string }) {
  return (
    <div>
      <div className="overflow-hidden rounded-[var(--adm-radius-control)]" style={{ border: '1px solid var(--adm-border)', background: 'var(--adm-card)' }}>
        <div className="flex aspect-[1.91/1] items-center justify-center" style={{ background: 'var(--adm-track)' }}>
          {image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={image} alt="" className="h-full w-full object-cover" />
            : <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>No sharing image</span>}
        </div>
        <div className="p-3">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>{domain}</p>
          <p className="truncate text-sm font-bold" style={{ color: 'var(--adm-text)' }}>{title || 'Untitled'}</p>
          <p className="line-clamp-2 text-xs" style={{ color: 'var(--adm-text-2)' }}>{description}</p>
        </div>
      </div>
    </div>
  );
}
