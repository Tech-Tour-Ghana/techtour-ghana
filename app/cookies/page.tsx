import type { Metadata } from 'next';

import LegalPage from '@/components/content/LegalPage';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'The cookies and browser storage TechTour Ghana uses and why.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return (
    <LegalPage
      path="/cookies"
      title="Cookie"
      titleAccent="Policy"
      description="What we store in your browser and why."
      updated="30 September 2026"
      sections={[
        {
          heading: 'Essential cookies',
          body: [
            'When you sign in, our authentication provider sets cookies that keep you signed in and keep your account secure. The site cannot work for signed-in users without them.',
          ],
        },
        {
          heading: 'Preferences',
          body: [
            'We save your display theme (bright or dim), your selected currency and the contents of your shopping cart in your browser storage so they are still there when you return. This stays on your device.',
          ],
        },
        {
          heading: 'Analytics',
          body: [
            'We record which pages are viewed, with an anonymous session identifier, to understand how the site is used. We do not use advertising cookies.',
          ],
        },
        {
          heading: 'Managing storage',
          body: [
            'You can clear cookies and site data at any time in your browser settings. Doing so will sign you out and reset your saved preferences.',
          ],
        },
      ]}
    />
  );
}
