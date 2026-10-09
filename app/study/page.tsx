import { redirect } from 'next/navigation';

// The real study abroad pages live under /services/study-abroad.
export default function StudyPage() {
  redirect('/services/study-abroad');
}
