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
  faClipboardList,
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
  faChevronRight,
  faGlobeAfrica,
  faUserCircle,
  faRoute,
  faHouse,
  faCartShopping,
  faQuoteLeft,
  faCommentDots,
  faNewspaper,
  faMapLocationDot,
  faAnglesLeft,
  faClockRotateLeft,
  faTrashCan,
  faBell,
  faEnvelopeCircleCheck,
  faHeadset,
  faBullhorn,
  faAnglesRight,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@/context/ThemeContext';
import AvatarContent from '@/components/AvatarContent';
import { getAuthStatus, logoutUser, type User } from '@/lib/api';
import { useSiteLogo } from '@/lib/useSiteLogo';
import { useAdminCounts, type AdminCounts } from '@/lib/useAdminCounts';
import NotificationBell from '@/components/notifications/NotificationBell';

const BRAND_COLORS = {
  tropicalTeal: 'var(--adm-primary)',
  sandyOrange: 'var(--brand-gold)',
};
const WHITE = (a: number) => `rgba(var(--brand-white-rgb), ${a})`;

// Grouped by what the admin is doing, not by table.
const NAV_GROUPS = [
  {
    group: 'Overview',
    items: [
      { icon: faDashboard, label: 'Dashboard', href: '/admin' },
      { icon: faBell, label: 'Notifications', href: '/admin/notifications' },
      { icon: faChartLine, label: 'Analytics', href: '/admin/analytics' },
    ],
  },
  {
    group: 'Travel & Study',
    items: [
      { icon: faRoute, label: 'Tours', href: '/admin/tours' },
      { icon: faMapLocationDot, label: 'Destinations', href: '/admin/destinations' },
      { icon: faHouse, label: 'Vacation Rentals', href: '/admin/rentals' },
      { icon: faGraduationCap, label: 'Study Abroad', href: '/admin/study' },
      { icon: faClipboardList, label: 'Study Applications', href: '/admin/applications' },
    ],
  },
  {
    group: 'Marketplace',
    items: [
      { icon: faBox, label: 'Market Products', href: '/admin/market' },
      { icon: faCartShopping, label: 'Orders', href: '/admin/orders' },
      { icon: faHammer, label: 'Artisans', href: '/admin/artisans' },
      { icon: faMicrochip, label: 'Tech Hub', href: '/admin/tech' },
    ],
  },
  {
    group: 'Website Content',
    items: [
      { icon: faLayerGroup, label: 'Homepage', href: '/admin/homepage' },
      { icon: faNewspaper, label: 'Blog', href: '/admin/blog' },
      { icon: faQuoteLeft, label: 'Testimonials', href: '/admin/testimonials' },
      { icon: faUsers, label: 'Team & Careers', href: '/admin/team' },
      { icon: faImages, label: 'Media Library', href: '/admin/media' },
      { icon: faBars, label: 'Navigation', href: '/admin/navigation' },
    ],
  },
  {
    group: 'Marketing',
    items: [
      { icon: faMagnifyingGlass, label: 'SEO Manager', href: '/admin/seo' },
      { icon: faPaperPlane, label: 'Newsletter', href: '/admin/newsletter' },
      { icon: faBell, label: 'Send Notifications', href: '/admin/send-notifications' },
    ],
  },
  {
    group: 'Inbox & Support',
    items: [
      { icon: faHeadset, label: 'Helpdesk', href: '/admin/helpdesk' },
      { icon: faBullhorn, label: 'Notice Board', href: '/admin/notices' },
      { icon: faEnvelope, label: 'Contact Messages', href: '/admin/contacts' },
      { icon: faCommentDots, label: 'Feedback', href: '/admin/feedback' },
      { icon: faEnvelopeCircleCheck, label: 'Email Log', href: '/admin/emails' },
    ],
  },
  {
    group: 'Administration',
    items: [
      { icon: faUsersCog, label: 'Users', href: '/admin/users' },
      { icon: faClockRotateLeft, label: 'Audit Log', href: '/admin/audit' },
      { icon: faTrashCan, label: 'Trash', href: '/admin/trash' },
      { icon: faScrewdriverWrench, label: 'Maintenance Mode', href: '/admin/maintenance' },
      { icon: faCog, label: 'Settings', href: '/admin/settings' },
      { icon: faUserCircle, label: 'My Profile', href: '/admin/profile' },
    ],
  },
];

