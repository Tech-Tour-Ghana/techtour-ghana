// app/market/artisans/page.tsx

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUp,
  faSearch,
  faTimes,
  faUser,
  faMapMarkerAlt,
  faStar,
  faCrown,
  faStore,
  faLightbulb,
  faUsers,
  faChevronRight,
  faGlobe,
  faEnvelope,
  faPhone,
  faHeart,
  faShare,
  faExternalLinkAlt,
  faArrowLeft,
  faFilter,
  faThLarge,
  faList,
  faInfoCircle,
  faBriefcase,
  faUserCircle,
} from '@fortawesome/free-solid-svg-icons';
// Import brand icons from the brands package
import {
  faInstagram,
  faFacebook,
  faTwitter,
} from '@fortawesome/free-brands-svg-icons';
import SearchParamsWrapper from '@/components/SearchParamsWrapper';
import Loading from '@/components/Loading';
import { createBrowserClient } from '@/lib/supabase/client';

// ===== BRAND COLORS =====
const COLORS = {
  light: {
    primary: '#139EA2',
    primaryHover: '#0D7A7D',
    primaryLight: '#E6F4F5',
    secondary: '#E6A64D',
    secondaryHover: '#D4953A',
    secondaryLight: '#FDF3E6',
    textPrimary: '#000000',
    textSecondary: '#4A4A4A',
    textMuted: '#9CA3AF',
    background: '#FFFFFF',
    backgroundAlt: '#F9F9F9',
    backgroundCard: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    shadow: 'rgba(0,0,0,0.08)',
    shadowHover: 'rgba(0,0,0,0.15)',
  },
  dark: {
    primary: '#E6A64D',
    primaryHover: '#D4953A',
    primaryLight: '#2A2218',
    secondary: '#139EA2',
    secondaryHover: '#0D7A7D',
    secondaryLight: '#1A2A2B',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#6B7280',
    background: '#0A0A0A',
    backgroundAlt: '#1A1A1A',
    backgroundCard: '#1A1A1A',
    border: '#2A2A2A',
    borderLight: '#222222',
    shadow: 'rgba(0,0,0,0.3)',
    shadowHover: 'rgba(0,0,0,0.5)',
  }
};

// ===== SUB-NAVIGATION LINKS =====
const SUB_NAV_LINKS = [
  { name: 'Market Center', path: '/market', icon: faStore },
  { name: 'Tech & Innovation', path: '/market/tech-innovation', icon: faLightbulb },
  { name: 'Artisan Spotlight', path: '/market/artisans', icon: faCrown },
];

// ===== INTERFACES =====
interface Artisan {
  id: string;
  name: string;
  slug: string;
  title: string;
  bio: string;
  location: string;
  profile_image: string;
  profile_image_url: string;
  cover_image: string;
  cover_image_url: string;
  craft_type: string;
  specialties: string;
  years_of_experience: number;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  facebook: string;
  twitter: string;
  is_featured: boolean;
  is_active: boolean;
  order: number;
  market_products?: MarketProduct[];
  market_product_count?: number;
}

interface MarketProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discount_price?: number | null;
  image?: string;
  image_url?: string;
  category_name?: string;
  is_in_stock?: boolean;
  stock_quantity?: number;
  is_featured?: boolean;
  artisan_name?: string;
}

interface ArtisanStats {
  total_artisans: number;
  featured_artisans: number;
  total_products: number;
  craft_counts: { craft_type: string; count: number }[];
}

