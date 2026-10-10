// Shapes and row mappers for the home page. Shared by the server loader and the
// client refresh, so a row maps the same way in both.

// ===== INTERFACES =====
export interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  button_text: string;
  button_link: string;
}

export interface MainFeatureCard {
  id: string;
  card_type: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  button_text: string;
  button_link: string;
  button_color: string;
  title_color: string;
  subtitle_color: string;
  description_color: string;
  title_alignment: string;
  subtitle_alignment: string;
  description_alignment: string;
  mobile_card_height: string;
  desktop_card_height?: string;
  mobile_card_width: string;
  desktop_card_width?: string;
  max_width: string;
}

export interface SmallGlassCard {
  id: string;
  main_card_id: string | null;
  title: string;
  description: string;
  icon: string | null;
  icon_type: 'emoji' | 'image';
  button_text: string;
  button_link: string;
  title_alignment: string;
  description_alignment: string;
  title_color: string;
  description_color: string;
  title_size: string;
  description_size: string;
}

export interface VideoSection {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  image_url: string | null;
  media_type: 'video' | 'image' | 'none';
  thumbnail: string;
  category: string;
  card_type: 'wide' | 'short';
  order: number;
  is_active: boolean;
  social_platform?: string;
  social_link?: string;
  social_button_text?: string;
  social_icon?: string;
}

// VideoSection.get_social_icon from the old backend.
export const SOCIAL_ICONS: Record<string, string> = {
  youtube: 'fa-youtube',
  tiktok: 'fa-tiktok',
  instagram: 'fa-instagram',
  facebook: 'fa-facebook',
  twitter: 'fa-twitter',
  other: 'fa-share-alt',
};

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
  mainCards: MainFeatureCard[];
  smallCards: SmallGlassCard[];
  videos: VideoSection[];
  testimonials: Testimonial[];
  loadError: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const mapSlides = (rows: any[]): Slide[] =>
  rows.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    description: s.description,
    image: s.image_url || '/images/placeholder-slide.svg',
    button_text: s.button_text,
    button_link: s.button_link,
  }));

export const mapMainCards = (rows: any[]): MainFeatureCard[] =>
  rows.map((c) => ({
    id: c.id,
    card_type: c.card_type,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    image: c.image_url,
    button_text: c.button_text,
    button_link: c.button_link,
    button_color: c.button_color,
    title_color: c.title_color,
    subtitle_color: c.subtitle_color,
    description_color: c.description_color,
    title_alignment: c.title_alignment,
    subtitle_alignment: c.subtitle_alignment,
    description_alignment: c.description_alignment,
    mobile_card_height: c.mobile_card_height,
    mobile_card_width: c.mobile_card_width,
    max_width: c.max_width,
  }));

export const mapSmallCards = (rows: any[]): SmallGlassCard[] =>
  rows.map((c) => {
    const icon = c.icon_image_url || c.icon || null;
    return {
      id: c.id,
      main_card_id: c.main_card_id,
      title: c.title,
      description: c.description,
      icon,
      icon_type: icon && (icon.startsWith('http') || icon.startsWith('/media')) ? 'image' : 'emoji',
      button_text: c.button_text,
      button_link: c.button_link,
      title_alignment: c.title_alignment,
      description_alignment: c.description_alignment,
      title_color: c.title_color,
      description_color: c.description_color,
      title_size: c.title_size,
      description_size: c.description_size,
    };
  });

export const mapVideos = (rows: any[]): VideoSection[] =>
  rows.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description || '',
    media_type: v.image_url ? 'image' : v.video_url ? 'video' : 'none',
    video_url: v.video_url || '',
    image_url: v.image_url || '',
    thumbnail: v.image_url || '',
    category: v.category || '',
    card_type: v.card_type || 'wide',
    order: v.sort_order,
    is_active: v.is_active,
    social_platform: v.social_platform || '',
    social_link: v.social_link || '',
    social_button_text: v.social_button_text || '',
    social_icon: SOCIAL_ICONS[v.social_platform ?? ''] ?? 'fa-share-alt',
  }));
