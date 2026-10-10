// Ported from docs/old-sites/techtour-frontend/app/auth/wishlist/page.tsx.
// Markup and styling are unchanged. getUserWishlist (lib/api.ts) reads
// public.wishlist_items through Supabase; RLS (0016) scopes it to the caller.
// The old page's remove handler was a stub that only edited local state, this
// one deletes the row.

'use client';

import Button from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserWishlist, removeWishlistItem, type WishlistItem } from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart,
  faGlobeAfrica,
  faTrash,
  faShoppingCart,
  faStar,
  faStarHalfAlt,
  faEye,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
};

export default function WishlistPage() {
  const router = useRouter();
  const { isDimMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const [failed, setFailed] = useState(false);

  const load = () => {
    setFailed(false);
    setLoading(true);
    getUserWishlist()
      .then(setWishlistItems)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const removeFromWishlist = async (id: string) => {
    if (await removeWishlistItem(id)) {
      setWishlistItems((items) => items.filter((item) => item.id !== id));
    }
  };

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#000000',
    textSecondary: isDimMode ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    hoverBg: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDimMode ? '#0A0A0A' : '#F9F9F9' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-sm" style={{ color: themeStyles.textSecondary }}>Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <DashboardLayout title="Wishlist" subtitle="Your saved items">
        <div role="alert" className="text-center py-12">
          <p className="mb-4 text-sm" style={{ color: themeStyles.textSecondary }}>We could not load this right now. Please try again.</p>
          <Button variant="accent" size="sm" onClick={load}>Try again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Wishlist" subtitle="Your saved items">
      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg"
              style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
            >
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                <img
                  src={item.image_url || '/placeholder-product.svg'}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  aria-label={`Remove ${item.title} from wishlist`}
                  className="absolute top-1 right-1 w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-teal-600"
                  style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-sm line-clamp-1" style={{ color: themeStyles.textPrimary }}>
                  {item.title}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold" style={{ color: BRAND_COLORS.tropicalTeal }}>
                    ₵{item.price.toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" arrow={false} icon={faEye} style={{ color: themeStyles.textSecondary }}>
                      View
                    </Button>
                    <Button variant="accent" size="sm" arrow={false} icon={faShoppingCart}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <FontAwesomeIcon icon={faHeart} className="text-6xl mb-4" style={{ color: themeStyles.textMuted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: themeStyles.textPrimary }}>Your wishlist is empty</h3>
          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>Start adding items you love to your wishlist.</p>
          <Button variant="accent" className="mt-4" href="/market">Browse Products</Button>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: themeStyles.textMuted }}>
          <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
          TechTour Ghana. Redefining African Tourism Through Innovation
        </p>
      </div>
    </DashboardLayout>
  );
}