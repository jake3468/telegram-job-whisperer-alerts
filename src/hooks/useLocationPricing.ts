
import { useState, useEffect } from 'react';
import { debugLogger } from '@/utils/debugUtils';

export interface PricingData {
  region: 'IN' | 'global';
  currency: 'INR' | 'USD';
  currencySymbol: '₹' | '$';
  monthlyPrice: number;
  creditPacks: Array<{
    credits: number;
    price: number;
    productId: string;
  }>;
  subscriptionProductId: string;
}

// Cache for location data to prevent repeated API calls
const LOCATION_CACHE_KEY = 'aspirely_location_pricing_cache';
const LOCATION_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
let locationDetectionPromise: Promise<PricingData> | null = null;

export const useLocationPricing = () => {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userCountry, setUserCountry] = useState<string>('');

  useEffect(() => {
    const detectLocationAndSetPricing = async () => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem(LOCATION_CACHE_KEY);
        if (cachedData) {
          try {
            const parsedCache = JSON.parse(cachedData);
            const now = Date.now();
            
            if (now - parsedCache.timestamp < LOCATION_CACHE_DURATION) {
              debugLogger.log('Using cached location pricing data');
              setPricingData(parsedCache.pricingData);
              setUserCountry(parsedCache.userCountry);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            debugLogger.warn('Failed to parse cached location data:', error);
            localStorage.removeItem(LOCATION_CACHE_KEY);
          }
        }

        // If already detecting location, wait for that promise
        if (locationDetectionPromise) {
          const result = await locationDetectionPromise;
          setPricingData(result);
          setIsLoading(false);
          return;
        }

        // Start location detection
        locationDetectionPromise = detectLocationWithFallback();
        const result = await locationDetectionPromise;
        
        setPricingData(result);
        setIsLoading(false);
        
        // Cache the result
        try {
          const cacheData = {
            pricingData: result,
            userCountry: result.region === 'IN' ? 'in' : 'global',
            timestamp: Date.now()
          };
          localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
          debugLogger.warn('Failed to cache location pricing data:', error);
        }
        
      } catch (error) {
        debugLogger.error('Error in location detection:', error);
        setPricingData(getGlobalPricing());
        setIsLoading(false);
      } finally {
        locationDetectionPromise = null;
      }
    };

    detectLocationAndSetPricing();
  }, []);

  return {
    pricingData,
    isLoading,
    userCountry
  };
};

const detectLocationWithFallback = async (): Promise<PricingData> => {
  try {
    debugLogger.log('Starting location detection...');
    
    // Try primary service with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const locationData = await response.json();
    
    if (locationData.error) {
      throw new Error(`Location service error: ${locationData.reason}`);
    }
    
    const countryCode = locationData.country_code?.toLowerCase();
    
    if (countryCode === 'in') {
      debugLogger.log('Setting Indian pricing for country:', countryCode);
      return getIndianPricing();
    } else {
      debugLogger.log('Setting international pricing for country:', countryCode);
      return getGlobalPricing();
    }
    
  } catch (error) {
    debugLogger.warn('Primary location service failed, using fallback:', error);
    
    try {
      // Simple fallback - check timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('Kolkata') || timezone.includes('Asia/Calcutta')) {
        debugLogger.log('Using timezone-based detection for India');
        return getIndianPricing();
      }
    } catch (timezoneError) {
      debugLogger.warn('Timezone detection failed:', timezoneError);
    }
    
    debugLogger.log('Using default global pricing');
    return getGlobalPricing();
  }
};

// Helper functions to avoid repetition
const getIndianPricing = (): PricingData => ({
  region: 'IN',
  currency: 'INR',
  currencySymbol: '₹',
  monthlyPrice: 499,
  creditPacks: [
    { credits: 30, price: 99, productId: 'pdt_indian_30_credits' },
    { credits: 80, price: 199, productId: 'pdt_indian_80_credits' },
    { credits: 200, price: 399, productId: 'pdt_indian_200_credits' },
    { credits: 500, price: 799, productId: 'pdt_indian_500_credits' }
  ],
  subscriptionProductId: 'pdt_indian_monthly_subscription'
});

const getGlobalPricing = (): PricingData => ({
  region: 'global',
  currency: 'USD',
  currencySymbol: '$',
  monthlyPrice: 9.99,
  creditPacks: [
    { credits: 30, price: 2.99, productId: 'pdt_global_30_credits' },
    { credits: 80, price: 4.99, productId: 'pdt_global_80_credits' },
    { credits: 200, price: 9.99, productId: 'pdt_global_200_credits' },
    { credits: 500, price: 19.99, productId: 'pdt_global_500_credits' }
  ],
  subscriptionProductId: 'pdt_global_monthly_subscription'
});
