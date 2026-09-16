'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImages } from '@fortawesome/free-solid-svg-icons';
import MediaPickerModal from './MediaPickerModal';

const BRAND = '#139EA2';

interface Props {
  value: string;
  onChange: (url: string) => void;
  inputStyle?: React.CSSProperties;
  placeholder?: string;
}

export default function UrlWithPicker({ value, onChange, inputStyle, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={value}
          placeholder={placeholder ?? 'https://...'}
          onChange={e => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Choose from media library"
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80"
          style={{ background: `${BRAND}22`, color: BRAND, border: `1px solid ${BRAND}44` }}
        >
          <FontAwesomeIcon icon={faImages} className="w-3.5 h-3.5" />
        </button>
      </div>
      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={url => { onChange(url); setOpen(false); }}
      />
    </>
  );
}
