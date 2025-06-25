
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

export type PaymentRecord = {
  id: string;
  webhook_id: string;
  event_type: string;
  payment_id: string | null;
  subscription_id: string | null;
  customer_email: string;
  product_id: string;
  quantity: number;
  amount: number | null;
  currency: string | null;
  status: string;
  credits_awarded: number;
  created_at: string;
  payment_products?: {
    product_name: string;
    product_type: string;
  } | null;
};

export const usePaymentHistory = () => {
  const { userProfile } = useUserProfile();

  return useQuery({
    queryKey: ['payment_history', userProfile?.user_id],
    queryFn: async () => {
      if (!userProfile?.user_id) {
        return [];
      }

      const { data, error } = await supabase
        .from('payment_records')
        .select(`
          *,
          payment_products (
            product_name,
            product_type
          )
        `)
        .eq('user_id', userProfile.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment history:', error);
        throw error;
      }

      // Transform the data to match our expected type
      return (data || []).map(record => ({
        ...record,
        payment_products: record.payment_products && !('error' in record.payment_products) 
          ? record.payment_products 
          : null
      })) as PaymentRecord[];
    },
    enabled: !!userProfile?.user_id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
