'use client';

import { useEffect, useState } from 'react';

import AdminLayout from '@/components/AdminLayout';
import BlogEditor from '@/components/admin/blog/BlogEditor';

// A first autosave rewrites the URL to /admin/blog/new?draft=<id>. Reading it once, after mount,
// lets a reload reopen that draft without the editor ever switching ids while someone is typing.
export default function NewArticlePage() {
  const [draftId, setDraftId] = useState<string | null | undefined>(undefined);
  useEffect(() => { setDraftId(new URLSearchParams(window.location.search).get('draft')); }, []);

  return (
    <AdminLayout title="New article" subtitle="Write, optimise and publish">
      {draftId !== undefined && <BlogEditor postId={draftId} />}
    </AdminLayout>
  );
}
