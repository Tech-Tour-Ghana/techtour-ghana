'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from '@/components/admin/toast';
import { ConfirmHost } from '@/components/admin/ui';
import { motion, useReducedMotion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDashboard,
  faBox,
  faTags,
  faHammer,
  faUsers,
  faBriefcase,
  faMicrochip,
  faGraduationCap,
  faLayerGroup,
  faBars,
  faUsersCog,
  faEnvelope,
  faPaperPlane,
  faChartLine,
  faCog,
  faImages,
  faMagnifyingGlass,
  faScrewdriverWrench,
  faArrowLeft,
  faSun,
  faMoon,
  faChevronDown,
  faSignOutAlt,
  faShieldHalved,
  faChevronRight,
  faGlobeAfrica,
  faUserCircle,
  faRoute,
  faCartShopping,
  faQuoteLeft,
  faCommentDots,
  faNewspaper,
  faMapLocationDot,
  faAnglesLeft,
  faClockRotateLeft,
  faBell,
  faEnvelopeCircleCheck,
  faAnglesRight,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@/context/ThemeContext';
import { getAuthStatus, logoutUser, type User } from '@/lib/api';

const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
};

const NAV_GROUPS = [
  {
    group: null,
    items: [{ icon: faDashboard, label: 'Dashboard', href: '/admin' }],
  },
  {
    group: 'Content',
    items: [
      { icon: faRoute, label: 'Tours', href: '/admin/tours' },
      { icon: faBox, label: 'Market Products', href: '/admin/market' },
      { icon: faHammer, label: 'Artisans', href: '/admin/artisans' },
      { icon: faUsers, label: 'Team & Careers', href: '/admin/team' },
      { icon: faMicrochip, label: 'Tech Hub', href: '/admin/tech' },
      { icon: faGraduationCap, label: 'Study Abroad', href: '/admin/study' },
      { icon: faLayerGroup, label: 'Homepage', href: '/admin/homepage' },
      { icon: faQuoteLeft, label: 'Testimonials', href: '/admin/testimonials' },
      { icon: faNewspaper, label: 'Blog', href: '/admin/blog' },
      { icon: faMapLocationDot, label: 'Destinations', href: '/admin/destinations' },
      { icon: faBars, label: 'Navigation', href: '/admin/navigation' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { icon: faCartShopping, label: 'Orders', href: '/admin/orders' },
      { icon: faUsersCog, label: 'Users', href: '/admin/users' },
      { icon: faEnvelope, label: 'Contact Messages', href: '/admin/contacts' },
      { icon: faCommentDots, label: 'Feedback', href: '/admin/feedback' },
      { icon: faGraduationCap, label: 'Study Applications', href: '/admin/applications' },
      { icon: faBell, label: 'Send Notifications', href: '/admin/send-notifications' },
      { icon: faEnvelopeCircleCheck, label: 'Email Log', href: '/admin/emails' },
      { icon: faPaperPlane, label: 'Newsletter', href: '/admin/newsletter' },
    ],
  },
  {
    group: 'Assets',
    items: [
      { icon: faImages, label: 'Media Library', href: '/admin/media' },
    ],
  },
  {
    group: 'Marketing',
    items: [
      { icon: faMagnifyingGlass, label: 'SEO Manager', href: '/admin/seo' },
    ],
  },
  {
    group: 'System',
    items: [
      { icon: faChartLine, label: 'Analytics', href: '/admin/analytics' },
      { icon: faScrewdriverWrench, label: 'Maintenance Mode', href: '/admin/maintenance' },
      { icon: faClockRotateLeft, label: 'Audit Log', href: '/admin/audit' },
      { icon: faCog, label: 'Settings', href: '/admin/settings' },
      { icon: faUserCircle, label: 'My Profile', href: '/admin/profile' },
    ],
  },
];

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { isDimMode, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  // Desktop only: collapse the sidebar to an icon rail. The mobile drawer is
  // always full width. The choice is remembered per browser.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('admin_sidebar_collapsed') === '1');
    } catch {
      // Storage blocked, start expanded.
    }
  }, []);
  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('admin_sidebar_collapsed', next ? '1' : '0');
    } catch {
      // Not persisted, still applies for this visit.
    }
  };
  // Hidden on desktop when collapsed, but always shown in the mobile drawer.
  const hideWhenRail = collapsed ? 'lg:hidden' : '';
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the mobile menu after navigating.
  useEffect(() => setNavOpen(false), [pathname]);

  // The shell is a fixed full-screen layer that scrolls its own content, but
  // the public site's global CSS (Navbar.css) still pads <body> by the navbar
  // height on every page. That made the document taller than the window, so a
  // second, page-level scrollbar appeared beside the content's. Lock the
  // document scroll while the shell is mounted and put it back on the way out.
  useEffect(() => {
    const html = document.documentElement;
    const previous = { html: html.style.overflow, body: document.body.style.overflow };
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previous.html;
      document.body.style.overflow = previous.body;
    };
  }, []);

  useEffect(() => {
    getAuthStatus().then((status) => {
      if (status.is_authenticated && status.user) setUser(status.user);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/admin/login');
  };

  const getInitials = () => {
    if (!user) return 'A';
    const name = user.display_name || user.email || 'Admin';
    return name.charAt(0).toUpperCase();
  };

  const themeStyles = {
    // Values now come from the --adm-* tokens in globals.css, the same ones the
    // analytics dashboard uses, so admin pages stop repeating inline hex.
    background: 'var(--adm-bg)',
    cardBg: 'var(--adm-card)',
    textPrimary: 'var(--adm-text)',
    textSecondary: 'var(--adm-text-2)',
    textMuted: 'var(--adm-muted)',
    border: 'var(--adm-border)',
    topBarBg: 'var(--adm-card)',
  };

  return (
    <div className="fixed inset-0 flex" style={{ background: themeStyles.background }}>
      {/* Sidebar */}
      {navOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setNavOpen(false)} aria-hidden />}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 flex-shrink-0 overflow-y-auto overflow-x-hidden flex flex-col transition-[transform,width] duration-200 lg:static lg:z-auto lg:translate-x-0 ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'} ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'linear-gradient(180deg, #0A0A0A, #111111)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          // Slim, dark scrollbar for the menu on short screens instead of the
          // default light one.
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.18) transparent',
        }}
      >
        {/* Brand */}
        <div className={`px-4 py-4 border-b ${collapsed ? 'lg:px-0 lg:flex lg:flex-col lg:items-center' : ''}`} style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: BRAND_COLORS.tropicalTeal }}>
              <FontAwesomeIcon icon={faShieldHalved} className="text-white text-xs" />
            </div>
            <div className={hideWhenRail}>
              <span className="text-white font-bold text-sm block leading-tight">ADMIN</span>
              <span className="text-xs" style={{ color: BRAND_COLORS.sandyOrange }}>TechTour Ghana</span>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 mt-3 text-xs transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            title="Back to Site"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
            <span className={hideWhenRail}>Back to Site</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className={`flex-1 p-3 space-y-1 ${collapsed ? 'lg:px-2' : ''}`}>
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group ?? '__top'}>
              {group && (
                <>
                  <p className={`px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest ${hideWhenRail}`} style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {group}
                  </p>
                  {collapsed && <div className="hidden lg:block my-2 mx-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />}
                </>
              )}
              {items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                    style={{
                      background: isActive ? `${BRAND_COLORS.tropicalTeal}22` : 'transparent',
                      color: isActive ? BRAND_COLORS.tropicalTeal : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className={hideWhenRail}>{item.label}</span>
                    {isActive && (
                      <FontAwesomeIcon icon={faChevronRight} className={`w-2.5 h-2.5 ml-auto ${hideWhenRail}`} style={{ color: BRAND_COLORS.tropicalTeal }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            <FontAwesomeIcon icon={faGlobeAfrica} className={collapsed ? 'lg:mr-0 mr-1' : 'mr-1'} />
            <span className={hideWhenRail}>TechTour Ghana Admin Panel</span>
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b flex-shrink-0"
          style={{ background: themeStyles.topBarBg, borderColor: themeStyles.border }}
        >
          <button
            onClick={() => setNavOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--adm-track)', color: themeStyles.textSecondary }}
            aria-label="Open menu"
          >
            <FontAwesomeIcon icon={faBars} className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center flex-shrink-0 transition hover:scale-105"
            style={{ background: 'var(--adm-track)', color: themeStyles.textSecondary }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <FontAwesomeIcon icon={collapsed ? faAnglesRight : faAnglesLeft} className="w-3.5 h-3.5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold" style={{ color: themeStyles.textPrimary }}>{title}</h1>
            {subtitle && <p className="text-xs" style={{ color: themeStyles.textSecondary }}>{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:scale-105"
              style={{ background: 'var(--adm-track)', color: themeStyles.textSecondary }}
            >
              <FontAwesomeIcon icon={isDimMode ? faSun : faMoon} className="w-3.5 h-3.5" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition"
                style={{ background: 'var(--adm-track)' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.tropicalTeal}, ${BRAND_COLORS.sandyOrange})`, color: 'white' }}
                >
                  {getInitials()}
                </div>
                <span className="text-xs font-medium" style={{ color: themeStyles.textPrimary }}>
                  {user?.display_name || 'Admin'}
                </span>
                <FontAwesomeIcon icon={faChevronDown} className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} style={{ color: themeStyles.textMuted }} />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg overflow-hidden z-50"
                  style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
                >
                  <div className="p-3 border-b" style={{ borderColor: themeStyles.border }}>
                    <p className="text-xs font-semibold" style={{ color: themeStyles.textPrimary }}>{user?.display_name || 'Admin'}</p>
                    <p className="text-xs" style={{ color: themeStyles.textMuted }}>{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 text-xs w-full text-left hover:bg-red-500/10 transition"
                    style={{ color: '#EF4444' }}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Same entrance for every admin page, none for reduced motion. */}
          <motion.div
            key={pathname}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </div>
      <Toaster />
      <ConfirmHost />
    </div>
  );
}
