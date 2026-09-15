// app/market/tech-innovation/page.tsx

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faArrowUp,
  faLightbulb,
  faRocket,
  faMicrochip,
  faRobot,
  faVrCardboard,
  faGlobe,
  faCloud,
  faDatabase,
  faNetworkWired,
  faCode,
  faMobileScreen,
  faCrown,
  faStore,
  faSearch,
  faTimes,
  faStar,
  faChevronRight,
  faUsers,
  faClock,
  faGraduationCap,
  faBuilding,
  faMapMarkerAlt,
  faEnvelope,
  faPhone,
  faUser,
  faTag,
  faLink,
  faExternalLinkAlt,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
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

// ===== INNOVATION INTERFACES =====
interface Innovation {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  image: string;
  image_url?: string;
  status: 'active' | 'development' | 'completed';
  launch_date?: string;
  impact_score: number;
  features: string[];
  team?: string[];
  tech_stack?: string[];
  website?: string;
  demo_url?: string;
  github_url?: string;
}

interface TechEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  image_url?: string;
  event_type: 'workshop' | 'hackathon' | 'seminar' | 'conference';
  speakers: string[];
  capacity: number;
  registered: number;
  is_upcoming: boolean;
  venue?: string;
  address?: string;
}

interface TechResource {
  id: string;
  title: string;
  description: string;
  resource_type: 'article' | 'video' | 'tutorial' | 'tool';
  url: string;
  thumbnail: string;
  thumbnail_url?: string;
  author: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: string;
}

