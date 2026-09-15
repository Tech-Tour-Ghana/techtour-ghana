// Ported from docs/old-sites/techtour-frontend/app/auth/payments/page.tsx.
// Markup and styling are unchanged. getUserPayments (lib/api.ts) now queries
// public.paystack_transactions directly; RLS (0013) scopes rows to the
// caller and paystack_transactions has no description column (that came
// from the old model's free-form metadata), so each row is labelled by its
// reference instead.

'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserPayments, type Payment } from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faGlobeAfrica, faCheckCircle, faClock, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
};

export default function PaymentsPage() {
  const { isDimMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    getUserPayments()
      .then(setPayments)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: '#10B981',
      pending: '#F59E0B',
      failed: '#EF4444',
      abandoned: '#6B7280',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  const totalSpent = payments.filter((p) => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#000000',
    textSecondary: isDimMode ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDimMode ? '#0A0A0A' : '#F9F9F9' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-sm" style={{ color: themeStyles.textSecondary }}>Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Payments" subtitle="Your transaction history">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl p-4" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>Total Spent</p>
          <p className="text-2xl font-bold" style={{ color: BRAND_COLORS.tropicalTeal }}>₵{totalSpent.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>Transactions</p>
          <p className="text-2xl font-bold" style={{ color: themeStyles.textPrimary }}>{payments.length}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>Pending</p>
          <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{payments.filter((p) => p.status === 'pending').length}</p>
        </div>
      </div>

      {payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-2xl p-4 transition-all duration-200 hover:shadow-lg" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold" style={{ color: themeStyles.textPrimary }}>Payment</p>
                    <span
                      className="px-2.5 py-0.5 text-xs font-medium rounded-full flex items-center gap-1.5"
                      style={{ background: `${getStatusColor(payment.status)}20`, color: getStatusColor(payment.status) }}
                    >
                      {payment.status === 'success' ? (
                        <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                      ) : payment.status === 'pending' ? (
                        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                      ) : (
                        <FontAwesomeIcon icon={faExclamationCircle} className="w-3 h-3" />
                      )}
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs" style={{ color: themeStyles.textMuted }}>
                    <span>Ref: {payment.reference.slice(0, 8)}</span>
                    <span>•</span>
                    <span>{new Date(payment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    {payment.channel && (
                      <>
                        <span>•</span>
                        <span>{payment.channel}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-lg font-bold" style={{ color: BRAND_COLORS.tropicalTeal }}>
                    {payment.currency === 'GHS' ? '₵' : payment.currency + ' '}{payment.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <FontAwesomeIcon icon={faCreditCard} className="text-6xl mb-4" style={{ color: themeStyles.textMuted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: themeStyles.textPrimary }}>No payment history</h3>
          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>Your transactions will appear here.</p>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: themeStyles.textMuted }}>
          <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
          TechTour Ghana — Redefining African Tourism Through Innovation
        </p>
      </div>
    </DashboardLayout>
  );
}
