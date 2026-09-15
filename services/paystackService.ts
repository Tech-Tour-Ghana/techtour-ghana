// Paystack client service, as used by the ported payment modal.
//
// The old version called api.paystack.co directly from the browser, sending
// the secret key as a Bearer token. Anyone could read that key from the network
// tab and use it to initialise, verify or refund transactions on the account.
//
// Initialising and verifying a transaction requires the secret key, so both
// must happen on the server, where the total is also recomputed from the
// database rather than trusted from the browser. Until that server route
// exists, these methods return Paystack's own failure shape, so the modal takes
// its existing error path and nothing is charged. Every other method is
// unchanged.

import { paystackConfig, BRAND_COLORS } from '@/config/paystack';

interface InitializePaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface VerifyPaymentResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: 'pending' | 'success' | 'failed' | 'abandoned';
    metadata: Record<string, any>;
    customer: {
      email: string;
      name?: string;
      phone?: string;
    };
    created_at: string;
    paid_at?: string;
    channel: string[];
  };
}

const PAYMENT_UNAVAILABLE =
  'Online payment is not available yet. Please contact us to complete your order.';

class PaystackService {
  private publicKey: string;
  private isLive: boolean;
  private brandColors = BRAND_COLORS;

  constructor() {
    const config = paystackConfig;
    this.publicKey = config.publicKey;
    this.isLive = config.isLive;
  }

  isLiveMode(): boolean {
    return this.isLive;
  }

  getModeLabel(): string {
    return this.isLive ? '🔴 LIVE' : '🟢 TEST';
  }

  getBrandColors() {
    return this.brandColors;
  }

  async initializePayment(params: {
    email: string;
    amount: number;
    currency?: 'GHS' | 'USD' | 'EUR' | 'GBP';
    reference?: string;
    callback_url?: string;
    metadata?: Record<string, any>;
    mobile_money?: {
      provider: 'mtn' | 'telecel' | 'airteltigo';
      phone: string;
    };
  }): Promise<InitializePaymentResponse> {
    return {
      status: false,
      message: PAYMENT_UNAVAILABLE,
      data: {
        authorization_url: '',
        access_code: '',
        reference: params.reference ?? '',
      },
    };
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    return {
      status: false,
      message: PAYMENT_UNAVAILABLE,
      data: {
        id: 0,
        reference,
        amount: 0,
        currency: 'GHS',
        status: 'failed',
        metadata: {},
        customer: { email: '' },
        created_at: '',
        channel: [],
      },
    };
  }

  async processMobileMoney(data: {
    email: string;
    amount: number;
    phone: string;
    provider: 'mtn' | 'telecel' | 'airteltigo';
    metadata?: Record<string, any>;
  }) {
    return this.initializePayment({
      ...data,
      mobile_money: {
        provider: data.provider,
        phone: data.phone,
      },
    });
  }

  getAvailablePaymentMethods() {
    return {
      card: {
        name: 'Card Payment',
        icon: '💳',
        description: 'Pay with Visa, Mastercard, Verve, or American Express',
        supported: true,
      },
      mobile_money: {
        name: 'Mobile Money',
        icon: '📱',
        description: 'Pay with MTN, Telecel, or AirtelTigo Mobile Money',
        supported: true,
        providers: ['mtn', 'telecel', 'airteltigo'],
      },
      bank_transfer: {
        name: 'Bank Transfer',
        icon: '🏦',
        description: 'Pay via bank transfer (automatic verification)',
        supported: true,
      },
      ussd: {
        name: 'USSD Payment',
        icon: '📞',
        description: 'Pay using USSD code',
        supported: true,
      },
    };
  }

  formatAmount(amount: number, currency: string = 'GHS'): string {
    const symbol = currency === 'GHS' ? '₵' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
    return `${symbol}${amount.toFixed(2)}`;
  }

  // TechTour Branding for payment pages
  getBrandingMetadata() {
    return {
      platform: 'TechTour Ghana',
      tagline: 'Redefining African Tourism Through Innovation',
      brandColors: this.brandColors,
      aesthetic: 'Afro-Modernism, Tech-Enabled Heritage, Sleek Innovation',
      values: ['Authenticity', 'Community Impact', 'Sustainability', 'Innovation', 'Integrity'],
    };
  }
}

export const paystackService = new PaystackService();
export default PaystackService;
