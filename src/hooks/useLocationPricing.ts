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
  const [pricingData, setPricingData] = useState<PricingData>({
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
  
  const [isLoading, setIsLoading] = useState(true);
  const [userCountry, setUserCountry] = useState<string>('');

  useEffect(() => {
    const detectLocation = async () => {
      try {
        logger.debug('Starting location detection...');
        
        // Primary IP detection service with better error handling
        let locationData = null;
        
        try {
          logger.debug('Trying primary location service...');
          const response = await fetch('https://ipapi.co/json/', {
            timeout: 5000 // 5 second timeout
          });
          
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
            const fallbackResponse = await fetch('https://api.ipify.org?format=json', {
              timeout: 5000
            });
            
            if (!fallbackResponse.ok) {
              throw new Error(`HTTP ${fallbackResponse.status}`);
            }
            
            const ipData = await fallbackResponse.json();
            logger.debug('Fallback IP detected:', ipData);
            
            // Use ipwhois for geolocation
            const geoResponse = await fetch(`https://ipwhois.app/json/${ipData.ip}`, {
              timeout: 5000
            });
            
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
              const finalResponse = await fetch('https://httpbin.org/ip', {
                timeout: 3000
              });
              
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
            setPricingData({
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
          } else {
            logger.debug('Setting international pricing for country:', countryCode);
            // Keep default USD pricing for non-Indian users
            setPricingData({
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
          }
        } else {
          logger.warn('No valid country code detected, using default USD pricing');
          // Explicitly set default USD pricing
          setPricingData({
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
        }
        
      } catch (error) {
        logger.error('Location detection completely failed, using default USD pricing:', error);
        // Explicitly set default USD pricing on any error
        setPricingData({
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
