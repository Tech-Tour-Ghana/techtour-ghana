'use client';

// Media Library: upload, organise and describe the images used across the site.
// The same component powers the picker inside the blog editor and other forms.

import AdminLayout from '@/components/AdminLayout';
import MediaLibrary from '@/components/admin/media/MediaLibrary';

export default function MediaLibraryPage() {
  return (
    <AdminLayout title="Media Library" subtitle="Upload, organise and describe site images">
      <MediaLibrary mode="manage" />
    </AdminLayout>
  );
}
