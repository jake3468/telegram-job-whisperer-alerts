import { useState, useEffect } from 'react';

// TypeScript types
export interface PricingData {
  currency: string;
  currencySymbol: string;
  plans: {
    basic: {
      monthly: { price: number; credits: number };
      sixMonth: { price: number; credits: number; savings: number };
      yearly: { price: number; credits: number; savings: number };
    };
    pro: {
      monthly: { price: number; credits: number };
      sixMonth: { price: number; credits: number; savings: number };
      yearly: { price: number; credits: number; savings: number };
    };
    premium: {
      monthly: { price: number; credits: number };
      sixMonth: { price: number; credits: number; savings: number };
      yearly: { price: number; credits: number; savings: number };
    };
  };
  credits: {
    pack50: { price: number; credits: number };
    pack100: { price: number; credits: number };
    pack250: { price: number; credits: number };
  };
}

// Pricing data configurations
const getIndianPricing = (): PricingData => ({
  currency: 'INR',
  currencySymbol: '₹',
  plans: {
    basic: {
      monthly: { price: 299, credits: 100 },
      sixMonth: { price: 1499, credits: 600, savings: 295 },
      yearly: { price: 2399, credits: 1200, savings: 1189 }
    },
    pro: {
      monthly: { price: 499, credits: 200 },
      sixMonth: { price: 2499, credits: 1200, savings: 495 },
      yearly: { price: 3999, credits: 2400, savings: 1981 }
    },
    premium: {
      monthly: { price: 799, credits: 350 },
      sixMonth: { price: 3999, credits: 2100, savings: 795 },
      yearly: { price: 6399, credits: 4200, savings: 3181 }
    }
  },
  credits: {
    pack50: { price: 199, credits: 50 },
    pack100: { price: 349, credits: 100 },
    pack250: { price: 799, credits: 250 }
  }
});

const getGlobalPricing = (): PricingData => ({
  currency: 'USD',
  currencySymbol: '$',
  plans: {
    basic: {
      monthly: { price: 9, credits: 100 },
      sixMonth: { price: 45, credits: 600, savings: 9 },
      yearly: { price: 72, credits: 1200, savings: 36 }
    },
    pro: {
      monthly: { price: 15, credits: 200 },
      sixMonth: { price: 75, credits: 1200, savings: 15 },
      yearly: { price: 120, credits: 2400, savings: 60 }
    },
    premium: {
      monthly: { price: 24, credits: 350 },
      sixMonth: { price: 120, credits: 2100, savings: 24 },
      yearly: { price: 192, credits: 4200, savings: 96 }
    }
  },
  credits: {
    pack50: { price: 6, credits: 50 },
    pack100: { price: 10, credits: 100 },
    pack250: { price: 24, credits: 250 }
  }
});

// Logger for debugging (simplified)
const logger = {
  debug: (message: string, data?: any) => console.info(`[DEBUG] ${message}`, data || ''),
  info: (message: string, data?: any) => console.info(`[INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || '')
};

export const useLocationPricing = () => {
  const [pricingData, setPricingData] = useState(() => {
    // Check for cached pricing first
    try {
      const cached = sessionStorage.getItem('pricing_data');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Failed to parse cached pricing data');
    }
    return getGlobalPricing(); // Safe default
  });
  
  const [userCountry, setUserCountry] = useState<string | null>(() => {
    // Check for cached country first
    try {
      const cached = sessionStorage.getItem('user_location');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Failed to parse cached location data');
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(() => {
    // If we have cached data, we're not loading
    return !userCountry;
  });

  useEffect(() => {
    // Skip if we already have cached location data
    if (userCountry) {
      logger.info('Using cached location data:', userCountry);
      return;
    }

    let isDetecting = false;
    
    const detectLocation = async () => {
      if (isDetecting) return;
      isDetecting = true;
      
      try {
        logger.debug('Starting location detection...');
        
        // Single optimized location detection with shorter timeout
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
        logger.debug('Location service response received');
        
        if (locationData.error) {
          throw new Error(`Location service error: ${locationData.reason}`);
        }
        
        // Process the location data
        if (locationData?.country_code) {
          const countryCode = locationData.country_code.toLowerCase();
          setUserCountry(countryCode);
          
          // Cache the result for future use
          sessionStorage.setItem('user_location', JSON.stringify(countryCode));
          
          logger.info('Location detected successfully:', countryCode);
          
          let newPricingData;
          if (countryCode === 'in') {
            logger.info('Setting Indian pricing for country:', countryCode);
            newPricingData = getIndianPricing();
          } else {
            logger.debug('Setting international pricing for country:', countryCode);
            newPricingData = getGlobalPricing();
          }
          
          setPricingData(newPricingData);
          // Cache pricing data as well
          sessionStorage.setItem('pricing_data', JSON.stringify(newPricingData));
          
        } else {
          logger.warn('No valid country code detected, using default USD pricing');
          const defaultPricing = getGlobalPricing();
          setPricingData(defaultPricing);
          sessionStorage.setItem('pricing_data', JSON.stringify(defaultPricing));
        }
        
      } catch (error) {
        logger.error('Location detection failed, using default USD pricing:', error);
        const defaultPricing = getGlobalPricing();
        setPricingData(defaultPricing);
        sessionStorage.setItem('pricing_data', JSON.stringify(defaultPricing));
      } finally {
        setIsLoading(false);
        isDetecting = false;
      }
    };

    detectLocation();
  }, [userCountry]); // Add userCountry as dependency

  return {
    pricingData,
    userCountry,
    isLoading
  };
};