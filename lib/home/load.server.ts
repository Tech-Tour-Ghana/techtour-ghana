import { createClient } from '@/lib/supabase/server';

import { mapMainCards, mapSlides, mapSmallCards, mapVideos, type HomeData } from './map';

/** Everything the home page shows, read through the visitor's RLS-checked client. */
export async function getHomeData(): Promise<HomeData> {
  const supabase = await createClient();
  const [slides, mainCards, smallCards, videos, testimonials] = await Promise.all([
    supabase.from('homepage_slides').select('*').order('sort_order'),
    supabase.from('main_feature_cards').select('*').order('sort_order'),
    supabase.from('small_glass_cards').select('*').order('sort_order'),
    supabase.from('video_sections').select('*').order('sort_order'),
    supabase
      .from('testimonials')
      .select('id, author_name, author_position, author_image_path, content, rating')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  return {
    slides: slides.data ? mapSlides(slides.data) : [],
    mainCards: mainCards.data ? mapMainCards(mainCards.data) : [],
    smallCards: smallCards.data ? mapSmallCards(smallCards.data) : [],
    videos: videos.data ? mapVideos(videos.data) : [],
    testimonials: testimonials.data ?? [],
    // Testimonials are optional, the rest are the page.
    loadError: [slides, mainCards, smallCards, videos].some((r) => r.error),
  };
}
