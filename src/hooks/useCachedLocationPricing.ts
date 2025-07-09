import { useState, useEffect } from 'react';
import { useLocationPricing, PricingData } from './useLocationPricing';
import { logger } from '@/utils/logger';

interface CachedPricingData extends PricingData {
  timestamp: number;
}

const CACHE_KEY = 'aspirely_pricing_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useCachedLocationPricing = () => {
  const { pricingData: freshData, isLoading, userCountry } = useLocationPricing();
  const [cachedData, setCachedData] = useState<CachedPricingData | null>(null);
  const [displayData, setDisplayData] = useState<PricingData | null>(null);

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setCachedData(parsedCache);
          const { timestamp, ...pricingData } = parsedCache;
          setDisplayData(pricingData);
          logger.debug('Loaded cached pricing data:', pricingData);
        } else {
          // Remove expired cache and set default pricing
          localStorage.removeItem(CACHE_KEY);
          setDisplayData({
            region: 'global',
            currency: 'USD',
            currencySymbol: '$',
            monthlyPrice: 15,
            subscriptionProductId: 'sub_premium_global',
            creditPacks: [
              { credits: 100, price: 15, productId: 'pack_100_global' },
              { credits: 250, price: 35, productId: 'pack_250_global' },
              { credits: 500, price: 65, productId: 'pack_500_global' }
            ]
          });
        }
      } else {
        // Set default pricing when no cache exists
        setDisplayData({
          region: 'global',
          currency: 'USD',
          currencySymbol: '$',
          monthlyPrice: 15,
          subscriptionProductId: 'sub_premium_global',
          creditPacks: [
            { credits: 100, price: 15, productId: 'pack_100_global' },
            { credits: 250, price: 35, productId: 'pack_250_global' },
            { credits: 500, price: 65, productId: 'pack_500_global' }
          ]
        });
      }
    } catch (error) {
      logger.warn('Failed to load cached pricing data:', error);
      localStorage.removeItem(CACHE_KEY);
      // Set default pricing on error
      setDisplayData({
        region: 'global',
        currency: 'USD',
        currencySymbol: '$',
        monthlyPrice: 15,
        subscriptionProductId: 'sub_premium_global',
        creditPacks: [
          { credits: 100, price: 15, productId: 'pack_100_global' },
          { credits: 250, price: 35, productId: 'pack_250_global' },
          { credits: 500, price: 65, productId: 'pack_500_global' }
        ]
      });
    }
  }, []);

  // Update cache and display data when fresh data arrives
  useEffect(() => {
    if (freshData && !isLoading) {
      const cacheData: CachedPricingData = {
        ...freshData,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setCachedData(cacheData);
        setDisplayData(freshData);
        logger.debug('Cached fresh pricing data:', cacheData);
      } catch (error) {
        logger.warn('Failed to cache pricing data:', error);
        setDisplayData(freshData);
      }
    }
  }, [freshData, isLoading]);

  // Determine if we're showing cached data
  const isShowingCachedData = isLoading && !!cachedData;

  return {
    pricingData: displayData,
    isLoading: isLoading && !cachedData, // Don't show loading if we have cached data
    userCountry,
    isShowingCachedData
  };
};