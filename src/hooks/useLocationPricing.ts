
import { useState, useEffect } from 'react';

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
        console.log('Starting location detection...');
        
        // Primary IP detection service
        let locationData = null;
        
        try {
          const response = await fetch('https://ipapi.co/json/');
          locationData = await response.json();
          console.log('Primary location service response:', locationData);
        } catch (error) {
          console.log('Primary location service failed, trying fallback...');
          
          // Fallback to alternative service
          try {
            const fallbackResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await fallbackResponse.json();
            console.log('Fallback IP detected:', ipData.ip);
            
            // Use a basic geolocation service
            const geoResponse = await fetch(`https://ipwhois.app/json/${ipData.ip}`);
            const geoData = await geoResponse.json();
            locationData = { country_code: geoData.country_code };
            console.log('Fallback location data:', locationData);
          } catch (fallbackError) {
            console.log('All location services failed:', fallbackError);
          }
        }
        
        if (locationData?.country_code) {
          setUserCountry(locationData.country_code);
          console.log('Final detected country:', locationData.country_code);
          
          // Set pricing based on detected location (IP-based only)
          if (locationData.country_code === 'IN') {
            console.log('Setting Indian pricing...');
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
            console.log('Setting international pricing...');
            // Keep default USD pricing for non-Indian users
          }
        } else {
          console.log('No valid country code detected, using default USD pricing');
        }
        
      } catch (error) {
        console.log('Location detection completely failed, using default USD pricing:', error);
        // Keep default USD pricing on any error
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
