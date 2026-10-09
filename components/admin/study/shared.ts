import type { Tone } from '@/components/admin/ui';
import type { Database } from '@/types/database';

export type Destination = Database['public']['Tables']['study_destinations']['Row'];
export type Scholarship = Database['public']['Tables']['scholarships']['Row'];
export type Level = Database['public']['Enums']['scholarship_level'];

// The column is NOT NULL, so a scholarship with no deadline stores this far-future date and shows as Open.
export const OPEN_DEADLINE = '2099-12-31';

export const LEVELS: readonly Level[] = ['all', 'bachelor', 'master', 'phd'];
export const LEVEL_LABELS: Record<Level, string> = { bachelor: 'Bachelor', master: 'Master', phd: 'PhD', all: 'All levels' };
export const LEVEL_TONE: Record<Level, Tone> = { bachelor: 'info', master: 'warning', phd: 'danger', all: 'success' };

/** Next free "-copy" slug among the given slugs. */
export function copySlug(slug: string, taken: string[]): string {
  const used = new Set(taken);
  let next = `${slug}-copy`;
  for (let n = 2; used.has(next); n++) next = `${slug}-copy-${n}`;
  return next;
}
