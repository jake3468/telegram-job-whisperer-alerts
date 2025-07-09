import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { useEnterpriseAuth } from './useEnterpriseAuth';
import { logger } from '@/utils/logger';

interface LinkedInPostData {
  id: string;
  user_id: string;
  topic: string;
  opinion: string | null;
  personal_story: string | null;
  audience: string | null;
  tone: string | null;
  post_heading_1: string | null;
  post_content_1: string | null;
  post_heading_2: string | null;
  post_content_2: string | null;
  post_heading_3: string | null;
  post_content_3: string | null;
  created_at: string;
  updated_at: string;
}

interface CachedLinkedInPostData {
  data: LinkedInPostData[];
  timestamp: number;
}

const CACHE_KEY = 'aspirely_linkedin_posts_cache';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

export const useCachedLinkedInPosts = () => {
  const { userProfile } = useUserProfile();
  const { executeWithRetry, isAuthReady } = useEnterpriseAuth();
  const [cachedData, setCachedData] = useState<LinkedInPostData[]>([]);
  const [isShowingCachedData, setIsShowingCachedData] = useState(false);

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedLinkedInPostData = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setCachedData(parsedCache.data);
          setIsShowingCachedData(true);
          logger.debug('Loaded cached LinkedIn posts data:', parsedCache.data.length, 'items');
        } else {
          // Remove expired cache
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached LinkedIn posts data:', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Fetch fresh data with React Query
  const {
    data: freshData,
    isLoading: isFreshLoading,
    refetch
  } = useQuery({
    queryKey: ['linkedin-posts-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id || !isAuthReady) return [];
      
      return executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('job_linkedin')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      }, 3, 'fetch LinkedIn posts history');
    },
    enabled: !!userProfile?.id && isAuthReady,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: CACHE_DURATION, // Keep in cache for 2 hours
    retry: 2
  });

  // Update cache when fresh data arrives
  useEffect(() => {
    if (freshData && !isFreshLoading) {
      const cacheData: CachedLinkedInPostData = {
        data: freshData,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        setCachedData(freshData);
        setIsShowingCachedData(false);
        logger.debug('Updated LinkedIn posts cache with fresh data:', freshData.length, 'items');
      } catch (error) {
        logger.warn('Failed to cache LinkedIn posts data:', error);
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
    refetch,
    hasCache: cachedData.length > 0
  };
};