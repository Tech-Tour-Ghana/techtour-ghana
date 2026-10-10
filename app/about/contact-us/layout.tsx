import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with TechTour Ghana about tours, study abroad, the market or partnerships.',
  alternates: { canonical: '/about/contact-us' },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
