'use client';

// Customer testimonials shown in a section near the bottom of the homepage.
// Public reads active rows, admin writes (testimonials_*_admin policies, 0011).
// The table has no sort_order, so the homepage shows featured quotes first and
// then the newest.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { faCircleCheck, faQuoteLeft, faStar } from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import TestimonialsPanel, { type Testimonial } from '@/components/admin/testimonials/TestimonialsPanel';
import { StatTile } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AdminTestimonialsPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    setError(err ? 'Testimonials could not be loaded. Please refresh.' : '');
    setRows(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout title="Testimonials" subtitle="Customer quotes shown on the homepage">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile icon={faQuoteLeft} label="Total quotes" value={rows.length} tone="neutral" />
        <StatTile icon={faCircleCheck} label="Shown on the homepage" value={rows.filter((r) => r.is_active).length} tone="success" />
        <StatTile icon={faStar} label="Featured" value={rows.filter((r) => r.is_active && r.is_featured).length} tone="warning" />
      </div>

      {error && <p role="alert" className="mb-4 rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>}

      <TestimonialsPanel rows={rows} loading={loading} reload={load} />
    </AdminLayout>
  );
}
