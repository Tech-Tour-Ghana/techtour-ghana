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
          {data.length < 3 && (
            <div className={`flex flex-col justify-center rounded-3xl p-6 sm:p-8 ${data.length === 1 ? 'lg:col-span-2' : ''}`} style={{ background: 'var(--sp-bg-card)', border: '1px dashed var(--sp-border-hover)' }}>
              <h3 className="text-xl font-bold">Looking for something specific?</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>
                More departures are added regularly. Tell us where you want to go and when, and our team will plan it with you.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button href="/about/contact-us">Talk to our team</Button>
                <Button href="/tours" variant="secondary">See all tours</Button>
              </div>
            </div>
          )}
        </div>
        {data.length >= 3 && <div className="mt-8"><Button href="/tours">View all tours</Button></div>}
      </div>
    </section>
  );
}
