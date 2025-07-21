import { useState, useEffect } from 'react';
import { useLocationPricing, PricingData } from './useLocationPricing';

interface CachedPricingData extends PricingData {
  timestamp: number;
}

const CACHE_KEY = 'aspirely_pricing_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useCachedLocationPricing = () => {
  const { pricingData: freshData, isLoading, userCountry } = useLocationPricing();
  const [displayData, setDisplayData] = useState<PricingData | null>(() => {
    // Try to load cached data immediately
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();
        
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          const { timestamp, ...pricingData } = parsedCache;
          return pricingData;
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  });

  // Update cache and display data when fresh data arrives
  useEffect(() => {
    if (freshData && !isLoading) {
      const cacheData: CachedPricingData = {
        ...freshData,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setDisplayData(freshData);
      } catch (error) {
        console.warn('Failed to cache pricing data:', error);
        setDisplayData(freshData);
      }
    }
  }, [freshData, isLoading]);

  return {
    pricingData: displayData || freshData,
    isLoading: isLoading && !displayData,
    userCountry,
    isShowingCachedData: isLoading && !!displayData
  };
};