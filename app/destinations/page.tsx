import { redirect } from 'next/navigation';

// The destination chips on Tours Listings replace the old index. Each place keeps
// its own guide page at /destinations/<slug>.
export default function DestinationsIndex() {
  redirect('/tours');
}
