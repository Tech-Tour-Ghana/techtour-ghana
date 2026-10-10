import { redirect } from 'next/navigation';

// Merged into the About page.
export default function OurTeam() {
  redirect('/about#team');
}
