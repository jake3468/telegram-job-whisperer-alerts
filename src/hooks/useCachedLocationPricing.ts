import { useState, useEffect } from 'react';
import { useLocationPricing, PricingData } from './useLocationPricing';
import { logger } from '@/utils/logger';

interface CachedPricingData extends PricingData {
  timestamp: number;
}

const CACHE_KEY = 'aspirely_pricing_cache';
const LOCATION_CACHE_KEY = 'aspirely_user_location_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const LOCATION_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export const useCachedLocationPricing = () => {
  const { pricingData: freshData, isLoading, userCountry } = useLocationPricing();
  const [cachedData, setCachedData] = useState<CachedPricingData | null>(null);
  const [displayData, setDisplayData] = useState<PricingData | null>(null);
  const [cachedLocation, setCachedLocation] = useState<string | null>(null);

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const locationCache = localStorage.getItem(LOCATION_CACHE_KEY);
      let defaultRegion = 'global';
      
      // Try to get cached location first
      if (locationCache) {
        try {
          const parsedLocationCache = JSON.parse(locationCache);
          const now = Date.now();
          
          if (now - parsedLocationCache.timestamp < LOCATION_CACHE_DURATION) {
            setCachedLocation(parsedLocationCache.country);
            defaultRegion = parsedLocationCache.country === 'IN' ? 'IN' : 'global';
            logger.debug('Using cached location for default pricing:', parsedLocationCache.country);
          } else {
            localStorage.removeItem(LOCATION_CACHE_KEY);
          }
        } catch (error) {
          logger.warn('Failed to parse location cache:', error);
          localStorage.removeItem(LOCATION_CACHE_KEY);
        }
      }
      
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setCachedData(parsedCache);
          const { timestamp, ...pricingData } = parsedCache;
          setDisplayData(pricingData);
          logger.debug('Loaded cached pricing data:', pricingData);
          return; // Exit early to prevent setting default pricing
        } else {
          // Remove expired cache and set default pricing based on cached location
          localStorage.removeItem(CACHE_KEY);
        }
      }
      
      // Only set default pricing if no valid cache exists and no location cache either
      if (!locationCache) {
        const defaultPricing = getDefaultPricing(defaultRegion);
        setDisplayData(defaultPricing);
        logger.debug('Set default pricing based on region (no cache):', defaultRegion);
      }
      
    } catch (error) {
      logger.warn('Failed to load cached pricing data:', error);
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(LOCATION_CACHE_KEY);
      // Set global default pricing on error
      setDisplayData(getDefaultPricing('global'));
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
        
        // Only update display data if region changed or we don't have display data
        if (!displayData || displayData.region !== freshData.region) {
          setDisplayData(freshData);
          logger.debug('Updated display data with fresh pricing (region changed):', freshData);
        } else {
          logger.debug('Skipping display update - same region. Cached fresh data:', cacheData);
        }
      } catch (error) {
        logger.warn('Failed to cache pricing data:', error);
        // Only update display on cache failure if region is different
        if (!displayData || displayData.region !== freshData.region) {
          setDisplayData(freshData);
        }
      }
    }
  }, [freshData, isLoading, displayData]);

  // Cache user location when detected
  useEffect(() => {
    if (userCountry && userCountry !== cachedLocation) {
      try {
        const locationCache = {
          country: userCountry,
          timestamp: Date.now()
        };
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locationCache));
        setCachedLocation(userCountry);
        logger.debug('Cached user location:', userCountry);
      } catch (error) {
        logger.warn('Failed to cache user location:', error);
      }
    }
  }, [userCountry, cachedLocation]);

  // Determine if we're showing cached data
  const isShowingCachedData = isLoading && !!cachedData;

  return {
    pricingData: displayData,
    isLoading: isLoading && !displayData, // Don't show loading if we have display data
    userCountry: freshData ? userCountry : cachedLocation,
    isShowingCachedData: isLoading && !!cachedData
  };
};

// Helper function to get default pricing based on region
const getDefaultPricing = (region: string): PricingData => {
  if (region === 'IN') {
    return {
      region: 'IN',
      currency: 'INR',
      currencySymbol: '₹',
      monthlyPrice: 499,
      subscriptionProductId: 'sub_premium_india',
      creditPacks: [
        { credits: 100, price: 99, productId: 'pack_100_india' },
        { credits: 250, price: 229, productId: 'pack_250_india' },
        { credits: 500, price: 429, productId: 'pack_500_india' }
      ]
    };
  }
  
  return {
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
  };
};