import type { Metadata } from 'next';

import LegalPage from '@/components/content/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How TechTour Ghana collects, uses and protects your personal information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      title="Privacy"
      titleAccent="Policy"
      description="How we collect, use and protect your personal information."
      updated="30 September 2026"
      sections={[
        {
          heading: 'What we collect',
          body: [
            'Account details you give us when you register: your name, email address and password. Passwords are handled by our authentication provider and are never visible to us.',
            'Details you submit through forms, such as the contact form and newsletter signup (name, email, phone number and your message).',
            'Order and payment records for purchases. Card and mobile money details are entered on Paystack and are not stored by TechTour Ghana.',
            'Basic usage information, such as the pages you view, so we can understand how the site is used and improve it.',
          ],
        },
        {
          heading: 'How we use it',
          body: [
            'To create and secure your account, process orders, send confirmations and reply to your messages.',
            'To send our newsletter if you subscribed. You can unsubscribe at any time.',
            'To keep the service secure and to improve it.',
          ],
        },
        {
          heading: 'Who we share it with',
          body: [
            'We use a small number of service providers to run the site: Supabase (database and authentication), Vercel (hosting), Paystack (payments) and Resend (email). They process data only to provide those services.',
            'We do not sell your personal information.',
          ],
        },
        {
          heading: 'Your choices',
          body: [
            'You can view and update your profile and notification preferences from your account. You can ask us to correct or delete your data by contacting us through the contact page.',
          ],
        },
        {
          heading: 'Retention and security',
          body: [
            'We keep account and order records for as long as your account is active or as needed to meet legal and accounting obligations. Access to data is restricted, and connections to the site are encrypted.',
          ],
        },
        {
          heading: 'Changes and contact',
          body: ['We may update this policy and will change the date above when we do. Questions can be sent through our contact page.'],
        },
      ]}
    />
  );
}
