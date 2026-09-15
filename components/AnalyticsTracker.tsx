'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const API_URL = '/api';
const IS_PRODUCTION = true;

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionIdRef = useRef<string | null>(null);
  const lastPageRef = useRef<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('analytics_session_id', sessionId);
      }
      sessionIdRef.current = sessionId;
    }
  }, []);

  useEffect(() => {
    if (!pathname || !IS_PRODUCTION) return;
    
    const currentPage = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    if (currentPage === lastPageRef.current) return;
    lastPageRef.current = currentPage;

    const timer = setTimeout(() => {
      trackActivity(currentPage, 'view');
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  const trackActivity = async (page: string, action: string, data?: any) => {
    if (!IS_PRODUCTION) return;

    try {
      const response = await fetch(`${API_URL}/analytics/track-activity/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_visited: page,
          action: action,
          data: data || {},
          session_id: sessionIdRef.current || 'unknown',
        }),
      });

      if (!response.ok) {
        console.warn('Analytics tracking failed:', response.status);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Analytics error:', error);
      }
    }
  };

  const trackPurchase = async (productName: string, productId: number, amount: number, quantity?: number) => {
    if (!IS_PRODUCTION) return;

    try {
      const response = await fetch(`${API_URL}/analytics/track-purchase/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName,
          product_id: productId,
          amount: amount,
          quantity: quantity || 1,
          user_id: localStorage.getItem('user_id') || null,
          session_id: sessionIdRef.current || 'unknown',
        }),
      });

      if (!response.ok) {
        console.warn('Purchase tracking failed:', response.status);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const trackBooking = async (tourName: string, tourId: number, bookingDate: string, participants: number, totalAmount: number) => {
    if (!IS_PRODUCTION) return;

    try {
      const response = await fetch(`${API_URL}/analytics/track-booking/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tour_name: tourName,
          tour_id: tourId,
          booking_date: bookingDate,
          participants: participants,
          total_amount: totalAmount,
          user_id: localStorage.getItem('user_id') || null,
          session_id: sessionIdRef.current || 'unknown',
        }),
      });

      if (!response.ok) {
        console.warn('Booking tracking failed:', response.status);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const trackContact = async (name: string, email: string, subject: string, message: string, phone?: string) => {
    if (!IS_PRODUCTION) return;

    try {
      const response = await fetch(`${API_URL}/analytics/submit-contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone || '',
          subject: subject,
          message: message,
          session_id: sessionIdRef.current || 'unknown',
        }),
      });

      if (!response.ok) {
        console.warn('Contact tracking failed:', response.status);
      }
    } catch (error) {
      // Silent fail
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__analytics = {
        trackActivity,
        trackPurchase,
        trackBooking,
        trackContact,
      };
    }
  }, []);

  return null;
}