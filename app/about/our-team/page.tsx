import { getTeamMembers, type TeamMember } from '@/lib/careers/load.server';

import TeamView from './TeamView';

export const revalidate = 60;

// Fallback only: shown when the team_members table has no active rows.
const fallbackTeam: TeamMember[] = [
  {
    name: 'Prince Kyei',
    role: 'CEO & Founder',
    bio: "Visionary founder leading TechTour Ghana's mission to redefine African tourism through technology and cultural authenticity.",
    image: '/images/p-kyei.jpg',
    email: '',
    linkedin: '',
    isLead: true,
  },
  {
    name: 'Stiffler Awuah Benard',
    role: 'Co-Founder & CTO',
    bio: 'Technology architect behind our VR tours, digital marketplace, and the platforms that power authentic Ghanaian experiences.',
    image: '/images/stiff.png',
    email: '',
    linkedin: '',
    isCoLead: true,
  },
  {
    name: 'David Osei Boateng',
    role: 'Chief Operations Officer',
    bio: 'Operations leader ensuring every TechTour experience, from booking to return, runs flawlessly across all 16 regions of Ghana.',
    image: '/images/david-osei.jpg',
    email: '',
    linkedin: '',
  },
];

export default async function OurTeamPage() {
  const members = await getTeamMembers();
  return <TeamView teamMembers={members.length ? members : fallbackTeam} />;
}
