import { useState, useEffect } from 'react';
import { useUserCredits } from './useUserCredits';
import { logger } from '@/utils/logger';
import { safeLocalStorage } from '@/utils/safeStorage';

interface CachedCreditsData {
  current_balance: number;
  subscription_plan: string;
  free_credits: number;
  paid_credits: number;
  next_reset_date: string;
  timestamp: number;
}

const CACHE_KEY = 'aspirely_user_credits_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCachedUserCredits = () => {
  const { data: freshData, isLoading, error, ...rest } = useUserCredits();
  const [cachedData, setCachedData] = useState<CachedCreditsData | null>(null);
  const [displayData, setDisplayData] = useState<any>({
    current_balance: 30,
    subscription_plan: 'free',
    free_credits: 30,
    paid_credits: 0,
    next_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Load cached data immediately on mount using safe storage
  useEffect(() => {
    try {
      const cached = safeLocalStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setCachedData(parsedCache);
          const cachedDisplayData = {
            current_balance: parsedCache.current_balance,
            subscription_plan: parsedCache.subscription_plan,
            free_credits: parsedCache.free_credits,
            paid_credits: parsedCache.paid_credits,
            next_reset_date: parsedCache.next_reset_date
          };
          setDisplayData(cachedDisplayData);
        } else {
          // Remove expired cache
          safeLocalStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached credits data:', error);
      safeLocalStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Update cache and display data when fresh data arrives using safe storage
  useEffect(() => {
    if (freshData) {
      const cacheData: CachedCreditsData = {
        current_balance: freshData.current_balance,
        subscription_plan: freshData.subscription_plan,
        free_credits: freshData.free_credits,
        paid_credits: freshData.paid_credits,
        next_reset_date: freshData.next_reset_date,
        timestamp: Date.now()
      };

      try {
        safeLocalStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setCachedData(cacheData);
        setDisplayData(freshData);
      } catch (error) {
        logger.warn('Failed to cache credits data:', error);
        setDisplayData(freshData);
      }
    }
  }, [freshData]);

  // Determine if we're showing cached data
  const isShowingCachedData = !freshData && !!cachedData;

  return {
    data: displayData,
    isLoading: isLoading && !cachedData, // Don't show loading if we have cached data
    error,
    isShowingCachedData,
    ...rest
  };
};