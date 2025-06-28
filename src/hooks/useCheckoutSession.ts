
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';

export const useCheckoutSession = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

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
      const { data, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
        body: { productId }
      });

      if (functionError) {
        console.error('Error creating checkout session:', functionError);
        const errorMsg = functionError.message || 'Failed to create checkout session';
        setError(errorMsg);
        toast.error(errorMsg, {
          action: {
            label: 'Close',
            onClick: () => toast.dismiss(),
          },
        });
        return null;
      }

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
      const errorMsg = 'Failed to create checkout session';
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
