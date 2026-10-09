'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { inputClass, useAccountTheme } from './AccountShell';

export default function PasswordInput({ id, label, value, onChange, autoComplete }: {
  id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string;
}) {
  const t = useAccountTheme();
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: t.textSecondary }}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className={`${inputClass} pr-11`}
          style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={show}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
          style={{ color: t.textSecondary }}
        >
          <FontAwesomeIcon icon={show ? faEyeSlash : faEye} />
        </button>
      </div>
    </div>
  );
}
