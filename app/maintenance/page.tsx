import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import MaintenanceView from '@/components/maintenance/MaintenanceView';
import { getMaintenance } from '@/lib/maintenance.server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Down for maintenance',
  robots: { index: false, follow: false },
};

// Middleware serves this page (HTTP 503) to visitors while maintenance mode is on.
// Opened directly when it is off, it sends people home; ?preview=1 shows it anyway
// so an admin can check the wording.
export default async function MaintenancePage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const [settings, { preview }] = await Promise.all([getMaintenance(), searchParams]);
  if (!settings.enabled && preview !== '1') redirect('/');
  return <MaintenanceView settings={settings} />;
}
