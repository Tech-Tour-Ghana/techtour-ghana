import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBath, faBed, faLocationDot, faUsers } from '@fortawesome/free-solid-svg-icons';

import Button from '@/components/ui/Button';
import { tourMoney } from '@/components/tours/TourCard';
import { rentalImages, typeLabel, type RentalCard as Card } from '@/lib/rentals/load.server';

export default function RentalCard({ rental }: { rental: Card }) {
  const href = `/services/dream-vacations/${rental.slug}`;
  const image = rentalImages(rental)[0];
  const place = [rental.city, rental.region].filter(Boolean).join(', ') || rental.location;
  return (
    <article className="group flex h-full flex-col rounded-3xl p-3 transition hover:shadow-xl" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl" style={{ background: 'var(--sp-border)' }}>
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          )}
        </Link>
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">{typeLabel(rental.property_type)}</span>
        {rental.is_featured && <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">Featured</span>}
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--sp-text-secondary)' }}>
          <span className="inline-flex items-center gap-1"><FontAwesomeIcon icon={faBed} className="h-3 w-3" />{rental.bedrooms} bed</span>
          <span className="inline-flex items-center gap-1"><FontAwesomeIcon icon={faBath} className="h-3 w-3" />{rental.bathrooms} bath</span>
          <span className="inline-flex items-center gap-1"><FontAwesomeIcon icon={faUsers} className="h-3 w-3" />{rental.max_guests} guests</span>
        </div>

        <div className="mt-2 flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-lg font-bold leading-snug"><Link href={href}>{rental.title}</Link></h2>
          <p className="flex-shrink-0 text-right leading-tight">
            <span className="text-lg font-bold" style={{ color: 'var(--sp-primary)' }}>{tourMoney(Number(rental.price_per_night), rental.currency)}</span>
            <span className="block text-[11px]" style={{ color: 'var(--sp-text-muted)' }}>per night</span>
          </p>
        </div>

        {place && <p className="mt-2 inline-flex min-w-0 items-center gap-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}><FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 flex-shrink-0" /><span className="truncate">{place}</span></p>}

        <div className="mt-auto pt-4">
          {!rental.is_available && <p className="mb-2 text-xs font-semibold" style={{ color: '#C2410C' }}>Currently unavailable</p>}
          <Button href={href} full>View rental</Button>
        </div>
      </div>
    </article>
  );
}
