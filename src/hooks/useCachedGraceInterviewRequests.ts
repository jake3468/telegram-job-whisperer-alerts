import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface GraceInterviewRequest {
  id: string;
  user_id: string;
  phone_number: string;
  company_name: string;
  job_title: string;
  job_description: string;
  status: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

interface CachedGraceInterviewData {
  requests: GraceInterviewRequest[];
  userProfileId: string;
  timestamp: number;
}

const CACHE_KEY = 'aspirely_grace_interview_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useCachedGraceInterviewRequests = () => {
  const { user } = useUser();
  const [requests, setRequests] = useState<GraceInterviewRequest[]>([]);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionIssue, setConnectionIssue] = useState(false);

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedGraceInterviewData = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setRequests(parsedCache.requests);
          setUserProfileId(parsedCache.userProfileId);
          setLoading(false); // Mark as loaded since we have cached data
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached grace interview data:', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Fetch fresh data only when user changes or when explicitly requested
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Only fetch if we don't have cached data or user has changed
    const shouldFetch = requests.length === 0 && !error;
    if (shouldFetch) {
      fetchGraceInterviewData();
    } else {
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object

  const fetchGraceInterviewData = async (showErrors = false) => {
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

      // Get grace interview requests for this user profile
      const result = await makeAuthenticatedRequest(async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        return await supabase
          .from('grace_interview_requests')
          .select('*')
          .eq('user_id', profileResult.data.id)
          .order('created_at', { ascending: false });
      });
      
      if (result.error) {
        throw new Error('Unable to load interview requests');
      }

      const requestsData = result.data || [];
      
      // Update state
      setRequests(requestsData);
      setUserProfileId(profileResult.data.id);

      // Cache the data
      try {
        const cacheData: CachedGraceInterviewData = {
          requests: requestsData,
          userProfileId: profileResult.data.id,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (cacheError) {
        logger.warn('Failed to cache grace interview data:', cacheError);
      }

    } catch (error: any) {
      logger.error('Error fetching grace interview data:', error);
      setConnectionIssue(true);
      
      if (showErrors) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = () => {
    localStorage.removeItem(CACHE_KEY);
    fetchGraceInterviewData();
  };

  const optimisticAdd = (newRequest: GraceInterviewRequest) => {
    setRequests(prevRequests => [newRequest, ...prevRequests]);
    
    // Update cache with new request
    try {
      const cacheData: CachedGraceInterviewData = {
        requests: [newRequest, ...requests],
        userProfileId: userProfileId!,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      logger.warn('Failed to update cache optimistically:', error);
    }
  };

  const forceRefresh = () => {
    // Force a full refresh with error showing
    setError(null);
    setConnectionIssue(false);
    fetchGraceInterviewData(true);
  };

  return {
    requests,
    userProfileId,
    loading,
    error,
    connectionIssue,
    refetch: fetchGraceInterviewData,
    invalidateCache,
    optimisticAdd,
    forceRefresh
  };
};