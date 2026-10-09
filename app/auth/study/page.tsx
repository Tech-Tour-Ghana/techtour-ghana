// Ported from docs/old-sites/techtour-frontend/app/auth/study/page.tsx.
// Markup and styling are unchanged. getUserStudy (lib/api.ts) reads
// public.study_applications through Supabase; RLS (0016) scopes it to the
// caller. Signed-out visitors are redirected by middleware.ts.

'use client';

import Button from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserStudy, type StudyApplication } from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap,
  faGlobeAfrica,
  faClock,
  faCheckCircle,
  faUniversity,
  faMapMarkerAlt,
  faCalendarAlt,
  faBook,
  faChevronRight,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';

const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
};

export default function StudyPage() {
  const router = useRouter();
  const { isDimMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<StudyApplication[]>([]);

  useEffect(() => {
    getUserStudy()
      .then(setApplications)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      approved: '#10B981',
      rejected: '#EF4444',
      completed: '#3B82F6',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#000000',
    textSecondary: isDimMode ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    hoverBg: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDimMode ? '#0A0A0A' : '#F9F9F9' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-sm" style={{ color: themeStyles.textSecondary }}>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Study Abroad" subtitle="Your study abroad applications">
      {applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl p-5 transition-all duration-200 hover:shadow-lg"
              style={{
                background: themeStyles.cardBg,
                border: `1px solid ${themeStyles.border}`,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold" style={{ color: themeStyles.textPrimary }}>
                      {app.program_name}
                    </h3>
                    <span
                      className="px-2.5 py-0.5 text-xs font-medium rounded-full"
                      style={{
                        background: `${getStatusColor(app.status)}20`,
                        color: getStatusColor(app.status),
                      }}
                    >
                      {app.status === 'approved' ? (
                        <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 mr-1" />
                      ) : app.status === 'pending' ? (
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1" />
                      ) : (
                        <FontAwesomeIcon icon={faExclamationCircle} className="w-3 h-3 mr-1" />
                      )}
                      {getStatusLabel(app.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm" style={{ color: themeStyles.textSecondary }}>
                    <span>
                      <FontAwesomeIcon icon={faUniversity} className="w-3 h-3 mr-1" />
                      {app.university}
                    </span>
                    <span>
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3 mr-1" />
                      {app.location}
                    </span>
                    <span>
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3 mr-1" />
                      Starts: {new Date(app.start_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span>
                      <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1" />
                      {app.duration}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: themeStyles.textMuted }}>
                    Applied on {new Date(app.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <Button variant="secondary" size="sm" arrow={false} style={{ color: themeStyles.textSecondary }}>
                  View Details
                  <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <FontAwesomeIcon icon={faGraduationCap} className="text-6xl mb-4" style={{ color: themeStyles.textMuted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: themeStyles.textPrimary }}>No applications yet</h3>
          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>Start your study abroad journey today.</p>
          <Button variant="accent" className="mt-4" href="/study">Explore Programs</Button>
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