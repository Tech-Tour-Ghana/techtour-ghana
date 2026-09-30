'use client';

// Admin analytics. Every figure is aggregated in Postgres by the functions in
// migration 0019 (admin-only, RLS-respecting), the browser never downloads raw
// analytics rows. The dashboard itself lives in components/admin/analytics.

import { Suspense } from 'react';

import AdminLayout from '@/components/AdminLayout';
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard';
import AnalyticsSkeleton from '@/components/admin/analytics/AnalyticsSkeleton';

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout title="Analytics" subtitle="Traffic, sales and customers">
      {/* useSearchParams (the date range lives in the URL) needs a Suspense boundary. */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
    </AdminLayout>
  );
}
