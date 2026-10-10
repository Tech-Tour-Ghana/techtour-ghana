import type { Metadata } from 'next';

import LegalPage from '@/components/content/LegalPage';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'How refunds and cancellations work at TechTour Ghana.',
  alternates: { canonical: '/refund' },
};

export default function RefundPage() {
  return (
    <LegalPage
      path="/refund"
      title="Refund"
      titleAccent="Policy"
      description="How refunds and cancellations work."
      updated="30 September 2026"
      sections={[
        {
          heading: 'Market orders',
          body: [
            'If an item arrives damaged, is not as described or cannot be delivered, contact us and we will arrange a replacement or a refund to your original payment method.',
            'Orders we cancel, for example because a product is out of stock, are refunded in full.',
          ],
        },
        {
          heading: 'Tours, study and vacation bookings',
          body: [
            'Cancellation and refund terms depend on the specific booking and are confirmed to you when you book. If a tour or programme is cancelled by us, you will receive a full refund or the option to rebook.',
          ],
        },
        {
          heading: 'How to request a refund',
          body: [
            'Send us your order or booking reference through the contact page. We aim to respond promptly, and approved refunds are returned through Paystack to the payment method you used. Processing times depend on your bank or mobile money provider.',
          ],
        },
      ]}
    />
  );
}
