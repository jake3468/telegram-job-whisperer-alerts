import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { makeAuthenticatedRequest } from '@/integrations/supabase/client';
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
  userProfileId: string;
  timestamp: number;
}

const CACHE_KEY = 'aspirely_job_analyses_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useCachedJobAnalyses = () => {
  const { user } = useUser();
  const [data, setData] = useState<JobAnalysisData[]>([]);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          setData(parsedCache.data);
          setUserProfileId(parsedCache.userProfileId);
          setIsLoading(false);
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached job analyses data:', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Fetch fresh data only when user changes or when explicitly requested
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    // Only fetch if we don't have cached data or user has changed
    const shouldFetch = data.length === 0 && !error;
    if (shouldFetch) {
      fetchJobAnalysesData();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchJobAnalysesData = async (showErrors = false) => {
    if (!user) return;
    
    try {
      setError(null);
      setConnectionIssue(false);
      
      // Get the user UUID from users table using clerk_id
      const userResult = await makeAuthenticatedRequest(async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        return await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .maybeSingle();
      });
      
      if (userResult.error || !userResult.data) {
        throw new Error('Unable to load user data');
      }

      // Get user profile using the user UUID
      const profileResult = await makeAuthenticatedRequest(async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        return await supabase
          .from('user_profile')
          .select('id')
          .eq('user_id', userResult.data.id)
          .maybeSingle();
      });
      
      if (profileResult.error || !profileResult.data) {
        throw new Error('Unable to load user profile');
      }

      // Get job analyses for this user profile
      const result = await makeAuthenticatedRequest(async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        return await supabase
          .from('job_analyses')
          .select('*')
          .eq('user_id', profileResult.data.id)
          .order('created_at', { ascending: false });
      });
      
      if (result.error) {
        throw new Error('Unable to load job analyses');
      }

      const jobAnalysesData = result.data || [];
      
      // Update state
      setData(jobAnalysesData);
      setUserProfileId(profileResult.data.id);

      // Cache the data
      try {
        const cacheData: CachedJobAnalysisData = {
          data: jobAnalysesData,
          userProfileId: profileResult.data.id,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (cacheError) {
        logger.warn('Failed to cache job analyses data:', cacheError);
      }

    } catch (error: any) {
      logger.error('Error fetching job analyses data:', error);
      setConnectionIssue(true);
      
      if (showErrors) {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const invalidateCache = () => {
    localStorage.removeItem(CACHE_KEY);
    fetchJobAnalysesData();
  };

  const forceRefresh = () => {
    setError(null);
    setConnectionIssue(false);
    fetchJobAnalysesData(true);
  };

  return {
    data,
    userProfileId,
    isLoading,
    error,
    connectionIssue,
    refetch: fetchJobAnalysesData,
    invalidateCache,
    forceRefresh,
    hasCache: data.length > 0,
    isShowingCachedData: false
  };
};