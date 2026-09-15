// app/market/page.tsx - COMPLETE PRODUCTION READY

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faArrowUp,
  faStar,
  faStarHalfAlt,
  faShoppingCart,
  faHeart,
  faEye,
  faFilter,
  faSearch,
  faTimes,
  faChevronDown,
  faChevronUp,
  faPlus,
  faMinus,
  faTag,
  faBox,
  faPalette,
  faRuler,
  faCheckCircle,
  faTruck,
  faShieldAlt,
  faUndo,
  faShare,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faUser,
  faSignOutAlt,
  faCog,
  faDashboard,
  faGlobeAfrica,
  faList,
  faThLarge,
  faInfoCircle,
  faExternalLinkAlt,
  faHome,
  faStore,
  faLightbulb,
  faGem,
  faCrown,
  faPaintBrush,
  faScissors,
  faWineBottle,
  faLeaf,
  faFire,
  faDollarSign,
  faEuroSign,
  faPoundSign,
  faYenSign,
  faChevronLeft,
  faChevronRight,
  faPlay,
  faPause,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import SearchParamsWrapper from '@/components/SearchParamsWrapper';
import Loading from '@/components/Loading';
import { useCart } from '@/context/CartContext';
import Cart from '@/components/Cart';
import { createBrowserClient } from '@/lib/supabase/client';
import { getAuthStatus } from '@/lib/api';

// ===== PAYSTACK IMPORTS =====
import PaystackPaymentModal from '@/components/PaystackPaymentModal';

// ===== BRAND COLORS =====
const COLORS = {
  light: {
    primary: '#139EA2',
    primaryHover: '#0D7A7D',
    primaryLight: '#E6F4F5',
    secondary: '#E6A64D',
    secondaryHover: '#D4953A',
    secondaryLight: '#FDF3E6',
    textPrimary: '#000000',
    textSecondary: '#4A4A4A',
    textMuted: '#9CA3AF',
    background: '#FFFFFF',
    backgroundAlt: '#F9F9F9',
    backgroundCard: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    shadow: 'rgba(0,0,0,0.08)',
    shadowHover: 'rgba(0,0,0,0.15)',
  },
  dark: {
    primary: '#E6A64D',
    primaryHover: '#D4953A',
    primaryLight: '#2A2218',
    secondary: '#139EA2',
    secondaryHover: '#0D7A7D',
    secondaryLight: '#1A2A2B',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#6B7280',
    background: '#0A0A0A',
    backgroundAlt: '#1A1A1A',
    backgroundCard: '#1A1A1A',
    border: '#2A2A2A',
    borderLight: '#222222',
    shadow: 'rgba(0,0,0,0.3)',
    shadowHover: 'rgba(0,0,0,0.5)',
  }
};

// ===== INTERFACES =====
interface MarketProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  sku: string;
  price: number;
  discount_price?: number;
  stock_quantity: number;
  is_in_stock: boolean;
  image?: string;
  image_url?: string;
  gallery_images?: any[];
  button_text: string;
  button_link: string;
  order: number;
  category?: string;
  category_id?: string;
  category_name?: string;
  rating?: number;
  review_count?: number;
  colors?: string[];
  sizes?: string[];
  materials?: string[];
  dimensions?: string;
  weight?: string;
  care_instructions?: string;
  origin?: string;
  artisan?: any;
  artisan_bio?: string;
  artisan_image?: string;
  featured?: boolean;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

interface MarketStats {
  total_products: number;
  active_products: number;
  featured_products: number;
  categories_count: number;
  artisans_count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  product_count?: number;
}

