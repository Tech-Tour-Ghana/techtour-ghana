import type { Metadata } from 'next';
import Link from 'next/link';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers to common questions about accounts, payments, tours, study abroad and the TechTour Ghana market.',
  alternates: { canonical: '/faq' },
};

const FAQS = [
  {
    q: 'What is TechTour Ghana?',
    a: 'TechTour Ghana is a tourism and technology platform. It brings together onsite tourism, dream vacations, study abroad, a marketplace for local artisans and tech innovation.',
  },
  {
    q: 'Do I need an account to browse?',
    a: 'No. You can browse the whole site without one. You need an account to place orders, save items to a wishlist and see your order history.',
  },
  {
    q: 'How do I pay?',
    a: 'Payments are handled by Paystack. You can pay by card or mobile money and you will be sent to Paystack to complete the payment securely.',
  },
  {
    q: 'I paid but did not get a confirmation email.',
    a: 'Check your spam folder first. Your order also appears in your account under Orders once the payment is confirmed. If it is missing, contact us with your payment reference.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Use "Forgot password" on the sign-in page. We will email you a link to choose a new one.',
  },
  {
    q: 'How do I contact the team?',
    a: 'Use the contact page and we will get back to you as soon as we can.',
  },
];

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };

  return (
    <ContentShell title="Frequently Asked" titleAccent="Questions" description="Quick answers about accounts, payments and our services.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-3xl mx-auto space-y-3">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="rounded-2xl p-5 group" style={cardStyle}>
            <summary className="cursor-pointer font-semibold list-none flex justify-between gap-4">
              {q}
              <span style={{ color: 'var(--sp-primary)' }} aria-hidden>+</span>
            </summary>
            <p className="mt-3 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{a}</p>
          </details>
        ))}
        <p className="text-sm pt-4 text-center" style={{ color: 'var(--sp-text-secondary)' }}>
          Still need help? <Link href="/about/contact-us" style={{ color: 'var(--sp-primary)' }} className="font-semibold">Contact us</Link>
        </p>
      </div>
    </ContentShell>
  );
}
