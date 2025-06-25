
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export type SubscriptionStatus = {
  id: string;
  subscription_id: string;
  product_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'failed';
  next_billing_date: string | null;
  previous_billing_date: string | null;
  cancelled_at: string | null;
  payment_products?: {
    product_name: string;
    product_type: string;
    credits_amount: number;
  } | null;
};

export const useSubscriptionStatus = () => {
  const { userProfile } = useUserProfile();

  return useQuery({
    queryKey: ['subscription_status', userProfile?.user_id],
    queryFn: async () => {
      if (!userProfile?.user_id) {
        return [];
      }

      const { data, error } = await supabase
        .from('subscription_tracking')
        .select(`
          *,
          payment_products (
            product_name,
            product_type,
            credits_amount
          )
        `)
        .eq('user_id', userProfile.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscription status:', error);
        throw error;
      }

      // Transform the data to match our expected type
      return (data || []).map(record => ({
        ...record,
        payment_products: record.payment_products && !('error' in record.payment_products) 
          ? record.payment_products 
          : null
      })) as SubscriptionStatus[];
    },
    enabled: !!userProfile?.user_id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