interface MarketOrder {
  id: string;
  order_number: string;
  user: string;
  user_name?: string;
  product: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  shipping_address: string;
  shipping_city: string;
  shipping_region: string;
  shipping_country: string;
  shipping_postal_code?: string;
  phone_number: string;
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  display_name: string;
  phone?: string;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

const CURRENCIES: Currency[] = [
  { code: 'GHS', symbol: '₵', name: 'Ghana Cedi', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.085 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.078 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.067 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rate: 130 },
];

// ===== LOGIN TOAST COMPONENT =====
const LoginToast = ({ message, onClose, isDimMode, colors }: any) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="login-toast"
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '30px',
        zIndex: 1000,
        background: isDimMode ? '#1A1A1A' : '#FFFFFF',
        border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.1)'}`,
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.3s ease-out',
        maxWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>🔒</span>
        <div>
          <div style={{ fontWeight: '600', fontSize: '15px', color: isDimMode ? '#FFFFFF' : '#000000' }}>
            Login Required
          </div>
          <div style={{ fontSize: '13px', color: isDimMode ? '#B0B0B0' : '#4A4A4A' }}>
            {message || 'Please log in to add items to your cart.'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: isDimMode ? '#6B7280' : '#9CA3AF',
            padding: '4px',
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Link
          href="/auth/login"
          style={{
            flex: 1,
            padding: '8px 16px',
            background: isDimMode ? '#E6A64D' : '#139EA2',
            color: isDimMode ? '#0A0A0A' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            textAlign: 'center',
            textDecoration: 'none',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Login
        </Link>
        <Link
          href="/auth/register"
          style={{
            flex: 1,
            padding: '8px 16px',
            background: 'transparent',
            color: isDimMode ? '#E6A64D' : '#139EA2',
            border: `1px solid ${isDimMode ? '#E6A64D' : '#139EA2'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            textAlign: 'center',
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          Register
        </Link>
      </div>
    </div>
  );
};

// ===== REDESIGNED PRODUCT CARD COMPONENT =====
const ProductCard = React.memo(({
  product,
  colors,
  isDimMode,
  onQuickView,
  onAddToCart,
  isWishlisted = false,
  onWishlistToggle,
  currency,
  convertPrice,
  viewMode = 'grid',
  isAuthenticated = false,
  isInCart = false,
}: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isListView = viewMode === 'list';

  const imageUrl = product.image_url || product.image || '/placeholder-product.jpg';
  const price = parseFloat(product.price) || 0;
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const hasDiscount = discountPrice !== null && discountPrice < price;
  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const displayPrice = convertPrice(price);
  const displayDiscountPrice = hasDiscount ? convertPrice(discountPrice) : null;

  const handleAddToCartClick = React.useCallback(() => {
    if (!isAuthenticated) {
      onAddToCart(product, false);
      return;
    }
    onAddToCart({
      ...product,
      quantity: 1,
      selectedColor: undefined,
      selectedSize: undefined,
      variant_key: `${product.id}_any_any`,
    }, true);
  }, [isAuthenticated, product, onAddToCart]);

  let buttonText = 'Add to Cart';
  let buttonVariant = 'primary';
  if (!isAuthenticated) {
    buttonText = 'Login to Add';
    buttonVariant = 'secondary';
  } else if (isInCart) {
    buttonText = 'In Cart ✓';
    buttonVariant = 'success';
  } else if (!product.is_in_stock) {
    buttonText = 'Out of Stock';
    buttonVariant = 'danger';
  }

  const isDisabled = !product.is_in_stock || isInCart;

  const getColorSwatch = (color: string) => {
    const colorValue = color.toLowerCase();
    if (colorValue.includes('black')) return '#1a1a1a';
    if (colorValue.includes('white')) return '#f5f5f5';
    if (colorValue.includes('red')) return '#ef4444';
    if (colorValue.includes('blue')) return '#3b82f6';
    if (colorValue.includes('green')) return '#22c55e';
    if (colorValue.includes('yellow')) return '#eab308';
    if (colorValue.includes('gold')) return '#f59e0b';
    if (colorValue.includes('silver')) return '#9ca3af';
    if (colorValue.includes('brown')) return '#92400e';
    if (colorValue.includes('purple')) return '#8b5cf6';
    if (colorValue.includes('pink')) return '#ec4899';
    if (colorValue.includes('orange')) return '#f97316';
    if (colorValue.includes('gray') || colorValue.includes('grey')) return '#6b7280';
    return colorValue;
  };

  const getButtonStyles = () => {
    if (isDisabled) {
      return {
        background: isDimMode ? '#2A2A2A' : '#E5E7EB',
        color: isDimMode ? '#6B7280' : '#9CA3AF',
        border: 'none',
      };
    }
    if (buttonVariant === 'secondary') {
      return {
        background: 'transparent',
        color: isDimMode ? colors.primary : '#139EA2',
        border: `1px solid ${isDimMode ? colors.primary : '#139EA2'}`,
      };
    }
    if (buttonVariant === 'success') {
      return {
        background: '#10B981',
        color: 'white',
        border: 'none',
      };
    }
    return {
      background: isDimMode ? colors.primary : '#139EA2',
      color: isDimMode ? '#0A0A0A' : 'white',
      border: 'none',
    };
  };

  // ===== GRID MODE =====
  if (!isListView) {
    return (
      <div
        className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl"
        style={{
          background: isDimMode ? colors.backgroundCard : '#FFFFFF',
          border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)'}`,
          boxShadow: isHovered
            ? (isDimMode ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(19,158,162,0.12)')
            : '0 4px 12px rgba(0,0,0,0.04)',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: isDimMode ? '#1A1A1A' : '#F9F9F9' }}>
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: isDimMode ? colors.primary : '#139EA2' }}></div>
            </div>
          )}
          <img
            src={imageUrl}
            alt={product.title}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />

          {hasDiscount && (
            <div className="absolute top-2 left-2 z-10">
              <span className="px-1.5 py-0.5 text-[9px] font-bold text-white rounded-full" style={{ background: colors.secondary }}>
                -{discountPercent}%
              </span>
            </div>
          )}

          {!product.is_in_stock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <span className="px-2 py-0.5 text-[10px] font-semibold text-white bg-red-500/90 rounded-lg">
                Out of Stock
              </span>
            </div>
          )}

          {isInCart && isAuthenticated && (
            <div className="absolute bottom-1 right-1 z-10">
              <span className="px-1.5 py-0.5 text-[8px] font-semibold text-white bg-green-500/90 rounded-full">
                In Cart
              </span>
            </div>
          )}

          <button
            onClick={() => onWishlistToggle && onWishlistToggle(product.id)}
            className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{
              background: isDimMode ? 'rgba(26,26,26,0.8)' : 'rgba(255,255,255,0.9)',
              color: isWishlisted ? '#EF4444' : (isDimMode ? '#B0B0B0' : '#4A4A4A'),
              backdropFilter: 'blur(8px)',
              border: 'none',
            }}
          >
            <FontAwesomeIcon icon={faHeart} className={`text-[10px] ${isWishlisted ? 'text-red-500' : ''}`} />
          </button>

          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => onQuickView && onQuickView(product)}
              className="px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-1.5"
              style={{
                background: isDimMode ? colors.primary : '#139EA2',
                color: isDimMode ? '#0A0A0A' : 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                border: 'none',
              }}
            >
              <FontAwesomeIcon icon={faEye} className="text-[10px]" />
              Quick View
            </button>
          </div>

          {product.category_name && (
            <div className="absolute bottom-1 left-1 z-10">
              <span className="px-1.5 py-0.5 text-[8px] font-medium text-white rounded-full bg-black/50 backdrop-blur-sm">
                {product.category_name}
              </span>
            </div>
          )}
        </div>

        <div className="p-3 md:p-4">
          <div className="flex flex-row items-start justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-base md:text-lg line-clamp-1 flex-1" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
              {product.title}
            </h3>
            <div className="flex flex-col items-end flex-shrink-0">
              {hasDiscount ? (
                <>
                  <span className="font-bold text-sm md:text-base" style={{ color: colors.secondary }}>
                    {currency.symbol}{displayDiscountPrice.toFixed(2)}
                  </span>
                  <span className="text-[9px] line-through" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    {currency.symbol}{displayPrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="font-bold text-sm md:text-base" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                  {currency.symbol}{displayPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <p className="text-[8px] md:text-[10px] mb-1.5" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
            SKU: {product.sku || 'N/A'}
          </p>

          {product.rating && (
            <div className="flex items-center gap-0.5 mb-1.5">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon
                    key={i}
                    icon={i < Math.floor(product.rating) ? faStar : (i < product.rating ? faStarHalfAlt : faStar)}
                    className="w-2.5 h-2.5 md:w-3 md:h-3"
                    style={{ color: '#F59E0B' }}
                  />
                ))}
              </div>
              <span className="text-[8px] md:text-[10px] font-medium" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                ({product.review_count || 0})
              </span>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[9px] md:text-[11px] font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                Colors:
              </span>
              <div className="flex gap-0.5">
                {product.colors.slice(0, 4).map((color: string) => (
                  <span
                    key={color}
                    className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                    style={{
                      background: getColorSwatch(color),
                      border: color.toLowerCase() === 'white' ? '1px solid #d1d5db' : 'none'
                    }}
                    title={color}
                  />
                ))}
                {product.colors.length > 4 && (
                  <span className="text-[8px] md:text-[10px] font-medium flex items-center" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    +{product.colors.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 mb-2.5">
            {product.is_in_stock ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-[9px] md:text-[11px] font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                  In Stock
                </span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span className="text-[9px] md:text-[11px] font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                  Out of Stock
                </span>
              </>
            )}
            {product.is_in_stock && product.stock_quantity > 0 && (
              <span className="text-[8px] md:text-[10px]" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                ({product.stock_quantity} available)
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCartClick}
            disabled={isDisabled}
            className={`w-full py-2 md:py-2.5 rounded-lg text-[11px] md:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${!isDisabled ? 'hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'}`}
            style={getButtonStyles()}
          >
            <FontAwesomeIcon icon={faShoppingCart} className="text-[11px] md:text-sm" />
            {buttonText}
          </button>
        </div>
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div
      className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col sm:flex-row"
      style={{
        background: isDimMode ? colors.backgroundCard : '#FFFFFF',
        border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)'}`,
        boxShadow: isHovered
          ? (isDimMode ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(19,158,162,0.12)')
          : '0 4px 12px rgba(0,0,0,0.04)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full sm:w-32 md:w-40 h-32 sm:h-auto sm:aspect-square flex-shrink-0 overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
        />
        {hasDiscount && (
          <div className="absolute top-1 left-1 z-10">
            <span className="px-1.5 py-0.5 text-[9px] font-bold text-white rounded-full" style={{ background: colors.secondary }}>
              -{discountPercent}%
            </span>
          </div>
        )}
        {isInCart && isAuthenticated && (
          <div className="absolute bottom-1 right-1 z-10">
            <span className="px-1.5 py-0.5 text-[8px] font-semibold text-white bg-green-500/90 rounded-full">
              In Cart
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 p-3 md:p-4 min-w-0 flex flex-col">
        <div className="flex flex-row items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base md:text-lg line-clamp-1" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
              {product.title}
            </h3>
            <p className="text-[9px] md:text-[11px]" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
              SKU: {product.sku || 'N/A'}
            </p>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            {hasDiscount ? (
              <>
                <span className="font-bold text-base md:text-lg" style={{ color: colors.secondary }}>
                  {currency.symbol}{displayDiscountPrice.toFixed(2)}
                </span>
                <span className="text-[10px] line-through" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                  {currency.symbol}{displayPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-bold text-base md:text-lg" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                {currency.symbol}{displayPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {product.rating && (
          <div className="flex items-center gap-0.5 mt-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FontAwesomeIcon
                  key={i}
                  icon={i < Math.floor(product.rating) ? faStar : (i < product.rating ? faStarHalfAlt : faStar)}
                  className="w-3 h-3 md:w-3.5 md:h-3.5"
                  style={{ color: '#F59E0B' }}
                />
              ))}
            </div>
            <span className="text-[9px] md:text-[11px]" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
              ({product.review_count || 0})
            </span>
          </div>
        )}

        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] md:text-[11px] font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
              Colors:
            </span>
            <div className="flex gap-0.5">
              {product.colors.slice(0, 6).map((color: string) => (
                <span
                  key={color}
                  className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                  style={{
                    background: getColorSwatch(color),
                    border: color.toLowerCase() === 'white' ? '1px solid #d1d5db' : 'none'
                  }}
                  title={color}
                />
              ))}
              {product.colors.length > 6 && (
                <span className="text-[8px] md:text-[10px] font-medium flex items-center" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                  +{product.colors.length - 6}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t" style={{ borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }}>
          <div className="flex items-center gap-1.5">
            {product.is_in_stock ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-[9px] md:text-[11px] font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                  In Stock
                </span>
                {product.stock_quantity > 0 && (
                  <span className="text-[8px] md:text-[10px]" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                    ({product.stock_quantity} available)
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span className="text-[9px] md:text-[11px] font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                  Out of Stock
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onQuickView && onQuickView(product)}
              className="px-2.5 py-1.5 md:px-3.5 md:py-2 text-[10px] md:text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-1.5"
              style={{
                background: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)',
                color: isDimMode ? colors.primary : '#139EA2',
                border: 'none',
              }}
            >
              <FontAwesomeIcon icon={faEye} className="text-[10px] md:text-xs" />
              Quick View
            </button>
            <button
              onClick={handleAddToCartClick}
              disabled={isDisabled}
              className={`px-3.5 py-1.5 md:px-5 md:py-2 rounded-lg text-[10px] md:text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${!isDisabled ? 'hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'}`}
              style={getButtonStyles()}
            >
              <FontAwesomeIcon icon={faShoppingCart} className="text-[10px] md:text-xs" />
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

// ===== PRODUCT DETAILS MODAL =====
const ProductDetailsModal = ({
  product,
  onClose,
  onAddToCart,
  colors,
  isDimMode,
  currency,
  convertPrice,
  isAuthenticated,
  isInCart = false,
}: any) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'artisan'>('details');
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Array<{
    color: string | null;
    size: string | null;
    quantity: number;
  }>>([]);
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!product) return null;

  const getProductImages = () => {
    let images: any[] = [];

    if (product.gallery_images && Array.isArray(product.gallery_images)) {
      images = product.gallery_images
        .filter((img: any) => img.image_url)
        .map((img: any) => ({
          url: img.image_url || img.url,
          alt_text: img.alt_text || product.title || 'Product image',
          is_primary: img.is_primary || false,
          order: img.order || 0,
          id: img.id || Math.random(),
        }));

      if (images.length > 0) {
        images.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        return images;
      }
    }

    if (product.image_url) {
      images = [{
        url: product.image_url,
        alt_text: product.title || 'Product image',
        is_primary: true,
        order: 0,
        id: 0,
      }];
      return images;
    }

    images = [{
      url: '/placeholder-product.jpg',
      alt_text: product.title || 'Product',
      is_primary: true,
      order: 0,
      id: 0,
    }];
    return images;
  };

  const images = getProductImages();
  const finalImages = images.length > 0 ? images : [{
    url: product.image_url || product.image || '/placeholder-product.jpg',
    alt_text: product.title || 'Product',
    is_primary: true,
    order: 0,
    id: 0,
  }];

  const currentImage = finalImages.length > 0 ? finalImages[currentIndex % finalImages.length] : null;
  const imageUrl = currentImage?.url || product.image_url || product.image || '/placeholder-product.jpg';

  const price = parseFloat(product.price) || 0;
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const hasDiscount = discountPrice !== null && discountPrice < price;
  const displayPrice = convertPrice(price);
  const displayDiscountPrice = hasDiscount ? convertPrice(discountPrice) : null;

  const nextImage = () => {
    if (finalImages.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % finalImages.length);
    }
  };

  const prevImage = () => {
    if (finalImages.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + finalImages.length) % finalImages.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0]!.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0]!.clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX - touchEndX > 50) {
      nextImage();
    } else if (touchEndX - touchStartX > 50) {
      prevImage();
    }
  };

  const getColorSwatch = (color: string) => {
    const colorValue = color.toLowerCase();
    if (colorValue.includes('black')) return '#1a1a1a';
    if (colorValue.includes('white')) return '#f5f5f5';
    if (colorValue.includes('red')) return '#ef4444';
    if (colorValue.includes('blue')) return '#3b82f6';
    if (colorValue.includes('green')) return '#22c55e';
    if (colorValue.includes('yellow')) return '#eab308';
    if (colorValue.includes('gold')) return '#f59e0b';
    if (colorValue.includes('silver')) return '#9ca3af';
    if (colorValue.includes('brown')) return '#92400e';
    if (colorValue.includes('purple')) return '#8b5cf6';
    if (colorValue.includes('pink')) return '#ec4899';
    if (colorValue.includes('orange')) return '#f97316';
    if (colorValue.includes('gray') || colorValue.includes('grey')) return '#6b7280';
    return colorValue;
  };

  const addVariant = () => {
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('Please select a color.');
      return;
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size.');
      return;
    }

    const exists = selectedVariants.some(
      (v) => v.color === selectedColor && v.size === selectedSize
    );

    if (exists) {
      alert('This variant is already in your list.');
      return;
    }

    const newVariant = {
      color: selectedColor,
      size: selectedSize,
      quantity: quantity || 1,
    };

    setSelectedVariants([...selectedVariants, newVariant]);
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantity(1);
  };

  const removeVariant = (index: number) => {
    setSelectedVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariantQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setSelectedVariants((prev) =>
      prev.map((v, i) => i === index ? { ...v, quantity: newQuantity } : v)
    );
  };

  const handleAddAllToCart = () => {
    if (!isAuthenticated) {
      onAddToCart(product, false);
      return;
    }

    if (selectedVariants.length === 0) {
      alert('Please add at least one variant to your cart.');
      return;
    }

    selectedVariants.forEach((variant) => {
      const variantKey = `${product.id}_${variant.color || 'any'}_${variant.size || 'any'}`;
      onAddToCart({
        ...product,
        quantity: variant.quantity,
        selectedColor: variant.color || undefined,
        selectedSize: variant.size || undefined,
        variant_key: variantKey,
      }, true);
    });

    setTimeout(() => {
      setSelectedVariants([]);
      onClose();
    }, 500);
  };

  // A plain function rather than useCallback. This component returns early
  // when there is no product, which sits above this line, so a hook here ran
  // on some renders and not others and React throws when hook order changes.
  // The memoisation bought nothing: the function is only used as a button's
  // onClick and appears in no dependency array.
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      onAddToCart(product, false);
      return;
    }
    if (isInCart) {
      onClose();
      return;
    }

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('Please select a color before adding to cart.');
      return;
    }

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size before adding to cart.');
      return;
    }

    const variantKey = `${product.id}_${selectedColor || 'any'}_${selectedSize || 'any'}`;
    onAddToCart({
      ...product,
      quantity: quantity,
      selectedColor: selectedColor || undefined,
      selectedSize: selectedSize || undefined,
      variant_key: variantKey,
    }, true);
    setTimeout(onClose, 500);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-3 pb-4">
            {product.materials && product.materials.length > 0 && (
              <p className="text-sm"><strong>Materials:</strong> {product.materials.join(', ')}</p>
            )}
            {product.dimensions && (
              <p className="text-sm"><strong>Dimensions:</strong> {product.dimensions}</p>
            )}
            {product.weight && (
              <p className="text-sm"><strong>Weight:</strong> {product.weight}</p>
            )}
            {product.care_instructions && (
              <p className="text-sm"><strong>Care:</strong> {product.care_instructions}</p>
            )}
            {product.origin && (
              <p className="text-sm"><strong>Origin:</strong> {product.origin}</p>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {product.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 text-xs rounded-full" style={{
                    background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                    color: isDimMode ? colors.textSecondary : colors.textSecondary,
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {finalImages.length > 0 && (
              <p className="text-xs mt-2" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                <FontAwesomeIcon icon={faImage} className="mr-1" />
                {finalImages.length} images available
              </p>
            )}
          </div>
        );
      case 'shipping':
        return (
          <div className="space-y-3 pb-4">
            <div className="p-3 rounded-lg" style={{
              background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
              border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
            }}>
              <p className="text-sm flex items-center gap-2"><FontAwesomeIcon icon={faTruck} className="w-4 h-4" style={{ color: isDimMode ? colors.primary : '#139EA2' }} /> Free shipping on orders over {currency.symbol}200</p>
            </div>
            <div className="p-3 rounded-lg" style={{
              background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
              border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
            }}>
              <p className="text-sm flex items-center gap-2"><FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4" style={{ color: isDimMode ? colors.primary : '#139EA2' }} /> Secure payment with SSL encryption</p>
            </div>
            <div className="p-3 rounded-lg" style={{
              background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
              border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
            }}>
              <p className="text-sm flex items-center gap-2"><FontAwesomeIcon icon={faUndo} className="w-4 h-4" style={{ color: isDimMode ? colors.primary : '#139EA2' }} /> 30-day money-back guarantee</p>
            </div>
            <div className="p-3 rounded-lg" style={{
              background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
              border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
            }}>
              <p className="text-sm"><strong>Shipping from:</strong> Accra, Ghana</p>
              <p className="text-sm"><strong>Estimated delivery:</strong> 3-7 business days</p>
            </div>
          </div>
        );
      case 'artisan':
        const artisanData = product.artisan;
        const artisanName = typeof artisanData === 'object' ? artisanData?.name : artisanData;
        const artisanBio = typeof artisanData === 'object' ? artisanData?.bio : product.artisan_bio;
        const artisanImage = typeof artisanData === 'object' ? artisanData?.profile_image : product.artisan_image;
        const artisanLocation = typeof artisanData === 'object' ? artisanData?.location : product.origin;
        const artisanCraft = typeof artisanData === 'object' ? artisanData?.craft_type : null;
        
        return (
          <div className="space-y-3 pb-4">
            {artisanName ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{
                  background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                }}>
                  {artisanImage ? (
                    <img
                      src={artisanImage}
                      alt={artisanName}
                      className="w-14 h-14 rounded-full object-cover border-2 flex-shrink-0"
                      style={{ borderColor: isDimMode ? colors.primary : '#139EA2' }}
                      onError={(e) => { e.currentTarget.src = '/placeholder-user.jpg'; }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{
                      background: isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.1)',
                      color: isDimMode ? colors.primary : '#139EA2',
                    }}>
                      <FontAwesomeIcon icon={faUser} className="text-xl" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                      {artisanName}
                    </p>
                    {artisanLocation && (
                      <p className="text-xs truncate" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                        {artisanLocation}
                      </p>
                    )}
                    {artisanCraft && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] rounded-full truncate max-w-full" style={{
                        background: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)',
                        color: isDimMode ? colors.primary : '#139EA2',
                      }}>
                        {artisanCraft}
                      </span>
                    )}
                  </div>
                </div>
                {artisanBio && (
                  <div className="p-3 rounded-lg" style={{
                    background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
                    border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                  }}>
                    <p className="text-sm leading-relaxed" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                      {artisanBio}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 text-sm" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
                    Verified Artisan
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faGem} style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
                    Handcrafted
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faCrown} className="text-4xl mb-3" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }} />
                <p className="text-sm" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                  Handcrafted by skilled Ghanaian artisans.
                </p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderPage1 = () => (
    <div 
      className="p-4 md:p-6 lg:p-8 overflow-y-auto flex-1"
      style={{ 
        maxHeight: isMobile ? 'calc(100vh - 280px)' : 'calc(90vh - 80px)',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div className="pb-4">
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {product.category_name && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                background: isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)',
                color: isDimMode ? colors.primary : '#139EA2'
              }}>
                {product.category_name}
              </span>
            )}
            {product.is_in_stock && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                background: 'rgba(16,185,129,0.1)',
                color: '#10B981'
              }}>
                <FontAwesomeIcon icon={faCheckCircle} className="mr-0.5 text-[8px]" />
                In Stock
              </span>
            )}
            {isInCart && isAuthenticated && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
                background: 'rgba(16,185,129,0.15)',
                color: '#10B981'
              }}>
                <FontAwesomeIcon icon={faCheckCircle} className="mr-0.5 text-[8px]" />
                In Cart
              </span>
            )}
          </div>
          <h2 className="text-lg md:text-2xl font-bold" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
            {product.title}
          </h2>
          <p className="text-[10px] mt-0.5" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
            SKU: {product.sku || 'N/A'}
          </p>
        </div>

        <div className="mb-3">
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-bold" style={{ color: colors.secondary }}>
                {currency.symbol}{displayDiscountPrice.toFixed(2)}
              </span>
              <span className="text-sm line-through" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                {currency.symbol}{displayPrice.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-xl md:text-2xl font-bold" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
              {currency.symbol}{displayPrice.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          {product.is_in_stock ? (
            <>
              <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-green-500" />
              <span className="text-xs font-medium text-green-500">
                In Stock ({product.stock_quantity} available)
              </span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faTimes} className="w-3 h-3 text-red-500" />
              <span className="text-xs font-medium text-red-500">Out of Stock</span>
            </>
          )}
        </div>

        <p className="text-xs leading-relaxed mb-3" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
          {product.description || 'No description available.'}
        </p>

        {(product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0) ? (
          <div className="mb-3 p-3 rounded-lg" style={{
            background: isDimMode ? 'rgba(230,166,77,0.05)' : 'rgba(19,158,162,0.03)',
            border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.08)'}`
          }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                Choose your variants
              </span>
              <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                {selectedVariants.length} variant{selectedVariants.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="mb-2">
                <label className="block text-xs font-medium mb-1" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                  Color {selectedColor ? `✓ ${selectedColor}` : ''}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {product.colors.map((color: string) => {
                    const isSelected = selectedColor === color;
                    const colorValue = color.toLowerCase();
                    let swatchColor = colorValue;
                    if (colorValue.includes('black')) swatchColor = '#1a1a1a';
                    else if (colorValue.includes('white')) swatchColor = '#f5f5f5';
                    else if (colorValue.includes('red')) swatchColor = '#ef4444';
                    else if (colorValue.includes('blue')) swatchColor = '#3b82f6';
                    else if (colorValue.includes('green')) swatchColor = '#22c55e';
                    else if (colorValue.includes('yellow')) swatchColor = '#eab308';
                    else if (colorValue.includes('gold')) swatchColor = '#f59e0b';
                    else if (colorValue.includes('silver')) swatchColor = '#9ca3af';
                    else if (colorValue.includes('brown')) swatchColor = '#92400e';
                    else if (colorValue.includes('purple')) swatchColor = '#8b5cf6';
                    else if (colorValue.includes('pink')) swatchColor = '#ec4899';
                    else if (colorValue.includes('orange')) swatchColor = '#f97316';
                    else if (colorValue.includes('gray') || colorValue.includes('grey')) swatchColor = '#6b7280';

                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-2.5 py-1 text-xs rounded-full border-2 transition-all duration-200 flex items-center gap-1.5 ${isSelected ? 'border-2 shadow-md' : 'border'}`}
                        style={{
                          background: isSelected ? (isDimMode ? colors.primary : '#139EA2') : 'transparent',
                          color: isSelected ? (isDimMode ? '#0A0A0A' : 'white') : (isDimMode ? colors.textSecondary : colors.textSecondary),
                          borderColor: isSelected ? (isDimMode ? colors.primary : '#139EA2') : (isDimMode ? 'rgba(255,255,255,0.15)' : '#E5E7EB'),
                        }}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                          style={{
                            background: swatchColor,
                            border: colorValue === 'white' ? '1px solid #d1d5db' : 'none'
                          }}
                        />
                        <span>{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-2">
                <label className="block text-xs font-medium mb-1" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                  Size {selectedSize ? `✓ ${selectedSize}` : ''}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((size: string) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg border-2 transition-all duration-200 ${isSelected ? 'border-2 shadow-md' : 'border'}`}
                        style={{
                          background: isSelected ? (isDimMode ? colors.primary : '#139EA2') : 'transparent',
                          color: isSelected ? (isDimMode ? '#0A0A0A' : 'white') : (isDimMode ? colors.textSecondary : colors.textSecondary),
                          borderColor: isSelected ? (isDimMode ? colors.primary : '#139EA2') : (isDimMode ? 'rgba(255,255,255,0.15)' : '#E5E7EB'),
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                  style={{
                    background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                    border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                    color: isDimMode ? colors.textSecondary : colors.textSecondary,
                  }}
                >
                  <FontAwesomeIcon icon={faMinus} className="text-xs" />
                </button>
                <span className="text-sm font-semibold w-6 text-center" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity || 10, quantity + 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                  style={{
                    background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                    border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                    color: isDimMode ? colors.textSecondary : colors.textSecondary,
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                </button>
              </div>
              <button
                onClick={addVariant}
                disabled={(!selectedColor && product.colors?.length > 0) || (!selectedSize && product.sizes?.length > 0)}
                className="px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  background: (selectedColor || !product.colors?.length) && (selectedSize || !product.sizes?.length)
                    ? (isDimMode ? colors.primary : '#139EA2')
                    : (isDimMode ? '#2A2A2A' : '#E5E7EB'),
                  color: (selectedColor || !product.colors?.length) && (selectedSize || !product.sizes?.length)
                    ? (isDimMode ? '#0A0A0A' : 'white')
                    : (isDimMode ? '#6B7280' : '#9CA3AF'),
                  border: 'none',
                  cursor: (selectedColor || !product.colors?.length) && (selectedSize || !product.sizes?.length) ? 'pointer' : 'not-allowed',
                }}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-1 text-xs" />
                Add Variant
              </button>
            </div>
          </div>
        ) : null}

        {selectedVariants.length > 0 && (
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1.5" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
              <FontAwesomeIcon icon={faShoppingCart} className="mr-1.5" style={{ color: colors.primary }} />
              Your Variants ({selectedVariants.length})
            </label>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
              {selectedVariants.map((variant, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{
                    background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
                    border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                  }}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                      {variant.color || 'Any Color'}
                      {variant.color && variant.size ? ' / ' : ''}
                      {variant.size || 'Any Size'}
                    </span>
                    <span className="font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                      × {variant.quantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateVariantQuantity(index, variant.quantity - 1)}
                      className="w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-105"
                      style={{
                        background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                        border: 'none',
                        color: isDimMode ? colors.textSecondary : colors.textSecondary,
                      }}
                    >
                      <FontAwesomeIcon icon={faMinus} className="text-[10px]" />
                    </button>
                    <span className="text-xs font-semibold w-4 text-center" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                      {variant.quantity}
                    </span>
                    <button
                      onClick={() => updateVariantQuantity(index, variant.quantity + 1)}
                      className="w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-105"
                      style={{
                        background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                        border: 'none',
                        color: isDimMode ? colors.textSecondary : colors.textSecondary,
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                    </button>
                    <button
                      onClick={() => removeVariant(index)}
                      className="w-6 h-6 rounded flex items-center justify-center transition-all duration-200 hover:scale-110"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDimMode ? '#6B7280' : '#9CA3AF',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = isDimMode ? '#6B7280' : '#9CA3AF'}
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedVariants.length > 0 ? (
          <button
            onClick={handleAddAllToCart}
            disabled={!product.is_in_stock}
            className={`w-full py-2.5 md:py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${product.is_in_stock ? 'hover:scale-[1.02]' : 'opacity-50 cursor-not-allowed'}`}
            style={{
              background: product.is_in_stock ? (isDimMode ? colors.primary : '#139EA2') : (isDimMode ? '#2A2A2A' : '#E5E7EB'),
              color: product.is_in_stock ? (isDimMode ? '#0A0A0A' : 'white') : (isDimMode ? '#6B7280' : '#9CA3AF'),
            }}
          >
            <FontAwesomeIcon icon={faShoppingCart} className="text-sm" />
            {!isAuthenticated ? 'Login to Add' : `Add ${selectedVariants.length} Variant${selectedVariants.length > 1 ? 's' : ''} to Cart`}
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!product.is_in_stock || isInCart}
            className={`w-full py-2.5 md:py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${(!product.is_in_stock || isInCart) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
            style={{
              background: (!product.is_in_stock || isInCart) ? (isDimMode ? '#2A2A2A' : '#E5E7EB') : (isDimMode ? colors.primary : '#139EA2'),
              color: (!product.is_in_stock || isInCart) ? (isDimMode ? '#6B7280' : '#9CA3AF') : (isDimMode ? '#0A0A0A' : 'white'),
            }}
          >
            <FontAwesomeIcon icon={faShoppingCart} className="text-sm" />
            {!isAuthenticated ? 'Login to Add' : isInCart ? 'In Cart ✓' : product.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        )}
      </div>
    </div>
  );

  const renderPage2 = () => (
    <div 
      className="p-4 md:p-6 lg:p-8 overflow-y-auto flex-1"
      style={{ 
        maxHeight: isMobile ? 'calc(100vh - 280px)' : 'calc(90vh - 80px)',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div className="pb-4">
        <div className="flex gap-1 border-b" style={{ borderColor: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }}>
          {['details', 'shipping', 'artisan'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-all duration-200 ${activeTab === tab ? 'bg-opacity-10' : ''}`}
              style={{
                background: activeTab === tab ? (isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)') : 'transparent',
                color: activeTab === tab ? (isDimMode ? colors.primary : '#139EA2') : (isDimMode ? colors.textSecondary : colors.textSecondary),
                borderBottom: activeTab === tab ? `2px solid ${isDimMode ? colors.primary : '#139EA2'}` : '2px solid transparent',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="mt-3 text-xs md:text-sm leading-relaxed" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-xl md:rounded-2xl shadow-2xl flex flex-col"
        style={{
          background: isDimMode ? colors.background : '#FFFFFF',
          border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.1)'}`,
          maxHeight: '95vh',
          margin: 'auto',
          position: 'relative',
          top: 'auto',
          transform: 'none',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:grid md:grid-cols-2 gap-0 flex-1 overflow-hidden">
          <div
            className="relative aspect-square md:aspect-auto md:h-full min-h-[280px] md:min-h-[400px] overflow-hidden flex-shrink-0"
            style={{ background: isDimMode ? '#1A1A1A' : '#F5F5F5' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-full h-full">
              <img
                src={imageUrl}
                alt={currentImage?.alt_text || product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.jpg';
                }}
              />
            </div>

            {hasDiscount && (
              <div className="absolute top-3 left-3 z-10">
                <span className="px-2 py-1 text-[10px] font-bold text-white rounded-full" style={{ background: colors.secondary }}>
                  {Math.round(((price - discountPrice) / price) * 100)}% OFF
                </span>
              </div>
            )}

            {!product.is_in_stock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <span className="px-4 py-2 text-sm font-bold text-white bg-red-500/90 rounded-lg">
                  Out of Stock
                </span>
              </div>
            )}

            {finalImages.length > 1 && (
              <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
                {currentIndex + 1} / {finalImages.length}
              </div>
            )}

            {finalImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 bg-black/50 hover:bg-black/70 text-white"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 bg-black/50 hover:bg-black/70 text-white"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                </button>
              </>
            )}

            {finalImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 z-20 max-w-[85%] overflow-x-auto">
                {finalImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                    className={`w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${currentIndex === idx ? 'border-white' : 'border-transparent hover:border-white/50'}`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt_text || `Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-product.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex flex-col overflow-hidden">
            {currentPage === 1 ? renderPage1() : renderPage2()}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 md:p-4 border-t flex-shrink-0" style={{
          borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
          background: isDimMode ? 'rgba(255,255,255,0.02)' : '#FAFAFA',
        }}>
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105 px-3 py-1.5 rounded-lg"
            style={{
              color: isDimMode ? colors.textSecondary : colors.textSecondary,
              background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
            }}
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
            <span>Close</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center ${currentPage === 1 ? 'text-white' : ''}`}
              style={{
                background: currentPage === 1 ? (isDimMode ? colors.primary : '#139EA2') : 'transparent',
                color: currentPage === 1 ? (isDimMode ? '#0A0A0A' : 'white') : (isDimMode ? colors.textSecondary : colors.textSecondary),
                border: currentPage === 1 ? 'none' : `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
              }}
            >
              1
            </button>
            <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>/</span>
            <button
              onClick={() => setCurrentPage(2)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center ${currentPage === 2 ? 'text-white' : ''}`}
              style={{
                background: currentPage === 2 ? (isDimMode ? colors.primary : '#139EA2') : 'transparent',
                color: currentPage === 2 ? (isDimMode ? '#0A0A0A' : 'white') : (isDimMode ? colors.textSecondary : colors.textSecondary),
                border: currentPage === 2 ? 'none' : `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
              }}
            >
              2
            </button>
          </div>

          <div className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
            Page {currentPage} of 2
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== SUB-NAVIGATION LINKS =====
const SUB_NAV_LINKS = [
  { name: 'Market Center', path: '/market', icon: faStore },
  { name: 'Tech & Innovation', path: '/market/tech-innovation', icon: faLightbulb },
  { name: 'Artisan Spotlight', path: '/market/artisans', icon: faCrown },
];

// ===== MAIN MARKET PAGE =====
function MarketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDimMode, setIsDimMode] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'popular'>('newest');
  const [stats, setStats] = useState<MarketStats | null>(null);

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES[0]!);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<MarketOrder | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [selectedProduct, setSelectedProduct] = useState<MarketProduct | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  const [showLoginToast, setShowLoginToast] = useState(false);
  const [loginToastMessage, setLoginToastMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [isMobile, setIsMobile] = useState(false);

  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<MarketProduct[]>([]);

  // ===== PAYSTACK STATES =====
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentOrderDetails, setPaymentOrderDetails] = useState<any>(null);

  const colors = isDimMode ? COLORS.dark : COLORS.light;

  const { addItem: addToCart, getItemCount, getCartItems, getCartTotal } = useCart();

  // ===== CURRENCY HELPERS =====
  const convertPrice = useCallback((price: number): number => {
    return price * selectedCurrency.rate;
  }, [selectedCurrency.rate]);

  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('selectedCurrency');
      if (savedCurrency) {
        const parsed = JSON.parse(savedCurrency);
        const found = CURRENCIES.find(c => c.code === parsed.code);
        if (found) setSelectedCurrency(found);
      }
    } catch (error) {
      console.error('Error loading currency:', error);
    }
  }, []);

  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      const { currency } = event.detail;
      setSelectedCurrency(currency);
    };
    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener);
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
    };
  }, []);

  // ===== RESPONSIVE ITEMS PER PAGE =====
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setItemsPerPage(mobile ? 4 : 6);
      setCurrentPage(1);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== FETCH DATA =====
  // Ported from GET /market-products/, /market-categories/, /market-orders/ and
  // /market-stats/ on the old Django API. The old market-products view applied
  // sort_by (price_low/price_high/popular/newest) and then unconditionally
  // re-ordered the queryset by the product's `order` field, which overwrote
  // that sort. The dropdown was effectively decorative. We reproduce that: the
  // query below always orders by sort_order regardless of sortBy.
  const splitCsv = (value: string | null | undefined): string[] =>
    value ? value.split(',').map((v) => v.trim()).filter(Boolean) : [];

  const fetchAllData = useCallback(async () => {
    try {
      const supabase = createBrowserClient();

      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('market_products')
          .select('*, market_categories(name), artisans(id, name, slug, bio, profile_image_url, location, craft_type), product_gallery(*)')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('market_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ]);

      let parsedProducts: MarketProduct[] = [];

      if (!productsRes.error && productsRes.data) {
        parsedProducts = productsRes.data.map((p: any) => {
          const gallery = (p.product_gallery || [])
            .filter((g: any) => g.is_active)
            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
          const primaryGallery = gallery.find((g: any) => g.is_primary) || gallery[0] || null;
          const imageUrl = primaryGallery?.image_url || p.image_url || null;

          const artisanRow = p.artisans || null;
          const artisanInfo = artisanRow
            ? {
                id: artisanRow.id,
                name: artisanRow.name,
                slug: artisanRow.slug,
                bio: artisanRow.bio,
                profile_image: artisanRow.profile_image_url || null,
                location: artisanRow.location,
                craft_type: artisanRow.craft_type,
              }
            : null;

          return {
            id: p.id,
            title: p.title,
            slug: p.slug,
            description: p.description || '',
            sku: p.sku || '',
            price: parseFloat(p.price) || 0,
            discount_price: p.discount_price ? parseFloat(p.discount_price) : null,
            stock_quantity: parseInt(p.stock_quantity, 10) || 0,
            is_in_stock: p.is_in_stock,
            image: imageUrl,
            image_url: imageUrl,
            gallery_images: gallery.map((g: any) => ({
              id: g.id,
              image_url: g.image_url,
              alt_text: g.alt_text || '',
              is_primary: g.is_primary,
              order: g.sort_order,
            })),
            button_text: p.button_text || 'Shop Now',
            button_link: p.button_link || `/market/${p.slug}`,
            is_featured: p.is_featured,
            order: p.sort_order,
            created_at: p.created_at,
            updated_at: p.updated_at,
            category_id: p.category_id,
            category_name: p.market_categories?.name || null,
            colors: splitCsv(p.colors),
            sizes: splitCsv(p.sizes),
            materials: splitCsv(p.materials),
            dimensions: p.dimensions || '',
            weight: p.weight || '',
            care_instructions: p.care_instructions || '',
            origin: p.origin || '',
            artisan: artisanInfo,
            artisan_bio: artisanRow?.bio || p.artisan_bio || '',
            artisan_image: artisanRow?.profile_image_url || p.artisan_image_url || '',
            tags: splitCsv(p.tags),
            rating: p.rating ? parseFloat(p.rating) : 0,
            review_count: p.review_count || 0,
            is_active: p.is_active,
          } as MarketProduct;
        });
        setProducts(parsedProducts);
      }

      let categoryList: Category[] = [];
      if (!categoriesRes.error && categoriesRes.data) {
        categoryList = categoriesRes.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          product_count: parsedProducts.filter((p) => p.category_id === cat.id).length,
        }));
        setCategories(categoryList);
      }

      // market-orders/ returned the signed in user's orders, 401 otherwise.
      // Row level security for orders may not be applied yet, so this can come
      // back empty or with an error; either way we leave orders as [] just like
      // the old page did on a failed or empty response.
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: orderRows, error: ordersError } = await supabase
          .from('orders')
          .select('*, market_products(title)')
          .eq('user_id', authData.user.id)
          .order('created_at', { ascending: false });

        if (!ordersError && orderRows) {
          setOrders(
            orderRows.map((o: any) => ({
              id: o.id,
              order_number: o.order_number,
              user: o.user_id,
              product: o.product_id,
              product_name: o.market_products?.title,
              quantity: o.quantity,
              unit_price: parseFloat(o.unit_price) || 0,
              total_price: parseFloat(o.total_price) || 0,
              shipping_address: o.shipping_address,
              shipping_city: o.shipping_city,
              shipping_region: o.shipping_region,
              shipping_country: o.shipping_country,
              shipping_postal_code: o.shipping_postal_code || '',
              phone_number: o.phone_number,
              order_status: o.order_status,
              payment_status: o.payment_status,
              tracking_number: o.tracking_number || '',
              notes: o.notes || '',
              created_at: o.created_at,
              updated_at: o.updated_at,
            })),
          );
        }
      }

      // market-stats/ returned aggregate figures. total_orders, pending_orders
      // and delivered_orders were part of that response but the page never
      // rendered them, so they are left out here rather than invented.
      setStats({
        total_products: parsedProducts.length,
        active_products: parsedProducts.filter((p) => p.is_in_stock).length,
        featured_products: parsedProducts.filter((p) => (p as any).is_featured).length,
        categories_count: categoryList.length,
        artisans_count: new Set(parsedProducts.filter((p) => p.artisan).map((p) => p.artisan.id)).size,
      });
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  }, []);

  // ===== THEME DETECTION =====
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDimMode(theme === 'dim' || theme === 'dark');
    };
    checkTheme();
    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // ===== SCROLL DETECTION =====
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ===== LOAD DATA =====
  useEffect(() => {
    setLoading(true);
    fetchAllData().finally(() => setLoading(false));
  }, [fetchAllData]);

  // ===== AUTH =====
  const fetchUserStatus = useCallback(async () => {
    try {
      const data = await getAuthStatus();
      setIsAuthenticated(data.is_authenticated);
      setUser(data.user || null);
    } catch (error) {
      console.error('Error fetching user status:', error);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  // ===== OPEN PRODUCT FROM URL PARAMETER =====
  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId && products.length > 0) {
      const product = products.find(p => String(p.id) === productId);
      if (product) {
        setSelectedProduct(product);
        setShowProductModal(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [searchParams, products]);

  // ===== LISTEN FOR PAYMENT EVENT FROM CART =====
  useEffect(() => {
    const handleProceedToPayment = (event: CustomEvent) => {
      const { cartItems, total } = event.detail;
      console.log('Payment event received:', { cartItems, total });

      setPaymentAmount(total);
      setPaymentOrderDetails({
        orderId: `TT-${Date.now().toString().slice(-8)}`,
        items: cartItems.map((item: any) => ({
          id: item.product_id || item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
        total: total,
      });
      setShowPaymentModal(true);
    };

    window.addEventListener('proceedToPayment', handleProceedToPayment as EventListener);
    return () => {
      window.removeEventListener('proceedToPayment', handleProceedToPayment as EventListener);
    };
  }, []);

  // ===== FILTERING, SEARCHING, SORTING =====
  const filteredProductsList = useMemo(() => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.category_name?.toLowerCase().includes(term)
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        const selectedLower = selectedCategory.toLowerCase();
        if (p.category && p.category.toLowerCase() === selectedLower) return true;
        if (p.category_name && p.category_name.toLowerCase() === selectedLower) return true;
        return false;
      });
    }

    switch (sortBy) {
      case 'price_low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price_high': filtered.sort((a, b) => b.price - a.price); break;
      case 'popular': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default: filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()); break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredProductsList.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    return filteredProductsList.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredProductsList, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== PAYMENT HANDLERS =====
  const handleProceedToPayment = useCallback(() => {
    const cartItems = getCartItems ? getCartItems() : [];
    const total = getCartTotal ? getCartTotal() : 0;

    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items before proceeding to payment.');
      return;
    }

    setPaymentAmount(total);
    setPaymentOrderDetails({
      orderId: `TT-${Date.now().toString().slice(-8)}`,
      items: cartItems.map((item: any) => ({
        id: item.product_id || item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
      total: total,
    });
    setShowPaymentModal(true);
  }, [getCartItems, getCartTotal]);

  const handlePaymentSuccess = useCallback((reference: string, transaction: any) => {
    console.log('Payment successful:', reference, transaction);
    setShowPaymentModal(false);
    alert(`✅ Payment successful! Your order #${paymentOrderDetails?.orderId} has been confirmed.`);
  }, [paymentOrderDetails]);

  const handlePaymentError = useCallback((error: string) => {
    console.error('Payment error:', error);
    setShowPaymentModal(false);
    alert(`❌ Payment failed: ${error}`);
  }, []);

  // ===== HANDLERS =====
  const handleQuickView = useCallback((product: MarketProduct) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  }, []);

  const handleAddToCart = useCallback((product: MarketProduct, isLoggedIn: boolean) => {
    if (!isLoggedIn || !isAuthenticated) {
      setLoginToastMessage(`Please log in to add "${product.title}" to your cart.`);
      setShowLoginToast(true);
      return;
    }

    const existingCount = getItemCount(product.id as any);
    if (existingCount > 0) {
      setLoginToastMessage(`"${product.title}" is already in your cart.`);
      setShowLoginToast(true);
      return;
    }

    const variantKey = `${product.id}_any_any`;

    // CartContext still types item/product ids as number, carried over from the
    // old numeric-id API. Ids are uuid strings now; cast rather than touch
    // CartContext, which is out of scope for this port.
    addToCart({
      id: product.id,
      product_id: product.id,
      title: product.title,
      price: product.price,
      discount_price: product.discount_price,
      image_url: product.image_url || product.image,
      quantity: 1,
      selectedColor: undefined,
      selectedSize: undefined,
      variant_key: variantKey,
    } as any);
  }, [isAuthenticated, addToCart, getItemCount]);

  const handleWishlistToggle = useCallback((productId: string) => {
    setWishlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  const handleOrderStatusFilter = useCallback((status: string) => {
    setOrderStatusFilter(status);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const closeLoginToast = useCallback(() => {
    setShowLoginToast(false);
    setLoginToastMessage('');
  }, []);

  const getOrderStatusColor = useCallback((status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      processing: '#3B82F6',
      shipped: '#8B5CF6',
      delivered: '#10B981',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  }, []);

  const getOrderStatusLabel = useCallback((status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }, []);

  if (loading) {
    return <Loading fullPage={true} />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: isDimMode ? colors.background : colors.background }}>

      {showLoginToast && (
        <LoginToast
          message={loginToastMessage}
          onClose={closeLoginToast}
          isDimMode={isDimMode}
          colors={colors}
        />
      )}

      <div className="sticky top-0 z-40 border-b" style={{
        background: isDimMode ? colors.backgroundAlt : '#FFFFFF',
        borderColor: isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)',
      }}>
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-1 overflow-x-auto py-3">
            {SUB_NAV_LINKS.map((link) => {
              const isActive = link.path === '/market';
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${isActive ? 'bg-opacity-10' : 'hover:bg-opacity-5'}`}
                  style={{
                    background: isActive ? (isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)') : 'transparent',
                    color: isActive ? (isDimMode ? colors.primary : '#139EA2') : (isDimMode ? colors.textSecondary : colors.textSecondary),
                  }}
                >
                  <FontAwesomeIcon icon={link.icon} className="w-4 h-4" />
                  {link.name}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: isDimMode ? colors.primary : '#139EA2' }} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <section className="relative overflow-hidden py-8 md:py-10">
        <div className="absolute inset-0" style={{
          background: isDimMode
            ? 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)'
            : 'linear-gradient(135deg, #139EA2 0%, #0D7A7D 100%)',
        }} />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{
                  background: isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(255,255,255,0.2)',
                  color: isDimMode ? colors.primary : 'white',
                }}>
                  <FontAwesomeIcon icon={faStore} className="mr-1" />
                  Marketplace
                </span>
                {stats && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20 text-white">
                    {stats.total_products} Products
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                TechTour <span style={{ color: isDimMode ? colors.primary : '#E6A64D' }}>Market</span>
              </h1>
              <p className="text-white/70 text-sm md:text-base mt-1 max-w-lg">
                Discover authentic Ghanaian artisan products — from Kente cloth to handcrafted jewelry,
                wood carvings, and more. Support local artisans.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-72">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                color: isDimMode ? colors.textPrimary : colors.textPrimary,
              }}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                color: isDimMode ? colors.textPrimary : colors.textPrimary,
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name} ({cat.product_count})</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
              className="px-3 py-2.5 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                color: isDimMode ? colors.textPrimary : colors.textPrimary,
              }}
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="popular">Popular</option>
            </select>

            <div className="relative">
              <button
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
                style={{
                  background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                  color: isDimMode ? colors.textPrimary : colors.textPrimary,
                }}
              >
                <span>{selectedCurrency.symbol}</span>
                <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                  {selectedCurrency.code}
                </span>
                <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3" />
              </button>
              {showCurrencyDropdown && (
                <div
                  className="absolute right-0 mt-1 w-48 rounded-lg shadow-lg overflow-hidden z-20"
                  style={{
                    background: isDimMode ? colors.backgroundCard : '#FFFFFF',
                    border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                  }}
                >
                  {CURRENCIES.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => {
                        setSelectedCurrency(currency);
                        setShowCurrencyDropdown(false);
                        try {
                          localStorage.setItem('selectedCurrency', JSON.stringify(currency));
                          window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency } }));
                        } catch (error) {
                          console.error('Error saving currency:', error);
                        }
                      }}
                      className={`w-full px-4 py-2.5 text-sm text-left transition-all duration-200 flex items-center justify-between ${selectedCurrency.code === currency.code ? 'bg-opacity-10' : 'hover:bg-opacity-5'
                        }`}
                      style={{
                        background: selectedCurrency.code === currency.code
                          ? (isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.05)')
                          : 'transparent',
                        color: isDimMode ? colors.textPrimary : colors.textPrimary,
                      }}
                    >
                      <span>{currency.symbol} {currency.code}</span>
                      <span className="text-xs" style={{ color: isDimMode ? colors.textMuted : '#9CA3AF' }}>
                        {currency.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2.5 transition-all duration-200 ${viewMode === 'grid' ? 'text-white' : ''}`}
                style={{
                  background: viewMode === 'grid' ? (isDimMode ? colors.primary : '#139EA2') : 'transparent',
                  color: viewMode === 'grid' ? (isDimMode ? '#0A0A0A' : 'white') : (isDimMode ? colors.textSecondary : colors.textSecondary),
                }}
              >
                <FontAwesomeIcon icon={faThLarge} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2.5 transition-all duration-200 ${viewMode === 'list' ? 'text-white' : ''}`}
                style={{
                  background: viewMode === 'list' ? (isDimMode ? colors.primary : '#139EA2') : 'transparent',
                  color: viewMode === 'list' ? (isDimMode ? '#0A0A0A' : 'white') : (isDimMode ? colors.textSecondary : colors.textSecondary),
                }}
              >
                <FontAwesomeIcon icon={faList} />
              </button>
            </div>
          </div>
        </div>

        <div className="products-section">
          <div style={{
            fontSize: '14px',
            color: isDimMode ? colors.textMuted : '#9CA3AF',
            marginBottom: '16px',
          }}>
            Showing {filteredProductsList.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredProductsList.length)} of {filteredProductsList.length} products
          </div>

          {paginatedProducts.length > 0 ? (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4'
              : 'grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'
            }>
              {paginatedProducts.map((product) => {
                const isInCart = getItemCount(product.id as any) > 0;
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    colors={colors}
                    isDimMode={isDimMode}
                    onQuickView={handleQuickView}
                    onAddToCart={handleAddToCart}
                    isWishlisted={wishlist.has(product.id)}
                    onWishlistToggle={handleWishlistToggle}
                    currency={selectedCurrency}
                    convertPrice={convertPrice}
                    viewMode={viewMode}
                    isAuthenticated={isAuthenticated}
                    isInCart={isInCart}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                No products found
              </h3>
              <p className="text-sm" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '30px',
              padding: '16px 0',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: currentPage === 1 ? (isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6') : (isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)'),
                  color: currentPage === 1 ? (isDimMode ? '#6B7280' : '#9CA3AF') : (isDimMode ? colors.primary : '#139EA2'),
                  border: 'none',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Previous
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) { pageNum = i + 1; }
                else if (currentPage <= 3) { pageNum = i + 1; }
                else if (currentPage >= totalPages - 2) { pageNum = totalPages - 4 + i; }
                else { pageNum = currentPage - 2 + i; }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      background: currentPage === pageNum ? (isDimMode ? colors.primary : '#139EA2') : (isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9'),
                      color: currentPage === pageNum ? (isDimMode ? '#0A0A0A' : 'white') : (isDimMode ? colors.textSecondary : colors.textSecondary),
                      border: `1px solid ${currentPage === pageNum ? (isDimMode ? colors.primary : '#139EA2') : (isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB')}`,
                      cursor: 'pointer',
                      fontWeight: currentPage === pageNum ? '600' : '400',
                      fontSize: '14px',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: currentPage === totalPages ? (isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6') : (isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)'),
                  color: currentPage === totalPages ? (isDimMode ? '#6B7280' : '#9CA3AF') : (isDimMode ? colors.primary : '#139EA2'),
                  border: 'none',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {orders.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-6 border-t" style={{
          borderColor: isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.1)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
              <FontAwesomeIcon icon={faShoppingCart} className="mr-2" style={{ color: isDimMode ? colors.primary : '#139EA2' }} />
              Recent Orders
            </h3>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleOrderStatusFilter(status)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-all duration-200 whitespace-nowrap ${orderStatusFilter === status ? 'font-semibold' : ''}`}
                  style={{
                    background: orderStatusFilter === status ? (isDimMode ? 'rgba(230,166,77,0.15)' : 'rgba(19,158,162,0.1)') : 'transparent',
                    color: orderStatusFilter === status ? (isDimMode ? colors.primary : '#139EA2') : (isDimMode ? colors.textSecondary : colors.textSecondary),
                    border: orderStatusFilter === status ? `1px solid ${isDimMode ? colors.primary : '#139EA2'}` : `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
                  }}
                >
                  {status === 'all' ? 'All' : getOrderStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}` }}>
                  <th className="py-2 text-left font-medium text-xs" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>Order #</th>
                  <th className="py-2 text-left font-medium text-xs" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>Product</th>
                  <th className="py-2 text-left font-medium text-xs" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>Total</th>
                  <th className="py-2 text-left font-medium text-xs" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>Status</th>
                  <th className="py-2 text-left font-medium text-xs" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .filter(order => orderStatusFilter === 'all' || order.order_status === orderStatusFilter)
                  .slice(0, 5)
                  .map((order) => (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${isDimMode ? 'rgba(255,255,255,0.03)' : '#F3F4F6'}` }}>
                      <td className="py-2 font-mono text-xs" style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>
                        #{order.order_number}
                      </td>
                      <td className="py-2 text-sm" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                        {order.product_name || `Product #${order.product}`}
                      </td>
                      <td className="py-2 font-semibold" style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                        {selectedCurrency.symbol}{convertPrice(order.total_price).toFixed(2)}
                      </td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{
                          background: `${getOrderStatusColor(order.order_status)}20`,
                          color: getOrderStatusColor(order.order_status),
                        }}>
                          {getOrderStatusLabel(order.order_status)}
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-xs font-medium transition-colors duration-200 hover:underline"
                          style={{ color: isDimMode ? colors.primary : '#139EA2' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showProductModal && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setShowProductModal(false)}
          onAddToCart={handleAddToCart}
          colors={colors}
          isDimMode={isDimMode}
          currency={selectedCurrency}
          convertPrice={convertPrice}
          isAuthenticated={isAuthenticated}
          isInCart={getItemCount(selectedProduct.id as any) > 0}
        />
      )}

      {showPaymentModal && paymentOrderDetails && (
        <PaystackPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={paymentAmount}
          currency="GHS"
          email={user?.email || 'customer@example.com'}
          name={user?.full_name || 'Customer'}
          phone={user?.phone || ''}
          orderDetails={paymentOrderDetails}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          isDimMode={isDimMode}
          colors={colors}
        />
      )}

      {/* Test cards removed for production */}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl shadow-2xl p-6"
            style={{
              background: isDimMode ? colors.background : '#FFFFFF',
              border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.1)'}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                color: isDimMode ? colors.textSecondary : colors.textSecondary,
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h3 className="text-xl font-bold mb-4" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
              Order #{selectedOrder.order_number}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>Status</span>
                <span className="font-medium" style={{ color: getOrderStatusColor(selectedOrder.order_status) }}>
                  {getOrderStatusLabel(selectedOrder.order_status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>Payment</span>
                <span className="font-medium" style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                  {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>Quantity</span>
                <span style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>{selectedOrder.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: isDimMode ? colors.textSecondary : colors.textSecondary }}>Unit Price</span>
                <span style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>
                  {selectedCurrency.symbol}{convertPrice(selectedOrder.unit_price).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t" style={{ borderColor: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }}>
                <span style={{ color: isDimMode ? colors.textPrimary : colors.textPrimary }}>Total</span>
                <span style={{ color: isDimMode ? colors.primary : '#139EA2' }}>
                  {selectedCurrency.symbol}{convertPrice(selectedOrder.total_price).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-30 hover:scale-110"
          style={{
            background: isDimMode ? colors.primary : '#139EA2',
            color: isDimMode ? '#0A0A0A' : 'white',
          }}
        >
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      )}

      <Cart onProceedToPayment={handleProceedToPayment} />
    </div>
  );
}

// ===== EXPORT =====
export default function MarketPageWrapper() {
  return (
    <SearchParamsWrapper>
      <MarketPage />
    </SearchParamsWrapper>
  );
}