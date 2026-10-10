import type { Metadata } from 'next';

import LegalPage from '@/components/content/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when you use the TechTour Ghana website and services.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      title="Terms of"
      titleAccent="Service"
      description="The terms that apply when you use TechTour Ghana."
      updated="30 September 2026"
      sections={[
        {
          heading: 'Using the site',
          body: [
            'By using this website you agree to these terms. Please use it lawfully and do not attempt to disrupt it or access accounts that are not yours.',
          ],
        },
        {
          heading: 'Accounts',
          body: [
            'You are responsible for keeping your password confidential and for activity on your account. Tell us promptly if you suspect unauthorised use.',
          ],
        },
        {
          heading: 'Orders and payments',
          body: [
            'Prices are shown in the currency displayed at checkout. Payments are processed securely by Paystack. An order is confirmed once payment succeeds and you receive a confirmation email.',
            'We may cancel an order if a product is unavailable or a pricing error occurred, in which case you will be refunded in full.',
          ],
        },
        {
          heading: 'Tours, study and vacation services',
          body: [
            'Descriptions of tours, study programmes and vacations are provided in good faith and may change. Specific conditions for a booking will be confirmed to you at the time of booking.',
          ],
        },
        {
          heading: 'Content',
          body: [
            'The text, images and branding on this site belong to TechTour Ghana or its partners and may not be reused without permission.',
          ],
        },
        {
          heading: 'Liability',
          body: [
            'We do our best to keep the site accurate and available but provide it as is. To the extent the law allows, we are not liable for indirect losses arising from its use.',
          ],
        },
        {
          heading: 'Contact',
          body: ['For questions about these terms, please use our contact page.'],
        },
      ]}
    />
  );
}
