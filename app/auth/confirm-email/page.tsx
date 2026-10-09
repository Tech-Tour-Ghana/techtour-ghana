// Ported from docs/old-sites/techtour-frontend/app/auth/confirm-email/page.tsx.
// Markup and styling follow the old page. The old page posted a Django
// confirmation key to /api/auth/confirm-email/. Supabase confirms the address
// when the emailed link hits /auth/callback, which sets the session and lands
// here, so this page only reports the outcome:
//   signed in and confirmed  -> "Email Verified!"
//   ?error present           -> "Verification Failed", with a resend button
//   ?email present, no user  -> "Check your inbox", with a resend button
// It replaces the old verify-email, verification-complete and confirm routes.

'use client';

import Button from '@/components/ui/Button';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faExclamationTriangle,
  faEnvelope,
  faRedo,
  faArrowRightToBracket,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { resendConfirmationEmail } from '@/lib/api';

type Status = 'loading' | 'success' | 'error' | 'pending';

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  const hasError = searchParams.has('error');
  const [status, setStatus] = useState<Status>('loading');
  const [resendNote, setResendNote] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (hasError) {
      setStatus('error');
      return;
    }
    createBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user?.email_confirmed_at) setStatus('success');
        else setStatus(emailParam ? 'pending' : 'error');
      });
  }, [hasError, emailParam]);

  const resend = async () => {
    if (!emailParam) return;
    setResending(true);
    const result = await resendConfirmationEmail(emailParam);
    setResendNote(result.success ? 'A new verification email is on its way.' : result.message || 'Could not resend the email.');
    setResending(false);
  };

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-white/60 mt-4">Verifying your email...</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <>
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-500/20">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 text-3xl" />
          </div>
          <h2 className="text-white text-2xl font-bold text-red-400">Verification Failed</h2>
          <p className="text-white/60 text-sm leading-relaxed my-3">
            The verification link is invalid or has expired. Please request a new verification email.
          </p>
          {emailParam ? (
            <Button onClick={resend} loading={resending} full>Resend Verification Email</Button>
          ) : (
            <Button href="/auth/register" full>Register Again</Button>
          )}
          {resendNote && <p className="text-white/60 text-xs mt-3">{resendNote}</p>}
        </>
      );
    }

    if (status === 'pending') {
      return (
        <>
          <div className="w-20 h-20 bg-purple-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faEnvelope} className="text-purple-400 text-3xl" />
          </div>
          <h2 className="text-white text-2xl font-bold">Check Your Inbox</h2>
          <p className="text-white/60 text-sm leading-relaxed my-3">
            We sent a verification link to <span className="text-white">{emailParam}</span>. Open it to finish creating your account.
          </p>
          <Button onClick={resend} loading={resending} full>Resend Verification Email</Button>
          {resendNote && <p className="text-white/60 text-xs mt-3">{resendNote}</p>}
        </>
      );
    }

    return (
      <>
        <div className="w-20 h-20 bg-purple-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faCheckCircle} className="text-purple-400 text-3xl" />
        </div>
        <h2 className="text-white text-2xl font-bold">Email Verified!</h2>
        <p className="text-white/60 text-sm leading-relaxed my-3">
          Your email has been successfully verified. Welcome to TechTour Ghana.
        </p>
        <Button href="/auth/dashboard" full>Go to Dashboard</Button>
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] p-4 relative overflow-hidden">

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl hover:border-purple-500/20 transition-all text-center">
          <div className="mb-4">
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              TECHTOUR <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">GHANA</span>
            </h1>
          </div>

          {renderContent()}

          <div className="mt-5 pt-4 border-t border-white/5 text-white/15 text-xs">
            &copy; {new Date().getFullYear()} TechTour Ghana. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e]">
          <div className="inline-block w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}
