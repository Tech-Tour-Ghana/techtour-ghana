// The four Blog Updates categories from the navigation menu. The slugs must
// match the check constraint on public.blog_posts.category (0018).
export const BLOG_CATEGORIES = {
  culture: { label: 'Culture & Heritage', blurb: 'Traditions, crafts, music and history from across Ghana.' },
  destinations: { label: 'Destination Guides', blurb: 'What to see, where to stay and how to get around.' },
  'student-stories': { label: 'Student Stories', blurb: 'First-hand accounts from students who studied through TechTour Ghana.' },
  'travel-tips': { label: 'Travel Tips', blurb: 'Practical advice to plan a smooth trip to Ghana.' },
} as const;

export type BlogCategory = keyof typeof BLOG_CATEGORIES;

export const isBlogCategory = (value: string): value is BlogCategory => value in BLOG_CATEGORIES;

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || 'T';

export const formatPostDate =(iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
