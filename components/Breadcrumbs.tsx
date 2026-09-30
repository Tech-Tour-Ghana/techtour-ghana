import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faHouse } from '@fortawesome/free-solid-svg-icons';

export interface Crumb {
  label: string;
  /** Leave out for the current page and for levels that have no page of their own. */
  href?: string;
}

/** Trail of links to the current page. The last item is the page you are on. */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="tt-breadcrumbs">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-[13px]">
        <li className="flex items-center gap-2">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:underline" style={{ color: 'inherit', opacity: 0.75 }}>
            <FontAwesomeIcon icon={faHouse} className="h-3 w-3" aria-hidden="true" />Home
          </Link>
        </li>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-2">
              <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5 flex-shrink-0" style={{ opacity: 0.4 }} aria-hidden="true" />
              {item.href && !last ? (
                <Link href={item.href} className="hover:underline" style={{ color: 'inherit', opacity: 0.75 }}>{item.label}</Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="truncate font-medium" style={{ maxWidth: '22rem' }}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
