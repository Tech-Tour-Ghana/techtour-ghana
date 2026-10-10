'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import dynamic from 'next/dynamic';
import AnalyticsTracker from "@/components/AnalyticsTracker";
import SiteBreadcrumbs, { CrumbProvider } from "@/components/SiteBreadcrumbs";
import { Suspense, useState, useEffect } from "react";
import { usePathname } from 'next/navigation';

const Cart = dynamic(
  () => import('@/components/Cart'),
  {
    ssr: false,
    loading: () => null
  }
);

function CartWrapper() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isMarketPage = pathname === '/market';

  if (!isMounted || !isMarketPage) {
    return null;
  }

  return <Cart />;
}

export default function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // ===== PAGES THAT SHOULD NOT HAVE NAVBAR & FOOTER =====
  const isAuthPage = pathname?.startsWith('/auth/');
  const isFullPageOnly = pathname?.startsWith('/market/payment/verify') ||
                         pathname?.startsWith('/market/checkout') ||
                         pathname?.startsWith('/auth/') ||
                         pathname?.startsWith('/admin') ||
                         pathname === '/maintenance' ||
                         pathname === '/market/payment/success' ||
                         pathname === '/market/payment/failed';

  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      <CartProvider>
       <CrumbProvider>
        {!isFullPageOnly && <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[3000] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black focus:shadow-lg">Skip to content</a>}
        {!isFullPageOnly && <Navbar />}
        {/* Add auth-page class to main for auth pages */}
        <main id="main-content" tabIndex={-1} className={isFullPageOnly ? "min-h-screen" : isAuthPage ? "auth-page page-main" : "page-main"}>
          {!isFullPageOnly && <SiteBreadcrumbs />}
          {children}
        </main>
        {!isFullPageOnly && <CartWrapper />}
        {!isFullPageOnly && <Footer />}
       </CrumbProvider>
      </CartProvider>
    </ThemeProvider>
  );
}