// Which sidebar item shows which count (see admin_sidebar_counts). Trash is informational, failed emails are a warning.
const BADGES: Record<string, { key: keyof AdminCounts; tone: 'attention' | 'quiet' | 'alert' }> = {
  '/admin/notifications': { key: 'notifications', tone: 'attention' },
  '/admin/tours': { key: 'tours', tone: 'attention' },
  '/admin/rentals': { key: 'rentals', tone: 'attention' },
  '/admin/applications': { key: 'applications', tone: 'attention' },
  '/admin/orders': { key: 'orders', tone: 'attention' },
  '/admin/helpdesk': { key: 'helpdesk', tone: 'attention' },
  '/admin/contacts': { key: 'contacts', tone: 'attention' },
  '/admin/feedback': { key: 'feedback', tone: 'attention' },
  '/admin/emails': { key: 'emails', tone: 'alert' },
  '/admin/trash': { key: 'trash', tone: 'quiet' },
};
const badgeStyle = (tone: 'attention' | 'quiet' | 'alert') =>
  tone === 'attention' ? { background: 'var(--brand-gold)', color: 'var(--brand-ink)' }
  : tone === 'alert' ? { background: 'var(--brand-error)', color: 'var(--brand-white)' }
  : { background: WHITE(0.16), color: WHITE(0.85) };
