
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PaymentProduct = {
  id: string;
  product_id: string;
  product_name: string;
  product_type: 'subscription' | 'credit_pack';
  credits_amount: number;
  price_amount: number;
  currency: string;
  billing_cycle: string;
  description: string;
  is_active: boolean;
};

export const usePaymentProducts = () => {
  return useQuery({
    queryKey: ['payment_products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_products')
        .select('*')
        .eq('is_active', true)
        .order('product_type', { ascending: true });

      if (error) {
        console.error('Error fetching payment products:', error);
        throw error;
      }

      return data as PaymentProduct[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
