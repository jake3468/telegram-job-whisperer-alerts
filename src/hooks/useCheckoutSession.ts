
import { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';

export const useCheckoutSession = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const { getToken } = useAuth();

  const createCheckoutSession = async (productId: string) => {
    if (!user) {
      const errorMsg = 'User not authenticated';
      setError(errorMsg);
      toast.error(errorMsg, {
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
      return null;
    }

    console.log('Creating checkout session for product:', productId);

    // Set loading state for this specific product
    setLoadingStates(prev => ({ ...prev, [productId]: true }));
    setError(null);

    try {
      // Get Clerk JWT token using useAuth hook
      const clerkToken = await getToken();
      if (!clerkToken) {
        throw new Error('Failed to get Clerk authentication token');
      }

      console.log('🔐 CLIENT: Got Clerk token, length:', clerkToken.length);

      // Make direct fetch request with Clerk token
      const response = await fetch('https://fnzloyyhzhrqsvslhhri.supabase.co/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from checkout session:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data?.url) {
        const errorMsg = 'No checkout URL returned';
        setError(errorMsg);
        toast.error(errorMsg, {
          action: {
            label: 'Close',
            onClick: () => toast.dismiss(),
          },
        });
        return null;
      }

      console.log('Checkout session created successfully:', data);
      return data;
    } catch (err) {
      console.error('Exception creating checkout session:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create checkout session';
      setError(errorMsg);
      toast.error(errorMsg, {
        action: {
          label: 'Close',
          onClick: () => toast.dismiss(),
        },
      });
      return null;
    } finally {
      // Clear loading state for this specific product
      setLoadingStates(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Fix: This should be a function call, not a function reference
  const isLoading = (productId: string) => {
    return loadingStates[productId] || false;
  };

  return {
    createCheckoutSession,
    isLoading,
    error
  };
};
