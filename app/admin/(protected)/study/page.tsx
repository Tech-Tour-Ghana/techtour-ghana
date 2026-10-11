'use client';

// Study abroad content: destinations (countries), partner institutions,
// programmes and scholarships. Students apply to a programme at a partner
// institution; TechTour handles the application for them (see Study Applications).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { faBuildingColumns, faEarthAfrica, faFileLines, faGraduationCap, faStar } from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import DestinationsPanel from '@/components/admin/study/DestinationsPanel';
import InstitutionsPanel, { type Institution } from '@/components/admin/study/InstitutionsPanel';
import ProgramsPanel, { type Program } from '@/components/admin/study/ProgramsPanel';
import ScholarshipsPanel from '@/components/admin/study/ScholarshipsPanel';
import type { Destination, Scholarship } from '@/components/admin/study/shared';
import { StatTile, Tabs } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';

type Tab = 'destinations' | 'institutions' | 'programs' | 'scholarships';

export default function AdminStudyPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [tab, setTab] = useState<Tab>('institutions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [applications, setApplications] = useState<Record<string, number>>({});
  const [programApps, setProgramApps] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const [a, b, c, d, e] = await Promise.all([
      supabase.from('study_destinations').select('*').order('sort_order').order('country_name'),
      supabase.from('scholarships').select('*').order('title'),
      supabase.from('study_applications').select('destination_id, program_id'),
      supabase.from('study_institutions').select('*').order('sort_order').order('name'),
      supabase.from('study_programs').select('*').order('sort_order').order('title'),
    ]);
    setError(a.error || b.error || c.error || d.error || e.error ? 'Some study data could not be loaded. Please refresh.' : '');
    setDestinations(a.data ?? []);
    setScholarships(b.data ?? []);
    setInstitutions(d.data ?? []);
    setPrograms(e.data ?? []);
    const counts: Record<string, number> = {};
    const byProgram: Record<string, number> = {};
    for (const row of c.data ?? []) {
      if (row.destination_id) counts[row.destination_id] = (counts[row.destination_id] ?? 0) + 1;
      if (row.program_id) byProgram[row.program_id] = (byProgram[row.program_id] ?? 0) + 1;
    }
    setApplications(counts);
    setProgramApps(byProgram);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const totalApps = Object.values(applications).reduce((n, v) => n + v, 0);
  const openScholarships = scholarships.filter((s) => s.is_active && s.deadline >= today).length;
  const programCounts: Record<string, number> = {};
  for (const p of programs) programCounts[p.institution_id] = (programCounts[p.institution_id] ?? 0) + 1;

  return (
    <AdminLayout title="Study Abroad" subtitle="Countries, partner universities, programmes and scholarships">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={faEarthAfrica} label="Active destinations" value={destinations.filter((d) => d.is_active).length} tone="info" />
        <StatTile icon={faBuildingColumns} label="Partner institutions" value={institutions.filter((i) => i.is_active).length} tone="success" />
        <StatTile icon={faGraduationCap} label="Open scholarships" value={openScholarships} tone="warning" />
        <StatTile icon={faFileLines} label="Applications received" value={totalApps} tone="neutral" />
      </div>

      <div className="mb-4 overflow-x-auto">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'institutions' as Tab, label: 'Institutions', count: institutions.length },
            { key: 'programs' as Tab, label: 'Programmes', count: programs.length },
            { key: 'destinations' as Tab, label: 'Destinations', count: destinations.length },
            { key: 'scholarships' as Tab, label: 'Scholarships', count: scholarships.length },
          ]}
        />
      </div>

      {error && <p role="alert" className="mb-4 rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>}

      {tab === 'institutions' && <InstitutionsPanel institutions={institutions} destinations={destinations} programCounts={programCounts} loading={loading} reload={load} />}
      {tab === 'programs' && <ProgramsPanel programs={programs} institutions={institutions} applicationCounts={programApps} loading={loading} reload={load} />}
      {tab === 'destinations' && <DestinationsPanel destinations={destinations} scholarships={scholarships} applications={applications} loading={loading} reload={load} />}
      {tab === 'scholarships' && <ScholarshipsPanel scholarships={scholarships} destinations={destinations} loading={loading} reload={load} />}
    </AdminLayout>
  );
}
