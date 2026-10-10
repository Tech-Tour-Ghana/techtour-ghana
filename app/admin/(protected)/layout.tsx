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

  // Admins with an authenticator app must pass the code check first. The factor
  // list is read from the auth server (not from the cookie copy of the user,
  // which can be stale), and the level of this session comes from its token.
  const [{ data: factors }, { data: aal }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if ((factors?.totp.length ?? 0) > 0 && aal?.currentLevel !== 'aal2') {
    redirect('/admin/mfa');
  }

  return <>{children}</>;
}
