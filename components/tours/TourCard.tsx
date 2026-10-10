import Button from '@/components/ui/Button';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faLocationDot, faStar } from '@fortawesome/free-solid-svg-icons';

import type { TourCardData } from '@/lib/tours/load.server';
import SaveTourButton from './SaveTourButton';

export const tourMoney = (amount: number, currency: string) => `${currency === 'GHS' ? '₵' : currency + ' '}${amount.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

function DateChip({ iso }: { iso: string }) {
  const d = new Date(`${iso}T00:00:00Z`);
  const part = (opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
  return (
    <span className="absolute left-3 top-3 flex w-11 flex-col items-center rounded-lg bg-white py-0.5 text-center leading-tight text-gray-900 shadow" title="Next departure">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">{part({ month: 'short' })}</span>
      <span className="text-base font-bold">{part({ day: 'numeric' })}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">{part({ weekday: 'short' })}</span>
    </span>
  );
}

export default function TourCard({ tour, headingLevel: Heading = 'h2' }: { tour: TourCardData; headingLevel?: 'h2' | 'h3' }) {
  const href = `/tours/${tour.slug}`;
  const onSale = tour.discount_price !== null && tour.discount_price < tour.price;
  const place = [tour.location, tour.region].filter(Boolean).join(', ');
  return (
    <article className="group flex h-full flex-col rounded-3xl p-3 transition hover:shadow-xl" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl" style={{ background: 'var(--sp-border)' }}>
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
          {tour.featured_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tour.featured_image_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          )}
        </Link>
        {tour.next_departure && <DateChip iso={tour.next_departure} />}
        {tour.is_featured && <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">Featured</span>}
        <div className="absolute right-3 top-3"><SaveTourButton slug={tour.slug} title={tour.title} /></div>
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--sp-text-secondary)' }}>
          {tour.review_count > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--sp-text-primary)' }}>
              <FontAwesomeIcon icon={faStar} className="h-3 w-3" style={{ color: 'var(--brand-warning)' }} />{tour.rating.toFixed(1)}
              <span className="font-normal" style={{ color: 'var(--sp-text-muted)' }}>({tour.review_count})</span>
            </span>
          ) : <span style={{ color: 'var(--sp-text-muted)' }}>New</span>}
          <span className="inline-flex items-center gap-1"><FontAwesomeIcon icon={faClock} className="h-3 w-3" />{tour.duration_days} {tour.duration_days === 1 ? 'day' : 'days'}</span>
          {place && <span className="inline-flex min-w-0 items-center gap-1"><FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 flex-shrink-0" /><span className="truncate">{place}</span></span>}
        </div>

        <div className="mt-2 flex items-start justify-between gap-3">
          <Heading className="line-clamp-2 text-lg font-bold leading-snug"><Link href={href}>{tour.title}</Link></Heading>
          <p className="flex-shrink-0 text-right leading-tight">
            <span className="text-lg font-bold" style={{ color: onSale ? 'var(--sp-accent-text, var(--brand-accent-text))' : 'var(--sp-primary)' }}>{tourMoney(onSale ? tour.discount_price! : tour.price, tour.currency)}</span>
            <span className="block text-[11px]" style={{ color: 'var(--sp-text-muted)' }}>{onSale && <s className="mr-1">{tourMoney(tour.price, tour.currency)}</s>}per person</span>
          </p>
        </div>

        {tour.short_description && <p className="mt-2 line-clamp-3 text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{tour.short_description}</p>}

        <div className="mt-auto pt-4">
          {tour.spots_left !== null && tour.spots_left <= 5 && <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--brand-warning-text)' }}>Only {tour.spots_left} spot{tour.spots_left === 1 ? '' : 's'} left</p>}
          <Button href={href} full>{tour.next_departure ? 'Reserve your booking' : 'View tour'}</Button>
        </div>
      </div>
    </article>
  );
}
