// D:\techtour-ghana\techtour-frontend\app\market\payment\verify\page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faArrowLeft,
  faShoppingCart,
  faHome,
  faCrown,
  faStore,
  faGlobeAfrica,
} from '@fortawesome/free-solid-svg-icons';
import { paystackService } from '@/services/paystackService';
import { BRAND_COLORS } from '@/config/paystack';

// ===== THEME COLORS =====
const THEME_COLORS = {
  light: {
    background: '#FFFFFF',
    cardBackground: '#FFFFFF',
    textPrimary: '#000000',
    textSecondary: '#4A4A4A',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    shadow: 'rgba(0,0,0,0.08)',
    cardBorder: 'rgba(19,158,162,0.1)',
  },
  dark: {
    background: '#0A0A0A',
    cardBackground: '#1A1A1A',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#6B7280',
    border: '#2A2A2A',
    borderLight: '#222222',
    shadow: 'rgba(0,0,0,0.3)',
    cardBorder: 'rgba(230,166,77,0.2)',
  }
};

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isDimMode, setIsDimMode] = useState(false);
  const brandColors = BRAND_COLORS;

  // ===== DETECT THEME =====
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDimMode(theme === 'dim' || theme === 'dark');
    };
    
    checkTheme();
    
    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme'] 
    });
    
    return () => observer.disconnect();
  }, []);

  // ===== VERIFY PAYMENT =====
  useEffect(() => {
    const verifyPayment = async () => {
      const ref = searchParams.get('reference');
      const trxref = searchParams.get('trxref');
      const paymentRef = ref || trxref;

      if (!paymentRef) {
        setStatus('failed');
        setMessage('No payment reference found. Please contact support.');
        return;
      }

      setReference(paymentRef);

      try {
        const response = await paystackService.verifyPayment(paymentRef);

        if (response.status && response.data) {
          const transaction = response.data;

          if (transaction.status === 'success') {
            setStatus('success');
            setMessage('Payment verified successfully! Your order has been confirmed.');
            localStorage.removeItem('pending_payment_reference');
            localStorage.removeItem('pending_payment_order');
          } else {
            setStatus('failed');
            setMessage(`Payment ${transaction.status}. Please contact support if you have any questions.`);
          }
        } else {
          setStatus('failed');
          setMessage(response.message || 'Payment verification failed. Please contact support.');
        }
      } catch (error: any) {
        setStatus('failed');
        setMessage(error.message || 'An error occurred during payment verification.');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const theme = isDimMode ? THEME_COLORS.dark : THEME_COLORS.light;
  const primaryColor = isDimMode ? brandColors.sandyOrange : brandColors.tropicalTeal;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.background }}>
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-4xl animate-spin" style={{ color: primaryColor }} />
          <p className="mt-4" style={{ color: theme.textPrimary }}>Verifying your payment...</p>
          <p className="text-sm mt-2" style={{ color: theme.textMuted }}>Please wait while we confirm your transaction</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: theme.background }}>
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8"
        style={{
          background: theme.cardBackground,
          border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.1)'}`,
          boxShadow: isDimMode ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(19,158,162,0.08)',
        }}
      >
        {/* TechTour Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: primaryColor }}>
            <FontAwesomeIcon icon={faCrown} className="text-white text-sm" />
          </div>
          <span className="font-bold text-sm" style={{ color: theme.textPrimary }}>TechTour Market</span>
        </div>

        <div className="text-center">
          {status === 'success' ? (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16,185,129,0.2)' }}>
                <FontAwesomeIcon icon={faCheckCircle} className="text-5xl" style={{ color: '#10B981' }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.textPrimary }}>Payment Successful! 🎉</h2>
              <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>{message}</p>
              <div
                className="p-3 rounded-lg mb-4 text-left"
                style={{ 
                  background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                }}
              >
                <p className="text-xs" style={{ color: theme.textMuted }}>Transaction Reference</p>
                <p className="text-sm font-mono" style={{ color: theme.textPrimary }}>{reference}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.2)' }}>
                <FontAwesomeIcon icon={faTimesCircle} className="text-5xl" style={{ color: '#EF4444' }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.textPrimary }}>Payment Failed</h2>
              <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>{message}</p>
              {reference && (
                <div
                  className="p-3 rounded-lg mb-4 text-left"
                  style={{ 
                    background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                    border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                  }}
                >
                  <p className="text-xs" style={{ color: theme.textMuted }}>Transaction Reference</p>
                  <p className="text-sm font-mono" style={{ color: theme.textPrimary }}>{reference}</p>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col gap-2 mt-4">
            <Link
              href="/market"
              className="w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${isDimMode ? '#D4953A' : '#0D7A7D'} 100%)`,
                color: isDimMode ? '#0A0A0A' : 'white',
              }}
            >
              <FontAwesomeIcon icon={faShoppingCart} />
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02]"
              style={{
                background: 'transparent',
                color: primaryColor,
                border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.3)' : 'rgba(19,158,162,0.3)'}`,
              }}
            >
              <FontAwesomeIcon icon={faHome} />
              Go Home
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t text-center" style={{ 
            borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
          }}>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>
              <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
              TechTour Ghana • Redefining African Tourism Through Innovation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}