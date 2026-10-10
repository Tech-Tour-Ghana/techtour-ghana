import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

export interface Job {
  id: string;
  slug: string;
  postedAt: string;
  closingDate: string | null;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  level: string;
  description: string;
  about: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  tags: string[];
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string | null;
  email: string;
  linkedin: string;
  isLead?: boolean;
  isCoLead?: boolean;
}

const lines = (s: string | null) => (s ?? '').split('\n').map((r) => r.trim()).filter(Boolean);

const TYPE_LABEL = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Full-time',
} as const;

export const getTeamMembers = cache(async (): Promise<TeamMember[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('team_members')
    .select('name, position, bio, image_path, email, linkedin')
    .eq('is_active', true)
    .order('sort_order');
  return (data ?? []).map((m) => ({
    name: m.name,
    role: m.position,
    bio: m.bio,
    image: m.image_path,
    email: m.email,
    linkedin: m.linkedin,
  }));
});

export const getJobs = cache(async (): Promise<Job[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('job_openings')
    .select('*, job_categories(name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  const today = new Date().toISOString().slice(0, 10);
  return (data ?? [])
    .filter((j) => !j.closing_date || j.closing_date >= today)
    .map((j) => ({
      id: j.id,
      slug: j.slug,
      postedAt: j.created_at,
      closingDate: j.closing_date,
      title: j.title,
      department: j.job_categories?.name ?? 'General',
      location: j.location,
      type: TYPE_LABEL[j.employment_type],
      level: j.level ?? '',
      description: j.description,
      about: j.description,
      responsibilities: lines(j.responsibilities),
      requirements: lines(j.requirements),
      niceToHave: [],
      benefits: lines(j.benefits),
      tags: j.tags ?? [],
    }));
});

export const getJobBySlug = cache(async (slug: string): Promise<Job | null> => {
  const jobs = await getJobs();
  return jobs.find((j) => j.slug === slug) ?? null;
});
