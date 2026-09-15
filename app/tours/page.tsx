// app/tours/page.tsx

export const dynamic = 'force-dynamic';

export default function ToursPage() {
  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-bold mb-6">Our Tours</h1>
      <p className="text-gray-600 mb-8">Discover the best tours and destinations in Ghana</p>
      <div className="bg-gray-100 rounded-2xl p-12 text-center">
        <p className="text-gray-500">Tour listings coming soon. Check back later!</p>
      </div>
    </div>
  );
}