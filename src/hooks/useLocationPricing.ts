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
    monthlyPrice: 4.99,
    creditPacks: [
      { credits: 50, price: 2.49, productId: 'pdt_global_50_credits' },
      { credits: 100, price: 4.49, productId: 'pdt_global_100_credits' },
      { credits: 200, price: 7.99, productId: 'pdt_global_200_credits' },
      { credits: 500, price: 17.99, productId: 'pdt_global_500_credits' }
    ],
    subscriptionProductId: 'pdt_global_monthly_subscription'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [userCountry, setUserCountry] = useState<string>('');

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Try to get location from IP
        const response = await fetch('https://ipapi.co/json/');
        const locationData = await response.json();
        
        console.log('Location detected:', locationData.country_code);
        setUserCountry(locationData.country_code || '');
        
        // Check if user is from India
        if (locationData.country_code === 'IN') {
          setPricingData({
            region: 'IN',
            currency: 'INR',
            currencySymbol: '₹',
            monthlyPrice: 199,
            creditPacks: [
              { credits: 50, price: 99, productId: 'pdt_indian_50_credits' },
              { credits: 100, price: 189, productId: 'pdt_indian_100_credits' },
              { credits: 200, price: 349, productId: 'pdt_indian_200_credits' },
              { credits: 500, price: 799, productId: 'pdt_indian_500_credits' }
            ],
            subscriptionProductId: 'pdt_indian_monthly_subscription'
          });
        }
      } catch (error) {
        console.log('Location detection failed, using default USD pricing:', error);
        // Keep default USD pricing
      } finally {
        setIsLoading(false);
      }
    };

    detectLocation();
  }, []);

  const switchToPricing = (region: 'IN' | 'global') => {
    if (region === 'IN') {
      setPricingData({
        region: 'IN',
        currency: 'INR',
        currencySymbol: '₹',
        monthlyPrice: 199,
        creditPacks: [
          { credits: 50, price: 99, productId: 'pdt_indian_50_credits' },
          { credits: 100, price: 189, productId: 'pdt_indian_100_credits' },
          { credits: 200, price: 349, productId: 'pdt_indian_200_credits' },
          { credits: 500, price: 799, productId: 'pdt_indian_500_credits' }
        ],
        subscriptionProductId: 'pdt_indian_monthly_subscription'
      });
    } else {
      setPricingData({
        region: 'global',
        currency: 'USD',
        currencySymbol: '$',
        monthlyPrice: 4.99,
        creditPacks: [
          { credits: 50, price: 2.49, productId: 'pdt_global_50_credits' },
          { credits: 100, price: 4.49, productId: 'pdt_global_100_credits' },
          { credits: 200, price: 7.99, productId: 'pdt_global_200_credits' },
          { credits: 500, price: 17.99, productId: 'pdt_global_500_credits' }
        ],
        subscriptionProductId: 'pdt_global_monthly_subscription'
      });
    }
  };

  return {
    pricingData,
    isLoading,
    userCountry,
    switchToPricing
  };
};
