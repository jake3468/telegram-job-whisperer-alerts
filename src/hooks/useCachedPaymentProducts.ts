import { useState, useEffect, useMemo, useRef } from 'react';
import { usePaymentProducts, PaymentProduct } from './usePaymentProducts';
import { logger } from '@/utils/logger';

interface CachedProductsData {
  products: PaymentProduct[];
  creditPackProducts: PaymentProduct[];
  region: string;
  currency: string;
  timestamp: number;
}

const CACHE_KEY = 'aspirely_products_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useCachedPaymentProducts = (currentRegion?: string, currentCurrency?: string) => {
  const { products, creditPackProducts, isLoading, error } = usePaymentProducts();
  const [cachedData, setCachedData] = useState<CachedProductsData | null>(null);
  const [displayProducts, setDisplayProducts] = useState<PaymentProduct[]>([]);
  const [displayCreditPackProducts, setDisplayCreditPackProducts] = useState<PaymentProduct[]>([]);
  
  // Use ref to track if we've already processed this data combination
  const lastProcessedRef = useRef<string>('');

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old and matches current region/currency
        if (now - parsedCache.timestamp < CACHE_DURATION &&
            parsedCache.region === currentRegion &&
            parsedCache.currency === currentCurrency) {
          setCachedData(parsedCache);
          setDisplayProducts(parsedCache.products);
          setDisplayCreditPackProducts(parsedCache.creditPackProducts);
        } else {
          // Remove expired or mismatched cache
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached products data:', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, [currentRegion, currentCurrency]);

  // Create a stable identifier for the current data state
  const currentDataId = useMemo(() => {
    return `${currentRegion}_${currentCurrency}_${products.length}_${creditPackProducts.length}_${isLoading}`;
  }, [currentRegion, currentCurrency, products.length, creditPackProducts.length, isLoading]);

  // Update cache and display data when fresh data arrives
  useEffect(() => {
    // Prevent processing the same data combination multiple times
    if (lastProcessedRef.current === currentDataId) {
      return;
    }

    if (products.length > 0 && !isLoading && currentRegion && currentCurrency) {
      const cacheData: CachedProductsData = {
        products,
        creditPackProducts,
        region: currentRegion,
        currency: currentCurrency,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setCachedData(cacheData);
        setDisplayProducts(products);
        setDisplayCreditPackProducts(creditPackProducts);
        
        // Only log once when data actually changes
        const cacheKey = `${currentRegion}_${currentCurrency}_${products.length}`;
        const lastLoggedKey = sessionStorage.getItem('last_products_log');
        if (lastLoggedKey !== cacheKey) {
          sessionStorage.setItem('last_products_log', cacheKey);
        }
      } catch (error) {
        logger.warn('Failed to cache products data:', error);
        setDisplayProducts(products);
        setDisplayCreditPackProducts(creditPackProducts);
      }

      // Mark this data combination as processed
      lastProcessedRef.current = currentDataId;
    }
  }, [currentDataId, products, creditPackProducts, isLoading, currentRegion, currentCurrency]);

  // Determine if we're showing cached data
  const isShowingCachedData = isLoading && !!cachedData;

  return {
    products: displayProducts,
    creditPackProducts: displayCreditPackProducts,
    isLoading: isLoading && !cachedData, // Don't show loading if we have cached data
    error,
    isShowingCachedData
  };
};