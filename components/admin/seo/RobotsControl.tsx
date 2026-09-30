'use client';

import { fieldStyle } from '@/components/admin/ui';

export default function RobotsControl({
  index,
  follow,
  onChange,
}: {
  index: boolean;
  follow: boolean;
  onChange: (patch: { robots_index?: boolean; robots_follow?: boolean }) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="robots-index" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Search visibility</label>
        <select id="robots-index" value={index ? 'index' : 'noindex'} onChange={(e) => onChange({ robots_index: e.target.value === 'index' })} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
          <option value="index">Show in search results</option>
          <option value="noindex">Hide from search results (noindex)</option>
        </select>
      </div>
      <div>
        <label htmlFor="robots-follow" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Links on this page</label>
        <select id="robots-follow" value={follow ? 'follow' : 'nofollow'} onChange={(e) => onChange({ robots_follow: e.target.value === 'follow' })} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
          <option value="follow">Let search engines follow them</option>
          <option value="nofollow">Do not follow them (nofollow)</option>
        </select>
      </div>
    </div>
  );
}
