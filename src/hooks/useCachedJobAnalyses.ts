import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { logger } from '@/utils/logger';

interface JobAnalysisData {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  job_match: string | null;
  match_score: string | null;
  created_at: string;
  updated_at: string;
}

interface CachedJobAnalysisData {
  data: JobAnalysisData[];
  timestamp: number;
}

const CACHE_KEY = 'aspirely_job_analyses_cache';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

export const useCachedJobAnalyses = () => {
  const { userProfile } = useUserProfile();
  const [cachedData, setCachedData] = useState<JobAnalysisData[]>([]);
  const [isShowingCachedData, setIsShowingCachedData] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedJobAnalysisData = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setCachedData(parsedCache.data);
          setIsShowingCachedData(true);
          logger.debug('Loaded cached job analyses data:', parsedCache.data.length, 'items');
        } else {
          // Remove expired cache
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached job analyses data:', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Fetch fresh data with React Query
  const {
    data: freshData,
    isLoading: isFreshLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['job-analyses-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      try {
        const { data, error } = await makeAuthenticatedRequest(async () => {
          return await supabase
            .from('job_analyses')
            .select('*')
            .eq('user_id', userProfile.id)
            .order('created_at', { ascending: false });
        }, { operationType: 'fetch job analyses' });

        if (error) {
          console.error('Error fetching job analyses history:', error);
          return [];
        }

        return data as JobAnalysisData[];
      } catch (err) {
        console.error('Exception fetching job analyses history:', err);
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
      const cacheData: CachedJobAnalysisData = {
        data: freshData,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setCachedData(freshData);
        setIsShowingCachedData(false);
        logger.debug('Updated job analyses cache with fresh data:', freshData.length, 'items');
      } catch (error) {
        logger.warn('Failed to cache job analyses data:', error);
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