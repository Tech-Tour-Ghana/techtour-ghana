'use client';

import DashboardLayout from '@/components/DashboardLayout';
import NotificationCenter from '@/components/notifications/NotificationCenter';

export default function NotificationsPage() {
  return (
    <DashboardLayout title="Notifications" subtitle="Order updates, replies to your tickets and news from TechTour">
      <NotificationCenter tone="site" />
    </DashboardLayout>
  );
}
