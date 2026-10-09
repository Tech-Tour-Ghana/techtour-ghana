import { getJobs } from '@/lib/careers/load.server';

import PositionsView from './PositionsView';

export const revalidate = 60;

export default async function PositionsPage() {
  return <PositionsView jobs={await getJobs()} />;
}
