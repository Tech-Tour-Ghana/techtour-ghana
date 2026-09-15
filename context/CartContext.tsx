// app/context/CartContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface CartItem {
  id: number;
  product_id: number;
  title: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  variant_key?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, variantKey?: string) => void;
  updateQuantity: (productId: number, quantity: number, variantKey?: string) => void;
  clearCart: () => void;
  getItemCount: (productId: number) => number;
  getCartTotal: () => number;
  getCartItems: () => CartItem[];
  totalItems: number;
  totalProducts: number;
  totalPrice: number;
  isCartOpen: boolean;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items, isClient]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(
        i => i.product_id === item.product_id && i.variant_key === item.variant_key
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex]!;
        updated[existingIndex] = {
          ...existing,
          quantity: existing.quantity + item.quantity,
        };
        return updated;
      } else {
        return [...prevItems, item];
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { itemTitle: item.title } 
      }));
    }
  }, []);

  const removeItem = useCallback((productId: number, variantKey?: string) => {
    setItems(prevItems => 
      prevItems.filter(item => 
        !(item.product_id === productId && item.variant_key === variantKey)
      )
    );
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number, variantKey?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantKey);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.product_id === productId && item.variant_key === variantKey
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemCount = useCallback((productId: number): number => {
    const item = items.find(i => i.product_id === productId);
    return item ? item.quantity : 0;
  }, [items]);

  const getCartTotal = useCallback((): number => {
    return items.reduce((total, item) => {
      const price = item.discount_price || item.price;
      return total + (price * item.quantity);
    }, 0);
  }, [items]);

  const getCartItems = useCallback((): CartItem[] => {
    return items;
  }, [items]);

  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev);
  }, []);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalProducts = items.length;
  const totalPrice = items.reduce((total, item) => {
    const price = item.discount_price || item.price;
    return total + (price * item.quantity);
  }, 0);

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemCount,
    getCartTotal,
    getCartItems,
    totalItems,
    totalProducts,
    totalPrice,
    isCartOpen,
    toggleCart,
    openCart,
    closeCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;