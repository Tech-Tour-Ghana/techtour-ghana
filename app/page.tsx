import type { Metadata } from 'next';

import Hero from '@/components/home/sections/Hero';
import FeaturedTours from '@/components/home/sections/FeaturedTours';
import LatestPosts from '@/components/home/sections/LatestPosts';
import MarketSpotlight from '@/components/home/sections/MarketSpotlight';
import PopularDestinations from '@/components/home/sections/PopularDestinations';
import Services from '@/components/home/sections/Services';
import StudyBand from '@/components/home/sections/StudyBand';
import Testimonials from '@/components/home/sections/Testimonials';
import WatchGhana from '@/components/home/sections/WatchGhana';
import WhyUs from '@/components/home/sections/WhyUs';
import { ServiceTheme } from '@/components/ServiceTheme';
import { getHomeData } from '@/lib/home/load.server';

export const metadata: Metadata = {
  description: 'Guided tours across Ghana, study abroad support and a marketplace for Ghanaian artisans, in one place.',
  alternates: { canonical: '/' },
};

export const revalidate = 60;

// Order is deliberate: promise, services, places, tours to book, video proof,
// study abroad, the market, reasons to trust us, then testimonials and articles.
export default async function HomePage() {
  const { slides, videos, testimonials, destinations } = await getHomeData();
  return (
    <ServiceTheme>
      <div style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
        <Hero slides={slides} destinations={destinations} />
        <Services />
        <PopularDestinations />
        <FeaturedTours />
        <WatchGhana videos={videos} />
        <StudyBand />
        <MarketSpotlight />
        <WhyUs />
        <Testimonials items={testimonials} />
        <LatestPosts />
      </div>
    </ServiceTheme>
  );
}
