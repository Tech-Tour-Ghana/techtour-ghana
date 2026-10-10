import type { Metadata } from 'next';

import HomeClient from '@/components/home/HomeClient';
import { getHomeData } from '@/lib/home/load.server';

export const metadata: Metadata = {
  description: 'Guided tours across Ghana, study abroad support and a marketplace for Ghanaian artisans, in one place.',
  alternates: { canonical: '/' },
};

export const revalidate = 60;

export default async function HomePage() {
  const initial = await getHomeData();
  return <HomeClient initial={initial} />;
}
