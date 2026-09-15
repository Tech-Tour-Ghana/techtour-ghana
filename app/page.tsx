// app/page.tsx

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight, faStar, faMapMarkerAlt,
  faChevronLeft, faChevronRight,
  faPlay, faPause, faUser, faSignOutAlt, faCog, faDashboard,
  faGlobeAfrica
} from '@fortawesome/free-solid-svg-icons';
import SearchParamsWrapper from '@/components/SearchParamsWrapper';
import Loading from '@/components/Loading';
import BackToTop from '@/components/BackToTop';
import { createBrowserClient } from '@/lib/supabase/client';
import { getAuthStatus, logoutUser, type User } from '@/lib/api';

// ===== BRAND COLORS =====
const COLORS = {
  // Light Mode Colors
  light: {
    primary: '#139EA2',        // Tropical Teal
    primaryHover: '#0D7A7D',   // Darker Teal
    primaryLight: '#E6F4F5',   // Light Teal tint
    textPrimary: '#000000',    // Jet Black
    textSecondary: '#4A4A4A',
    background: '#FFFFFF',     // Pure White
    backgroundAlt: '#F9F9F9',  // Snow White
    border: '#E5E7EB',
  },
  // Dark Mode Colors
  dark: {
    primary: '#E6A64D',        // Sandy Orange
    primaryHover: '#D4953A',   // Darker Orange
    primaryLight: '#2A2218',   // Dark Orange tint
    textPrimary: '#FFFFFF',    // Pure White
    textSecondary: '#B0B0B0',
    background: '#0A0A0A',     // Jet Black (softened)
    backgroundAlt: '#1A1A1A',
    border: '#2A2A2A',
  }
};

// ===== INTERFACES =====
interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  button_text: string;
  button_link: string;
}

interface Destination {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  location: string;
  region: string;
  featured_image: string;
  video_url: string;
  video_thumbnail: string | null;
  media_type: 'image' | 'video' | 'none';
  rating: number;
  review_count: number;
  price: number;
}

interface MainFeatureCard {
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

interface SmallGlassCard {
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

interface TourCategory {
  id: string;
  name: string;
  slug: string;
}

interface VideoSection {
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

// Tour.get_video_id and Tour.get_video_thumbnail from the old backend.
const getTourVideoThumbnail = (videoUrl: string): string | null => {
  if (videoUrl.includes('youtube') || videoUrl.includes('youtu.be')) {
    const match = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
  }
  if (videoUrl.includes('vimeo')) {
    const match = videoUrl.match(/(?:vimeo\.com\/)(\d+)/);
    return match ? `https://vumbnail.com/${match[1]}.jpg` : null;
  }
  return null;
};

// VideoSection.get_social_icon from the old backend.
const SOCIAL_ICONS: Record<string, string> = {
  youtube: 'fa-youtube',
  tiktok: 'fa-tiktok',
  instagram: 'fa-instagram',
  facebook: 'fa-facebook',
  twitter: 'fa-twitter',
  other: 'fa-share-alt',
};

// ===== YOUTUBE HELPERS =====
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
    /(?:youtube\.com\/v\/)([^?]+)/,
    /(?:youtube\.com\/shorts\/)([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1] ?? null;
  }
  return null;
};

const getYouTubeEmbedUrl = (url: string, autoplay: boolean = true): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=1&controls=0&rel=0&showinfo=0&modestbranding=1&loop=1&playlist=${videoId}&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0`;
  }
  return null;
};

const getCloudflareVideoId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)/);
  return match ? match[1] ?? null : null;
};

const getCloudflareIframeUrl = (videoId: string, posterUrl: string = ''): string => {
  let url = `https://customer-9eyoushdtg3zafli.cloudflarestream.com/${videoId}/iframe?loop=true&autoplay=true&muted=true&controls=false&preload=true`;
  if (posterUrl) {
    const encodedPoster = encodeURIComponent(posterUrl);
    url += `&poster=${encodedPoster}`;
  }
  return url;
};

// ===== IMAGE DISPLAY COMPONENT =====
const ImageDisplay = ({ media, isDimMode, cardType, colors }: any) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const hasSocialLink = media.social_link && media.social_link?.trim() !== '';
  const imageUrl = media.image_url || media.thumbnail;

