
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

    if (Object.values(positionCounts).some(count => count > 1)) {
      hasConflicts = true;
      break;
    }
  }

  if (hasConflicts) {
    try {
      await supabase.rpc('rebalance_job_tracker_order_positions');
      
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

      return correctedJobs;
    } catch (error) {
      // Silent error handling for order position rebalancing
      return jobs;
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
        
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setJobs(parsedCache.jobs);
          setUserProfileId(parsedCache.userProfileId);
          setLoading(false);
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  // Fetch fresh data only when needed
  useEffect(() => {
    if (!user || !isAuthReady) {
      setLoading(false);
      return;
    }
    
    const shouldFetch = !hasFetched && jobs.length === 0 && !error;
    if (shouldFetch) {
      fetchJobTrackerData();
    } else if (hasFetched || jobs.length > 0) {
      setLoading(false);
    }
  }, [user?.id, hasFetched, jobs.length, error, isAuthReady]);

  const sanitizeText = (text: string): string => {
    if (!text) return '';
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-.,()&]/g, '')
      .substring(0, 200);
  };

  const fetchJobTrackerData = async (showErrors = false) => {
    if (!user || !isAuthReady) {
      return;
    }
    
    try {
      setError(null);
      setConnectionIssue(false);
      
      // Get the user UUID from users table
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

      // Get user profile
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

      // Get jobs for this user profile
      const data = await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('job_tracker')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('order_position', { ascending: true });
        
        if (error) throw error;
        return data;
      }, 3, 'fetch job tracker data');

      // Transform and sanitize the data
      const jobsData: JobEntry[] = (data || []).map(job => ({
        ...job,
        company_name: sanitizeText(job.company_name),
        job_title: sanitizeText(job.job_title),
        job_description: job.job_description ? sanitizeText(job.job_description) : undefined,
        file_urls: Array.isArray(job.file_urls) ? job.file_urls.map(url => String(url)) : [],
        comments: job.comments || undefined
      }));

      // Validate and fix order positions
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
      } catch (cacheError) {
        // Silent cache error handling
      }

    } catch (error: any) {
      setConnectionIssue(true);
      setHasFetched(true);
      
      if (showErrors) {
        // Only show user-friendly error messages
        if (error?.message?.includes('refresh the page')) {
          setError(error.message);
        } else {
          setError('Unable to load job data. Please refresh the page.');
        }
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
    setJobs(prevJobs => {
      const updatedJobs = [...prevJobs, newJob];
      return updatedJobs;
    });
    localStorage.removeItem(CACHE_KEY);
  };

  const optimisticDelete = (jobId: string) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  };

  const forceRefresh = () => {
    setError(null);
    setConnectionIssue(false);
    localStorage.removeItem(CACHE_KEY);
    setHasFetched(false);
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
