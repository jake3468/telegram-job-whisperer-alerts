
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
        console.log('🔍 Fetching products for:', { 
          region: pricingData.region, 
          currency: pricingData.currency 
        });
        
        // Query products for the specific region and currency_code
        const { data, error } = await supabase
          .from('payment_products')
          .select('*')
          .eq('is_active', true)
          .eq('region', pricingData.region)
          .eq('currency_code', pricingData.currency)
          .order('price_amount', { ascending: true });

        if (error) {
          console.error('❌ Error fetching payment products:', error);
          setError(error.message);
          return;
        }

        console.log('📦 Raw products from database:', data);
        console.log('📊 Total products found:', data?.length || 0);

        // Filter and type-cast the products to ensure they match our interface
        const validProducts = (data || [])
          .filter(product => {
            const isValidType = product.product_type === 'subscription' || product.product_type === 'credit_pack';
            console.log(`🔍 Product ${product.product_name}: type=${product.product_type}, valid=${isValidType}`);
            return isValidType;
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

        console.log('✅ Final processed products:', validProducts);
        console.log('📈 Credit packs found:', validProducts.filter(p => p.product_type === 'credit_pack'));
        
        setProducts(validProducts);
      } catch (err) {
        console.error('💥 Exception fetching payment products:', err);
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
