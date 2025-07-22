
import { useState, useEffect, useCallback } from 'react';
import { makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useEnhancedTokenManagerIntegration } from './useEnhancedTokenManagerIntegration';
import { logger } from '@/utils/logger';

interface TrackedJob {
  id: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  job_url?: string;
  description?: string;
  status: string;
  application_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const CACHE_KEY = 'aspirely_job_tracker_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCachedJobTracker = () => {
  const { user } = useUser();
  const sessionManager = useEnhancedTokenManagerIntegration();
  
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cached data immediately
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();
        
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          setJobs(parsedCache.jobs);
          setIsLoading(false);
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

  // Fetch jobs with enhanced authentication
  const fetchJobs = useCallback(async () => {
    if (!user || !sessionManager) return;

    try {
      setError(null);

      const { data, error: fetchError } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('job_applications')
          .select('*')
          .order('updated_at', { ascending: false });
      }, { operationType: 'fetch_tracked_jobs' });

      if (fetchError) throw fetchError;

      const jobsData = data || [];
      setJobs(jobsData);

      // Cache the fresh data
      try {
        const cacheData = {
          jobs: jobsData,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        logger.debug('Cached fresh job tracker data:', cacheData);
      } catch (cacheError) {
        logger.warn('Failed to cache job tracker data:', cacheError);
      }

      return jobsData;
    } catch (err) {
      console.error('Error fetching tracked jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, sessionManager]);

  // Add new job with enhanced authentication
  const addJob = useCallback(async (jobData: Omit<TrackedJob, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user || !sessionManager) return;

    try {
      const { data, error: addError } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('job_applications')
          .insert([jobData])
          .select()
          .single();
      }, { operationType: 'add_tracked_job' });

      if (addError) throw addError;

      // Update local state
      setJobs(prev => [data, ...prev]);

      // Update cache
      try {
        const cacheData = {
          jobs: [data, ...jobs],
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (cacheError) {
        logger.warn('Failed to update cache after adding job:', cacheError);
      }

      return data;
    } catch (err) {
      console.error('Error adding job:', err);
      throw err;
    }
  }, [user, sessionManager, jobs]);

  // Update job with enhanced authentication
  const updateJob = useCallback(async (jobId: string, updates: Partial<TrackedJob>) => {
    if (!user || !sessionManager) return;

    try {
      const { data, error: updateError } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('job_applications')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', jobId)
          .select()
          .single();
      }, { operationType: 'update_tracked_job' });

      if (updateError) throw updateError;

      // Update local state
      setJobs(prev => prev.map(job => job.id === jobId ? data : job));

      // Update cache
      try {
        const updatedJobs = jobs.map(job => job.id === jobId ? data : job);
        const cacheData = {
          jobs: updatedJobs,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (cacheError) {
        logger.warn('Failed to update cache after updating job:', cacheError);
      }

      return data;
    } catch (err) {
      console.error('Error updating job:', err);
      throw err;
    }
  }, [user, sessionManager, jobs]);

  // Delete job with enhanced authentication
  const deleteJob = useCallback(async (jobId: string) => {
    if (!user || !sessionManager) return;

    try {
      const { error: deleteError } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('job_applications')
          .delete()
          .eq('id', jobId);
      }, { operationType: 'delete_tracked_job' });

      if (deleteError) throw deleteError;

      // Update local state
      setJobs(prev => prev.filter(job => job.id !== jobId));

      // Update cache
      try {
        const filteredJobs = jobs.filter(job => job.id !== jobId);
        const cacheData = {
          jobs: filteredJobs,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (cacheError) {
        logger.warn('Failed to update cache after deleting job:', cacheError);
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      throw err;
    }
  }, [user, sessionManager, jobs]);

  // Refresh jobs
  const refreshJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchJobs();
    } catch (err) {
      // Error is already handled in fetchJobs
    }
  }, [fetchJobs]);

  // Initial data fetch when user and session manager are ready
  useEffect(() => {
    if (user && sessionManager) {
      // Only fetch if we don't have cached data or if we're already loading
      if (jobs.length === 0 || isLoading) {
        fetchJobs();
      }
    }
  }, [user, sessionManager]);

  return {
    jobs,
    isLoading,
    error,
    addJob,
    updateJob,
    deleteJob,
    refreshJobs
  };
};
