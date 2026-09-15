// app/components/Cart.tsx - FIXED TYPESCRIPT ERRORS

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShoppingCart, 
  faTimes, 
  faPlus, 
  faMinus, 
  faTrash,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@/context/ThemeContext';
import { getAuthStatus } from '@/lib/api';

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

export default function Cart({ onProceedToPayment }: { onProceedToPayment?: () => void }) {
  const { 
    items, 
    totalItems, 
    totalProducts,
    totalPrice, 
    removeItem,
    updateQuantity,
    clearCart,
    isCartOpen,
    toggleCart,
    closeCart,
    getCartItems,
    getCartTotal
  } = useCart();
  const { isDimMode } = useTheme();
  const [showNotification, setShowNotification] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES[0]!);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const cartRef = useRef<HTMLDivElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  // Mark as client-side only
  useEffect(() => {
    setIsClient(true);
    
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

  // ===== FIXED: Listen for cart updates with proper event listener =====
  useEffect(() => {
    if (!isClient) return;
    
    const handleCartUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { itemTitle } = customEvent.detail;
      setLastAddedItem(itemTitle);
      setShowNotification(true);
      
      const timer = setTimeout(() => {
        setShowNotification(false);
        setLastAddedItem(null);
      }, 3000);
      
      // Store timer reference for cleanup
      return () => clearTimeout(timer);
    };
    
    // Use addEventListener with proper typing
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [isClient]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ===== CLOSE CART ON SCROLL =====
  useEffect(() => {
    if (!isCartOpen) return;
    
    const handleScroll = () => {
      closeCart();
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCartOpen, closeCart]);

  const convertPrice = (price: number): number => {
    return price * selectedCurrency.rate;
  };

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
    try {
      localStorage.setItem('selectedCurrency', JSON.stringify(currency));
      window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency } }));
    } catch (error) {
      console.error('Error saving currency:', error);
    }
    setShowCurrencyDropdown(false);
  };

  // ===== PROCEED TO CHECKOUT =====
  const handleCheckout = async () => {
    const cartItems = getCartItems ? getCartItems() : [];
    const total = getCartTotal ? getCartTotal() : 0;

    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items before proceeding to payment.');
      return;
    }

    // Session lives in an httpOnly cookie under Supabase Auth; there is no
    // access_token in localStorage to check anymore.
    const { is_authenticated } = await getAuthStatus();
    if (!is_authenticated) {
      alert('Please log in to proceed to payment.');
      window.location.href = '/auth/login';
      return;
    }

    // Close the cart
    closeCart();
    
    // Call the parent's payment handler if provided
    if (onProceedToPayment) {
      // Small delay to allow the cart to close
      setTimeout(() => {
        onProceedToPayment();
      }, 300);
    } else {
      // Fallback: dispatch event for the market page to handle
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('proceedToPayment', { 
            detail: { cartItems, total } 
          }));
        }, 300);
      }
    }
  };

  // Don't render on server
  if (!isClient) {
    return null;
  }

  const cartItems = getCartItems ? getCartItems() : items;
  // Use totalProducts for unique item count, not totalItems
  const itemCount = totalProducts || cartItems.length;
  const total = getCartTotal ? getCartTotal() : totalPrice;
  const cartWidth = isMobile ? '85%' : '420px';

  return (
    <>
      {/* Floating Cart Icon */}
      <button
        ref={cartButtonRef}
        onClick={toggleCart}
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '30px',
          zIndex: 999,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: isDimMode ? '#E6A64D' : '#139EA2',
          color: isDimMode ? '#0A0A0A' : 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          fontSize: '24px',
        }}
      >
        <FontAwesomeIcon icon={faShoppingCart} />
        {itemCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: '#EF4444',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            minWidth: '22px',
            height: '22px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
          }}>
            {itemCount}
          </span>
        )}
      </button>

      {/* Add to Cart Notification */}
      {showNotification && lastAddedItem && (
        <div style={{
          position: 'fixed',
          bottom: '160px',
          right: '30px',
          zIndex: 1000,
          background: isDimMode ? '#1A1A1A' : '#FFFFFF',
          border: `1px solid ${isDimMode ? 'rgba(230,166,77,0.2)' : 'rgba(19,158,162,0.1)'}`,
          borderRadius: '12px',
          padding: '12px 20px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.3s ease-out',
          maxWidth: '300px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: isDimMode ? '#FFFFFF' : '#000000' }}>
              Added to cart!
            </div>
            <div style={{ fontSize: '13px', color: isDimMode ? '#B0B0B0' : '#4A4A4A' }}>
              {lastAddedItem}
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <div 
        ref={cartRef}
        style={{
          position: 'fixed',
          top: 0,
          right: isCartOpen ? '0' : `-${cartWidth}`,
          width: cartWidth,
          maxWidth: '100%',
          height: '100vh',
          background: isDimMode ? '#1A1A1A' : '#FFFFFF',
          zIndex: 1001,
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '-4px 0 30px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '600',
            color: isDimMode ? '#FFFFFF' : '#000000',
          }}>
            Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Currency Selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                  color: isDimMode ? '#B0B0B0' : '#4A4A4A',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{selectedCurrency.symbol}</span>
                <span>{selectedCurrency.code}</span>
              </button>
              {showCurrencyDropdown && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  background: isDimMode ? '#1A1A1A' : '#FFFFFF',
                  border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                  zIndex: 10,
                  minWidth: '120px',
                  overflow: 'hidden',
                }}>
                  {CURRENCIES.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => handleCurrencyChange(currency)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        textAlign: 'left',
                        background: selectedCurrency.code === currency.code 
                          ? (isDimMode ? 'rgba(230,166,77,0.1)' : 'rgba(19,158,162,0.05)')
                          : 'transparent',
                        color: isDimMode ? '#FFFFFF' : '#000000',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'background 0.2s',
                      }}
                    >
                      {currency.symbol} {currency.code} - {currency.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={closeCart}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                color: isDimMode ? '#B0B0B0' : '#4A4A4A',
                padding: '4px 8px',
                transition: 'transform 0.2s',
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
        }}>
          {cartItems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: isDimMode ? '#6B7280' : '#9CA3AF',
            }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</p>
              <p style={{ fontSize: '16px', fontWeight: '500' }}>Your cart is empty</p>
              <p style={{ fontSize: '14px', marginTop: '4px' }}>Start shopping to add items</p>
              <button
                onClick={closeCart}
                style={{
                  marginTop: '20px',
                  padding: '10px 32px',
                  background: isDimMode ? '#E6A64D' : '#139EA2',
                  color: isDimMode ? '#0A0A0A' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'transform 0.2s',
                }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => {
              const price = item.discount_price || item.price;
              const convertedPrice = convertPrice(price);
              const itemTotal = convertedPrice * item.quantity;
              
              return (
                <div key={`${item.product_id}-${item.variant_key || 'default'}`} style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '12px 0',
                  borderBottom: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6'}`,
                  alignItems: 'center',
                }}>
                  <img
                    src={item.image_url || '/placeholder-product.jpg'}
                    alt={item.title}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: '500', 
                      fontSize: '14px',
                      color: isDimMode ? '#FFFFFF' : '#000000',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.title}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: isDimMode ? '#6B7280' : '#9CA3AF',
                      marginTop: '2px',
                    }}>
                      {item.selectedColor && `Color: ${item.selectedColor}`}
                      {item.selectedSize && ` • Size: ${item.selectedSize}`}
                    </div>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '15px',
                      color: isDimMode ? '#E6A64D' : '#139EA2',
                      marginTop: '2px',
                    }}>
                      {selectedCurrency.symbol}{convertedPrice.toFixed(2)} × {item.quantity} = {selectedCurrency.symbol}{itemTotal.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_key)}
                      style={{
                        padding: '4px 8px',
                        background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                        border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: isDimMode ? '#B0B0B0' : '#4A4A4A',
                        transition: 'background 0.2s',
                      }}
                    >
                      <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                    </button>
                    <span style={{ 
                      minWidth: '24px', 
                      textAlign: 'center',
                      color: isDimMode ? '#FFFFFF' : '#000000',
                      fontWeight: '500',
                      fontSize: '14px',
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_key)}
                      style={{
                        padding: '4px 8px',
                        background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                        border: `1px solid ${isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: isDimMode ? '#B0B0B0' : '#4A4A4A',
                        transition: 'background 0.2s',
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.product_id, item.variant_key)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#EF4444',
                        marginLeft: '4px',
                        transition: 'transform 0.2s',
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: `1px solid ${isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB'}`,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: isDimMode ? '#B0B0B0' : '#4A4A4A' }}>Subtotal</span>
              <span style={{ 
                fontWeight: 'bold', 
                fontSize: '20px',
                color: isDimMode ? '#E6A64D' : '#139EA2',
              }}>
                {selectedCurrency.symbol}{convertPrice(total).toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              style={{
                width: '100%',
                padding: '14px',
                background: isDimMode ? '#E6A64D' : '#139EA2',
                color: isDimMode ? '#0A0A0A' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <FontAwesomeIcon icon={faLock} className="w-4 h-4" />
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '8px',
                background: 'transparent',
                border: `1px solid #EF4444`,
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#EF4444',
                fontSize: '13px',
                transition: 'background 0.2s',
              }}
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>

      {/* Overlay */}
      {isCartOpen && (
        <div
          onClick={closeCart}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease-out',
          }}
        />
      )}
    </>
  );
}