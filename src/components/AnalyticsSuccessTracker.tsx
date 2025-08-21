// Component to track successful payments when users return from Stripe checkout
// Place this component on success/thank you pages or pages users land on after successful checkout

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Analytics } from '@/utils/analytics';

interface AnalyticsSuccessTrackerProps {
  // Optional: manually trigger tracking instead of using URL params
  manualTracking?: {
    productId: string;
    productType: 'subscription' | 'credit_pack';
    price: number;
    currency?: string;
    credits: number;
    transactionId?: string;
  };
}

export const AnalyticsSuccessTracker: React.FC<AnalyticsSuccessTrackerProps> = ({
  manualTracking
}) => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // If manual tracking is provided, use it
    if (manualTracking) {
      Analytics.trackPurchase(
        manualTracking.productId,
        manualTracking.productType,
        manualTracking.price,
        manualTracking.transactionId || `manual_${Date.now()}`,
        manualTracking.currency || 'USD',
        manualTracking.credits
      );
      return;
    }

    // Otherwise, check URL parameters for Stripe success data
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    const productId = searchParams.get('product_id');
    const productType = searchParams.get('product_type') as 'subscription' | 'credit_pack';
    const price = searchParams.get('price');
    const currency = searchParams.get('currency');
    const credits = searchParams.get('credits');

    // Only track if we have the required parameters from a successful Stripe session
    if (success === 'true' && sessionId && productId && productType && price && credits) {
      Analytics.trackPurchase(
        productId,
        productType,
        parseFloat(price),
        sessionId,
        currency || 'USD',
        parseInt(credits)
      );

      console.log('[Analytics] Successfully tracked purchase:', {
        productId,
        productType,
        price: parseFloat(price),
        transactionId: sessionId,
        currency: currency || 'USD',
        credits: parseInt(credits)
      });

      // Clean up URL parameters after tracking (optional)
      // This prevents re-tracking if user refreshes the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams, manualTracking]);

  // This component doesn't render anything
  return null;
};

export default AnalyticsSuccessTracker;
