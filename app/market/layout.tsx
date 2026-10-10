import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'TechTour Market',
  description: 'Handcrafted Ghanaian goods from named artisans: Kente, beads, pottery, wood carvings and more.',
  alternates: { canonical: '/market' },
};

export default function MarketLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
