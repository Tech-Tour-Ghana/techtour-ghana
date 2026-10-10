// Signed-in customer shell. Sidebar on large screens; below lg the section links
// become a scrollable bar under the header, so nothing is fixed-width on a phone.

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
  faGraduationCap,
  faHeart,
  faCreditCard,
  faBell,
  faShieldAlt,
  faCog,
  faSignOutAlt,
  faChevronRight,
  faArrowLeft,
  faSun,
  faMoon,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import AvatarContent from '@/components/AvatarContent';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { getAuthStatus, getNotifications, logoutUser, type Notification, type User } from '@/lib/api';

const BRAND_COLORS = {
  tropicalTeal: 'var(--brand-teal)',
  sandyOrange: 'var(--brand-gold)',
};

export const SIDEBAR_ITEMS = [
  { icon: faDashboard, label: 'Dashboard', href: '/auth/dashboard' },
  { icon: faShoppingBag, label: 'Orders', href: '/auth/orders' },
  { icon: faCreditCard, label: 'Payments', href: '/auth/payments' },
  { icon: faGraduationCap, label: 'Study', href: '/auth/study' },
  { icon: faCalendarCheck, label: 'Tours', href: '/auth/tours' },
  { icon: faHeart, label: 'Wishlist', href: '/auth/wishlist' },
];

