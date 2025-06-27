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
        logger.debug('Fetching products for region and currency');
        
        // Query products for the specific region and currency
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

        logger.debug('Payment products fetched successfully');

        // Filter and type-cast the products to ensure they match our interface
        const validProducts = (data || [])
          .filter(product => 
            product.product_type === 'subscription' || 
            product.product_type === 'credit_pack'
          )
          .filter(product => 
            // Ensure currency matches the detected pricing data
            product.currency_code === pricingData.currency
          )
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
            description: product.description,
            is_active: product.is_active
          }));

        logger.info(`Processed ${validProducts.length} payment products for region: ${pricingData.region}, currency: ${pricingData.currency}`);
        setProducts(validProducts);
      } catch (err) {
        logger.error('Exception fetching payment products:', err);
        setError('Failed to fetch payment products');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch when we have a region and currency
    if (pricingData.region && pricingData.currency) {
      fetchProducts();
    }
  }, [pricingData.region, pricingData.currency]);

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
