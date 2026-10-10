import { createClient } from '@/lib/supabase/server';

import { mapSlides, type HomeData } from './map';

/** What the home page needs from the database, read through the visitor's RLS-checked client. */
export async function getHomeData(): Promise<HomeData> {
  const supabase = await createClient();
  const [slides, videos, testimonials, destinations] = await Promise.all([
    supabase.from('homepage_slides').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('video_sections').select('id, title, description, category, video_url, image_url').eq('is_active', true).order('sort_order'),
    supabase
      .from('testimonials')
      .select('id, author_name, author_position, author_image_path, content, rating')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('destinations').select('slug, name').eq('is_active', true).order('sort_order'),
  ]);

  return {
    slides: mapSlides(slides.data ?? []),
    videos: videos.data ?? [],
    testimonials: testimonials.data ?? [],
    destinations: destinations.data ?? [],
  };
}
