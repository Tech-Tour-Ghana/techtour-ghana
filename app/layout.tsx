import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { env } from "@/lib/env";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

// This stays a Server Component. The Metadata API below only works in one, so
// making the root layout a Client Component would stop every page in the app
// from emitting a title, description or canonical tag. If a provider is needed
// later it goes in its own Client Component, not here.
export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "TechTour Ghana, tours and travel across Ghana",
    template: "%s | TechTour Ghana",
  },
  description:
    "Guided tours, artisan goods and study abroad services across Ghana. Heritage sites, rainforest, savannah and coast, booked with local guides.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "TechTour Ghana",
    locale: "en_GH",
    url: "/",
    title: "TechTour Ghana, tours and travel across Ghana",
    description:
      "Guided tours, artisan goods and study abroad services across Ghana.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TechTour Ghana",
    description: "Guided tours, artisan goods and study abroad services across Ghana.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
