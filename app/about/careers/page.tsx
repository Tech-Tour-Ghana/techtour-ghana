import { getJobs } from '@/lib/careers/load.server';

import CareersView from './CareersView';

export const revalidate = 60;

export default async function CareersPage() {
  return <CareersView openPositions={await getJobs()} />;
}
