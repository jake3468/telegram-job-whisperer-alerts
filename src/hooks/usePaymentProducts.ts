
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocationPricing } from './useLocationPricing';

export interface PaymentProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_type: 'subscription' | 'credit_pack';
  credits_amount: number;
  price_amount: number;
  currency: string;
  currency_code: string;
  region: string;
  is_default_region: boolean;
  description: string;
  is_active: boolean;
}

export const usePaymentProducts = () => {
  const [products, setProducts] = useState<PaymentProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pricingData } = useLocationPricing();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('payment_products')
          .select('*')
          .eq('is_active', true)
          .or(`region.eq.${pricingData.region},region.eq.global`)
          .order('price_amount', { ascending: true });

        if (error) {
          console.error('Error fetching payment products:', error);
          setError(error.message);
          return;
        }

        setProducts(data || []);
      } catch (err) {
        console.error('Exception fetching payment products:', err);
        setError('Failed to fetch payment products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [pricingData.region]);

  const getSubscriptionProducts = () => products.filter(p => p.product_type === 'subscription');
  const getCreditPackProducts = () => products.filter(p => p.product_type === 'credit_pack' && p.product_id !== 'initial_free_credits');

  return {
    products,
    subscriptionProducts: getSubscriptionProducts(),
    creditPackProducts: getCreditPackProducts(),
    isLoading,
    error
  };
};
