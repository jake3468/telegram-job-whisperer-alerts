import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface JobEntry {
  id: string;
  company_name: string;
  job_title: string;
  job_description?: string;
  job_url?: string;
  status: 'saved' | 'applied' | 'interview' | 'rejected' | 'offer';
  order_position: number;
  resume_updated: boolean;
  job_role_analyzed: boolean;
  company_researched: boolean;
  cover_letter_prepared: boolean;
  ready_to_apply: boolean;
  interview_call_received: boolean;
  interview_prep_guide_received: boolean;
  ai_mock_interview_attempted: boolean;
  created_at: string;
  updated_at: string;
}

interface CachedJobTrackerData {
  jobs: JobEntry[];
  userProfileId: string;
  timestamp: number;
}

const CACHE_KEY = 'aspirely_job_tracker_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useCachedJobTracker = () => {
  const { user } = useUser();
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionIssue, setConnectionIssue] = useState(false);

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedJobTrackerData = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's less than cache duration old
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setJobs(parsedCache.jobs);
          setUserProfileId(parsedCache.userProfileId);
          setLoading(false); // Mark as loaded since we have cached data
          logger.debug('Loaded cached job tracker data:', parsedCache);
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached job tracker data:', error);
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
    const shouldFetch = jobs.length === 0 && !error;
    if (shouldFetch) {
      fetchJobTrackerData();
    } else {
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object

  const fetchJobTrackerData = async (showErrors = false) => {
    if (!user) return;
    
    try {
      setError(null);
      setConnectionIssue(false);
      
      // Get the user UUID from users table using clerk_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .maybeSingle();
      
      if (userError || !userData) {
        throw new Error('Unable to load user data');
      }

      // Get user profile using the user UUID
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', userData.id)
        .maybeSingle();
      
      if (profileError || !userProfile) {
        throw new Error('Unable to load user profile');
      }

      // Get jobs for this user profile
      const { data, error } = await supabase
        .from('job_tracker')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('order_position', { ascending: true });
      
      if (error) {
        throw new Error('Unable to load job applications');
      }

      // Transform the data to match JobEntry interface
      const jobsData = (data || []).map(job => ({
        ...job
      }));
      
      // Update state
      setJobs(jobsData);
      setUserProfileId(userProfile.id);

      // Cache the data
      try {
        const cacheData: CachedJobTrackerData = {
          jobs: jobsData,
          userProfileId: userProfile.id,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        logger.debug('Cached fresh job tracker data:', cacheData);
      } catch (cacheError) {
        logger.warn('Failed to cache job tracker data:', cacheError);
      }

    } catch (error: any) {
      logger.error('Error fetching job tracker data:', error);
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
    fetchJobTrackerData();
  };

  const optimisticUpdate = (updatedJob: JobEntry) => {
    setJobs(prevJobs => 
      prevJobs.map(job => job.id === updatedJob.id ? updatedJob : job)
    );
  };

  const optimisticAdd = (newJob: JobEntry) => {
    setJobs(prevJobs => [...prevJobs, newJob]);
  };

  const optimisticDelete = (jobId: string) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  };

  const forceRefresh = () => {
    // Force a full refresh with error showing
    setError(null);
    setConnectionIssue(false);
    fetchJobTrackerData(true);
  };

  return {
    jobs,
    userProfileId,
    loading,
    error,
    connectionIssue,
    refetch: fetchJobTrackerData,
    invalidateCache,
    optimisticUpdate,
    optimisticAdd,
    optimisticDelete,
    forceRefresh
  };
};