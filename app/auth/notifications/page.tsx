// Ported from docs/old-sites/techtour-frontend/app/auth/notifications/page.tsx.
// Markup and styling are unchanged. The old page rendered a hardcoded array of
// sample notifications. This one reads public.notifications (0017), which the
// database fills on signup and on each order, and persists mark-as-read.

'use client';

import Button from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';
import { getNotifications, markNotificationsRead, type Notification } from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faGlobeAfrica,
  faCheckCircle,
  faClock,
  faShoppingBag,
  faCalendarCheck,
  faHeart,
  faTag,
  faChevronRight,
  faEllipsisV,
} from '@fortawesome/free-solid-svg-icons';

const BRAND_COLORS = {
  tropicalTeal: '#0D7A7D',
  sandyOrange: '#E6A64D',
};

export default function NotificationsPage() {
  const { isDimMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [failed, setFailed] = useState(false);

  const load = () => {
    setFailed(false);
    setLoading(true);
    getNotifications(true)
      .then(setNotifications)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markAsRead = (id: string) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markNotificationsRead(id);
  };

  const markAllAsRead = () => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    markNotificationsRead();
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      order: faShoppingBag,
      tour: faCalendarCheck,
      promotion: faTag,
      wishlist: faHeart,
      general: faBell,
    };
    return icons[type] || faBell;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      order: BRAND_COLORS.tropicalTeal,
      tour: '#8B5CF6',
      promotion: BRAND_COLORS.sandyOrange,
      wishlist: '#EF4444',
      general: '#3B82F6',
    };
    return colors[type] || '#6B7280';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#000000',
    textSecondary: isDimMode ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDimMode ? '#9CA3AF' : '#6B7280',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    hoverBg: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDimMode ? '#0A0A0A' : '#F9F9F9' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-sm" style={{ color: themeStyles.textSecondary }}>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <DashboardLayout title="Notifications" subtitle={`${unreadCount} unread notifications`}>
        <div role="alert" className="text-center py-12">
          <p className="mb-4 text-sm" style={{ color: themeStyles.textSecondary }}>We could not load this right now. Please try again.</p>
          <Button variant="accent" size="sm" onClick={load}>Try again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Notifications" subtitle={`${unreadCount} unread notifications`}>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: themeStyles.textSecondary }}>
            {notifications.length} total notifications
          </span>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full" style={{ background: '#EF444420', color: '#EF4444' }}>
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" arrow={false} onClick={markAllAsRead} style={{ color: themeStyles.textSecondary }}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl p-4 transition-all duration-200 hover:shadow-lg ${
                !notification.read ? 'border-l-4' : ''
              }`}
              style={{
                background: themeStyles.cardBg,
                border: `1px solid ${themeStyles.border}`,
                borderLeftColor: !notification.read ? BRAND_COLORS.tropicalTeal : themeStyles.border,
                borderLeftWidth: !notification.read ? '4px' : '1px',
              }}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${getTypeColor(notification.type)}20` }}
                >
                  <FontAwesomeIcon
                    icon={getTypeIcon(notification.type)}
                    style={{ color: getTypeColor(notification.type) }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: themeStyles.textPrimary }}>
                        {notification.title}
                        {!notification.read && (
                          <span className="ml-2 w-2 h-2 rounded-full inline-block" style={{ background: BRAND_COLORS.tropicalTeal }} />
                        )}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: themeStyles.textSecondary }}>
                        {notification.message}
                      </p>
                      <p className="text-xs mt-1" style={{ color: themeStyles.textMuted }}>
                        {new Date(notification.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      aria-label="More options"
                      className="p-1.5 rounded-lg transition-all duration-200 hover:bg-opacity-10"
                      style={{ color: themeStyles.textMuted }}
                    >
                      <FontAwesomeIcon icon={faEllipsisV} className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <FontAwesomeIcon icon={faBell} className="text-6xl mb-4" style={{ color: themeStyles.textMuted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: themeStyles.textPrimary }}>No notifications</h3>
          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>You're all caught up!</p>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: themeStyles.textMuted }}>
          <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
          TechTour Ghana. Redefining African Tourism Through Innovation
        </p>
      </div>
    </DashboardLayout>
  );
}