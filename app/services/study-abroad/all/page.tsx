import { redirect } from 'next/navigation';

// The destinations and scholarships now live on the main study abroad page.
export default function StudyAbroadAll() {
  redirect('/services/study-abroad');
}
