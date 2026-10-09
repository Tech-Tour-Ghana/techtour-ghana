'use client';

// Team members, job openings and job categories. All three tables have admin
// write policies (0011, 0012) and are covered by Trash (0030). Openings have
// optional level, tags, responsibilities and benefits columns from 0035.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { faBriefcase, faTags, faUsers } from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import CategoriesPanel from '@/components/admin/team/CategoriesPanel';
import MembersPanel from '@/components/admin/team/MembersPanel';
import OpeningsPanel from '@/components/admin/team/OpeningsPanel';
import type { JobCategory, Member, Opening } from '@/components/admin/team/shared';
import { StatTile, Tabs } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';

type Tab = 'team' | 'jobs' | 'categories';

export default function AdminTeamPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [tab, setTab] = useState<Tab>('team');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      supabase.from('team_members').select('*').order('sort_order').order('name'),
      supabase.from('job_categories').select('*').order('sort_order').order('name'),
      supabase.from('job_openings').select('*').order('created_at', { ascending: false }),
    ]);
    setError(a.error || b.error || c.error ? 'Some team data could not be loaded. Please refresh.' : '');
    setMembers(a.data ?? []);
    setCategories(b.data ?? []);
    setOpenings(c.data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const openRoles = openings.filter((o) => o.is_active && (!o.closing_date || o.closing_date >= today)).length;

  return (
    <AdminLayout title="Team & Careers" subtitle="Team members, job openings and categories">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile icon={faUsers} label="Team members on the site" value={members.filter((m) => m.is_active).length} tone="info" />
        <StatTile icon={faBriefcase} label="Roles open now" value={openRoles} tone="success" />
        <StatTile icon={faTags} label="Job categories" value={categories.length} tone="neutral" />
      </div>

      <div className="mb-4 overflow-x-auto">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'team' as Tab, label: 'Team members', count: members.length },
            { key: 'jobs' as Tab, label: 'Job openings', count: openings.length },
            { key: 'categories' as Tab, label: 'Job categories', count: categories.length },
          ]}
        />
      </div>

      {error && <p role="alert" className="mb-4 rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>}

      {tab === 'team' && <MembersPanel members={members} loading={loading} reload={load} />}
      {tab === 'jobs' && <OpeningsPanel openings={openings} categories={categories} loading={loading} reload={load} />}
      {tab === 'categories' && <CategoriesPanel categories={categories} openings={openings} loading={loading} reload={load} />}
    </AdminLayout>
  );
}
