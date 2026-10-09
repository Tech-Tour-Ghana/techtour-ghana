// Public pages, grouped for the HTML sitemap and listed for sitemap.xml.
// Destinations and blog posts are added from the database by the callers.
export const SITE_LINK_GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Main',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Tours Listings', href: '/tours' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'Blog Updates', href: '/blog' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Dream Vacations', href: '/services/dream-vacations' },
      { label: 'Study Abroad', href: '/services/study-abroad' },
    ],
  },
  {
    title: 'Market',
    links: [
      { label: 'TechTour Market', href: '/market' },
      { label: 'Artisan Spotlight', href: '/market/artisans' },
      { label: 'Tech & Innovation', href: '/market/tech-innovation' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '/about/our-story' },
      { label: 'Meet the Team', href: '/about/our-team' },
      { label: 'Partnerships', href: '/about/partnership' },
      { label: 'Careers', href: '/about/careers' },
      { label: 'Contact Us', href: '/about/contact-us' },
    ],
  },
  {
    title: 'Help and legal',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Refund Policy', href: '/refund' },
    ],
  },
];
