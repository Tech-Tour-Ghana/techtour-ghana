'use client';

// Admin home. The dashboard itself lives in components/admin/dashboard.

import AdminLayout from '@/components/AdminLayout';
import DashboardOverview from '@/components/admin/dashboard/DashboardOverview';

export default function AdminDashboardPage() {
  return (
    <AdminLayout title="Dashboard" subtitle="Overview of the site">
      <DashboardOverview />
    </AdminLayout>
  );
}
