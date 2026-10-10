import type { Metadata } from 'next';
import Link from 'next/link';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers to common questions about accounts, payments, tours, short stays, study abroad and the TechTour Ghana market.',
  alternates: { canonical: '/faq' },
};

const GROUPS = [
  {
    id: 'general',
    title: 'About TechTour Ghana',
    items: [
      { q: 'What is TechTour Ghana?', a: 'TechTour Ghana is a tourism and technology platform. It brings together guided tours, short-stay rentals, study abroad, a marketplace for local artisans and tech innovation.' },
      { q: 'Do I need an account to browse?', a: 'No. You can browse the whole site without one. You need an account to reserve a tour or stay, apply to study abroad, place marketplace orders, save items to a wishlist and see your history.' },
      { q: 'How do I contact the team?', a: 'Use the contact page, or open a ticket from the Help section of your account. A ticket lets you follow its status and reply in one place.' },
    ],
  },
  {
    id: 'tours-stays',
    title: 'Tours and stays',
    items: [
      { q: 'How do I reserve a tour?', a: 'Open a tour, choose a departure date on the calendar, set the number of people and select Reserve. You are not charged at that point. Our team confirms your place by email and arranges payment.' },
      { q: 'How do I book a short stay?', a: 'Open a rental, choose your check-in and check-out dates and the number of guests, then request the stay. The total is shown before you send it, dates that are already taken are blocked, and we confirm availability by email.' },
      { q: 'Where can I see my bookings?', a: 'Signed-in customers can see tour bookings in their account under Tours, and the confirmation reference appears when you reserve.' },
    ],
  },
  {
    id: 'study',
    title: 'Study abroad',
    items: [
      { q: 'How do I apply to study abroad?', a: 'Choose a destination on the study abroad page and complete the application form. You can follow your application from your account and our team will be in touch.' },
    ],
  },
  {
    id: 'payments',
    title: 'Payments and orders',
    items: [
      { q: 'How do I pay for marketplace orders?', a: 'Payments are handled by Paystack. You can pay by card or mobile money and you are sent to Paystack to complete the payment securely.' },
      { q: 'I paid but did not get a confirmation email.', a: 'Check your spam folder first. Your order also appears in your account under Orders once the payment is confirmed. If it is missing, contact us with your payment reference.' },
      { q: 'What is your refund policy?', a: 'The full terms are on our Refund Policy page. If you need help with a specific payment, open a ticket from your account and include the reference.' },
    ],
  },
  {
    id: 'account',
    title: 'Your account',
    items: [
      { q: 'How do I reset my password?', a: 'Use "Forgot password" on the sign-in page. We will email you a link to choose a new one.' },
      { q: 'Where do I find my notifications?', a: 'Select the bell at the top of your account or open Notifications in the sidebar. Updates about orders and replies to your tickets appear there, and you can mark them read or unread.' },
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: GROUPS.flatMap((g) => g.items).map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };

  return (
    <ContentShell wide title="Frequently Asked" titleAccent="Questions" description="Quick answers about accounts, payments, tours, stays and study abroad.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Question topics" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:sticky lg:top-28 lg:mx-0 lg:self-start lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-2 lg:w-auto lg:flex-col lg:gap-1">
            {GROUPS.map((g) => (
              <li key={g.id}><a href={`#${g.id}`} className="block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium lg:rounded-xl" style={{ ...cardStyle, color: 'var(--sp-text-secondary)' }}>{g.title}</a></li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-12">
          {GROUPS.map((g) => (
            <section key={g.id} id={g.id} className="scroll-mt-28" aria-labelledby={`${g.id}-h`}>
              <h2 id={`${g.id}-h`} className="mb-4 text-xl font-bold md:text-2xl">{g.title}</h2>
              <div className="space-y-3">
                {g.items.map(({ q, a }) => (
                  <details key={q} className="group rounded-2xl p-5" style={cardStyle}>
                    <summary className="flex cursor-pointer list-none justify-between gap-4 font-semibold">
                      {q}
                      <span aria-hidden="true" className="flex-shrink-0 transition-transform group-open:rotate-45" style={{ color: 'var(--sp-primary)' }}>+</span>
                    </summary>
                    <p className="mt-3 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-3xl p-8 text-center" style={cardStyle} aria-labelledby="faq-help">
            <h2 id="faq-help" className="text-xl font-bold">Still need help?</h2>
            <p className="mx-auto mt-2 max-w-md" style={{ color: 'var(--sp-text-secondary)' }}>Send us a message, or sign in and open a ticket to follow the reply. See also our <Link href="/refund" className="font-semibold underline" style={{ color: 'var(--sp-primary)' }}>Refund Policy</Link>.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button href="/about/contact-us">Contact us</Button>
              <Button href="/auth/support" variant="secondary">Open a ticket</Button>
            </div>
          </section>
        </div>
      </div>
    </ContentShell>
  );
}
