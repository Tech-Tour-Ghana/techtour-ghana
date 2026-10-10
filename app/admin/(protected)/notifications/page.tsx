'use client';

import AdminLayout from '@/components/AdminLayout';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function AdminNotificationsPage() {
  return (
    <AdminLayout title="Notifications" subtitle="New tickets, orders, bookings, applications and messages">
      <NotificationCenter tone="admin" />
    </AdminLayout>
  );
}
