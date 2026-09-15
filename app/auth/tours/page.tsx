// Ported from docs/old-sites/techtour-frontend/app/auth/tours/page.tsx.
// Markup and styling are unchanged. getUserTours (lib/api.ts) now queries
// public.bookings directly; guide_name had no column anywhere in the new
// schema, so that line is dropped rather than invented, and the empty state
// links to /services/onsite-tourism (the real tours vertical) instead of
// /destinations, which never existed on either site.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserTours, type TourBooking } from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faGlobeAfrica, faClock, faMapMarkerAlt, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
};

export default function ToursPage() {
  const router = useRouter();
  const { isDimMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<TourBooking[]>([]);

  useEffect(() => {
    getUserTours()
      .then(setTours)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      confirmed: '#10B981',
      completed: '#10B981',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#000000',
    textSecondary: isDimMode ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDimMode ? '#0A0A0A' : '#F9F9F9' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-sm" style={{ color: themeStyles.textSecondary }}>Loading tours...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="My Tours" subtitle="Your tour bookings and experiences">
      {tours.length > 0 ? (
        <div className="space-y-4">
          {tours.map((tour) => (
            <div key={tour.id} className="rounded-2xl p-5 transition-all duration-200 hover:shadow-lg" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold" style={{ color: themeStyles.textPrimary }}>{tour.tour_name}</h3>
                    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full" style={{ background: `${getStatusColor(tour.status)}20`, color: getStatusColor(tour.status) }}>
                      {getStatusLabel(tour.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm" style={{ color: themeStyles.textSecondary }}>
                    {tour.tour_location && (
                      <span>
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3 mr-1" />
                        {tour.tour_location}
                      </span>
                    )}
                    {tour.booking_date && (
                      <span>
                        <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 mr-1" />
                        {new Date(tour.booking_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {tour.duration_days > 0 && (
                      <span>
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1" />
                        {tour.duration_days} days
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-semibold" style={{ color: BRAND_COLORS.tropicalTeal }}>
                      {tour.currency === 'GHS' ? '₵' : tour.currency + ' '}{tour.total_price.toFixed(2)}
                    </span>
                    <span className="text-xs ml-2" style={{ color: themeStyles.textMuted }}>
                      • {tour.participants} {tour.participants === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <FontAwesomeIcon icon={faCalendarCheck} className="text-6xl mb-4" style={{ color: themeStyles.textMuted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: themeStyles.textPrimary }}>No tours booked yet</h3>
          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>Explore our destinations and book an unforgettable experience.</p>
          <button className="mt-4 px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105" style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }} onClick={() => router.push('/services/onsite-tourism')}>
            Explore Tours
          </button>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: themeStyles.textMuted }}>
          <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
          TechTour Ghana — Redefining African Tourism Through Innovation
        </p>
      </div>
    </DashboardLayout>
  );
}
