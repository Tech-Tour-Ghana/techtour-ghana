// Ported from docs/old-sites/techtour-frontend/app/auth/password-reset/page.tsx.
// requestPasswordReset (lib/api.ts) now calls Supabase Auth instead of a
// Django endpoint; markup and styling are unchanged.

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/api';

function PasswordResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    setIsDarkMode(theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    setIsThemeLoaded(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await requestPasswordReset(email);
    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Password reset link sent to your email.' });
      setTimeout(() => {
        router.push('/auth/login?reset_sent=true');
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to send reset link.' });
    }
    setIsSubmitting(false);
  };

  const closeModal = () => {
    router.push('/auth/login');
  };

  if (!isThemeLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-white text-center">
          <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className={`bg-[#1a1a2e] border border-white/10 rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl relative ${isDarkMode ? 'bg-[#1a1a2e]' : 'bg-white'}`}>
        <button onClick={closeModal} className={`absolute top-4 right-4 transition-colors ${isDarkMode ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-12 p-1.5 rounded-full transition-all ${isDarkMode ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-500/20">
          <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>

        <h2 className={`text-xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Reset Password</h2>

        <p className={`text-sm text-center leading-relaxed mt-2 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? isDarkMode
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-green-50 border border-green-200 text-green-600'
                : isDarkMode
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-red-50 border border-red-200 text-red-600'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all ${isDarkMode ? 'bg-[#1a1a2e] border border-white/10 text-white placeholder:text-white/30 focus:border-amber-400' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-amber-400'}`}
              placeholder="you@business.com"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/auth/login" className={`text-sm transition-colors ${isDarkMode ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-700'}`}>
            ← Back to Login
          </Link>
        </div>

        <div className={`mt-5 pt-4 border-t text-xs text-center ${isDarkMode ? 'border-white/5 text-white/20' : 'border-gray-200 text-gray-400'}`}>
          &copy; {new Date().getFullYear()} TechTour Ghana. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
          <div className="text-white text-center">
            <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white/60">Loading...</p>
          </div>
        </div>
      }
    >
      <PasswordResetContent />
    </Suspense>
  );
}
