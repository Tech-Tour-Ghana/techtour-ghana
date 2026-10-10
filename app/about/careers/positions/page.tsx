import { redirect } from 'next/navigation';

// Open positions now live on the Careers page.
export default function Positions() {
  redirect('/about/careers#roles');
}
