'use client';

import AdminLayout from '@/components/AdminLayout';
import MaintenanceManager from '@/components/admin/maintenance/MaintenanceManager';

export default function MaintenancePage() {
  return (
    <AdminLayout title="Maintenance Mode" subtitle="Show visitors a maintenance page while you work on the site">
      <MaintenanceManager />
    </AdminLayout>
  );
}
