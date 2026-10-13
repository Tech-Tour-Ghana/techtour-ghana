// Social platforms: the real brand glyph and the platform's own colour.
//
// The colours here are the one place the project uses fixed hex values for
// something visible. A social logo has to stay in its platform's colour in light
// and dark mode, so these are deliberately not theme tokens. Everything that shows a
// social icon (footer, contact page, admin) reads this file.

import { faFacebookF, faInstagram, faLinkedinIn, faTiktok, faWhatsapp, faXTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faLink, type IconDefinition } from '@fortawesome/free-solid-svg-icons';

export type SocialPlatform = 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp' | 'other';

export interface SocialBrand {
  label: string;
  icon: IconDefinition;
  /** The platform's brand colour, used behind a white glyph. */
  color: string;
  placeholder: string;
}

export const SOCIAL_BRANDS: Record<SocialPlatform, SocialBrand> = {
  facebook: { label: 'Facebook', icon: faFacebookF, color: '#1877F2', placeholder: 'https://www.facebook.com/yourpage' },
  twitter: { label: 'X (Twitter)', icon: faXTwitter, color: '#000000', placeholder: 'https://x.com/yourhandle' },
  instagram: { label: 'Instagram', icon: faInstagram, color: '#E4405F', placeholder: 'https://www.instagram.com/yourhandle' },
  linkedin: { label: 'LinkedIn', icon: faLinkedinIn, color: '#0A66C2', placeholder: 'https://www.linkedin.com/company/yourcompany' },
  youtube: { label: 'YouTube', icon: faYoutube, color: '#FF0000', placeholder: 'https://www.youtube.com/@yourchannel' },
  tiktok: { label: 'TikTok', icon: faTiktok, color: '#000000', placeholder: 'https://www.tiktok.com/@yourhandle' },
  whatsapp: { label: 'WhatsApp', icon: faWhatsapp, color: '#25D366', placeholder: 'https://wa.me/233200000000' },
  other: { label: 'Other', icon: faLink, color: '#5B6770', placeholder: 'https://' },
};

export const SOCIAL_PLATFORMS = Object.keys(SOCIAL_BRANDS) as SocialPlatform[];

export const socialBrand = (platform: string): SocialBrand =>
  SOCIAL_BRANDS[(platform.toLowerCase() === 'x' ? 'twitter' : platform.toLowerCase()) as SocialPlatform] ?? SOCIAL_BRANDS.other;
