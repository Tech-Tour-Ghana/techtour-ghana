'use client';

import AdminLayout from '@/components/AdminLayout';
import SEOManager from '@/components/admin/seo/SEOManager';

export default function SeoManagerPage() {
  return (
    <AdminLayout title="SEO Manager" subtitle="On-site search health, redirects and site-wide SEO settings">
      <SEOManager />
    </AdminLayout>
  );
}
