
import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

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

export const useLocationPricing = () => {
  // Initialize with null to prevent showing default data before cache check
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userCountry, setUserCountry] = useState<string>('');

  // Check for cached location first to initialize with appropriate defaults
  const getInitialDefaults = () => {
    try {
      const locationCache = localStorage.getItem('aspirely_user_location_cache');
      if (locationCache) {
        const parsedLocationCache = JSON.parse(locationCache);
        const now = Date.now();
        const LOCATION_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (now - parsedLocationCache.timestamp < LOCATION_CACHE_DURATION) {
          const isIndian = parsedLocationCache.country === 'IN';
          return isIndian ? getIndianPricing() : getGlobalPricing();
        }
      }
    } catch (error) {
      logger.warn('Failed to check cached location for defaults:', error);
    }
    return getGlobalPricing(); // Safe default
  };

  // Don't initialize with defaults if we have cached data - let cached hook handle it
  // This prevents USD default from flashing when Indian cache exists

  useEffect(() => {
    const detectLocation = async () => {
      try {
        logger.debug('Starting location detection...');
        
        // Primary IP detection service with better error handling
        let locationData = null;
        
        try {
          logger.debug('Trying primary location service...');
          
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch('https://ipapi.co/json/', {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          locationData = await response.json();
          logger.debug('Primary location service response:', locationData);
          
          // Check if the response contains error
          if (locationData.error) {
            throw new Error(`Location service error: ${locationData.reason}`);
          }
          
        } catch (error) {
          logger.warn('Primary location service failed:', error);
          
          // Fallback to alternative service with better error handling
          try {
            logger.debug('Trying fallback location service...');
            
            const controller2 = new AbortController();
            const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
            
            const fallbackResponse = await fetch('https://api.ipify.org?format=json', {
              signal: controller2.signal
            });
            
            clearTimeout(timeoutId2);
            
            if (!fallbackResponse.ok) {
              throw new Error(`HTTP ${fallbackResponse.status}`);
            }
            
            const ipData = await fallbackResponse.json();
            logger.debug('Fallback IP detected:', ipData);
            
            // Use ipwhois for geolocation
            const controller3 = new AbortController();
            const timeoutId3 = setTimeout(() => controller3.abort(), 5000);
            
            const geoResponse = await fetch(`https://ipwhois.app/json/${ipData.ip}`, {
              signal: controller3.signal
            });
            
            clearTimeout(timeoutId3);
            
            if (!geoResponse.ok) {
              throw new Error(`HTTP ${geoResponse.status}`);
            }
            
            const geoData = await geoResponse.json();
            locationData = { country_code: geoData.country_code };
            logger.debug('Fallback location data obtained:', locationData);
            
          } catch (fallbackError) {
            logger.warn('Fallback location service also failed:', fallbackError);
            
            // Try one more service as last resort
            try {
              logger.debug('Trying final fallback service...');
              
              const controller4 = new AbortController();
              const timeoutId4 = setTimeout(() => controller4.abort(), 3000);
              
              const finalResponse = await fetch('https://httpbin.org/ip', {
                signal: controller4.signal
              });
              
              clearTimeout(timeoutId4);
              
              if (finalResponse.ok) {
                // This won't give us country, but at least we tried
                logger.debug('Final service responded, but no country detection available');
              }
            } catch (finalError) {
              logger.warn('All location services failed');
            }
          }
        }
        
        // Process the location data
        if (locationData?.country_code) {
          const countryCode = locationData.country_code.toLowerCase();
          setUserCountry(countryCode);
          logger.info('Location detected successfully:', countryCode);
          
          // Set pricing based on detected location (case-insensitive comparison)
          if (countryCode === 'in' || countryCode === 'india') {
            logger.info('Setting Indian pricing for country:', countryCode);
            setPricingData(getIndianPricing());
          } else {
            logger.debug('Setting international pricing for country:', countryCode);
            setPricingData(getGlobalPricing());
          }
        } else {
          logger.warn('No valid country code detected, using default USD pricing');
          setPricingData(getGlobalPricing());
        }
        
      } catch (error) {
        logger.error('Location detection completely failed, using default USD pricing:', error);
        setPricingData(getGlobalPricing());
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, []);

  return {
    pricingData,
    isLoading,
    userCountry
  };
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
