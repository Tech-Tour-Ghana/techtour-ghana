import Button from '@/components/ui/Button';
import TourCard from '@/components/tours/TourCard';
import { CARD_SELECT, toCard } from '@/lib/tours/load.server';
import { createClient } from '@/lib/supabase/server';

export default async function FeaturedTours() {
  const supabase = await createClient();
  const { data } = await supabase.from('tours').select(CARD_SELECT).eq('is_active', true).order('is_featured', { ascending: false }).order('created_at', { ascending: false }).limit(3);
  if (!data?.length) return null;

  return (
    <section aria-labelledby="home-tours" className="py-12 md:py-16" style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>Guided trips</p>
        <h2 id="home-tours" className="mt-2 text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)] font-bold leading-tight">Featured tours</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((row) => <TourCard key={row.id} tour={toCard(row)} headingLevel="h3" />)}
        </div>
        <div className="mt-8"><Button href="/tours">View all tours</Button></div>
      </div>
    </section>
  );
}
