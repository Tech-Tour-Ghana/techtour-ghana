import type { Database } from '@/types/database';

export type Member = Database['public']['Tables']['team_members']['Row'];
export type JobCategory = Database['public']['Tables']['job_categories']['Row'];
export type Opening = Database['public']['Tables']['job_openings']['Row'];
export type EmploymentType = Database['public']['Enums']['employment_type'];

export const EMPLOYMENT_TYPES: readonly { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
];

export const typeLabel = (t: EmploymentType) => EMPLOYMENT_TYPES.find((e) => e.value === t)?.label ?? t;

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const isUrl = (s: string) => /^https?:\/\/\S+$/i.test(s);
