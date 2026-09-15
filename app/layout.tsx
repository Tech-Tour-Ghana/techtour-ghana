import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { env } from "@/lib/env";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: "TechTour Ghana",
  // No canonical here. Metadata set in the root layout is inherited by every
  // route, so a canonical of "/" would tell search engines that every page is
  // a duplicate of the homepage. Each page sets its own canonical instead.
  openGraph: {
    title: "TechTour Ghana",
    url: "/",
    siteName: "TechTour Ghana",
    type: "website",
  },
  icons: {
    // The old layout also linked /images/logo-40x40.png.ico, a file that never
    // existed in the old site, so every visit requested something missing.
    // These entries point only at logo files present in public/images.
    icon: [
      { url: "/images/logo-40x40.png", type: "image/png" },
      { url: "/images/logo-40x4.png", type: "image/png" },
    ],
    shortcut: [{ url: "/images/logo-40x40.png", type: "image/png" }],
    apple: "/images/logo-40x40.png",
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
