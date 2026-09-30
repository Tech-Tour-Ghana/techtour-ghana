'use client';

import AdminLayout from '@/components/AdminLayout';
import BlogEditor from '@/components/admin/blog/BlogEditor';

export default function NewArticlePage() {
  return (
    <AdminLayout title="New article" subtitle="Write, optimise and publish">
      <BlogEditor postId={null} />
    </AdminLayout>
  );
}
