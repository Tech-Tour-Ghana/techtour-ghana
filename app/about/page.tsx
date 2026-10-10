import type { Metadata } from 'next';
import Link from 'next/link';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import TeamProfileCard from '@/components/team/TeamProfileCard';
import Button from '@/components/ui/Button';
import { getTeamMembers, type TeamMember } from '@/lib/careers/load.server';

export const metadata: Metadata = {
  title: 'About TechTour Ghana',
  description: 'Who we are, what we believe and who is behind TechTour Ghana: guided tours, study abroad and a marketplace for Ghanaian artisans.',
  alternates: { canonical: '/about' },
};

export const revalidate = 60;

const OFFERINGS = [
  { title: 'Guided tours', body: 'Dated departures across Ghana that you can reserve online.' },
  { title: 'Study abroad', body: 'Destinations, costs and scholarships, with a team to guide your application.' },
  { title: 'Short-stay rentals', body: 'Places to stay across Ghana, arranged through an enquiry.' },
  { title: 'Artisan marketplace', body: 'Local craftspeople selling directly to a wider audience.' },
];

const TECHNOLOGY = [
  { title: 'Book online', body: 'Reserve a tour date and pay securely, with a confirmation sent by email.' },
  { title: 'Apply online', body: 'Submit a study abroad application in one form and follow up with our team.' },
  { title: 'Shop direct', body: 'Buy crafts from named artisans, with their story beside every piece.' },
];

const VALUES = [
  { title: 'Authenticity', body: "We champion genuine cultural experiences that honor Ghana's true story." },
  { title: 'Community impact', body: 'Every booking should create real value for local people and artisans.' },
  { title: 'Sustainability', body: 'We build for the long-term well-being of people and planet.' },
  { title: 'Innovation', body: 'We use technology as a bridge between heritage and the future.' },
  { title: 'Integrity', body: 'We do what we say, and we say what we mean.' },
  { title: 'Excellence', body: 'We set a high standard for African tourism, then raise it again.' },
];

// Shown only when the team_members table has no active rows.
const FALLBACK_TEAM: TeamMember[] = [
  { name: 'Prince Kyei', role: 'CEO & Founder', bio: "Visionary founder leading TechTour Ghana's mission to redefine African tourism through technology and cultural authenticity.", image: '/images/p-kyei.jpg', email: '', linkedin: '', isLead: true },
  { name: 'Stiffler Awuah Benard', role: 'Co-Founder & CTO', bio: 'Technology architect behind our digital marketplace and the platforms that power authentic Ghanaian experiences.', image: '/images/stiff.png', email: '', linkedin: '', isCoLead: true },
  { name: 'David Osei Boateng', role: 'Chief Operations Officer', bio: 'Operations leader ensuring every TechTour experience, from booking to return, runs smoothly.', image: null, email: '', linkedin: '' },
];

