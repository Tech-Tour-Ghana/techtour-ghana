import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';

// robots.txt only asks well-behaved crawlers to stay out. It is not a security
// control: private pages are protected by authentication and by noindex metadata.
export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/auth/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
