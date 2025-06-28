
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';

export const useCheckoutSession = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const createCheckoutSession = async (productId: string) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    // Set loading state for this specific product
    setLoadingStates(prev => ({ ...prev, [productId]: true }));
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
        body: { productId }
      });

      if (functionError) {
        console.error('Error creating checkout session:', functionError);
        setError(functionError.message || 'Failed to create checkout session');
        return null;
      }

      if (!data?.url) {
        setError('No checkout URL returned');
        return null;
      }

      return data;
    } catch (err) {
      console.error('Exception creating checkout session:', err);
      setError('Failed to create checkout session');
      return null;
    } finally {
      // Clear loading state for this specific product
      setLoadingStates(prev => ({ ...prev, [productId]: false }));
    }
  };

  const isLoading = (productId: string) => loadingStates[productId] || false;

  return {
    createCheckoutSession,
    isLoading,
    error
  };
};