export default async function AboutPage() {
  const fromDb = await getTeamMembers();
  const team = fromDb.length ? fromDb : FALLBACK_TEAM;
  const heading = { color: 'var(--sp-text-primary)' };
  const body = { color: 'var(--sp-text-secondary)' };

  return (
    <ContentShell wide title="About" titleAccent="TechTour Ghana" description="Redefining African tourism through technology that uplifts local communities.">
      <nav aria-label="On this page" className="-mx-4 mb-10 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max gap-2">
          {[['story', 'Our story'], ['purpose', 'Mission and vision'], ['values', 'Values'], ['team', 'Team']].map(([id, label]) => (
            <li key={id}><a href={`#${id}`} className="block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium" style={{ ...cardStyle, color: 'var(--sp-text-secondary)' }}>{label}</a></li>
          ))}
        </ul>
      </nav>

      <section id="story" className="scroll-mt-28" aria-labelledby="story-h">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
          <div>
            <h2 id="story-h" className="text-2xl font-bold sm:text-3xl" style={heading}>Our story</h2>
            <div className="mt-4 space-y-4 leading-relaxed" style={body}>
              <p>TechTour Ghana started from a simple observation: Africa&apos;s tourism is rich in culture, history and natural beauty, yet local communities and artisans are too often left on the sidelines of its economic success.</p>
              <p>We set out to change that by combining technology with a deep respect for Ghanaian heritage. The goal is a platform that does not only show Ghana to the world, but lifts the people who make its culture so vibrant.</p>
              <p>Our principle is that tourism should benefit everyone it touches: the traveler who discovers something new, the artisan who finds a wider market, and the community that thrives because of it.</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>What we do</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {OFFERINGS.map((o) => (
                <li key={o.title} className="rounded-2xl p-4" style={cardStyle}>
                  <p className="font-semibold" style={heading}>{o.title}</p>
                  <p className="mt-1 text-sm" style={body}>{o.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="purpose" className="mt-16 scroll-mt-28" aria-labelledby="purpose-h">
        <h2 id="purpose-h" className="text-2xl font-bold sm:text-3xl" style={heading}>Mission and vision</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl p-6 sm:p-8" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>Mission</p>
            <p className="mt-3 leading-relaxed" style={body}>To redefine African tourism through technology that uplifts, connects and inspires. We create authentic cultural experiences that empower Ghanaian communities, support local artisans, and show the true beauty of Africa to the world.</p>
          </div>
          <div className="rounded-3xl p-6 sm:p-8" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>Vision</p>
            <p className="mt-3 leading-relaxed" style={body}>A world where African tourism is a catalyst for sustainable prosperity, where every traveler&apos;s journey contributes directly to the well-being of local communities, and innovation is a bridge between heritage and progress.</p>
          </div>
        </div>
      </section>

      <section id="values" className="mt-16 scroll-mt-28" aria-labelledby="values-h">
        <h2 id="values-h" className="text-2xl font-bold sm:text-3xl" style={heading}>What we stand for</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v) => (
            <li key={v.title} className="rounded-2xl p-5" style={cardStyle}>
              <h3 className="font-semibold" style={heading}>{v.title}</h3>
              <p className="mt-1 text-sm" style={body}>{v.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="technology" className="mt-16 scroll-mt-28" aria-labelledby="tech-h">
        <h2 id="tech-h" className="text-2xl font-bold sm:text-3xl" style={heading}>Technology, used plainly</h2>
        <p className="mt-2 max-w-2xl" style={body}>We build tools that make it easier to reach Ghana and the people who work in its tourism.</p>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {TECHNOLOGY.map((t) => (
            <li key={t.title} className="rounded-2xl p-5" style={cardStyle}>
              <h3 className="font-semibold" style={heading}>{t.title}</h3>
              <p className="mt-1 text-sm" style={body}>{t.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="team" className="mt-16 scroll-mt-28" aria-labelledby="team-h">
        <h2 id="team-h" className="text-2xl font-bold sm:text-3xl" style={heading}>The team</h2>
        <p className="mt-2 max-w-2xl" style={body}>The people behind TechTour Ghana, working across tourism, technology and operations.</p>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m) => (
            <li key={m.name}>
              <TeamProfileCard member={{ name: m.name, role: m.role, bio: m.bio, image: m.image, email: m.email, linkedin: m.linkedin, badge: m.isLead ? 'Founder' : m.isCoLead ? 'Co-Founder' : 'Leadership' }} />
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-sm" style={body}>
          Want to work with us? <Link href="/about/careers" className="font-semibold underline" style={{ color: 'var(--sp-primary)' }}>See open roles</Link>.
        </p>
      </section>

      <section className="mt-16 rounded-3xl p-8 text-center sm:p-12" style={cardStyle} aria-labelledby="cta-h">
        <h2 id="cta-h" className="text-2xl font-bold" style={heading}>Be part of the story</h2>
        <p className="mx-auto mt-2 max-w-xl" style={body}>Whether you are a traveler, an artisan or a partner, there is a place for you.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/about/contact-us">Get in touch</Button>
          <Button href="/about/partnership" variant="secondary">Become a partner</Button>
        </div>
      </section>
    </ContentShell>
  );
}