// ===== MAIN PAGE =====
function TechInnovationPage() {
  const [loading, setLoading] = useState(true);
  const [isDimMode, setIsDimMode] = useState(false);
  const [innovations, setInnovations] = useState<Innovation[]>([]);
  const [events, setEvents] = useState<TechEvent[]>([]);
  const [resources, setResources] = useState<TechResource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [selectedInnovation, setSelectedInnovation] = useState<Innovation | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TechEvent | null>(null);
  const [selectedResource, setSelectedResource] = useState<TechResource | null>(null);

  const colors = isDimMode ? COLORS.dark : COLORS.light;

  // ===== CATEGORIES =====
  const categories = [
    { id: 'all', name: 'All', icon: faRocket },
    { id: 'ai', name: 'AI & Machine Learning', icon: faRobot },
    { id: 'vr', name: 'Virtual Reality', icon: faVrCardboard },
    { id: 'cloud', name: 'Cloud Computing', icon: faCloud },
    { id: 'mobile', name: 'Mobile Tech', icon: faMobileScreen },
    { id: 'blockchain', name: 'Blockchain', icon: faNetworkWired },
  ];

  // ===== FETCH DATA =====
  // Ported from GET /tech-innovations/, /tech-events/?is_upcoming=true and
  // /tech-resources/. tech_events renamed the old date/end_date columns to
  // starts_at/ends_at; mapped back to `date` here since that is what this
  // page and its modals expect. features/team/tech_stack/speakers/tags were
  // comma-separated text columns on the old models and are comma-separated
  // text columns here too, so the same split applies.
  const splitCsv = (value: string | null | undefined): string[] =>
    value ? value.split(',').map((v) => v.trim()).filter(Boolean) : [];

  const fetchData = useCallback(async () => {
    try {
      const supabase = createBrowserClient();

      const [innovationsRes, eventsRes, resourcesRes] = await Promise.all([
        supabase
          .from('tech_innovations')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase
          .from('tech_events')
          .select('*')
          .eq('is_active', true)
          .eq('is_upcoming', true)
          .order('starts_at', { ascending: true }),
        supabase
          .from('tech_resources')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false }),
      ]);

      if (!innovationsRes.error && innovationsRes.data) {
        setInnovations(
          innovationsRes.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            slug: item.slug,
            description: item.description,
            category: item.category,
            icon: item.icon || '',
            image: item.image_url,
            image_url: item.image_url,
            status: item.status,
            launch_date: item.launch_date,
            impact_score: item.impact_score,
            features: splitCsv(item.features),
            team: splitCsv(item.team),
            tech_stack: splitCsv(item.tech_stack),
            website: item.website,
            demo_url: item.demo_url,
            github_url: item.github_url,
            is_featured: item.is_featured,
            created_at: item.created_at,
          })),
        );
      }
      if (!eventsRes.error && eventsRes.data) {
        setEvents(
          eventsRes.data.map((event: any) => ({
            id: event.id,
            title: event.title,
            slug: event.slug,
            description: event.description,
            date: event.starts_at,
            location: event.location,
            event_type: event.event_type,
            image: event.image_url,
            image_url: event.image_url,
            speakers: splitCsv(event.speakers),
            capacity: event.capacity,
            registered: event.registered,
            is_upcoming: event.is_upcoming,
            is_featured: event.is_featured,
            venue: event.venue,
            address: event.address,
          })),
        );
      }
      if (!resourcesRes.error && resourcesRes.data) {
        setResources(
          resourcesRes.data.map((resource: any) => ({
            id: resource.id,
            title: resource.title,
            slug: resource.slug,
            description: resource.description,
            resource_type: resource.resource_type,
            url: resource.url,
            thumbnail: resource.thumbnail_url,
            thumbnail_url: resource.thumbnail_url,
            author: resource.author,
            tags: splitCsv(resource.tags),
            difficulty: resource.difficulty,
            duration: resource.duration,
            is_featured: resource.is_featured,
          })),
        );
      }
    } catch (error) {
      console.error('Error fetching tech data:', error);
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

  // ===== FILTER INNOVATIONS =====
  const filteredInnovations = innovations.filter(innovation => {
    const matchesCategory = selectedCategory === 'all' || innovation.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      innovation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      innovation.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== CLICK HANDLERS =====
  const handleInnovationClick = (innovation: Innovation) => {
    setSelectedInnovation(innovation);
  };

  const handleEventClick = (event: TechEvent) => {
    setSelectedEvent(event);
  };

  const handleResourceClick = (resource: TechResource) => {
    setSelectedResource(resource);
  };

  const closeModals = () => {
    setSelectedInnovation(null);
    setSelectedEvent(null);
    setSelectedResource(null);
  };

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      active: { color: '#10B981', label: 'Active' },
      development: { color: '#F59E0B', label: 'In Development' },
      completed: { color: '#3B82F6', label: 'Completed' },
    };
    return config[status] || config.development!;
  };

  // ===== GET EVENT TYPE BADGE =====
  const getEventTypeBadge = (type: string) => {
    const config: Record<string, { color: string; label: string }> = {
      workshop: { color: '#8B5CF6', label: 'Workshop' },
      hackathon: { color: '#EF4444', label: 'Hackathon' },
      seminar: { color: '#3B82F6', label: 'Seminar' },
      conference: { color: '#F59E0B', label: 'Conference' },
      webinar: { color: '#10B981', label: 'Webinar' },
    };
    return config[type] || config.seminar!;
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
              const isActive = link.path === '/market/tech-innovation';
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

      {/* ===== HERO BANNER ===== */}
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
                  <FontAwesomeIcon icon={faRocket} className="mr-1" />
                  Tech & Innovation
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20 text-white">
                  {innovations.length} Projects
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                <span style={{ color: isDimMode ? colors.primary : '#E6A64D' }}>Tech</span> &amp; Innovation
              </h1>
              <p className="text-white/80 text-base md:text-lg mt-2 max-w-lg">
                Explore how technology is transforming tourism and preserving Ghanaian culture
                through innovation and digital experiences.
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
            { label: 'Innovations', value: innovations.length, icon: faLightbulb },
            { label: 'Events', value: events.length, icon: faUsers },
            { label: 'Resources', value: resources.length, icon: faGraduationCap },
            { label: 'Active Projects', value: innovations.filter(i => i.status === 'active').length, icon: faRocket },
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
              placeholder="Search innovations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                color: isDimMode ? colors.textPrimary : colors.textPrimary,
              }}
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${selectedCategory === category.id ? 'font-semibold' : ''
                  }`}
                style={{
                  background: selectedCategory === category.id
                    ? (isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)')
                    : 'transparent',
                  color: selectedCategory === category.id
                    ? (isDimMode ? colors.primary : '#139EA2')
                    : (isDimMode ? colors.textSecondary : colors.textSecondary),
                  border: selectedCategory === category.id
                    ? `1px solid ${isDimMode ? colors.primary : '#139EA2'}`
                    : `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                }}
              >
                <FontAwesomeIcon icon={category.icon} className="w-3 h-3" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== INNOVATIONS GRID ===== */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
          <FontAwesomeIcon icon={faRocket} style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
          Innovation Projects
        </h2>

        {filteredInnovations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInnovations.map((innovation) => {
              const statusBadge = getStatusBadge(innovation.status);
              return (
                <div
                  key={innovation.id}
                  onClick={() => handleInnovationClick(innovation)}
                  className="group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
                  style={{
                    background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                    border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)'}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={innovation.image || innovation.image_url || '/placeholder-tech.jpg'}
                      alt={innovation.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 text-xs font-semibold text-white rounded-full" style={{ background: statusBadge.color }}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{innovation.icon || '🚀'}</span>
                        <h3 className="font-bold text-white text-sm line-clamp-1">{innovation.title}</h3>
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 text-white/50 text-xs bg-black/40 px-2 py-0.5 rounded-full">
                      Click to view →
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-sm line-clamp-2 mb-3" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                      {innovation.description}
                    </p>

                    {innovation.features && innovation.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {innovation.features.slice(0, 3).map((feature) => (
                          <span
                            key={feature}
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                              color: isDimMode ? colors.textSecondary : colors.textSecondary,
                            }}
                          >
                            {feature}
                          </span>
                        ))}
                        {innovation.features.length > 3 && (
                          <span className="px-2 py-0.5 text-xs rounded-full" style={{
                            background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                            color: isDimMode ? colors.textSecondary : colors.textSecondary,
                          }}>
                            +{innovation.features.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }}>
                      <div className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faStar} className="w-3 h-3" style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
                        <span className="text-sm font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                          {innovation.impact_score}
                        </span>
                        <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>impact</span>
                      </div>
                      {innovation.launch_date && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                          <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                          <span>{new Date(innovation.launch_date).getFullYear()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4"></div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
              No innovations found
            </h3>
            <p className="text-sm" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* ===== UPCOMING EVENTS ===== */}
      {events.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
            <FontAwesomeIcon icon={faUsers} style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
            Upcoming Events
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.filter(e => e.is_upcoming).map((event) => {
              const eventType = getEventTypeBadge(event.event_type); return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col md:flex-row cursor-pointer"
                  style={{
                    background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                    border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)'}`,
                  }}
                >
                  <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
                    <img
                      src={event.image || event.image_url || '/placeholder-event.jpg'}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 md:w-2/3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ background: eventType.color + '20', color: eventType.color }}>
                        {eventType.label}
                      </span>
                      <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-semibold" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                      {event.title}
                    </h3>
                    <p className="text-sm line-clamp-2" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                      <span>
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                        {event.location}
                      </span>
                      <span>
                        <FontAwesomeIcon icon={faUsers} className="mr-1" />
                        {event.registered}/{event.capacity}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== RESOURCES ===== */}
      {resources.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
            <FontAwesomeIcon icon={faGraduationCap} style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
            Learning Resources
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                onClick={() => handleResourceClick(resource)}
                className="group rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
                style={{
                  background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                  border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)'}`,
                }}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={resource.thumbnail || resource.thumbnail_url || '/placeholder-resource.jpg'}
                    alt={resource.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-1.5 py-0.5 text-xs rounded" style={{
                      background: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)',
                      color: isDimMode ? colors.primary : '#139EA2',
                    }}>
                      {resource.resource_type}                    </span>
                    <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                      {resource.difficulty}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium line-clamp-1" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                    {resource.title}
                  </h4>
                  <p className="text-xs line-clamp-2" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                    {resource.description}
                  </p>
                  <p className="text-xs mt-1" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    By {resource.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== INNOVATION DETAIL MODAL ===== */}
      {selectedInnovation && (
        <InnovationDetailModal
          innovation={selectedInnovation}
          onClose={closeModals}
          colors={colors}
          isDimMode={isDimMode}
        />
      )}

      {/* ===== EVENT DETAIL MODAL ===== */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={closeModals}
          colors={colors}
          isDimMode={isDimMode}
        />
      )}

      {/* ===== RESOURCE DETAIL MODAL ===== */}
      {selectedResource && (
        <ResourceDetailModal
          resource={selectedResource}
          onClose={closeModals}
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
          }}
        >
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      )}
    </div>
  );
}

