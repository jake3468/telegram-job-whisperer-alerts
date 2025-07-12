import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocationPricing } from './useLocationPricing';
import { logger } from '@/utils/logger';

export interface AIInterviewProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  credits_amount: number;
  price_amount: number;
  currency: string;
  currency_code: string;
  region: string;
  is_active: boolean;
  discount?: number;
  originalPrice?: number;
  savings?: number;
}

export const useAIInterviewProducts = () => {
  const { pricingData } = useLocationPricing();
  const [products, setProducts] = useState<AIInterviewProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!pricingData?.region || !pricingData?.currency) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('payment_products')
        .select('*')
        .eq('is_active', true)
        .like('product_name', '%AI Mock Interview%')
        .or(`region.eq.${pricingData.region},region.eq.global`)
        .eq('currency_code', pricingData.currency)
        .order('credits_amount', { ascending: true });

      if (fetchError) {
        logger.error('Error fetching AI interview products:', fetchError);
        setError(fetchError.message);
        return;
      }

      setProducts(data || []);
    } catch (err) {
      logger.error('Unexpected error fetching AI interview products:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pricingData?.region && pricingData?.currency) {
      fetchProducts();
    }
  }, [pricingData?.region, pricingData?.currency]);

  // Calculate discount percentages
  const getProductsWithDiscounts = () => {
    if (products.length === 0) return [];

    const singleProduct = products.find(p => p.credits_amount === 1);
    if (!singleProduct) return products;

    const singlePrice = singleProduct.price_amount;
    
    return products.map(product => {
      const totalSinglePrice = singlePrice * product.credits_amount;
      const discount = totalSinglePrice > product.price_amount 
        ? Math.round(((totalSinglePrice - product.price_amount) / totalSinglePrice) * 100)
        : 0;

      return {
        ...product,
        discount,
        originalPrice: totalSinglePrice,
        savings: totalSinglePrice - product.price_amount
      };
    });
  };

  return {
    products: getProductsWithDiscounts(),
    isLoading,
    error,
    refetch: fetchProducts,
    currency: pricingData?.currency || 'USD',
    currencySymbol: pricingData?.currency === 'INR' ? '₹' : '$'
  };
};