const countLabel = (n: number) => (n > 99 ? '99+' : String(n));

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
  const siteLogo = useSiteLogo();
  const counts = useAdminCounts();
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
  // Sidebar groups the admin has folded up. Remembered per browser; the group that
  // holds the current page is opened again whenever the route changes.
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('admin_nav_closed') ?? '[]');
      if (Array.isArray(saved)) setClosedGroups(saved.filter((g): g is string => typeof g === 'string'));
    } catch {
      // Storage blocked or invalid, start with every group open.
    }
  }, []);
  const saveClosed = (next: string[]) => {
    setClosedGroups(next);
    try {
      localStorage.setItem('admin_nav_closed', JSON.stringify(next));
    } catch {
      // Not persisted, still applies for this visit.
    }
  };
  const toggleGroup = (name: string) => saveClosed(closedGroups.includes(name) ? closedGroups.filter((g) => g !== name) : [...closedGroups, name]);
  useEffect(() => {
    const active = NAV_GROUPS.find((g) => g.items.some((i) => (i.href === '/admin' ? pathname === '/admin' : pathname === i.href || pathname.startsWith(`${i.href}/`))));
    if (active?.group) setClosedGroups((prev) => (prev.includes(active.group!) ? prev.filter((g) => g !== active.group) : prev));
  }, [pathname]);
  // Hidden on desktop when collapsed, but always shown in the mobile drawer.
  const hideWhenRail = collapsed ? 'lg:hidden' : '';
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setNavOpen(false);
      setIsDropdownOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[3000] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg" style={{ background: 'var(--brand-card)', color: 'var(--brand-text)' }}>Skip to content</a>
      {/* Sidebar */}
      {navOpen && <div className="fixed inset-0 z-30 bg-[rgba(var(--brand-black-rgb),0.5)] lg:hidden" onClick={() => setNavOpen(false)} aria-hidden />}
      <aside
        aria-label="Admin sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-64 flex-shrink-0 overflow-y-auto overflow-x-hidden flex flex-col transition-[transform,width] duration-200 lg:static lg:z-auto lg:translate-x-0 ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'} ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'linear-gradient(180deg, var(--brand-black), var(--brand-ink))',
          borderRight: `1px solid ${WHITE(0.06)}`,
          // Slim, dark scrollbar for the menu on short screens instead of the
          // default light one.
          scrollbarWidth: 'thin',
          scrollbarColor: `${WHITE(0.18)} transparent`,
        }}
      >
        {/* Brand */}
        <div className={`px-4 py-4 border-b ${collapsed ? 'lg:px-0 lg:flex lg:flex-col lg:items-center' : ''}`} style={{ borderColor: WHITE(0.06) }}>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={siteLogo} alt="TechTour Ghana" className="h-8 w-8 flex-shrink-0 rounded-lg object-contain" />
            <div className={hideWhenRail}>
              <span className="text-white font-bold text-sm block leading-tight">ADMIN</span>
              <span className="text-xs" style={{ color: BRAND_COLORS.sandyOrange }}>TechTour Ghana</span>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 mt-3 text-xs transition-colors hover:text-white"
            style={{ color: WHITE(0.35) }}
            title="Back to Site"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
            <span className={hideWhenRail}>Back to Site</span>
          </Link>
        </div>

        {/* Nav */}
        <nav aria-label="Admin sections" className={`flex-1 p-3 space-y-1 ${collapsed ? 'lg:px-2' : ''}`}>
          {NAV_GROUPS.map(({ group, items }) => {
            const folded = !!group && closedGroups.includes(group);
            const groupId = `admin-nav-${(group ?? 'top').toLowerCase().replace(/[^a-z]+/g, '-')}`;
            return (
            <div key={group ?? '__top'}>
              {group && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    aria-expanded={!folded}
                    aria-controls={groupId}
                    className={`flex w-full items-center justify-between rounded-md px-3 pt-3 pb-1 text-left text-[10px] font-semibold uppercase tracking-widest transition-colors hover:text-white ${hideWhenRail}`}
                    style={{ color: WHITE(0.4) }}
                  >
                    <span className="flex items-center gap-2">
                      {group}
                      {folded && (() => {
                        const total = items.reduce((n, i) => { const b = BADGES[i.href]; return b && b.tone !== 'quiet' ? n + (counts[b.key] ?? 0) : n; }, 0);
                        return total > 0 ? <span aria-label={`${total} waiting`} className="rounded-full px-1.5 text-[10px] font-bold leading-4" style={badgeStyle('attention')}>{countLabel(total)}</span> : null;
                      })()}
                    </span>
                    <FontAwesomeIcon icon={faChevronDown} className={`h-2.5 w-2.5 transition-transform ${folded ? '-rotate-90' : ''}`} />
                  </button>
                  {collapsed && <div className="hidden lg:block my-2 mx-3 border-t" style={{ borderColor: WHITE(0.08) }} />}
                </>
              )}
              <div id={groupId} className={folded ? (collapsed ? 'hidden lg:block' : 'hidden') : undefined}>
              {items.map((item) => {
                const isActive = item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors duration-150 ${isActive ? 'font-semibold' : 'font-medium hover:bg-white/5 hover:text-white'} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                    style={{
                      background: isActive ? `color-mix(in srgb, ${BRAND_COLORS.tropicalTeal} 18%, transparent)` : undefined,
                      color: isActive ? 'var(--brand-white)' : WHITE(0.6),
                    }}
                  >
                    {isActive && <span aria-hidden="true" className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full" style={{ background: BRAND_COLORS.tropicalTeal }} />}
                    <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5 flex-shrink-0" style={isActive ? { color: BRAND_COLORS.tropicalTeal } : undefined} />
                    <span className={hideWhenRail}>{item.label}</span>
                    {(() => {
                      const b = BADGES[item.href];
                      const n = b ? counts[b.key] ?? 0 : 0;
                      if (!b || n <= 0) return null;
                      return (
                        <span
                          aria-label={`${n} ${b.tone === 'quiet' ? 'in trash' : b.tone === 'alert' ? 'failed' : 'waiting'}`}
                          className={`ml-auto min-w-[1.25rem] rounded-full px-1.5 text-center text-[10px] font-bold leading-5 ${collapsed ? 'lg:absolute lg:right-1 lg:top-0.5 lg:ml-0 lg:min-w-[1rem] lg:px-1 lg:leading-4' : ''}`}
                          style={badgeStyle(b.tone)}
                        >
                          {countLabel(n)}
                        </span>
                      );
                    })()}
                  </Link>
                );
              })}
              </div>
            </div>
            );
          })}
        </nav>

        <div className="p-3 border-t text-center" style={{ borderColor: WHITE(0.06) }}>
          <p className="text-[9px]" style={{ color: WHITE(0.2) }}>
            <FontAwesomeIcon icon={faGlobeAfrica} className={collapsed ? 'lg:mr-0 mr-1' : 'mr-1'} />
            <span className={hideWhenRail}>TechTour Ghana Admin Panel</span>
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 sm:px-6 py-3 border-b flex-shrink-0"
          style={{ background: themeStyles.topBarBg, borderColor: themeStyles.border }}
        >
          <button
            onClick={() => setNavOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--adm-track)', color: themeStyles.textSecondary }}
            aria-label="Open menu"
            aria-expanded={navOpen}
          >
            <FontAwesomeIcon icon={faBars} className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex w-10 h-10 rounded-lg items-center justify-center flex-shrink-0 transition hover:scale-105"
            style={{ background: 'var(--adm-track)', color: themeStyles.textSecondary }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <FontAwesomeIcon icon={collapsed ? faAnglesRight : faAnglesLeft} className="w-3.5 h-3.5" />
          </button>
          <div className="order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
            <h1 className="truncate text-lg font-bold leading-tight" style={{ color: themeStyles.textPrimary }}>{title}</h1>
            {subtitle && <p className="truncate text-xs" style={{ color: themeStyles.textSecondary }}>{subtitle}</p>}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label={isDimMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition hover:scale-105"
              style={{ background: 'var(--adm-track)', color: themeStyles.textSecondary }}
            >
              <FontAwesomeIcon icon={isDimMode ? faSun : faMoon} className="w-3.5 h-3.5" />
            </button>

            <NotificationBell
              tone="admin"
              allHref="/admin/notifications"
              buttonStyle={{ width: '2.5rem', height: '2.5rem', background: 'var(--adm-track)', color: themeStyles.textSecondary }}
            />

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="Account menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
                className="flex min-h-10 items-center gap-2 px-3 py-1.5 rounded-lg transition"
                style={{ background: 'var(--adm-track)' }}
              >
                <div
                  className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.tropicalTeal}, ${BRAND_COLORS.sandyOrange})`, color: 'white' }}
                >
                  <AvatarContent src={user?.avatar_url} name={user?.display_name || user?.email || 'Admin'} />
                </div>
                <span className="hidden text-xs font-medium sm:inline" style={{ color: themeStyles.textPrimary }}>
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
                    role="menuitem"
                    className="flex min-h-10 items-center gap-3 px-3 py-2 text-xs w-full text-left hover:bg-red-500/10 transition"
                    style={{ color: 'var(--brand-error)' }}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div id="admin-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 sm:p-6 focus:outline-none">
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
