// New page, not a port. The old Django flow put a uidb64/token pair in the
// URL (app/auth/password-reset/confirm/[uidb64]/[token]/page.tsx in
// docs/old-sites); Supabase's reset flow instead exchanges the email link
// for a session at app/auth/callback and lands the visitor here already
// signed in, so this only needs to call updateUser. Styled to match the
// other auth screens rather than left unstyled.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    const supabase = createBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push('/auth/login?reset_sent=true');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl relative">
        <h2 className="text-xl font-bold text-center text-white">Choose a new password</h2>
        <p className="text-sm text-center leading-relaxed mt-2 text-white/60">
          Enter and confirm a new password for your account.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-lg text-sm bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white/70">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none bg-[#1a1a2e] border border-white/10 text-white placeholder:text-white/30 focus:border-amber-400"
              placeholder="At least 8 characters"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white/70">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none bg-[#1a1a2e] border border-white/10 text-white placeholder:text-white/30 focus:border-amber-400"
              placeholder="Repeat your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-1 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Save new password'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/auth/login" className="text-sm transition-colors text-white/40 hover:text-white/70">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
