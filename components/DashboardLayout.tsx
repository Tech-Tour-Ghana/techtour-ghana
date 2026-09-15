// Ported from docs/old-sites/techtour-frontend/app/components/DashboardLayout.tsx.
// Markup and styling are unchanged. Two things changed:
//
// 1. User identity comes from getAuthStatus() (Supabase, lib/api.ts) instead
//    of a localStorage 'user' blob left over from the JWT-era client.
// 2. The sidebar drops Study and Wishlist. Both called real-sounding
//    endpoints on the old Django backend, but user_wishlist and user_study
//    (admin_dashboard/views.py) imported pages.models.Wishlist and
//    pages.models.StudyApplication, neither of which exists anywhere in
//    pages/models.py. Both endpoints would 500 in production. There is
//    nothing there to port.

'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faDashboard,
  faShoppingBag,
  faCalendarCheck,
  faCreditCard,
  faBell,
  faCog,
  faSignOutAlt,
  faChevronRight,
  faGlobeAfrica,
  faCrown,
  faArrowLeft,
  faSun,
  faMoon,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { getAuthStatus, logoutUser, type User } from '@/lib/api';

const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
};

export const SIDEBAR_ITEMS = [
  { icon: faDashboard, label: 'Dashboard', href: '/auth/dashboard' },
  { icon: faShoppingBag, label: 'Orders', href: '/auth/orders' },
  { icon: faCreditCard, label: 'Payments', href: '/auth/payments' },
  { icon: faCalendarCheck, label: 'Tours', href: '/auth/tours' },
];

export const TOP_BAR_ITEMS = [
  { icon: faUser, label: 'Profile', href: '/auth/profile' },
  { icon: faCog, label: 'Settings', href: '/auth/settings' },
];

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDimMode, toggleTheme } = useTheme();
  const { clearCart } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAuthStatus().then((status) => {
      if (status.is_authenticated && status.user) setUser(status.user);
      else router.push('/auth/login');
    });
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserInitials = () => {
    if (!user) return 'U';
    const name = user.display_name || user.first_name || user.email || 'User';
    return name.charAt(0).toUpperCase();
  };

  const getFullName = () => {
    if (!user) return 'User';
    return user.display_name || 'User';
  };

  const handleLogout = async () => {
    await logoutUser();
    clearCart();
    router.push('/');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const themeStyles = {
    background: isDimMode ? '#0A0A0A' : '#F9F9F9',
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#000000',
    textSecondary: isDimMode ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    topBarBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
  };

  return (
    <div className="dashboard-layout-wrapper flex h-screen overflow-hidden" style={{ background: themeStyles.background, margin: 0, padding: 0 }}>
      {/* ===== SIDEBAR - Far Left ===== */}
      <div
        className="w-[280px] flex-shrink-0 h-full overflow-y-auto relative"
        style={{
          background: 'linear-gradient(180deg, #0A0A0A, #1A1A1A)',
          borderRight: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}`,
          margin: 0,
          padding: 0,
        }}
      >
        <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', margin: 0 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: BRAND_COLORS.tropicalTeal }}>
              <FontAwesomeIcon icon={faCrown} className="text-white text-sm" />
            </div>
            <div>
              <span className="text-white font-bold text-sm block leading-tight">TECHTOUR</span>
              <span className="text-xs" style={{ color: BRAND_COLORS.sandyOrange }}>GHANA</span>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 mt-2 text-xs transition-colors duration-200 hover:text-white"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
            Back to Site
          </Link>
        </div>

        <nav className="p-3">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive ? 'bg-opacity-20' : 'hover:bg-opacity-10'
                }`}
                style={{
                  background: isActive ? `${BRAND_COLORS.tropicalTeal}33` : 'transparent',
                  color: isActive ? BRAND_COLORS.tropicalTeal : 'rgba(255,255,255,0.6)',
                }}
              >
                <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                <span>{item.label}</span>
                {isActive && (
                  <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3 ml-auto" style={{ color: BRAND_COLORS.tropicalTeal }} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
            TechTour Ghana
          </p>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ margin: 0, padding: 0 }}>
        <div
          className="flex items-center justify-between px-8 py-4 border-b flex-shrink-0"
          style={{ background: themeStyles.topBarBg, borderColor: themeStyles.border, margin: 0, paddingTop: '16px', paddingBottom: '16px' }}
        >
          <div>
            <h1 className="text-xl font-bold" style={{ color: themeStyles.textPrimary }}>{title}</h1>
            {subtitle ? (
              <p className="text-sm" style={{ color: themeStyles.textSecondary }}>{subtitle}</p>
            ) : (
              <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
                {getGreeting()}, {getFullName()}!
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{ background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', color: themeStyles.textSecondary }}
            >
              <FontAwesomeIcon icon={isDimMode ? faSun : faMoon} className="w-4 h-4" />
            </button>

            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 relative"
                style={{ background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', color: themeStyles.textSecondary }}
              >
                <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
              </button>
              {isNotificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-xl shadow-lg overflow-hidden z-50"
                  style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
                >
                  <div className="p-3 border-b" style={{ borderColor: themeStyles.border }}>
                    <p className="font-semibold text-sm" style={{ color: themeStyles.textPrimary }}>Notifications</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-sm" style={{ color: themeStyles.textMuted }}>No new notifications</p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-opacity-10"
                style={{ background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.tropicalTeal}, ${BRAND_COLORS.sandyOrange})`, color: 'white' }}
                >
                  {getUserInitials()}
                </div>
                <span className="text-sm font-medium" style={{ color: themeStyles.textPrimary }}>{getFullName()}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} style={{ color: themeStyles.textMuted }} />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50"
                  style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
                >
                  <div className="p-3 border-b" style={{ borderColor: themeStyles.border }}>
                    <p className="font-semibold text-sm" style={{ color: themeStyles.textPrimary }}>{getFullName()}</p>
                    <p className="text-xs" style={{ color: themeStyles.textMuted }}>{user?.email}</p>
                  </div>

                  {TOP_BAR_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 hover:bg-opacity-5"
                      style={{ color: themeStyles.textSecondary }}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}

                  <div className="border-t" style={{ borderColor: themeStyles.border }}></div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 text-sm w-full text-left transition-all duration-200 hover:bg-red-500/10"
                    style={{ color: '#EF4444' }}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8" style={{ paddingTop: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
