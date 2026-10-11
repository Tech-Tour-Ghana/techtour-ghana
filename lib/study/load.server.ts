import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

export interface StudyDestination {
  id: string;
  slug: string;
  country_name: string;
  flag: string;
  description: string;
  why_study: string;
  cost_of_living: string;
  language: string;
  currency_name: string;
  average_tuition: string;
  image_url: string;
  is_featured: boolean;
}

export interface Scholarship {
  id: string;
  destination_id: string;
  slug: string;
  title: string;
  level: string;
  description: string;
  deadline: string;
  amount: string;
  is_featured: boolean;
}

export const DEST_SELECT = 'id, slug, country_name, flag, description, why_study, cost_of_living, language, currency_name, average_tuition, image_url, is_featured';
export const SCHOLAR_SELECT = 'id, destination_id, slug, title, level, description, deadline, amount, is_featured';

/** Scholarships stored with this deadline have none: the column is NOT NULL, so the admin uses a far-future date. */
export const OPEN_DEADLINE = '2099-12-31';

export const getStudyDestinations = cache(async (): Promise<StudyDestination[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from('study_destinations').select(DEST_SELECT).eq('is_active', true).order('sort_order').order('country_name');
  return data ?? [];
});

export const getOpenScholarships = cache(async (): Promise<Scholarship[]> => {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from('scholarships').select(SCHOLAR_SELECT).eq('is_active', true).gte('deadline', today).order('deadline');
  return data ?? [];
});

export const getStudyDestination = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: destination } = await supabase.from('study_destinations').select(DEST_SELECT).eq('slug', slug).eq('is_active', true).maybeSingle();
  if (!destination) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data: scholarships } = await supabase.from('scholarships').select(SCHOLAR_SELECT).eq('destination_id', destination.id).eq('is_active', true).gte('deadline', today).order('deadline');
  return { destination, scholarships: scholarships ?? [] };
});

export const deadlineLabel = (iso: string) =>
  iso >= OPEN_DEADLINE ? 'Open all year' : new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const LEVELS: Record<string, string> = { all: 'All levels', bachelor: 'Bachelor', master: 'Master', phd: 'PhD' };

export interface StudyProgram {
  id: string;
  institution_id: string;
  title: string;
  slug: string;
  level: string;
  field: string;
  duration: string;
  tuition_amount: number | null;
  tuition_currency: string;
  application_fee: number | null;
  intakes: string;
  requirements: string;
  description: string;
}

export interface StudyInstitution {
  id: string;
  slug: string;
  name: string;
  destination_id: string | null;
  city: string;
  logo_url: string;
  image_url: string;
  website: string;
  description: string;
  is_partner: boolean;
  is_featured: boolean;
  programs: StudyProgram[];
}

const PROGRAM_SELECT = 'id, institution_id, title, slug, level, field, duration, tuition_amount, tuition_currency, application_fee, intakes, requirements, description';
const INSTITUTION_SELECT = `id, slug, name, destination_id, city, logo_url, image_url, website, description, is_partner, is_featured, study_programs(${PROGRAM_SELECT})`;

type InstitutionRow = Omit<StudyInstitution, 'programs'> & { study_programs: StudyProgram[] | null };
const toInstitution = ({ study_programs, ...rest }: InstitutionRow): StudyInstitution => ({
  ...rest,
  programs: (study_programs ?? []).sort((a, b) => a.title.localeCompare(b.title)),
});

/** Active partner institutions (optionally one country) with their active programmes. RLS hides anything inactive. */
export const getStudyInstitutions = cache(async (destinationId?: string): Promise<StudyInstitution[]> => {
  const supabase = await createClient();
  let query = supabase.from('study_institutions').select(INSTITUTION_SELECT).eq('is_active', true).eq('study_programs.is_active', true).order('is_featured', { ascending: false }).order('sort_order').order('name');
  if (destinationId) query = query.eq('destination_id', destinationId);
  const { data } = await query;
  return ((data as unknown as InstitutionRow[] | null) ?? []).map(toInstitution);
});

export const getStudyProgram = cache(async (id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: program } = await supabase.from('study_programs').select(PROGRAM_SELECT).eq('id', id).eq('is_active', true).maybeSingle();
  if (!program) return null;
  const { data: institution } = await supabase.from('study_institutions').select('id, slug, name, destination_id, city, logo_url, image_url, website, description, is_partner, is_featured').eq('id', program.institution_id).eq('is_active', true).maybeSingle();
  if (!institution) return null;
  const { data: destination } = institution.destination_id
    ? await supabase.from('study_destinations').select(DEST_SELECT).eq('id', institution.destination_id).eq('is_active', true).maybeSingle()
    : { data: null };
  if (!destination) return null;
  return { program: program as StudyProgram, institution, destination };
});

export const formatTuition = (amount: number | null, currency: string) =>
  amount === null ? '' : `${currency} ${Number(amount).toLocaleString('en-GB', { maximumFractionDigits: 0 })} per year`;
