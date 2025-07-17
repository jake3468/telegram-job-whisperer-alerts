import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseAuth } from './useEnterpriseAuth';
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
  comments?: string;
  file_urls?: string[];
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

// Helper function to validate and fix order position conflicts
const validateAndFixOrderPositions = async (jobs: JobEntry[], userProfileId: string): Promise<JobEntry[]> => {
  const statusGroups = jobs.reduce((groups, job) => {
    if (!groups[job.status]) {
      groups[job.status] = [];
    }
    groups[job.status].push(job);
    return groups;
  }, {} as Record<string, JobEntry[]>);

  // Check for conflicts and fix them if found
  let hasConflicts = false;
  for (const [status, statusJobs] of Object.entries(statusGroups)) {
    const positionCounts = statusJobs.reduce((counts, job) => {
      counts[job.order_position] = (counts[job.order_position] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);

    // If any position appears more than once, we have conflicts
    if (Object.values(positionCounts).some(count => count > 1)) {
      hasConflicts = true;
      break;
    }
  }

  if (hasConflicts) {
    logger.warn('Order position conflicts detected, rebalancing...', { userProfileId });
    try {
      // Call the database function to rebalance positions
      await supabase.rpc('rebalance_job_tracker_order_positions');
      
      // Refetch the data to get the corrected positions
      const { data: correctedData, error } = await supabase
        .from('job_tracker')
        .select('*')
        .eq('user_id', userProfileId)
        .order('order_position', { ascending: true });

      if (error) throw error;

      const correctedJobs: JobEntry[] = (correctedData || []).map(job => ({
        ...job,
        file_urls: Array.isArray(job.file_urls) ? job.file_urls.map(url => String(url)) : [],
        comments: job.comments || undefined
      }));

      logger.debug('Order positions rebalanced successfully');
      return correctedJobs;
    } catch (error) {
      logger.error('Failed to rebalance order positions:', error);
      return jobs; // Return original data if rebalancing fails
    }
  }

  return jobs;
};

export const useCachedJobTracker = () => {
  const { user } = useUser();
  const { executeWithRetry, isAuthReady } = useEnterpriseAuth();
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

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
    if (!user || !isAuthReady) {
      setLoading(false);
      return;
    }
    
    // Only fetch if we haven't fetched yet and don't have cached data
    const shouldFetch = !hasFetched && jobs.length === 0 && !error;
    if (shouldFetch) {
      fetchJobTrackerData();
    } else if (hasFetched || jobs.length > 0) {
      setLoading(false);
    }
  }, [user?.id, hasFetched, jobs.length, error, isAuthReady]); // Include isAuthReady

  const fetchJobTrackerData = async (showErrors = false) => {
    if (!user || !isAuthReady) {
      console.log('🔒 Job tracker fetch skipped - auth not ready:', { user: !!user, isAuthReady });
      return;
    }
    
    console.log('🚀 Starting job tracker data fetch with enhanced auth...');
    
    try {
      setError(null);
      setConnectionIssue(false);
      
      // Get the user UUID from users table using enhanced authentication
      const userData = await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        return data;
      }, 3, 'fetch user data for job tracker');
      
      if (!userData) {
        throw new Error('Unable to load user data');
      }

      // Get user profile using enhanced authentication
      const userProfile = await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('user_profile')
          .select('id')
          .eq('user_id', userData.id)
          .maybeSingle();
        
        if (error) throw error;
        return data;
      }, 3, 'fetch user profile for job tracker');
      
      if (!userProfile) {
        throw new Error('Unable to load user profile');
      }

      // Get jobs for this user profile using enhanced authentication
      const data = await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('job_tracker')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('order_position', { ascending: true });
        
        if (error) throw error;
        return data;
      }, 3, 'fetch job tracker data');

      // Transform the data to match JobEntry interface
      const jobsData: JobEntry[] = (data || []).map(job => ({
        ...job,
        file_urls: Array.isArray(job.file_urls) ? job.file_urls.map(url => String(url)) : [],
        comments: job.comments || undefined
      }));
      
      // Validate and fix any order position conflicts
      const validatedJobs = await validateAndFixOrderPositions(jobsData, userProfile.id);
      
      // Update state
      setJobs(validatedJobs);
      setUserProfileId(userProfile.id);
      setHasFetched(true);

      // Cache the data
      try {
        const cacheData: CachedJobTrackerData = {
          jobs: validatedJobs,
          userProfileId: userProfile.id,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        logger.debug('✅ Job tracker data loaded successfully:', { jobCount: validatedJobs.length, userProfileId: userProfile.id });
      } catch (cacheError) {
        logger.warn('Failed to cache job tracker data:', cacheError);
      }

    } catch (error: any) {
      logger.error('❌ Error fetching job tracker data:', error);
      console.error('Job tracker fetch error details:', {
        errorMessage: error.message,
        errorCode: error.code,
        user: user?.id,
        isAuthReady,
        showErrors
      });
      setConnectionIssue(true);
      setHasFetched(true); // Mark as fetched even on error
      
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