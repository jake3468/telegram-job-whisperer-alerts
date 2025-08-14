import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { logger } from '@/utils/logger';

interface InterviewPrepData {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  interview_questions: any | null;
  created_at: string;
  updated_at: string;
}

interface CachedInterviewPrepData {
  data: InterviewPrepData[];
  timestamp: number;
}

const CACHE_KEY = 'aspirely_interview_prep_cache';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

export const useCachedInterviewPrep = () => {
  const { userProfile } = useUserProfile();
  const [cachedData, setCachedData] = useState<InterviewPrepData[]>([]);
  const [isShowingCachedData, setIsShowingCachedData] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedInterviewPrepData = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setCachedData(parsedCache.data);
          setIsShowingCachedData(true);
        } else {
          // Remove expired cache
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached interview prep data:', error);
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
    queryKey: ['interview-prep-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      return makeAuthenticatedRequest(async () => {
        const { data, error } = await supabase
          .from('interview_prep')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      }, { maxRetries: 3, operationType: 'fetch interview history' });
    },
    enabled: !!userProfile?.id,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: CACHE_DURATION, // Keep in cache for 2 hours
    retry: 2
  });

  // Handle connection issues
  useEffect(() => {
    if (error && !cachedData.length) {
      setConnectionIssue(true);
    } else if (freshData) {
      setConnectionIssue(false);
    }
  }, [error, freshData, cachedData.length]);

  // Update cache when fresh data arrives
  useEffect(() => {
    if (freshData && !isFreshLoading) {
      const cacheData: CachedInterviewPrepData = {
        data: freshData,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setCachedData(freshData);
        setIsShowingCachedData(false);
      } catch (error) {
        logger.warn('Failed to cache interview prep data:', error);
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