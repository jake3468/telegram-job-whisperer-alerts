
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocationPricing } from './useLocationPricing';
import { logger } from '@/utils/logger';

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

        // Validate we have the required data
        if (!pricingData?.region || !pricingData?.currency) {
          setIsLoading(false);
          return;
        }

        // Query products for the specific region and currency_code
        const { data, error } = await supabase
          .from('payment_products')
          .select('*')
          .eq('is_active', true)
          .eq('region', pricingData.region)
          .eq('currency_code', pricingData.currency)
          .order('price_amount', { ascending: true });

        if (error) {
          logger.error('Error fetching payment products:', error);
          setError(error.message);
          return;
        }

        if (!data || data.length === 0) {
          setProducts([]);
          setIsLoading(false);
          return;
        }

        // Filter and type-cast the products to ensure they match our interface
        const validProducts = (data || [])
          .filter(product => {
            return product.product_type === 'subscription' || product.product_type === 'credit_pack';
          })
          .map(product => ({
            id: product.id,
            product_id: product.product_id,
            product_name: product.product_name,
            product_type: product.product_type as 'subscription' | 'credit_pack',
            credits_amount: product.credits_amount,
            price_amount: product.price_amount,
            currency: product.currency,
            currency_code: product.currency_code,
            region: product.region,
            is_default_region: product.is_default_region,
            is_active: product.is_active
          }));
        
        setProducts(validProducts);
      } catch (err) {
        logger.error('Exception fetching payment products:', err);
        setError('Failed to fetch payment products');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch when we have a region and currency
    if (pricingData?.region && pricingData?.currency) {
      fetchProducts();
    }
  }, [pricingData?.region, pricingData?.currency]);

  const getSubscriptionProducts = () => products.filter(p => p.product_type === 'subscription');
  const getCreditPackProducts = () => products.filter(p => 
    p.product_type === 'credit_pack' && 
    p.product_id !== 'initial_free_credits' &&
    !p.product_name.toLowerCase().includes('ai mock interview') &&
    p.credits_amount > 10 // Exclude small credit amounts (1, 3, 5) that are for AI interviews
  );
  const getAIInterviewProducts = () => products.filter(p => 
    p.product_type === 'credit_pack' && 
    (p.product_name.toLowerCase().includes('ai mock interview') || p.credits_amount <= 10)
  );

  return {
    products,
    subscriptionProducts: getSubscriptionProducts(),
    creditPackProducts: getCreditPackProducts(),
    aiInterviewProducts: getAIInterviewProducts(),
    isLoading,
    error
  };
};