export const TOP_BAR_ITEMS = [
  { icon: faUser, label: 'Profile', href: '/auth/profile' },
  { icon: faCog, label: 'Preferences', href: '/auth/settings' },
  { icon: faShieldAlt, label: 'Security', href: '/auth/security' },
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  useEffect(() => {
    getNotifications().then(setNotifications);
  }, []);
  const unreadNotifications = notifications.filter((n) => !n.read).length;
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
    background: 'var(--brand-bg)',
    cardBg: 'var(--brand-card)',
    textPrimary: 'var(--brand-text)',
    textSecondary: 'var(--brand-text-2)',
    textMuted: 'var(--brand-muted)',
    border: isDimMode ? 'rgba(var(--brand-white-rgb), 0.05)' : 'var(--brand-line)',
    topBarBg: 'var(--brand-card)',
  };

  return (
    <div className="dashboard-layout-wrapper flex h-screen overflow-hidden" style={{ background: themeStyles.background, margin: 0, padding: 0 }}>
      {/* ===== SIDEBAR (large screens) ===== */}
      <aside
        className="hidden h-full w-64 flex-shrink-0 flex-col overflow-y-auto lg:flex"
        style={{ background: 'var(--brand-ink)', borderRight: `1px solid ${isDimMode ? 'rgba(var(--brand-white-rgb), 0.05)' : 'rgba(var(--brand-white-rgb), 0.1)'}` }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(var(--brand-white-rgb), 0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-base font-extrabold text-white" style={{ background: BRAND_COLORS.tropicalTeal }} aria-hidden>T</div>
            <div>
              <span className="block text-sm font-bold leading-tight text-white">TECHTOUR</span>
              <span className="text-xs" style={{ color: BRAND_COLORS.sandyOrange }}>GHANA</span>
            </div>
          </div>
          <Link href="/" className="mt-3 flex items-center gap-2 text-xs transition-colors hover:text-white" style={{ color: 'rgba(var(--brand-white-rgb), 0.55)' }}>
            <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />
            Back to site
          </Link>
        </div>

        <nav className="flex-1 p-3" aria-label="Account sections">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className="mb-1 flex min-h-[2.75rem] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-white/5"
                style={{
                  background: isActive ? `color-mix(in srgb, ${BRAND_COLORS.tropicalTeal} 20%, transparent)` : 'transparent',
                  color: isActive ? 'color-mix(in srgb, var(--brand-teal) 60%, var(--brand-white))' : 'rgba(var(--brand-white-rgb), 0.72)',
                }}
              >
                <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                <span>{item.label}</span>
                {isActive && <FontAwesomeIcon icon={faChevronRight} className="ml-auto h-3 w-3" />}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 lg:px-8 lg:py-4"
          style={{ background: themeStyles.topBarBg, borderColor: themeStyles.border }}
        >
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-xl" style={{ color: themeStyles.textPrimary }}>{title}</h1>
            {subtitle ? (
              <p className="truncate text-sm" style={{ color: themeStyles.textSecondary }}>{subtitle}</p>
            ) : (
              <p className="truncate text-sm" style={{ color: themeStyles.textSecondary }}>
                {getGreeting()}, {getFullName()}!
              </p>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              aria-label={isDimMode ? 'Switch to light theme' : 'Switch to dark theme'}
              className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
              style={{ background: isDimMode ? 'rgba(var(--brand-white-rgb), 0.05)' : 'var(--brand-subtle)', color: themeStyles.textSecondary }}
            >
              <FontAwesomeIcon icon={isDimMode ? faSun : faMoon} className="w-4 h-4" />
            </button>

            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
                aria-expanded={isNotificationsOpen}
                className="relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
                style={{ background: isDimMode ? 'rgba(var(--brand-white-rgb), 0.05)' : 'var(--brand-subtle)', color: themeStyles.textSecondary }}
              >
                <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              {isNotificationsOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl"
                  style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
                >
                  <div className="p-3 border-b" style={{ borderColor: themeStyles.border }}>
                    <p className="font-semibold text-sm" style={{ color: themeStyles.textPrimary }}>Notifications</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-3 text-center">
                      <p className="text-sm" style={{ color: themeStyles.textMuted }}>No new notifications</p>
                    </div>
                  ) : (
                    <>
                      {notifications.slice(0, 4).map((n) => (
                        <div key={n.id} className="p-3 border-b" style={{ borderColor: themeStyles.border }}>
                          <p className="text-sm font-medium" style={{ color: themeStyles.textPrimary }}>{n.title}</p>
                          <p className="text-xs" style={{ color: themeStyles.textMuted }}>{n.message}</p>
                        </div>
                      ))}
                      <Link href="/auth/notifications" onClick={() => setIsNotificationsOpen(false)} className="block p-3 text-center text-sm font-medium" style={{ color: BRAND_COLORS.tropicalTeal }}>
                        View all
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="Account menu"
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
                className="flex min-h-[2.75rem] items-center gap-2 rounded-lg px-2 sm:px-3"
                style={{ background: isDimMode ? 'rgba(var(--brand-white-rgb), 0.05)' : 'var(--brand-subtle)' }}
              >
                <div
                  className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold"
                  style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}
                >
                  <AvatarContent src={user?.avatar_url} name={getFullName()} />
                </div>
                <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline" style={{ color: themeStyles.textPrimary }}>{getFullName()}</span>
                <FontAwesomeIcon icon={faChevronDown} className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} style={{ color: themeStyles.textMuted }} />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl"
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
                      className="flex min-h-[2.75rem] items-center gap-3 px-3 text-sm hover:bg-black/5"
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
                    className="flex min-h-[2.75rem] w-full items-center gap-3 px-3 text-left text-sm hover:bg-red-500/10"
                    style={{ color: 'var(--brand-error)' }}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <nav className="flex-shrink-0 overflow-x-auto border-b px-3 py-2 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden" aria-label="Account sections" style={{ background: themeStyles.topBarBg, borderColor: themeStyles.border }}>
          <ul className="flex w-max gap-2">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className="flex min-h-[2.5rem] items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium"
                    style={{ background: isActive ? BRAND_COLORS.tropicalTeal : 'transparent', color: isActive ? 'var(--brand-white)' : themeStyles.textSecondary, border: `1px solid ${isActive ? BRAND_COLORS.tropicalTeal : themeStyles.border}` }}
                  >
                    <FontAwesomeIcon icon={item.icon} className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
