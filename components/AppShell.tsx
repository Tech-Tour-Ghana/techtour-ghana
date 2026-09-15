'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import dynamic from 'next/dynamic';
import AnalyticsTracker from "@/components/AnalyticsTracker";
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
                         pathname === '/market/payment/success' ||
                         pathname === '/market/payment/failed';

  return (
    <ThemeProvider>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      <CartProvider>
        {!isFullPageOnly && <Navbar />}
        {/* Add auth-page class to main for auth pages */}
        <main className={isFullPageOnly ? "min-h-screen" : isAuthPage ? "auth-page page-main" : "page-main"}>
          {children}
        </main>
        {!isFullPageOnly && <CartWrapper />}
        {!isFullPageOnly && <Footer />}
      </CartProvider>
    </ThemeProvider>
  );
}