// ===== INNOVATION DETAIL MODAL =====
function InnovationDetailModal({ innovation, onClose, colors, isDimMode }: any) {
  const statusBadge = getStatusBadge(innovation.status);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: isDimMode ? colors.background : '#FFFFFF',
          border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.1)'}`,
          animation: 'slideUp 0.3s ease',
          margin: 'auto',
          marginTop: '5vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 pb-0">
          {/* Image */}
          <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-6">
            <img
              src={innovation.image || innovation.image_url || '/placeholder-tech.jpg'}
              alt={innovation.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1.5 text-sm font-semibold text-white rounded-full" style={{ background: statusBadge.color }}>
                {statusBadge.label}
              </span>
            </div>
            <div className="absolute bottom-4 right-4 text-5xl">
              {innovation.icon || ''}
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
            {innovation.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 text-sm rounded-full" style={{
              background: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)',
              color: isDimMode ? colors.primary : '#139EA2',
            }}>
              {innovation.category}
            </span>
            <span className="flex items-center gap-1 text-sm" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
              <FontAwesomeIcon icon={faStar} style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
              Impact Score: {innovation.impact_score}/10
            </span>
            {innovation.launch_date && (
              <span className="text-sm" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                Launched: {new Date(innovation.launch_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>

          <p className="text-base leading-relaxed mb-6" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
            {innovation.description}
          </p>

          {innovation.features && innovation.features.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                <FontAwesomeIcon icon={faTag} className="mr-2" style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
                Features
              </h4>
              <div className="flex flex-wrap gap-2">
                {innovation.features.map((feature: string) => (
                  <span
                    key={feature}
                    className="px-3 py-1.5 text-sm rounded-full"
                    style={{
                      background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                      color: isDimMode ? colors.textSecondary : colors.textSecondary,
                      border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {innovation.team && innovation.team.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                <FontAwesomeIcon icon={faUser} className="mr-2" style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
                Team
              </h4>
              <div className="flex flex-wrap gap-2">
                {innovation.team.map((member: string) => (
                  <span
                    key={member}
                    className="px-3 py-1.5 text-sm rounded-full"
                    style={{
                      background: isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.05)',
                      color: isDimMode ? colors.primary : '#139EA2',
                    }}
                  >
                    {member}
                  </span>
                ))}
              </div>
            </div>
          )}

          {innovation.tech_stack && innovation.tech_stack.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                <FontAwesomeIcon icon={faGlobe} className="mr-2" style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
                Tech Stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {innovation.tech_stack.map((tech: string) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 text-sm rounded-full"
                    style={{
                      background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                      color: isDimMode ? colors.textSecondary : colors.textSecondary,
                      border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-4 border-t" style={{ borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }}>
            {innovation.website && (
              <a
                href={innovation.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                style={{
                  background: isDimMode ? colors.primary : '#139EA2',
                  color: isDimMode ? '#0A0A0A' : 'white',
                }}
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                Visit Website
              </a>
            )}
            {innovation.demo_url && (
              <a
                href={innovation.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                style={{
                  background: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)',
                  color: isDimMode ? colors.primary : '#139EA2',
                  border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.2)'}`,
                }}
              >
                <FontAwesomeIcon icon={faLink} />
                View Demo
              </a>
            )}
            {innovation.github_url && (
              <a
                href={innovation.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                style={{
                  background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                  color: isDimMode ? colors.textSecondary : colors.textSecondary,
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                }}
              >
                <FontAwesomeIcon icon={faGithub} />
                GitHub
              </a>
            )}
          </div>
        </div>

        {/* Close Button - Bottom Only */}
        <div className="sticky bottom-0 p-4 border-t flex justify-center" style={{
          background: isDimMode ? colors.background : '#FFFFFF',
          borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
          borderTop: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
          borderRadius: '0 0 16px 16px',
        }}>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
            style={{
              background: isDimMode ? colors.primary : '#139EA2',
              color: isDimMode ? '#0A0A0A' : 'white',
              boxShadow: '0 4px 12px rgba(19,158,162,0.3)',
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

// ===== EVENT DETAIL MODAL =====
function EventDetailModal({ event, onClose, colors, isDimMode }: any) {
  const eventType = getEventTypeBadge(event.event_type || event.type);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: isDimMode ? colors.background : '#FFFFFF',
          border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.1)'}`,
          animation: 'slideUp 0.3s ease',
          margin: 'auto',
          marginTop: '5vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 pb-0">
          <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-6">
            <img
              src={event.image || event.image_url || '/placeholder-event.jpg'}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1.5 text-sm font-semibold text-white rounded-full" style={{ background: eventType.color }}>
                {eventType.label}
              </span>
            </div>
            {event.is_upcoming && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1.5 text-sm font-semibold text-white rounded-full bg-green-500">
                  Upcoming
                </span>
              </div>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
            {event.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="flex items-center gap-2 text-sm" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
              <FontAwesomeIcon icon={faCalendarAlt} style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-2 text-sm" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
              {event.location}
            </span>
          </div>

          <p className="text-base leading-relaxed mb-6" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
            {event.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 rounded-xl" style={{
            background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
            border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
          }}>
            {event.venue && (
              <div>
                <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>Venue</span>
                <p className="font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>{event.venue}</p>
              </div>
            )}
            {event.address && (
              <div>
                <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>Address</span>
                <p className="font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>{event.address}</p>
              </div>
            )}
            <div>
              <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>Capacity</span>
              <p className="font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>{event.capacity} people</p>
            </div>
            <div>
              <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>Registered</span>
              <p className="font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>{event.registered} people</p>
            </div>
          </div>

          {event.speakers && event.speakers.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                <FontAwesomeIcon icon={faUser} className="mr-2" style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
                Speakers
              </h4>
              <div className="flex flex-wrap gap-2">
                {event.speakers.map((speaker: string) => (
                  <span
                    key={speaker}
                    className="px-3 py-1.5 text-sm rounded-full"
                    style={{
                      background: isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.05)',
                      color: isDimMode ? colors.primary : '#139EA2',
                    }}
                  >
                    {speaker}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Close Button - Bottom Only */}
        <div className="sticky bottom-0 p-4 border-t flex justify-center" style={{
          background: isDimMode ? colors.background : '#FFFFFF',
          borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
          borderTop: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
          borderRadius: '0 0 16px 16px',
        }}>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
            style={{
              background: isDimMode ? colors.primary : '#139EA2',
              color: isDimMode ? '#0A0A0A' : 'white',
              boxShadow: '0 4px 12px rgba(19,158,162,0.3)',
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

// ===== RESOURCE DETAIL MODAL =====
function ResourceDetailModal({ resource, onClose, colors, isDimMode }: any) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: isDimMode ? colors.background : '#FFFFFF',
          border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.1)'}`,
          animation: 'slideUp 0.3s ease',
          margin: 'auto',
          marginTop: '5vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 pb-0">
          <div className="relative h-56 md:h-64 rounded-xl overflow-hidden mb-6">
            <img
              src={resource.thumbnail || resource.thumbnail_url || '/placeholder-resource.jpg'}
              alt={resource.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1.5 text-sm font-semibold text-white rounded-full" style={{
                background: isDimMode ? colors.primary : '#139EA2',
              }}>
                {resource.resource_type}
              </span>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
            {resource.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="flex items-center gap-2 text-sm" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
              <FontAwesomeIcon icon={faUser} style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
              By {resource.author}
            </span>
            <span className="flex items-center gap-2 text-sm" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
              <FontAwesomeIcon icon={faClock} style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
              {resource.difficulty} • {resource.duration || 'N/A'}
            </span>
          </div>

          <p className="text-base leading-relaxed mb-6" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
            {resource.description}
          </p>

          {resource.tags && resource.tags.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                <FontAwesomeIcon icon={faTag} className="mr-2" style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 text-sm rounded-full"
                    style={{
                      background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                      color: isDimMode ? colors.textSecondary : colors.textSecondary,
                      border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 mb-4"
            style={{
              background: isDimMode ? colors.primary : '#139EA2',
              color: isDimMode ? '#0A0A0A' : 'white',
            }}
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} />
            View Resource
          </a>
        </div>

        {/* Close Button - Bottom Only */}
        <div className="sticky bottom-0 p-4 border-t flex justify-center" style={{
          background: isDimMode ? colors.background : '#FFFFFF',
          borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
          borderTop: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
          borderRadius: '0 0 16px 16px',
        }}>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
            style={{
              background: isDimMode ? colors.primary : '#139EA2',
              color: isDimMode ? '#0A0A0A' : 'white',
              boxShadow: '0 4px 12px rgba(19,158,162,0.3)',
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

// ===== HELPER FUNCTIONS =====
function getStatusBadge(status: string) {
  const config: Record<string, { color: string; label: string }> = {
    active: { color: '#10B981', label: 'Active' },
    development: { color: '#F59E0B', label: 'In Development' },
    completed: { color: '#3B82F6', label: 'Completed' },
  };
  return config[status] || config.development!;
}

function getEventTypeBadge(type: string) {
  const config: Record<string, { color: string; label: string }> = {
    workshop: { color: '#8B5CF6', label: 'Workshop' },
    hackathon: { color: '#EF4444', label: 'Hackathon' },
    seminar: { color: '#3B82F6', label: 'Seminar' },
    conference: { color: '#F59E0B', label: 'Conference' },
    webinar: { color: '#10B981', label: 'Webinar' },
  };
  return config[type] || config.seminar!;
}

export default function TechInnovationPageWrapper() {
  return (
    <SearchParamsWrapper>
      <TechInnovationPage />
    </SearchParamsWrapper>
  );
}