import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { logger } from '@/utils/logger';
import { safeLocalStorage } from '@/utils/safeStorage';

interface CoverLetterData {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  cover_letter: string | null;
  created_at: string;
  updated_at: string;
}

interface CachedCoverLetterData {
  data: CoverLetterData[];
  timestamp: number;
}

const CACHE_KEY = 'aspirely_cover_letters_cache';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

export const useCachedCoverLetters = () => {
  const { userProfile } = useUserProfile();
  const [cachedData, setCachedData] = useState<CoverLetterData[]>([]);
  const [isShowingCachedData, setIsShowingCachedData] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = safeLocalStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedCoverLetterData = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setCachedData(parsedCache.data);
          setIsShowingCachedData(true);
        } else {
          // Remove expired cache
          safeLocalStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached cover letters data:', error);
      safeLocalStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Fetch fresh data with React Query
  const {
    data: freshData,
    isLoading: isFreshLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['cover-letters-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      try {
        const { data, error } = await supabase
          .from('job_cover_letters')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching cover letters history:', error);
          return [];
        }

        return data as CoverLetterData[];
      } catch (err) {
        console.error('Exception fetching cover letters history:', err);
        return [];
      }
    },
    enabled: !!userProfile?.id,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: CACHE_DURATION, // Keep in cache for 2 hours
  });

  // Connection issue handling
  useEffect(() => {
    setConnectionIssue(!!error && cachedData.length > 0);
  }, [error, cachedData.length]);

  // Update cache when fresh data arrives
  useEffect(() => {
    if (freshData && !isFreshLoading) {
      const cacheData: CachedCoverLetterData = {
        data: freshData,
        timestamp: Date.now()
      };

      try {
        safeLocalStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setCachedData(freshData);
        setIsShowingCachedData(false);
      } catch (error) {
        logger.warn('Failed to cache cover letters data:', error);
        // Still update state even if caching fails
        setCachedData(freshData);
        setIsShowingCachedData(false);
      }
    }
  }, [freshData, isFreshLoading]);

  // Return cached data immediately, fresh data loads in background
  const data = freshData || cachedData;
  const isLoading = isFreshLoading && !cachedData.length;

  return {
    data,
    isLoading,
    isShowingCachedData: isShowingCachedData && !freshData,
    connectionIssue,
    error,
    refetch,
    hasCache: cachedData.length > 0
  };
};