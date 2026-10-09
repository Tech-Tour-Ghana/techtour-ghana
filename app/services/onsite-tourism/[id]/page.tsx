import { redirect } from 'next/navigation';

// Onsite tourism is served by the Tours Listings, which read from the database.
export default function OnsiteTourismRedirect() {
  redirect('/tours');
}
