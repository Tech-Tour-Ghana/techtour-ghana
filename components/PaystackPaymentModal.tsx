// D:\techtour-ghana\techtour-frontend\app\components\PaystackPaymentModal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faCreditCard,
  faMobileAlt,
  faUniversity,
  faPhone,
  faCheckCircle,
  faSpinner,
  faLock,
  faShieldAlt,
  faExclamationTriangle,
  faCrown,
  faStore,
  faGlobeAfrica,
} from '@fortawesome/free-solid-svg-icons';
import { paystackService } from '@/services/paystackService';
import { BRAND_COLORS } from '@/config/paystack';

interface PaystackPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  email: string;
  name?: string;
  phone?: string;
  orderDetails: {
    orderId: string;
    items: Array<{
      id: number;
      title: string;
      quantity: number;
      price: number;
    }>;
    total: number;
  };
  onSuccess: (reference: string, transaction: any) => void;
  onError: (error: string) => void;
  isDimMode: boolean;
  colors: any;
}

const PaystackPaymentModal: React.FC<PaystackPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency = 'GHS',
  email,
  name,
  phone,
  orderDetails,
  onSuccess,
  onError,
  isDimMode,
  colors,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money' | 'bank_transfer'>('card');
  const [mobileProvider, setMobileProvider] = useState<'mtn' | 'telecel' | 'airteltigo'>('mtn');
  const [mobilePhone, setMobilePhone] = useState(phone || '');
  const [emailInput, setEmailInput] = useState(email);
  const [nameInput, setNameInput] = useState(name || '');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // TechTour Brand Colors
  const brandColors = BRAND_COLORS;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setEmailInput(email);
      setNameInput(name || '');
      setMobilePhone(phone || '');
    }
  }, [isOpen, email, name, phone]);

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (paymentMethod === 'mobile_money' && !mobilePhone) {
      setError('Please enter your mobile money phone number');
      return;
    }

    if (paymentMethod === 'mobile_money' && mobilePhone.length < 10) {
      setError('Please enter a valid phone number (e.g., 0241234567)');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const metadata = {
        order_id: orderDetails.orderId,
        customer_name: nameInput || 'Customer',
        platform: 'TechTour Ghana',
        items: orderDetails.items.map(item => ({
          product_id: item.id,
          product_name: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      let response;
      
      if (paymentMethod === 'mobile_money') {
        response = await paystackService.processMobileMoney({
          email: emailInput,
          amount: amount,
          phone: mobilePhone,
          provider: mobileProvider,
          metadata: metadata,
        });
      } else {
        response = await paystackService.initializePayment({
          email: emailInput,
          amount: amount,
          currency: currency as any,
          metadata: metadata,
          callback_url: typeof window !== 'undefined' 
            ? `${window.location.origin}/market/payment/verify` 
            : undefined,
        });
      }

      if (response.status && response.data) {
        // Every method redirects to Paystack's hosted checkout: mobile money
        // there still needs an OTP step this modal never collects, so a
        // synchronous "success" here would be reported before the charge
        // actually completes. Paystack's own page handles that step and
        // sends the browser back to /market/payment/verify either way.
        localStorage.setItem('pending_payment_reference', response.data.reference);
        localStorage.setItem('pending_payment_order', JSON.stringify(orderDetails));
        window.location.href = response.data.authorization_url;
      } else {
        setError(response.message || 'Payment initialization failed. Please try again.');
        setProcessing(false);
        onError(response.message || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment processing');
      setProcessing(false);
      onError(err.message || 'Payment failed');
    }
  };

  const PaymentMethodCard = ({ 
    method, 
    icon, 
    label, 
    description 
  }: { 
    method: 'card' | 'mobile_money' | 'bank_transfer';
    icon: any;
    label: string;
    description: string;
  }) => (
    <button
      onClick={() => setPaymentMethod(method)}
      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
        paymentMethod === method ? 'border-opacity-100 shadow-md' : 'border-opacity-30'
      }`}
      style={{
        background: paymentMethod === method
          ? (isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.05)')
          : 'transparent',
        borderColor: paymentMethod === method
          ? (isDimMode ? brandColors.sandyOrange : brandColors.tropicalTeal)
          : (isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'),
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="font-medium text-sm" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
            {label}
          </div>
          <div className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
            {description}
          </div>
        </div>
        {paymentMethod === method && (
          <FontAwesomeIcon icon={faCheckCircle} className="ml-auto" style={{ color: isDimMode ? brandColors.sandyOrange : brandColors.tropicalTeal }} />
        )}
      </div>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl md:rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: isDimMode ? colors.background : '#FFFFFF',
          border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.1)'}`,
          maxHeight: 'calc(100vh - 40px)',
          height: 'auto',
          width: '100%',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with TechTour Branding */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{
            background: isDimMode 
              ? `linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 100%)`
              : `linear-gradient(135deg, ${brandColors.tropicalTeal} 0%, #0D7A7D 100%)`,
            borderColor: isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <FontAwesomeIcon icon={faCrown} className="text-white text-sm" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">TechTour Market</h3>
              <p className="text-white/60 text-[10px]">Secure Payment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 text-[8px] font-semibold rounded-full"
              style={{
                background: paystackService.isLiveMode() 
                  ? 'rgba(239,68,68,0.2)' 
                  : 'rgba(16,185,129,0.2)',
                color: paystackService.isLiveMode() 
                  ? '#EF4444' 
                  : '#10B981',
              }}
            >
              {paystackService.isLiveMode() ? '🔴 LIVE' : '🟢 TEST'}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
              }}
            >
              <FontAwesomeIcon icon={faTimes} className="text-sm" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Order Summary */}
          <div
            className="p-3 rounded-lg mb-4"
            style={{
              background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
              border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                Order #{orderDetails.orderId.slice(0, 8)}
              </span>
              <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                {orderDetails.items.length} items
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                Total Amount
              </span>
              <span className="text-xl font-bold" style={{ color: isDimMode ? brandColors.sandyOrange : brandColors.tropicalTeal }}>
                {paystackService.formatAmount(amount, currency)}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-4">
            <label className="text-sm font-medium block mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
              Select Payment Method
            </label>
            <div className="space-y-2">
              <PaymentMethodCard
                method="card"
                icon="💳"
                label="Card Payment"
                description="Visa, Mastercard, Verve, American Express"
              />
              <PaymentMethodCard
                method="mobile_money"
                icon="📱"
                label="Mobile Money"
                description="MTN, Telecel, AirtelTigo (Instant)"
              />
              <PaymentMethodCard
                method="bank_transfer"
                icon="🏦"
                label="Bank Transfer"
                description="Manual bank transfer with auto-verification"
              />
            </div>
          </div>

          {/* Mobile Money Provider Selection */}
          {paymentMethod === 'mobile_money' && (
            <div className="mb-4">
              <label className="text-sm font-medium block mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                Select Mobile Money Provider
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'mtn', label: 'MTN MoMo', color: '#FFCD00' },
                  { id: 'telecel', label: 'Telecel Cash', color: '#ED1C24' },
                  { id: 'airteltigo', label: 'AirtelTigo Cash', color: '#ED1C24' },
                ].map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setMobileProvider(provider.id as any)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      mobileProvider === provider.id ? 'border-2 shadow-md' : 'border'
                    }`}
                    style={{
                      background: mobileProvider === provider.id
                        ? (isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)')
                        : 'transparent',
                      borderColor: mobileProvider === provider.id
                        ? (isDimMode ? brandColors.sandyOrange : brandColors.tropicalTeal)
                        : (isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'),
                      color: isDimMode ? colors.textPrimary : colors.textPrimary,
                    }}
                  >
                    {provider.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Money Phone Input */}
          {paymentMethod === 'mobile_money' && (
            <div className="mb-4">
              <label className="text-sm font-medium block mb-1" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                Mobile Money Phone Number
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                  +233
                </span>
                <input
                  type="tel"
                  placeholder="24 123 4567"
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                    border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                    color: isDimMode ? colors.textPrimary : colors.textPrimary,
                    outline: 'none',
                  }}
                />
              </div>
              <p className="text-[10px] mt-1" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                Enter without leading zero (e.g., 241234567)
              </p>
            </div>
          )}

          {/* Email Input */}
          {(paymentMethod === 'card' || paymentMethod === 'bank_transfer') && (
            <div className="mb-4">
              <label className="text-sm font-medium block mb-1" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="customer@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                  color: isDimMode ? colors.textPrimary : colors.textPrimary,
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Name Input */}
          {(paymentMethod === 'card' || paymentMethod === 'bank_transfer') && (
            <div className="mb-4">
              <label className="text-sm font-medium block mb-1" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{
                  background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                  color: isDimMode ? colors.textPrimary : colors.textPrimary,
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="p-3 rounded-lg mb-4 flex items-start gap-2"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mt-0.5" />
              <span className="text-sm text-red-500">{error}</span>
            </div>
          )}

          {/* Secure Notice */}
          <div
            className="p-2 rounded-lg mb-4 flex items-center gap-2 justify-center"
            style={{
              background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
            }}
          >
            <FontAwesomeIcon icon={faLock} className="text-xs" style={{ color: isDimMode ? brandColors.sandyOrange : brandColors.tropicalTeal }} />
            <span className="text-[10px]" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
              Secured by Paystack • PCI DSS Level 1 Certified
            </span>
          </div>

          {/* Pay Button with TechTour Branding */}
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: processing
                ? (isDimMode ? '#2A2A2A' : '#E5E7EB')
                : (isDimMode 
                    ? `linear-gradient(135deg, ${brandColors.sandyOrange} 0%, #D4953A 100%)`
                    : `linear-gradient(135deg, ${brandColors.tropicalTeal} 0%, #0D7A7D 100%)`),
              color: processing
                ? (isDimMode ? '#6B7280' : '#9CA3AF')
                : (isDimMode ? '#0A0A0A' : 'white'),
              cursor: processing ? 'not-allowed' : 'pointer',
            }}
          >
            {processing ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faShieldAlt} />
                Pay {paystackService.formatAmount(amount, currency)} Securely
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-3 text-center">
            <p className="text-[8px]" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
              <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
              TechTour Ghana • Redefining African Tourism Through Innovation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaystackPaymentModal;