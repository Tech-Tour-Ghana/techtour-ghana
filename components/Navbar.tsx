"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faCaretDown, faSun, faMoon,
  faUser, faSignOutAlt, faChevronDown,
  faCog, faDashboard, faSearch, faHandPeace
} from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';
import { getAuthStatus, logoutUser, User } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { createBrowserClient } from '@/lib/supabase/client';

interface NavbarItem {
  id: string;
  label: string;
  url: string;
  has_dropdown: boolean;
  dropdowns?: { label: string; url: string }[];
}

interface SiteSettings {
  logo: string;
  site_name: string;
  site_tagline: string;
}

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isDimMode, toggleTheme } = useTheme();
  const { clearCart } = useCart();

  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<NavbarItem | null>(null);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [navbarItems, setNavbarItems] = useState<NavbarItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const dropdownTimer = useRef<NodeJS.Timeout | null>(null);
  const submenuTimer = useRef<NodeJS.Timeout | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const isAuthPage = pathname?.startsWith('/auth/');

  // HELPER: Check if a URL matches the current path
  const isUrlActive = (url: string, exactMatch: boolean = false) => {
    if (!url || !pathname) return false;

    // Normalize URLs by removing trailing slashes
    const cleanUrl = url.replace(/\/$/, '');
    const cleanPath = pathname.replace(/\/$/, '');

    if (exactMatch) {
      return cleanPath === cleanUrl;
    }

    // For non-exact matches, check if pathname starts with the URL
    // But avoid matching "/" against everything
    if (cleanUrl === '' || cleanUrl === '/') {
      return cleanPath === '' || cleanPath === '/';
    }

    return cleanPath === cleanUrl;
  };

  // HELPER: Check if a parent nav item has an active child
  const hasActiveChild = (item: NavbarItem): boolean => {
    if (!item.has_dropdown || !item.dropdowns) return false;
    return item.dropdowns.some((dropdown) => isUrlActive(dropdown.url));
  };

  // HELPER: Check if a parent nav item is active (self or child)
  const isParentActive = (item: NavbarItem): boolean => {
    // Direct match on parent URL
    if (!item.has_dropdown && isUrlActive(item.url)) return true;

    // Match on parent URL OR any child URL
    if (item.has_dropdown) {
      return isUrlActive(item.url) || hasActiveChild(item);
    }

    return false;
  };

  // 1. LOAD DATA
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    };

    loadUserFromStorage();

    const supabase = createBrowserClient();

    const fetchNavbar = async () => {
      try {
        const [menusRes, dropdownsRes] = await Promise.all([
          supabase.from('navbar_menus').select('id, label, url, has_dropdown').order('sort_order'),
          supabase.from('navbar_dropdowns').select('parent_menu_id, label, url').order('sort_order'),
        ]);
        if (menusRes.error) throw menusRes.error;
        if (dropdownsRes.error) throw dropdownsRes.error;
        setNavbarItems(menusRes.data.map((menu) => ({
          id: menu.id,
          label: menu.label,
          url: menu.url,
          has_dropdown: menu.has_dropdown,
          ...(menu.has_dropdown && {
            dropdowns: dropdownsRes.data
              .filter((d) => d.parent_menu_id === menu.id)
              .map((d) => ({ label: d.label, url: d.url })),
          }),
        })));
      } catch (error) {
        console.error('Error fetching navbar:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSiteSettings = async () => {
      try {
        const [siteRes, footerRes] = await Promise.all([
          supabase.from('site_settings').select('logo_url').limit(1).maybeSingle(),
          supabase.from('footer_settings').select('company_name, tagline').limit(1).maybeSingle(),
        ]);
        if (siteRes.error) throw siteRes.error;
        if (footerRes.error) throw footerRes.error;
        if (siteRes.data) {
          setSiteSettings({
            logo: siteRes.data.logo_url,
            site_name: footerRes.data?.company_name ?? '',
            site_tagline: footerRes.data?.tagline ?? '',
          });
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    };

    const fetchAuthStatus = async () => {
      try {
        const status = await getAuthStatus();
        if (status.is_authenticated && status.user) {
          setIsAuthenticated(true);
          setUser(status.user);
          localStorage.setItem('user', JSON.stringify(status.user));

          const justLoggedIn = localStorage.getItem('just_logged_in');
          if (justLoggedIn === 'true') {
            const displayName = status.user.display_name || status.user.first_name || status.user.email?.split('@')[0] || 'User';
            setWelcomeMessage(`Welcome back, ${displayName}!`);
            setShowWelcome(true);
            localStorage.removeItem('just_logged_in');
            setTimeout(() => setShowWelcome(false), 5000);
          }
        }
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };

    Promise.all([fetchNavbar(), fetchSiteSettings(), fetchAuthStatus()]);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const userData = JSON.parse(e.newValue);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const handleUserLoggedIn = (event: CustomEvent) => {
      const userData = event.detail;
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        const displayName = userData.display_name || userData.first_name || userData.email?.split('@')[0] || 'User';
        setWelcomeMessage(`Welcome, ${displayName}!`);
        setShowWelcome(true);
        setTimeout(() => setShowWelcome(false), 5000);
      }
    };
    window.addEventListener('userLoggedIn', handleUserLoggedIn as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleUserLoggedIn as EventListener);
    };
  }, []);

  // 2. SCROLL EFFECT - Auto-close mobile menu on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setScrolled(currentScrollY > 20);

      if (isMobileMenuOpen && Math.abs(currentScrollY - lastScrollY) > 5) {
        setIsMobileMenuOpen(false);
        setMobileDropdown(null);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  // 3. BODY SCROLL LOCK WHEN MOBILE MENU IS OPEN
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // 4. CLICK OUTSIDE HANDLERS
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 5. BODY CLASS MANAGEMENT
  useEffect(() => {
    if (!isAuthPage) {
      document.body.classList.add('has-navbar');
      document.body.classList.remove('auth-page');
    } else {
      document.body.classList.remove('has-navbar');
      document.body.classList.add('auth-page');
    }
    return () => {
      document.body.classList.remove('has-navbar');
      document.body.classList.remove('auth-page');
    };
  }, [isAuthPage]);

  // 6. CLOSE DROPDOWN ON ROUTE CHANGE
  useEffect(() => {
    setActiveDropdown(null);
    setActiveSubmenu(null);
    setMobileDropdown(null);
    setIsMobileMenuOpen(false);
    if (dropdownTimer.current) {
      clearTimeout(dropdownTimer.current);
      dropdownTimer.current = null;
    }
    if (submenuTimer.current) {
      clearTimeout(submenuTimer.current);
      submenuTimer.current = null;
    }
  }, [pathname]);

  // 7. HELPER FUNCTIONS
  const handleDropdownEnter = (item: NavbarItem) => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    if (submenuTimer.current) clearTimeout(submenuTimer.current);
    setActiveDropdown(item.id);
    if (item.has_dropdown && item.dropdowns && item.dropdowns.length > 0) {
      setActiveSubmenu(item);
    }
  };

  const handleDropdownLeave = () => {
    dropdownTimer.current = setTimeout(() => {
      setActiveDropdown(null);
      submenuTimer.current = setTimeout(() => {
        setActiveSubmenu(null);
      }, 200);
    }, 300);
  };

  const handleSubmenuEnter = () => {
    if (submenuTimer.current) clearTimeout(submenuTimer.current);
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
  };

  const handleSubmenuLeave = () => {
    submenuTimer.current = setTimeout(() => {
      setActiveSubmenu(null);
      setActiveDropdown(null);
    }, 300);
  };

  const handleDropdownItemClick = (url: string) => {
    setActiveDropdown(null);
    setActiveSubmenu(null);
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    if (submenuTimer.current) clearTimeout(submenuTimer.current);
    router.push(url);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearCart();
      setIsAuthenticated(false);
      setUser(null);
      setIsUserDropdownOpen(false);
      localStorage.removeItem('just_logged_in');
      localStorage.removeItem('user');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMobileDropdown = (id: string) => {
    setMobileDropdown(mobileDropdown === id ? null : id);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setMobileDropdown(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setMobileDropdown(null);
  };

  const getUserDisplayName = () => {
    if (user?.display_name) return user.display_name;
    if (user?.first_name) return user.first_name;
    if (user?.full_name) return user.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    if (name && name.length > 0) return name.charAt(0).toUpperCase();
    return 'U';
  };

  const logoSrc = siteSettings?.logo || '/images/logo-40x40.png';

  if (loading) {
    return (
      <nav className="navbar navbar-loading-state">
        <div className="nav-container">
          <div className="nav-logo">
            <img src={logoSrc} alt="TechTour Logo" className="nav-logo-img" />
            <span className="nav-logo-text">TECHTOUR <span className="nav-logo-accent">GHANA</span></span>
          </div>
          <div className="nav-right">
            <div className="nav-skeleton-btn">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      {showWelcome && (
        <div className="welcome-banner">
          <div className="welcome-content">
            <div className="welcome-icon">
              <FontAwesomeIcon icon={faHandPeace} />
            </div>
            <div className="welcome-text">
              <div className="welcome-message">{welcomeMessage}</div>
              <div className="welcome-sub">Successfully logged in</div>
            </div>
            <button className="welcome-close" onClick={() => setShowWelcome(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="welcome-progress-bar">
            <div className="welcome-progress-fill"></div>
          </div>
        </div>
      )}

      {/* ===== NAVBAR ===== */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>

        {/* TOP BAR */}
        <div className="nav-top-bar">
          <div className="nav-container">
            {/* Logo */}
            <Link href="/" className="nav-logo" onClick={closeMobileMenu}>
              <img src={logoSrc} alt="TechTour Logo" className="nav-logo-img" />
              <span className="nav-logo-text">TECHTOUR <span className="nav-logo-accent">GHANA</span></span>
            </Link>

            {/* Centered Desktop Menu */}
            <ul className="nav-desktop-menu">
              {navbarItems.map((item) => {
                const parentActive = isParentActive(item);
                const childActive = item.has_dropdown && hasActiveChild(item);

                return (
                  <li
                    key={item.id}
                    className={`nav-item ${activeDropdown === item.id ? 'hovered' : ''} ${parentActive ? 'active' : ''} ${childActive ? 'has-active-child' : ''}`}
                    onMouseEnter={() => handleDropdownEnter(item)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {item.has_dropdown ? (
                      <button className="nav-link-btn">
                        {item.label}
                        <FontAwesomeIcon icon={faCaretDown} className="nav-arrow" />
                      </button>
                    ) : (
                      <Link href={item.url} className="nav-link">
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Right Actions */}
            <div className="nav-right">
              <button className="nav-icon-btn desktop-only" aria-label="Search">
                <FontAwesomeIcon icon={faSearch} />
              </button>

              <button className="nav-theme-btn desktop-only" onClick={toggleTheme}>
                <FontAwesomeIcon icon={isDimMode ? faSun : faMoon} />
                <span>{isDimMode ? 'Light' : 'Dark'}</span>
              </button>

              <div className="desktop-only">
                {isAuthenticated && user ? (
                  <div className="nav-user-menu" ref={userDropdownRef}>
                    <button
                      className="nav-user-btn"
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    >
                      <div className="nav-user-avatar">{getUserInitials()}</div>
                      <span className="nav-user-name">{getUserDisplayName()}</span>
                      <FontAwesomeIcon icon={faChevronDown} className={`nav-user-arrow ${isUserDropdownOpen ? 'open' : ''}`} />
                    </button>
                    {isUserDropdownOpen && (
                      <div className="nav-user-dropdown">
                        <div className="nav-user-header">
                          <div className="nav-user-avatar-large">{getUserInitials()}</div>
                          <div>
                            <div className="nav-user-name-large">{getUserDisplayName()}</div>
                            <div className="nav-user-email">{user.email}</div>
                          </div>
                        </div>
                        <div className="nav-divider"></div>
                        <Link href="/auth/profile" className="nav-dropdown-link" onClick={() => setIsUserDropdownOpen(false)}>
                          <FontAwesomeIcon icon={faUser} /> Profile
                        </Link>
                        <Link href="/auth/dashboard" className="nav-dropdown-link" onClick={() => setIsUserDropdownOpen(false)}>
                          <FontAwesomeIcon icon={faDashboard} /> Dashboard
                        </Link>
                        <Link href="/auth/settings" className="nav-dropdown-link" onClick={() => setIsUserDropdownOpen(false)}>
                          <FontAwesomeIcon icon={faCog} /> Settings
                        </Link>
                        <div className="nav-divider"></div>
                        <button onClick={handleLogout} className="nav-dropdown-link nav-logout">
                          <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/auth/login" className="nav-login-btn">
                    Register / Login
                  </Link>
                )}
              </div>

              {/* SINGLE Animated Hamburger Button */}
              <button
                className={`nav-hamburger ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>
            </div>
          </div>
        </div>

        {/* OVERLAY SUB-BAR */}
        <div
          className={`nav-sub-bar ${activeSubmenu ? 'active' : ''}`}
          onMouseEnter={handleSubmenuEnter}
          onMouseLeave={handleSubmenuLeave}
        >
          <div className="nav-sub-container">
            {activeSubmenu && activeSubmenu.dropdowns && activeSubmenu.dropdowns.map((dropdown, idx) => {
              const subActive = isUrlActive(dropdown.url);
              return (
                <Link
                  key={idx}
                  href={dropdown.url}
                  className={`nav-sub-link ${subActive ? 'active' : ''}`}
                  onClick={() => handleDropdownItemClick(dropdown.url)}
                >
                  {dropdown.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ===== FULL-SCREEN MOBILE MENU ===== */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`} ref={mobileMenuRef}>
        <div className="mobile-menu-body">
          <ul className="mobile-nav-list">
            {navbarItems.map((item) => {
              const parentActive = isParentActive(item);
              const childActive = item.has_dropdown && hasActiveChild(item);

              return (
                <li key={item.id} className="mobile-nav-item">
                  {item.has_dropdown ? (
                    <>
                      <button
                        className={`mobile-dropdown-btn ${mobileDropdown === item.id ? 'expanded' : ''} ${parentActive ? 'active' : ''} ${childActive ? 'has-active-child' : ''}`}
                        onClick={() => toggleMobileDropdown(item.id)}
                      >
                        <span>{item.label}</span>
                        <FontAwesomeIcon
                          icon={faCaretDown}
                          className={`mobile-arrow ${mobileDropdown === item.id ? 'open' : ''}`}
                        />
                      </button>
                      <div className={`mobile-dropdown-content ${mobileDropdown === item.id ? 'open' : ''}`}>
                        {item.dropdowns && item.dropdowns.map((dropdown, idx) => {
                          const subActive = isUrlActive(dropdown.url);
                          return (
                            <Link
                              key={idx}
                              href={dropdown.url}
                              className={`mobile-dropdown-link ${subActive ? 'active' : ''}`}
                              onClick={closeMobileMenu}
                            >
                              {dropdown.label}
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.url}
                      className={`mobile-nav-link ${parentActive ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Footer Section */}
          <div className="mobile-menu-footer">
            <button className="mobile-theme-btn" onClick={toggleTheme}>
              <FontAwesomeIcon icon={isDimMode ? faSun : faMoon} />
              {isDimMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>

            {isAuthenticated && user ? (
              <>
                <div className="mobile-user-info">
                  <div className="mobile-user-avatar">{getUserInitials()}</div>
                  <div>
                    <div className="mobile-user-name">{getUserDisplayName()}</div>
                    <div className="mobile-user-email">{user.email}</div>
                  </div>
                </div>
                <Link href="/auth/profile" className="mobile-link-btn" onClick={closeMobileMenu}>
                  <FontAwesomeIcon icon={faUser} /> Profile
                </Link>
                <Link href="/auth/dashboard" className="mobile-link-btn" onClick={closeMobileMenu}>
                  <FontAwesomeIcon icon={faDashboard} /> Dashboard
                </Link>
                <Link href="/auth/settings" className="mobile-link-btn" onClick={closeMobileMenu}>
                  <FontAwesomeIcon icon={faCog} /> Settings
                </Link>
                <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="mobile-logout-btn">
                  <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="mobile-login-btn" onClick={closeMobileMenu}>
                Register / Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;