// ===== MAIN PAGE =====
function ArtisansPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isDimMode, setIsDimMode] = useState(false);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [stats, setStats] = useState<ArtisanStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCraft, setSelectedCraft] = useState('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal state
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);

  const colors = isDimMode ? COLORS.dark : COLORS.light;

  // ===== FETCH DATA =====
  // Ported from GET /artisans/ (Artisan table, is_active=true, with embedded
  // market_products and a market_product_count) and /artisan-stats/, which
  // aggregated total/featured artisan counts and craft type counts. The old
  // stats endpoint also returned total_products/in_stock_products from a
  // separate ArtisanProduct table that this schema does not have; the UI never
  // rendered those figures, so they are left out rather than invented.
  const fetchData = useCallback(async () => {
    try {
      const supabase = createBrowserClient();

      const { data, error } = await supabase
        .from('artisans')
        .select('*, market_products(id, title, slug, description, price, discount_price, stock_quantity, is_in_stock, is_active, is_featured, sort_order, image_url, artisan_id, category_id, market_categories(name))')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        const mapped: Artisan[] = data.map((a: any) => {
          // The old market_product_count summed ALL of the artisan's products
          // (model related_name market_products.count()), not just active
          // ones, even though the list below only shows active products.
          // Reproduced as-is rather than "fixed".
          const allProducts = a.market_products || [];
          const activeProducts = allProducts.filter((p: any) => p.is_active !== false);
          return {
            id: a.id,
            name: a.name,
            slug: a.slug,
            title: a.title,
            bio: a.bio,
            location: a.location,
            profile_image: a.profile_image_url,
            profile_image_url: a.profile_image_url,
            cover_image: a.cover_image_url,
            cover_image_url: a.cover_image_url,
            craft_type: a.craft_type,
            specialties: a.specialties,
            years_of_experience: a.years_of_experience,
            email: a.email,
            phone: a.phone,
            website: a.website,
            instagram: a.instagram,
            facebook: a.facebook,
            twitter: a.twitter,
            is_featured: a.is_featured,
            is_active: a.is_active,
            order: a.sort_order,
            market_products: activeProducts
              .sort((x: any, y: any) => (x.sort_order || 0) - (y.sort_order || 0))
              .map((p: any) => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                description: p.description,
                price: p.price,
                discount_price: p.discount_price,
                image_url: p.image_url,
                category_name: p.market_categories?.name || null,
                is_in_stock: p.is_in_stock,
                stock_quantity: p.stock_quantity,
                is_featured: p.is_featured,
                artisan_name: a.name,
              })),
            market_product_count: allProducts.length,
          };
        });
        setArtisans(mapped);

        const craftCounts = new Map<string, number>();
        mapped.forEach((a) => {
          if (a.craft_type) craftCounts.set(a.craft_type, (craftCounts.get(a.craft_type) || 0) + 1);
        });

        setStats({
          total_artisans: mapped.length,
          featured_artisans: mapped.filter((a) => a.is_featured).length,
          total_products: mapped.reduce((sum, a) => sum + (a.market_product_count || 0), 0),
          craft_counts: Array.from(craftCounts.entries()).map(([craft_type, count]) => ({ craft_type, count })),
        });
      }
    } catch (error) {
      console.error('Error fetching artisans data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // ===== SCROLL DETECTION =====
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ===== LOAD DATA =====
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // ===== OPEN ARTISAN FROM URL PARAMETER =====
  useEffect(() => {
    const artisanSlug = searchParams.get('artisan');
    if (artisanSlug && artisans.length > 0) {
      const artisan = artisans.find(a =>
        a.slug === artisanSlug || String(a.id) === artisanSlug
      );
      if (artisan) {
        setSelectedArtisan(artisan);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [searchParams, artisans]);

  // ===== FILTER ARTISANS =====
  const filteredArtisans = artisans.filter((artisan) => {
    const matchesSearch = searchTerm === '' ||
      artisan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artisan.craft_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artisan.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCraft = selectedCraft === 'all' || artisan.craft_type === selectedCraft;
    return matchesSearch && matchesCraft;
  });

  // ===== GET UNIQUE CRAFT TYPES =====
  const craftTypes = ['all', ...new Set(artisans.map(a => a.craft_type).filter(Boolean))];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== CLICK HANDLERS =====
  const handleArtisanClick = (artisan: Artisan) => {
    setSelectedArtisan(artisan);
  };

  const closeModal = () => {
    setSelectedArtisan(null);
  };

  if (loading) {
    return <Loading fullPage={true} />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: isDimMode ? colors.background : colors.background }}>

      {/* ===== SUB-NAVIGATION ===== */}
      <div className="sticky top-0 z-40 border-b" style={{
        background: isDimMode ? colors.backgroundAlt : '#FFFFFF',
        borderColor: isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)',
      }}>
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-thin scrollbar-thumb-white/20">
            {SUB_NAV_LINKS.map((link) => {
              const isActive = link.path === '/market/artisans';
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive ? 'bg-opacity-10' : 'hover:bg-opacity-5'
                    }`}
                  style={{
                    background: isActive
                      ? (isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)')
                      : 'transparent',
                    color: isActive
                      ? (isDimMode ? colors.primary : '#139EA2')
                      : (isDimMode ? colors.textSecondary : colors.textSecondary),
                  }}
                >
                  <FontAwesomeIcon icon={link.icon} className="w-4 h-4" />
                  {link.name}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: isDimMode ? colors.primary : '#139EA2' }} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: isDimMode
            ? 'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 100%)'
            : 'linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%)',
        }} />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20 text-white">
                  <FontAwesomeIcon icon={faCrown} className="mr-1" />
                  Artisan Spotlight
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20 text-white">
                  {stats?.total_artisans || 0} Artisans
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                <span style={{ color: isDimMode ? colors.primary : '#E6A64D' }}>Artisan</span> Spotlight
              </h1>
              <p className="text-white/80 text-base md:text-lg mt-2 max-w-lg">
                Meet the talented Ghanaian artisans behind the authentic crafts.
                Discover their stories, traditions, and creations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/market"
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  background: isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <FontAwesomeIcon icon={faStore} className="mr-2" />
                Visit Market
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Artisans', value: stats?.total_artisans || 0, icon: faUsers },
            { label: 'Featured', value: stats?.featured_artisans || 0, icon: faStar },
            { label: 'Products', value: stats?.total_products || 0, icon: faStore },
            { label: 'Craft Types', value: craftTypes.length - 1 || 0, icon: faLightbulb },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4 text-center transition-all duration-300 hover:scale-105"
              style={{
                background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)'}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              }}
            >
              <FontAwesomeIcon
                icon={stat.icon}
                className="text-2xl mb-1"
                style={{ color: isDimMode ? colors.primary : '#139EA2' }}
              />
              <div className="text-2xl font-bold" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="max-w-7xl mx-auto px-4 py-6 mt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}
            />
            <input
              type="text"
              placeholder="Search artisans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                color: isDimMode ? colors.textPrimary : colors.textPrimary,
                outline: 'none',
              }}
            />
          </div>

          {/* Craft Type Filters */}
          <div className="flex flex-wrap gap-2">
            {craftTypes.slice(0, 6).map((craft) => (
              <button
                key={craft}
                onClick={() => setSelectedCraft(craft)}
                className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 capitalize ${selectedCraft === craft ? 'font-semibold' : ''}`}
                style={{
                  background: selectedCraft === craft
                    ? (isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)')
                    : 'transparent',
                  color: selectedCraft === craft
                    ? (isDimMode ? colors.primary : '#139EA2')
                    : (isDimMode ? colors.textSecondary : colors.textSecondary),
                  border: selectedCraft === craft
                    ? `1px solid ${isDimMode ? colors.primary : '#139EA2'}`
                    : `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                  outline: 'none',
                }}
              >
                {craft === 'all' ? 'All Crafts' : craft}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg overflow-hidden border" style={{
            borderColor: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
          }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 transition-all duration-200 ${viewMode === 'grid' ? 'text-white' : ''}`}
              style={{
                background: viewMode === 'grid'
                  ? (isDimMode ? colors.primary : '#139EA2')
                  : 'transparent',
                color: viewMode === 'grid'
                  ? (isDimMode ? '#0A0A0A' : 'white')
                  : (isDimMode ? colors.textSecondary : colors.textSecondary),
                outline: 'none',
              }}
            >
              <FontAwesomeIcon icon={faThLarge} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 transition-all duration-200 ${viewMode === 'list' ? 'text-white' : ''}`}
              style={{
                background: viewMode === 'list'
                  ? (isDimMode ? colors.primary : '#139EA2')
                  : 'transparent',
                color: viewMode === 'list'
                  ? (isDimMode ? '#0A0A0A' : 'white')
                  : (isDimMode ? colors.textSecondary : colors.textSecondary),
                outline: 'none',
              }}
            >
              <FontAwesomeIcon icon={faList} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== ARTISANS GRID ===== */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
          <FontAwesomeIcon icon={faUsers} style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
          Meet Our Artisans
          <span className="text-sm font-normal" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
            ({filteredArtisans.length} artisans)
          </span>
        </h2>

        {filteredArtisans.length > 0 ? (
          viewMode === 'grid' ? (
            // ===== GRID VIEW =====
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArtisans.map((artisan) => (
                <div
                  key={artisan.id}
                  onClick={() => handleArtisanClick(artisan)}
                  className="group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
                  style={{
                    background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                    border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)'}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={artisan.profile_image || artisan.profile_image_url || '/placeholder-artisan.jpg'}
                      alt={artisan.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {artisan.is_featured && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 text-xs font-semibold bg-yellow-500 text-black rounded-full">
                          <FontAwesomeIcon icon={faStar} className="mr-1" />
                          Featured
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white">{artisan.name}</h3>
                      <p className="text-white/80 text-sm">{artisan.title || artisan.craft_type}</p>
                      <div className="flex items-center gap-2 mt-1 text-white/60 text-xs">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                        <span>{artisan.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm line-clamp-2" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                      {artisan.bio}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }}>
                      <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                        {artisan.years_of_experience || 0} years experience
                      </span>
                      <span className="text-xs font-medium" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                        Click to view →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // ===== LIST VIEW =====
            <div className="grid grid-cols-1 gap-4">
              {filteredArtisans.map((artisan) => (
                <div
                  key={artisan.id}
                  onClick={() => handleArtisanClick(artisan)}
                  className="group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col sm:flex-row cursor-pointer"
                  style={{
                    background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                    border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)'}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Image - Left side on desktop, full width on mobile */}
                  <div className="relative w-full sm:w-48 md:w-56 lg:w-64 h-48 sm:h-auto sm:aspect-square flex-shrink-0 overflow-hidden">
                    <img
                      src={artisan.profile_image || artisan.profile_image_url || '/placeholder-artisan.jpg'}
                      alt={artisan.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {artisan.is_featured && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-500 text-black rounded-full">
                          <FontAwesomeIcon icon={faStar} className="mr-1" />
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content - Right side on desktop, below image on mobile */}
                  <div className="flex-1 p-4 md:p-5 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-lg md:text-xl" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                            {artisan.name}
                          </h3>
                          <p className="text-sm" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                            {artisan.title || artisan.craft_type}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                              {artisan.location}
                            </span>
                            <span>•</span>
                            <span>{artisan.years_of_experience || 0} years experience</span>
                          </div>
                          {artisan.specialties && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {artisan.specialties.split(',').slice(0, 3).map((spec: string) => (
                                <span key={spec.trim()} className="px-2 py-0.5 text-[10px] rounded-full" style={{
                                  background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                                  color: isDimMode ? colors.textSecondary : colors.textSecondary,
                                }}>
                                  {spec.trim()}
                                </span>
                              ))}
                              {artisan.specialties.split(',').length > 3 && (
                                <span className="px-2 py-0.5 text-[10px] rounded-full" style={{
                                  color: isDimMode ? colors.textMuted : '#9CA3AF',
                                }}>
                                  +{artisan.specialties.split(',').length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-medium flex items-center gap-1" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                            View Profile
                            <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-2 mt-2 hidden md:block" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                        {artisan.bio}
                      </p>
                    </div>
                    {/* Product count badge */}
                    {(artisan.market_product_count || 0) > 0 && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }}>
                        <span className="text-xs flex items-center gap-1" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                          <FontAwesomeIcon icon={faStore} className="w-3 h-3" />
                          {artisan.market_product_count} products available
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
              No artisans found
            </h3>
            <p className="text-sm" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* ===== ARTISAN DETAIL MODAL ===== */}
      {selectedArtisan && (
        <ArtisanDetailModal
          artisan={selectedArtisan}
          onClose={closeModal}
          colors={colors}
          isDimMode={isDimMode}
        />
      )}

      {/* ===== SCROLL TO TOP ===== */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 hover:scale-110"
          style={{
            background: isDimMode ? colors.primary : '#139EA2',
            color: isDimMode ? '#0A0A0A' : 'white',
            outline: 'none',
            border: 'none',
          }}
        >
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      )}
    </div>
  );
}

// ===== ARTISAN DETAIL MODAL WITH 3 TABS =====
function ArtisanDetailModal({ artisan, onClose, colors, isDimMode, API_URL }: any) {
  const [activeTab, setActiveTab] = useState<'profile' | 'about' | 'products'>('profile');
  
  // Use artisan.market_products directly
  const products = artisan.market_products || [];
  const productCount = artisan.market_product_count || products.length;

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Helper to get product image
  const getProductImage = (product: MarketProduct) => {
    return product.image_url || product.image || '/placeholder-product.jpg';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: isDimMode ? colors.background : '#FFFFFF',
          border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.1)'}`,
          animation: 'slideUp 0.3s ease',
          margin: 'auto',
          marginTop: '5vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Image */}
        <div className="relative h-48 md:h-56 overflow-hidden">
          <img
            src={artisan.cover_image || artisan.cover_image_url || artisan.profile_image || '/placeholder-artisan-cover.jpg'}
            alt={artisan.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = '/placeholder-artisan-cover.jpg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Profile Image */}
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white overflow-hidden shadow-xl">
              <img
                src={artisan.profile_image || artisan.profile_image_url || '/placeholder-artisan.jpg'}
                alt={artisan.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = '/placeholder-artisan.jpg'; }}
              />
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              backdropFilter: 'blur(4px)',
            }}
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm md:text-base" />
          </button>

          {/* Featured Badge */}
          {artisan.is_featured && (
            <div className="absolute top-3 left-3 z-20">
              <span className="px-2.5 py-1 text-xs font-semibold bg-yellow-500 text-black rounded-full">
                <FontAwesomeIcon icon={faStar} className="mr-1" />
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Artisan Name & Title - Below cover */}
        <div className="pt-12 md:pt-14 px-6 md:px-8 pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                {artisan.name}
              </h2>
              <p className="text-sm" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                {artisan.title || artisan.craft_type}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
                <span>{artisan.location}</span>
                <span>•</span>
                <span>{artisan.years_of_experience || 0} years experience</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-xs rounded-full" style={{
                background: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)',
                color: isDimMode ? colors.primary : '#139EA2',
              }}>
                {artisan.craft_type}
              </span>
              <span className="px-2.5 py-1 text-xs rounded-full" style={{
                background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                color: isDimMode ? colors.textSecondary : colors.textSecondary,
                border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
              }}>
                {productCount} Products
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 md:px-8 border-b" style={{ borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }}>
          <div className="flex gap-1 -mb-px">
            {[
              { id: 'profile', label: 'Profile', icon: faUserCircle },
              { id: 'about', label: 'About', icon: faInfoCircle },
              { id: 'products', label: 'Products', icon: faStore },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id ? 'border-b-2' : 'border-b-2 border-transparent'
                }`}
                style={{
                  color: activeTab === tab.id
                    ? (isDimMode ? colors.primary : '#139EA2')
                    : (isDimMode ? colors.textSecondary : colors.textSecondary),
                  borderColor: activeTab === tab.id
                    ? (isDimMode ? colors.primary : '#139EA2')
                    : 'transparent',
                }}
              >
                <FontAwesomeIcon icon={tab.icon} className="text-sm" />
                {tab.label}
                {tab.id === 'products' && productCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full" style={{
                    background: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)',
                    color: isDimMode ? colors.primary : '#139EA2',
                  }}>
                    {productCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8 max-h-[calc(90vh-350px)] overflow-y-auto">
          {/* ===== PROFILE TAB ===== */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Quick Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{
                  background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                }}>
                  <h4 className="text-xs font-medium mb-2" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    <FontAwesomeIcon icon={faUser} className="mr-1.5" />
                    Craft
                  </h4>
                  <p className="text-sm font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                    {artisan.craft_type}
                  </p>
                  {artisan.specialties && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {artisan.specialties.split(',').slice(0, 3).map((spec: string) => (
                        <span key={spec.trim()} className="px-2 py-0.5 text-[10px] rounded-full" style={{
                          background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                          color: isDimMode ? colors.textSecondary : colors.textSecondary,
                        }}>
                          {spec.trim()}
                        </span>
                      ))}
                      {artisan.specialties.split(',').length > 3 && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full" style={{
                          color: isDimMode ? colors.textMuted : '#9CA3AF',
                        }}>
                          +{artisan.specialties.split(',').length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl" style={{
                  background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                }}>
                  <h4 className="text-xs font-medium mb-2" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1.5" />
                    Location
                  </h4>
                  <p className="text-sm font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                    {artisan.location}
                  </p>
                  <p className="text-xs mt-1" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    {artisan.years_of_experience} years of experience
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              {(artisan.email || artisan.phone || artisan.website) && (
                <div className="p-4 rounded-xl" style={{
                  background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                }}>
                  <h4 className="text-xs font-medium mb-2" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    <FontAwesomeIcon icon={faEnvelope} className="mr-1.5" />
                    Contact
                  </h4>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {artisan.email && (
                      <a href={`mailto:${artisan.email}`} className="flex items-center gap-2 hover:underline" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                        <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
                        {artisan.email}
                      </a>
                    )}
                    {artisan.phone && (
                      <a href={`tel:${artisan.phone}`} className="flex items-center gap-2 hover:underline" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                        <FontAwesomeIcon icon={faPhone} className="text-xs" />
                        {artisan.phone}
                      </a>
                    )}
                    {artisan.website && (
                      <a href={artisan.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                        <FontAwesomeIcon icon={faGlobe} className="text-xs" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Social Media */}
              {(artisan.instagram || artisan.facebook || artisan.twitter) && (
                <div className="p-4 rounded-xl" style={{
                  background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                }}>
                  <h4 className="text-xs font-medium mb-2" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    <FontAwesomeIcon icon={faShare} className="mr-1.5" />
                    Social Media
                  </h4>
                  <div className="flex gap-3">
                    {artisan.instagram && (
                      <a href={artisan.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{
                        background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                        color: '#E4405F',
                      }} title="Instagram">
                        <FontAwesomeIcon icon={faInstagram} className="text-lg" />
                      </a>
                    )}
                    {artisan.facebook && (
                      <a href={artisan.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{
                        background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                        color: '#1877F2',
                      }} title="Facebook">
                        <FontAwesomeIcon icon={faFacebook} className="text-lg" />
                      </a>
                    )}
                    {artisan.twitter && (
                      <a href={artisan.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{
                        background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                        color: '#1DA1F2',
                      }} title="Twitter">
                        <FontAwesomeIcon icon={faTwitter} className="text-lg" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== ABOUT TAB ===== */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                  About {artisan.name}
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                  {artisan.bio}
                </p>
              </div>

              {artisan.specialties && (
                <div>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                    Specialties
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {artisan.specialties.split(',').map((spec: string) => (
                      <span key={spec.trim()} className="px-3 py-1 text-xs rounded-full" style={{
                        background: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)',
                        color: isDimMode ? colors.primary : '#139EA2',
                      }}>
                        {spec.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-xl text-center" style={{
                  background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                }}>
                  <div className="text-2xl font-bold" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                    {artisan.years_of_experience}+
                  </div>
                  <div className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    Years Experience
                  </div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{
                  background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                }}>
                  <div className="text-2xl font-bold" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                    {productCount}
                  </div>
                  <div className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    Products Created
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== PRODUCTS TAB ===== */}
          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                  All Products ({productCount})
                </h4>
                {productCount > 0 && (
                  <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    Click a product to view details
                  </span>
                )}
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {products.map((product: MarketProduct) => (
                    <Link
                      key={product.id}
                      href={`/market?product=${product.id}`}
                      className="group rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      style={{
                        background: isDimMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                        border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                      }}
                    >
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={getProductImage(product)}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
                        />
                      </div>
                      <div className="p-2.5">
                        <h5 className="text-xs font-medium line-clamp-1" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                          {product.title}
                        </h5>
                        <p className="text-[10px] line-clamp-1" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                          {product.category_name || 'Handcrafted'}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-sm font-bold" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                            ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                          </span>
                          {product.is_in_stock ? (
                            <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-green-500"></span>
                              In Stock
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-500">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                  <div className="text-4xl mb-2">🎨</div>
                  <p className="text-sm">No products available yet</p>
                  <p className="text-xs mt-1">Check back soon for new creations!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 border-t flex justify-between items-center" style={{
          background: isDimMode ? colors.background : '#FFFFFF',
          borderTop: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
          borderRadius: '0 0 16px 16px',
        }}>
          <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
            <FontAwesomeIcon icon={faCrown} className="mr-1" />
            {artisan.craft_type}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
            style={{
              background: isDimMode ? colors.primary : '#139EA2',
              color: isDimMode ? '#0A0A0A' : 'white',
              boxShadow: '0 4px 12px rgba(19,158,162,0.3)',
              outline: 'none',
              border: 'none',
            }}
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default function ArtisansPageWrapper() {
  return (
    <SearchParamsWrapper>
      <ArtisansPage />
    </SearchParamsWrapper>
  );
}