import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
