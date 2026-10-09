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
