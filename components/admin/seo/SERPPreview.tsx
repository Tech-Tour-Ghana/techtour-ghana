'use client';

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Approximate Google result. Google may rewrite titles and descriptions, so this is a guide only. */
export default function SERPPreview({ siteName, title, url, description }: { siteName: string; title: string; url: string; description: string }) {
  let host = url;
  let path = '';
  try {
    const u = new URL(url);
    host = u.host;
    path = u.pathname.replace(/\/$/, '').split('/').filter(Boolean).join(' › ');
  } catch { /* show the raw value */ }
  return (
    <div>
      <div className="rounded-[var(--adm-radius-control)] bg-white p-3 text-left" style={{ border: '1px solid var(--adm-border)' }}>
        <p className="truncate text-xs" style={{ color: '#202124' }}>{siteName} <span style={{ color: '#5f6368' }}>· {host}{path ? ` › ${path}` : ''}</span></p>
        <p className="mt-0.5 text-lg leading-snug" style={{ color: '#1a0dab' }}>{clip(title, 60) || 'Untitled'}</p>
        <p className="mt-0.5 text-[13px] leading-snug" style={{ color: '#4d5156' }}>{clip(description, 160) || 'No description. Search engines will pick text from the page.'}</p>
      </div>
      <p className="mt-1 text-[11px]" style={{ color: 'var(--adm-muted)' }}>Preview only. Search engines may show different text.</p>
    </div>
  );
}
