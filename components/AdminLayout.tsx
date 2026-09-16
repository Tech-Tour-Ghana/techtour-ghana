'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  faArrowLeft,
  faSun,
  faMoon,
  faChevronDown,
  faSignOutAlt,
  faShieldHalved,
  faChevronRight,
  faGlobeAfrica,
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
      { icon: faBox, label: 'Market Products', href: '/admin/market' },
      { icon: faHammer, label: 'Artisans', href: '/admin/artisans' },
      { icon: faUsers, label: 'Team & Careers', href: '/admin/team' },
      { icon: faMicrochip, label: 'Tech Hub', href: '/admin/tech' },
      { icon: faGraduationCap, label: 'Study Abroad', href: '/admin/study' },
      { icon: faLayerGroup, label: 'Homepage', href: '/admin/homepage' },
      { icon: faBars, label: 'Navigation', href: '/admin/navigation' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { icon: faUsersCog, label: 'Users', href: '/admin/users' },
      { icon: faEnvelope, label: 'Contact Messages', href: '/admin/contacts' },
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
    group: 'System',
    items: [
      { icon: faChartLine, label: 'Analytics', href: '/admin/analytics' },
      { icon: faCog, label: 'Settings', href: '/admin/settings' },
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
  const { isDimMode, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    background: isDimMode ? '#0A0A0A' : '#F0F4F8',
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    topBarBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: themeStyles.background }}>
      {/* Sidebar */}
      <div
        className="w-64 flex-shrink-0 h-full overflow-y-auto flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #0A0A0A, #111111)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Brand */}
        <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: BRAND_COLORS.tropicalTeal }}>
              <FontAwesomeIcon icon={faShieldHalved} className="text-white text-xs" />
            </div>
            <div>
              <span className="text-white font-bold text-sm block leading-tight">ADMIN</span>
              <span className="text-xs" style={{ color: BRAND_COLORS.sandyOrange }}>TechTour Ghana</span>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 mt-3 text-xs transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
            Back to Site
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group ?? '__top'}>
              {group && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {group}
                </p>
              )}
              {items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      background: isActive ? `${BRAND_COLORS.tropicalTeal}22` : 'transparent',
                      color: isActive ? BRAND_COLORS.tropicalTeal : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.label}</span>
                    {isActive && (
                      <FontAwesomeIcon icon={faChevronRight} className="w-2.5 h-2.5 ml-auto" style={{ color: BRAND_COLORS.tropicalTeal }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
            TechTour Ghana Admin Panel
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
          style={{ background: themeStyles.topBarBg, borderColor: themeStyles.border }}
        >
          <div>
            <h1 className="text-lg font-bold" style={{ color: themeStyles.textPrimary }}>{title}</h1>
            {subtitle && <p className="text-xs" style={{ color: themeStyles.textSecondary }}>{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:scale-105"
              style={{ background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', color: themeStyles.textSecondary }}
            >
              <FontAwesomeIcon icon={isDimMode ? faSun : faMoon} className="w-3.5 h-3.5" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition"
                style={{ background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }}
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
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
