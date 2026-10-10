// Shapes and row mappers for the home page.

export interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  button_text: string;
  button_link: string;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_position: string;
  author_image_path: string | null;
  content: string;
  rating: number;
}

export interface HomeData {
  slides: Slide[];
  videos: { id: string; title: string; description: string; category: string; video_url: string; image_url: string }[];
  testimonials: Testimonial[];
  destinations: { slug: string; name: string }[];
}

export const mapSlides = (rows: { id: string; title: string; subtitle: string; description: string; image_url: string | null; button_text: string; button_link: string }[]): Slide[] =>
  rows.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    description: s.description,
    image: s.image_url || '/images/placeholder-slide.svg',
    button_text: s.button_text,
    button_link: s.button_link,
  }));