  if (!imageUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4`}
        style={{ background: `linear-gradient(135deg, ${isDimMode ? '#1A1A1A' : '#139EA2'}, ${isDimMode ? '#0A0A0A' : '#0D7A7D'})` }}>
        <div className="text-center text-white">
          <FontAwesomeIcon icon={faGlobeAfrica} className="text-4xl md:text-6xl block mb-2" style={{ color: isDimMode ? colors.primary : 'white' }} />
          <p className="text-sm md:text-base font-semibold">{media.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden group">
      <div className="w-full h-full relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: isDimMode ? '#1A1A1A' : '#139EA2' }}>
            <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: isDimMode ? colors.primary : 'white' }}></div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={media.title}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"></div>

      {media.category && (
        <div className="absolute top-3 left-3 z-10">
          <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full border border-white/20 ${isDimMode ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm'}`}>
            {media.category}
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <h3 className={`font-bold text-white ${cardType === 'short' ? 'text-sm md:text-base' : 'text-lg md:text-2xl'} mb-1`}>
          {media.title}
        </h3>
        {media.description && (
          <p className={`text-white/80 ${cardType === 'short' ? 'text-xs md:text-sm' : 'text-sm md:text-base'} line-clamp-2`}>
            {media.description}
          </p>
        )}
        {hasSocialLink ? (
          <a
            href={media.social_link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 font-semibold hover:underline transition-colors duration-300 ${cardType === 'short' ? 'text-xs md:text-sm' : 'text-sm md:text-base'} mt-1`}
            style={{ color: isDimMode ? colors.primary : '#139EA2' }}
          >
            <i className={`fab ${media.social_icon || 'fa-share-alt'}`}></i>
            {media.social_button_text || `View on ${media.social_platform || 'Social'}`}
            <FontAwesomeIcon icon={faArrowRight} className={cardType === 'short' ? 'w-3 h-3' : 'w-4 h-4'} />
          </a>
        ) : (
          <span className={`text-white/70 ${cardType === 'short' ? 'text-xs md:text-sm' : 'text-sm md:text-base'} mt-1 block`}>
            {media.description || 'Explore Ghana'}
          </span>
        )}
      </div>
    </div>
  );
};

// ===== VIDEO PLAYER COMPONENT =====
const VideoPlayer = ({ video, isDimMode, videoRefs, isVisible, onPlayPause, cardType, colors }: any) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const isYouTube = video.video_url && (video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be'));
  const isCloudflare = video.video_url && video.video_url.includes('cloudflarestream.com');
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(video.video_url, true) : null;
  const cfVideoId = isCloudflare ? getCloudflareVideoId(video.video_url) : null;

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const videoEl = videoRefs.current[String(video.id)];
    if (!videoEl) return;

    if (videoEl.paused) {
      videoEl.play().catch(() => { });
      setIsPlaying(true);
      if (onPlayPause) onPlayPause(video.id, 'playing');
    } else {
      videoEl.pause();
      setIsPlaying(false);
      if (onPlayPause) onPlayPause(video.id, 'paused');
    }
  }, [video.id, videoRefs, onPlayPause]);

  useEffect(() => {
    if (!isYouTube && !isCloudflare) {
      const videoEl = videoRefs.current[String(video.id)];
      if (!videoEl) return;

      const handleEnded = () => {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => { });
        setIsPlaying(true);
      };

      videoEl.addEventListener('ended', handleEnded);

      if (isVisible) {
        videoEl.play().catch(() => { });
        setIsPlaying(true);
      } else {
        videoEl.pause();
        setIsPlaying(false);
      }

      return () => {
        videoEl.removeEventListener('ended', handleEnded);
      };
    }
  }, [isVisible, video.id, isYouTube, isCloudflare, videoRefs]);

  useEffect(() => {
    if (!isYouTube && !isCloudflare) {
      const videoEl = videoRefs.current[String(video.id)];
      if (!videoEl) return;

      const handleMouseEnter = () => {
        setIsHovering(true);
        if (!videoEl.paused) {
          videoEl.pause();
          setIsPlaying(false);
        }
      };

      const handleMouseLeave = () => {
        setIsHovering(false);
        if (videoEl.paused && videoEl.currentTime > 0) {
          videoEl.play().catch(() => { });
          setIsPlaying(true);
        }
      };

      const container = videoEl.closest('.relative');
      if (container) {
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);
        return () => {
          container.removeEventListener('mouseenter', handleMouseEnter);
          container.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    }
  }, [video.id, isYouTube, isCloudflare, videoRefs]);

  // These early returns used to sit above the hooks below. React requires
  // hooks to run in the same order on every render, so returning before them
  // crashed this component whenever a card's media type changed between
  // renders. They now run after every hook. The hooks do nothing when there
  // is no video element, so what renders is unchanged.
  if (video.media_type === 'image' || (video.image_url && !video.video_url)) {
    return <ImageDisplay media={video} isDimMode={isDimMode} cardType={cardType} colors={colors} />;
  }

  if (video.media_type === 'none' || (!video.video_url && !video.image_url)) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${isDimMode ? '#1A1A1A' : '#139EA2'}, ${isDimMode ? '#0A0A0A' : '#0D7A7D'})` }}>
        <div className="text-center text-white">
          <FontAwesomeIcon icon={faGlobeAfrica} className="text-4xl md:text-6xl block mb-2" style={{ color: isDimMode ? colors.primary : 'white' }} />
          <p className="text-sm md:text-base font-semibold">{video.title}</p>
          {video.description && (
            <p className="text-xs md:text-sm text-white/80 max-w-xs mx-auto">{video.description}</p>
          )}
        </div>
      </div>
    );
  }

  if (isYouTube && embedUrl) {
    return (
      <div className="w-full h-full relative">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={false}
        />
        <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>

        {video.category && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full border border-white/20 ${isDimMode ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm'}`}>
              {video.category}
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <h3 className={`font-bold text-white ${cardType === 'short' ? 'text-sm md:text-base' : 'text-lg md:text-2xl'} mb-1`}>
            {video.title}
          </h3>
          {video.description && (
            <p className={`text-white/80 ${cardType === 'short' ? 'text-xs md:text-sm' : 'text-sm md:text-base'} mb-2 line-clamp-2`}>
              {video.description}
            </p>
          )}
          <a
            href={video.video_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 font-semibold hover:underline transition-colors duration-300 ${cardType === 'short' ? 'text-xs md:text-sm' : 'text-sm md:text-base'}`}
            style={{ color: isDimMode ? colors.primary : '#139EA2' }}
          >
            Watch Video
            <FontAwesomeIcon icon={faArrowRight} className={cardType === 'short' ? 'w-3 h-3' : 'w-4 h-4'} />
          </a>
        </div>
      </div>
    );
  }

  if (isCloudflare && cfVideoId) {
    const posterUrl = video.thumbnail || video.image_url || '';
    const iframeUrl = getCloudflareIframeUrl(cfVideoId, posterUrl);

    return (
      <div className="w-full h-full relative overflow-hidden">
        <iframe
          src={iframeUrl}
          className="w-full h-full block"
          style={{
            width: '100%',
            height: '100%',
            minWidth: '100%',
            minHeight: '100%',
            border: 'none',
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen={false}
        />

        <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>

        {video.category && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full border border-white/20 ${isDimMode ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm'}`}>
              {video.category}
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
          <h3 className={`font-bold text-white ${cardType === 'short' ? 'text-sm md:text-base' : 'text-lg md:text-2xl'} mb-1`}>
            {video.title}
          </h3>
          {video.description && (
            <p className={`text-white/80 ${cardType === 'short' ? 'text-xs md:text-sm' : 'text-sm md:text-base'} mb-2 line-clamp-2`}>
              {video.description}
            </p>
          )}
          <a
            href={video.video_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 font-semibold hover:underline transition-colors duration-300 ${cardType === 'short' ? 'text-xs md:text-sm' : 'text-sm md:text-base'} pointer-events-auto`}
            style={{ color: isDimMode ? colors.primary : '#139EA2' }}
          >
            Watch Video
            <FontAwesomeIcon icon={faArrowRight} className={cardType === 'short' ? 'w-3 h-3' : 'w-4 h-4'} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group overflow-hidden">
      <video
        ref={el => {
          if (el) {
            videoRefs.current[String(video.id)] = el;
            el.muted = true;
          }
        }}
        className="w-full h-full object-cover"
        muted
        playsInline
        poster={video.thumbnail || ''}
        preload="metadata"
        autoPlay={false}
      >
        <source src={video.video_url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"></div>

      {video.category && (
        <div className="absolute top-3 left-3 z-10">
          <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full border border-white/20 ${isDimMode ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm'}`}>
            {video.category}
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <h3 className={`font-bold text-white ${cardType === 'short' ? 'text-sm md:text-base' : 'text-lg md:text-2xl'} mb-1`}>
          {video.title}
        </h3>
        {video.description && (
          <p className={`text-white/80 ${cardType === 'short' ? 'text-xs md:text-sm' : 'text-sm md:text-base'} mb-2 line-clamp-2`}>
            {video.description}
          </p>
        )}
        <a
          href={video.video_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 font-semibold hover:underline transition-colors duration-300 ${cardType === 'short' ? 'text-xs md:text-sm' : 'text-sm md:text-base'}`}
          style={{ color: isDimMode ? colors.primary : '#139EA2' }}
        >
          Watch Video
          <FontAwesomeIcon icon={faArrowRight} className={cardType === 'short' ? 'w-3 h-3' : 'w-4 h-4'} />
        </a>
      </div>
    </div>
  );
};

// ===== MAIN HOME PAGE =====
function HomePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [tourCategories, setTourCategories] = useState<TourCategory[]>([]);
  const [mainCards, setMainCards] = useState<MainFeatureCard[]>([]);
  const [smallCards, setSmallCards] = useState<SmallGlassCard[]>([]);
  const [videoSection, setVideoSection] = useState<VideoSection[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isDimMode, setIsDimMode] = useState(false);
  const [visibleVideos, setVisibleVideos] = useState<Set<string>>(new Set());
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const observerRefs = useRef<{ [key: string]: IntersectionObserver }>({});
  const [scrollIndexes, setScrollIndexes] = useState<{ [key: number]: number }>({});

  // Get colors based on mode
  const colors = isDimMode ? COLORS.dark : COLORS.light;

  // ===== FETCH ALL DATA =====
  const fetchAllData = useCallback(async () => {
    try {
      const supabase = createBrowserClient();
      const [slidesRes, toursRes, categoriesRes, mainCardsRes, smallCardsRes, videoRes] = await Promise.all([
        supabase.from('homepage_slides').select('*').order('sort_order'),
        supabase.from('tours').select('*, tour_categories(name)').order('is_featured', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('tour_categories').select('id, name, slug').order('sort_order'),
        supabase.from('main_feature_cards').select('*').order('sort_order'),
        supabase.from('small_glass_cards').select('*').order('sort_order'),
        supabase.from('video_sections').select('*').order('sort_order'),
      ]);

      if (!slidesRes.error) {
        setSlides(slidesRes.data.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: s.subtitle,
          description: s.description,
          image: s.image_url || '/images/placeholder-slide.jpg',
          button_text: s.button_text,
          button_link: s.button_link,
        })));
      }
      if (!toursRes.error) {
        const toursData: Destination[] = toursRes.data.map((t) => {
          const mediaType = t.video_url ? 'video' : t.featured_image_url ? 'image' : 'none';
          const finalPrice = t.discount_price ? t.discount_price : t.price;
          return {
            id: t.id,
            title: t.title,
            slug: t.slug,
            short_description: t.short_description || (t.description ? t.description.slice(0, 100) : ''),
            description: t.description,
            category: t.tour_categories?.name ?? 'Nature',
            location: t.location || 'Ghana',
            region: t.region || t.location || 'Ghana',
            featured_image: t.featured_image_url,
            video_url: t.video_url,
            video_thumbnail: mediaType === 'video' ? getTourVideoThumbnail(t.video_url) : null,
            media_type: mediaType,
            rating: Number(t.rating) || 0,
            review_count: t.review_count || 0,
            price: Number(finalPrice) || 0,
          };
        });
        setDestinations(toursData);
        setFilteredDestinations(toursData.slice(0, 4));
      }
      if (!categoriesRes.error) setTourCategories(categoriesRes.data);
      if (!mainCardsRes.error) {
        // desktop_card_height and desktop_card_width have no columns and are left undefined.
        setMainCards(mainCardsRes.data.map((c) => ({
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
        })));
      }
      if (!smallCardsRes.error) {
        setSmallCards(smallCardsRes.data.map((c) => {
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
        }));
      }
      if (!videoRes.error) {
        const videoData = videoRes.data.map((v) => ({
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
        const processedData = videoData.map((v: any) => ({
          ...v,
          image_url: v.image_url || '',
          video_url: v.video_url || '',
          media_type: v.media_type || (v.image_url ? 'image' : (v.video_url ? 'video' : 'none')),
        }));
        setVideoSection(processedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  // ===== INITIAL DATA LOAD =====
  useEffect(() => {
    const loadData = async () => {
      // Only show loading on first load
      if (!hasLoadedOnce) {
        setLoading(true);
        await fetchAllData();
        setLoading(false);
        setHasLoadedOnce(true);
      } else {
        // Just refresh data without showing loading
        await fetchAllData();
      }
    };
    loadData();
  }, [fetchAllData, hasLoadedOnce]);

  // ===== REFRESH DATA ON VISIBILITY CHANGE =====
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchAllData]);

  // ===== AUTH FUNCTIONS =====
  const fetchUserStatus = useCallback(async () => {
    try {
      const data = await getAuthStatus();
      setIsAuthenticated(data.is_authenticated);
      setUser(data.user ?? null);
      if (data.is_authenticated && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      const { success } = await logoutUser();
      if (success) {
        setIsAuthenticated(false);
        setUser(null);
        setShowDropdown(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  // ===== THEME DETECTION =====
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDimMode(theme === 'dim' || theme === 'dark');
    };
    checkTheme();
    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // ===== FETCH USER STATUS =====
  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  // ===== REFRESH USER WHEN COMING BACK FROM VERIFICATION =====
  useEffect(() => {
    const justVerified = sessionStorage.getItem('just_verified');
    if (justVerified) {
      sessionStorage.removeItem('just_verified');
      fetchUserStatus();
    }
  }, [fetchUserStatus]);

  // ===== INTERSECTION OBSERVER FOR AUTO-PLAY =====
  useEffect(() => {
    Object.values(observerRefs.current).forEach(observer => observer.disconnect());
    observerRefs.current = {};

    const videoElements = Object.entries(videoRefs.current).filter(
      ([_, el]) => el !== null
    ) as [string, HTMLVideoElement][];

    videoElements.forEach(([id, video]) => {
      const observer = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          entries.forEach((entry: IntersectionObserverEntry) => {
            const videoId = id;
            if (entry.isIntersecting) {
              video.play().catch(() => { });
              setVisibleVideos((prev: Set<string>) => new Set(prev).add(videoId));
            } else {
              video.pause();
              setVisibleVideos((prev: Set<string>) => {
                const newSet = new Set(prev);
                newSet.delete(videoId);
                return newSet;
              });
            }
          });
        },
        {
          threshold: 0.2,
          rootMargin: '0px 0px -50px 0px',
        }
      );

      const container = video.closest('.relative');
      if (container) {
        observer.observe(container);
        observerRefs.current[String(video.id)] = observer;
      }
    });

    return () => {
      Object.values(observerRefs.current).forEach(observer => observer.disconnect());
      videoElements.forEach(([_, video]) => {
        video.pause();
      });
    };
  }, [videoSection]);

  // ===== AUTO-SLIDE =====
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // ===== FILTER DESTINATIONS =====
  useEffect(() => {
    if (activeCategory === 'All') {
      setFilteredDestinations(destinations.slice(0, 4));
    } else {
      setFilteredDestinations(
        destinations
          .filter(d => d.category === activeCategory)
          .slice(0, 4)
      );
    }
  }, [activeCategory, destinations]);

  // ===== GROUP SMALL CARDS =====
  const smallCardsByMainCard = smallCards.reduce((acc, card) => {
    if (card.main_card_id) {
      if (!acc[card.main_card_id]) acc[card.main_card_id] = [];
      acc[card.main_card_id]?.push(card);
    }
    return acc;
  }, {} as Record<string, SmallGlassCard[]>);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const getAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const getSizeClass = (size: string) => {
    const sizes: Record<string, string> = {
      'text-xs': 'text-xs',
      'text-sm': 'text-sm',
      'text-base': 'text-base',
      'text-lg': 'text-lg',
      'text-xl': 'text-xl',
      'text-2xl': 'text-2xl',
    };
    return sizes[size] || 'text-sm';
  };

  if (loading) {
    return <Loading fullPage={true} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300`} style={{ background: isDimMode ? colors.background : colors.background }}>
      {/* Hero Slider Section */}
      <section className="relative h-[70vh] min-h-[400px] md:h-[85vh] overflow-hidden">
        <div className="relative h-full">
          <div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {slides.map((slide, idx) => (
              <div key={slide.id} className="w-full flex-shrink-0 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 z-10"></div>
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${slide.image})` }}></div>
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
                  <h5 className="text-xs md:text-sm lg:text-base tracking-[0.2em] mb-3 opacity-90 font-semibold uppercase" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                    {slide.subtitle || ''}
                  </h5>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 max-w-4xl leading-tight drop-shadow-lg">
                    {slide.title}
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg max-w-2xl mb-6 opacity-95 font-medium leading-relaxed drop-shadow-md line-clamp-2">
                    {slide.description}
                  </p>
                  <Link
                    href={slide.button_link}
                    className="inline-flex items-center gap-2.5 px-6 py-3 md:px-7 md:py-3.5 rounded-full font-semibold text-sm md:text-base transition-all duration-300 hover:scale-105 shadow-lg"
                    style={{
                      background: isDimMode ? colors.primary : '#139EA2',
                      color: isDimMode ? '#0A0A0A' : 'white',
                      boxShadow: isDimMode ? `0 8px 25px ${colors.primary}40` : `0 8px 25px #139EA240`
                    }}
                  >
                    {slide.button_text}
                    <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 hover:scale-110"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-white text-lg md:text-xl" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 hover:scale-110"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-white text-lg md:text-xl" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-8' : 'w-2 bg-white/50 hover:bg-white/70'}`}
                    style={{ background: currentSlide === idx ? (isDimMode ? colors.primary : '#139EA2') : 'rgba(255,255,255,0.5)' }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Video Section */}
      <section className="py-12 md:py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-10">
          <div className="relative inline-block">
            <span className="text-sm font-semibold tracking-widest uppercase block mb-2" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
              Discover
            </span>
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-3 relative z-10`} style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
              <span style={{ color: isDimMode ? colors.primary : '#139EA2' }}>Explore</span>
              <span className="ml-2">Ghana's</span>
              <br className="sm:hidden" />
              <span>Wonders</span>
            </h2>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full" style={{ background: isDimMode ? colors.primary : '#139EA2' }}></div>
          </div>
          <p className={`text-sm md:text-base max-w-2xl mx-auto mt-4`} style={{ color: isDimMode ? colors.textSecondary : '#4A4A4A' }}>
            Discover the rich culture, breathtaking landscapes, and historical landmarks through immersive video and image experiences.
          </p>
        </div>

        <div className="w-full">
          {videoSection && videoSection.length > 0 ? (
            <>
              {videoSection.filter(v => v.card_type === 'wide' || !v.card_type).length > 0 && (
                <div className="space-y-6 md:space-y-8 mb-8">
                  {videoSection.filter(v => v.card_type === 'wide' || !v.card_type).map((video) => (
                    <div
                      key={video.id}
                      className="rounded-xl overflow-hidden shadow-lg group hover:shadow-2xl transition-all duration-300 w-full border"
                      style={{
                        background: isDimMode ? colors.backgroundAlt : '#FFFFFF',
                        borderColor: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.15)',
                        aspectRatio: '5/1',
                        minHeight: '400px',
                        maxHeight: '600px',
                      }}
                    >
                      <div className="relative w-full h-full">
                        <VideoPlayer
                          video={video}
                          isDimMode={isDimMode}
                          videoRefs={videoRefs}
                          isVisible={visibleVideos.has(String(video.id))}
                          cardType="wide"
                          colors={colors}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {videoSection.filter(v => v.card_type === 'short').length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {videoSection.filter(v => v.card_type === 'short').map((video) => (
                    <div
                      key={video.id}
                      className="rounded-xl overflow-hidden shadow-lg group hover:shadow-2xl transition-all duration-300 border"
                      style={{
                        background: isDimMode ? colors.backgroundAlt : '#FFFFFF',
                        borderColor: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.15)',
                        aspectRatio: '16/9',
                      }}
                    >
                      <div className="relative w-full h-full">
                        <VideoPlayer
                          video={video}
                          isDimMode={isDimMode}
                          videoRefs={videoRefs}
                          isVisible={visibleVideos.has(String(video.id))}
                          cardType="short"
                          colors={colors}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg" style={{ color: isDimMode ? colors.textSecondary : '#4A4A4A' }}>
                No media available. Check back soon!
              </p>
            </div>
          )}
        </div>

        <div className="text-center mt-10 md:mt-12">
          <Link
            href="/destinations"
            className="inline-flex items-center gap-3 font-bold text-sm md:text-base px-8 py-3.5 rounded-full shadow-lg transition-all duration-300 group hover:scale-105"
            style={{
              background: isDimMode ? colors.primary : '#139EA2',
              color: isDimMode ? '#0A0A0A' : 'white',
              boxShadow: isDimMode ? `0 8px 25px ${colors.primary}40` : `0 8px 25px #139EA240`
            }}
          >
            <span>Show More Destinations</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Main Feature Cards */}
      {mainCards.length > 0 && (
        <section className="py-8 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col gap-6 md:gap-10">
              {mainCards.map((card) => {
                const smallCardsList = smallCardsByMainCard[card.id] || [];
                const hasButton = card.button_text && card.button_text.trim() !== '';

                return (
                  <div key={card.id} className="w-full">
                    <div
                      className="relative rounded-2xl overflow-hidden shadow-xl w-full border"
                      style={{
                        height: '650px',
                        minHeight: '500px',
                        maxHeight: '600px',
                        background: isDimMode ? colors.backgroundAlt : '#0A0A0A',
                        borderColor: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.15)',
                      }}
                    >
                      <div className="absolute inset-0 w-full h-full">
                        {card.image ? (
                          <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-[#1A1A2E] to-[#0A0A0F]"></div>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                      <div className="relative z-10 h-full flex flex-col justify-end p-4 md:p-8">
                        <div className="mb-3">
                          <h2
                            className="font-bold text-white text-xl md:text-3xl lg:text-4xl"
                            style={{ color: card.title_color || '#ffffff' }}
                          >
                            {card.title}
                          </h2>
                          {card.subtitle && (
                            <h3
                              className="font-semibold text-base md:text-xl"
                              style={{ color: isDimMode ? colors.primary : '#139EA2' }}
                            >
                              {card.subtitle}
                            </h3>
                          )}
                          {card.description && (
                            <p
                              className="text-white/80 max-w-2xl text-xs md:text-sm line-clamp-2"
                              style={{ color: card.description_color || '#e5e7eb' }}
                            >
                              {card.description}
                            </p>
                          )}
                        </div>

                        {smallCardsList.length > 0 && (
                          <div className="mb-3 w-full">
                            <div
                              className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                              style={{
                                scrollSnapType: 'x mandatory',
                                WebkitOverflowScrolling: 'touch',
                              }}
                            >
                              {smallCardsList.map((smallCard) => {
                                const titleAlign = smallCard.title_alignment || 'center';
                                const descAlign = smallCard.description_alignment || 'center';
                                const titleSize = getSizeClass(smallCard.title_size || 'text-base');
                                const descSize = getSizeClass(smallCard.description_size || 'text-sm');

                                return (
                                  <div
                                    key={smallCard.id}
                                    className={`flex-shrink-0 w-[85vw] sm:w-[320px] md:w-[380px] p-5 md:p-6 rounded-xl backdrop-blur-md border hover:scale-105 flex flex-col ${getAlignmentClass(titleAlign)}`}
                                    style={{
                                      scrollSnapAlign: 'start',
                                      minHeight: '220px',
                                      maxHeight: '320px',
                                      background: isDimMode ? 'rgba(26,26,26,0.8)' : 'rgba(255,255,255,0.1)',
                                      borderColor: isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.2)',
                                    }}
                                  >
                                    {smallCard.icon && (
                                      <div className={`text-3xl md:text-4xl mb-2 ${titleAlign === 'center' ? 'self-center' : titleAlign === 'right' ? 'self-end' : 'self-start'}`}>
                                        {smallCard.icon_type === 'image' ? (
                                          <img
                                            src={smallCard.icon}
                                            alt={smallCard.title}
                                            className="w-10 h-10 md:w-12 md:h-12 object-contain"
                                          />
                                        ) : (
                                          <span>{smallCard.icon}</span>
                                        )}
                                      </div>
                                    )}

                                    <h4
                                      className={`font-bold text-white ${titleSize} ${titleAlign === 'center' ? 'text-center' : titleAlign === 'right' ? 'text-right' : 'text-left'} w-full`}
                                      style={{
                                        color: smallCard.title_color || '#ffffff',
                                      }}
                                    >
                                      {smallCard.title}
                                    </h4>

                                    {smallCard.description && (
                                      <p
                                        className={`text-white/80 ${descSize} mt-2 w-full ${descAlign === 'center' ? 'text-center' : descAlign === 'right' ? 'text-right' : 'text-left'} flex-1`}
                                        style={{
                                          color: smallCard.description_color || 'rgba(255,255,255,0.8)',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 5,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          lineHeight: '1.6',
                                        }}
                                      >
                                        {smallCard.description}
                                      </p>
                                    )}

                                    {smallCard.button_text && (
                                      <Link
                                        href={smallCard.button_link || '#'}
                                        className={`inline-flex items-center gap-1 font-semibold text-sm md:text-base mt-3 transition-all hover:gap-2 ${titleAlign === 'center' ? 'self-center' : titleAlign === 'right' ? 'self-end' : 'self-start'}`}
                                        style={{ color: isDimMode ? colors.primary : '#139EA2' }}
                                      >
                                        {smallCard.button_text}
                                        <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 md:w-4 md:h-4" />
                                      </Link>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {hasButton && (
                          <Link
                            href={card.button_link}
                            className="inline-flex items-center gap-2 rounded-full font-semibold transition hover:scale-105 self-start px-5 py-2.5 text-sm md:text-base"
                            style={{
                              background: isDimMode ? colors.primary : '#139EA2',
                              color: isDimMode ? '#0A0A0A' : 'white',
                            }}
                          >
                            {card.button_text}
                            <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 md:w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== BRAND FOOTER ===== */}
      <footer className={`py-6 text-center border-t`} style={{
        background: isDimMode ? colors.background : '#FFFFFF',
        borderColor: isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)'
      }}>
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs" style={{ color: isDimMode ? colors.textSecondary : '#4A4A4A' }}>
            <span style={{ color: isDimMode ? colors.primary : '#139EA2' }}>--</span> TechTour Ghana · Tourism at your finger-tip <span style={{ color: isDimMode ? colors.primary : '#139EA2' }}>--</span>
          </p>
        </div>
      </footer>

      {/* Back to Top, using shared component */}
      <BackToTop accentColor="teal" />
    </div>
  );
}

// ===== EXPORT WITH SEARCH PARAMS WRAPPER =====
export default function HomePageWrapper() {
  return (
    <SearchParamsWrapper>
      <HomePage />
    </SearchParamsWrapper>
  );
}