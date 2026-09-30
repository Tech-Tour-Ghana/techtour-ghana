'use client';

import { use } from 'react';

import AdminLayout from '@/components/AdminLayout';
import BlogEditor from '@/components/admin/blog/BlogEditor';

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminLayout title="Edit article" subtitle="Write, optimise and publish">
      <BlogEditor postId={id} />
    </AdminLayout>
  );
}
