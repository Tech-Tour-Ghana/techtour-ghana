import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

/** The white circle with a diagonal arrow that ends our dark pill buttons. */
export default function ArrowCircle() {
  return (
    <span aria-hidden className="ml-3 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
      <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3 -rotate-45" />
    </span>
  );
}

export const darkPill = { background: 'linear-gradient(180deg, #2b2b2b 0%, #0b0b0b 100%)' };
