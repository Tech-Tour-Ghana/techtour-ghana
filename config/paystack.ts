// Paystack client configuration.
//
// Client Components import this file, so everything in it reaches the browser.
// It therefore holds only values that are safe to publish: the public key, the
// callback URL and the brand colours.
//
// The old version also carried the secret key, read from NEXT_PUBLIC_ variables
// that Next.js inlines into the client bundle, with a hardcoded test secret as a
// fallback. That shipped the secret key to every visitor. The secret now lives
// only in PAYSTACK_SECRET_KEY, validated server side by lib/env.server.ts, and
// never appears in this file.

import { env } from "@/lib/env";

interface PaystackConfig {
  publicKey: string;
  callbackUrl: string;
  webhookUrl: string;
  isLive: boolean;
}

// Maintaining TechTour Brand Colors
export const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
  snowWhite: '#F9F9F9',
  pureWhite: '#FFFFFF',
  jetBlack: '#000000',
  // Gradients
  gradient: 'linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%)',
  gradientOrange: 'linear-gradient(135deg, #E6A64D 0%, #D4953A 100%)',
  gradientDark: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 100%)',
};

export const paystackConfig: PaystackConfig = {
  publicKey: env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  callbackUrl: `${env.NEXT_PUBLIC_SITE_URL}/market/payment/verify`,
  webhookUrl: `${env.NEXT_PUBLIC_SITE_URL}/api/paystack/webhook`,
  // Derived from the key itself rather than NODE_ENV, so a preview build using
  // a test key can never report itself as live, and a live key is never
  // mistaken for test.
  isLive: env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.startsWith('pk_live_'),
};

export default paystackConfig;
