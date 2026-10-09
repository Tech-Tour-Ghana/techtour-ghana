'use client';

// Study destinations and scholarships. Both tables have admin write policies
// (0011) and sit in the trash (0029, 0030). Deleting a destination cascades to
// its scholarships (0006); applications only lose the link (0031).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { faEarthAfrica, faFileLines, faGraduationCap, faStar } from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import DestinationsPanel from '@/components/admin/study/DestinationsPanel';
import ScholarshipsPanel from '@/components/admin/study/ScholarshipsPanel';
import type { Destination, Scholarship } from '@/components/admin/study/shared';
import { StatTile, Tabs } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';

type Tab = 'destinations' | 'scholarships';

export default function AdminStudyPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [tab, setTab] = useState<Tab>('destinations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      supabase.from('study_destinations').select('*').order('sort_order').order('country_name'),
      supabase.from('scholarships').select('*').order('title'),
      supabase.from('study_applications').select('destination_id'),
    ]);
    setError(a.error || b.error || c.error ? 'Some study data could not be loaded. Please refresh.' : '');
    setDestinations(a.data ?? []);
    setScholarships(b.data ?? []);
    const counts: Record<string, number> = {};
    for (const row of c.data ?? []) if (row.destination_id) counts[row.destination_id] = (counts[row.destination_id] ?? 0) + 1;
    setApplications(counts);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const totalApps = Object.values(applications).reduce((n, v) => n + v, 0);
  const openScholarships = scholarships.filter((s) => s.is_active && s.deadline >= today).length;

  return (
    <AdminLayout title="Study Abroad" subtitle="Destinations and scholarships">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={faEarthAfrica} label="Active destinations" value={destinations.filter((d) => d.is_active).length} tone="info" />
        <StatTile icon={faGraduationCap} label="Open scholarships" value={openScholarships} tone="success" />
        <StatTile icon={faStar} label="Featured scholarships" value={scholarships.filter((s) => s.is_featured && s.is_active).length} tone="warning" />
        <StatTile icon={faFileLines} label="Applications received" value={totalApps} tone="neutral" />
      </div>

      <div className="mb-4 overflow-x-auto">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'destinations' as Tab, label: 'Destinations', count: destinations.length },
            { key: 'scholarships' as Tab, label: 'Scholarships', count: scholarships.length },
          ]}
        />
      </div>

      {error && <p role="alert" className="mb-4 rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>}

      {tab === 'destinations'
        ? <DestinationsPanel destinations={destinations} scholarships={scholarships} applications={applications} loading={loading} reload={load} />
        : <ScholarshipsPanel scholarships={scholarships} destinations={destinations} loading={loading} reload={load} />}
    </AdminLayout>
  );
}
