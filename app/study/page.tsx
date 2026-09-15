// app/study/page.tsx

export const dynamic = 'force-dynamic';

export default function StudyPage() {
  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-bold mb-6">Study Abroad</h1>
      <p className="text-gray-600 mb-8">Explore international education opportunities</p>
      <div className="bg-gray-100 rounded-2xl p-12 text-center">
        <p className="text-gray-500">Study abroad programs coming soon. Check back later!</p>
      </div>
    </div>
  );
}