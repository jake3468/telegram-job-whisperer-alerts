
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
        
        // Primary IP detection service
        let locationData = null;
        
        try {
          const response = await fetch('https://ipapi.co/json/');
          locationData = await response.json();
          logger.debug('Location service response received');
        } catch (error) {
          logger.info('Primary location service failed, trying fallback...');
          
          // Fallback to alternative service
          try {
            const fallbackResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await fallbackResponse.json();
            logger.debug('Fallback IP detected');
            
            // Use a basic geolocation service
            const geoResponse = await fetch(`https://ipwhois.app/json/${ipData.ip}`);
            const geoData = await geoResponse.json();
            locationData = { country_code: geoData.country_code };
            logger.debug('Fallback location data obtained');
          } catch (fallbackError) {
            logger.warn('All location services failed');
          }
        }
        
        if (locationData?.country_code) {
          setUserCountry(locationData.country_code);
          logger.info('Location detected successfully');
          
          // Set pricing based on detected location (IP-based only)
          if (locationData.country_code === 'IN') {
            logger.info('Setting Indian pricing...');
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
            logger.debug('Setting international pricing');
            // Explicitly set USD pricing for non-Indian users
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
          logger.info('No valid country code detected, using default USD pricing');
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
