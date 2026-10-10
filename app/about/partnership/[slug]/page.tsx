import { redirect } from 'next/navigation';

type Params = { params: Promise<{ slug: string }> };

// The six partner types are cards on the Partnerships page now.
export default async function PartnerType({ params }: Params) {
  const { slug } = await params;
  redirect('/about/partnership?type=' + encodeURIComponent(slug) + '#apply');
}
