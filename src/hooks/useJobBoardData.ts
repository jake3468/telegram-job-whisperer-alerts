
import { useState, useEffect, useCallback } from 'react';
import { makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useEnhancedTokenManagerIntegration } from './useEnhancedTokenManagerIntegration';

interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  description?: string;
  url: string;
  created_at: string;
  is_saved?: boolean;
}

interface SavedJob {
  id: string;
  job_id: string;
  user_id: string;
  created_at: string;
}

export const useJobBoardData = () => {
  const { user } = useUser();
  const sessionManager = useEnhancedTokenManagerIntegration();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch jobs with enhanced authentication
  const fetchJobs = useCallback(async (searchQuery?: string, locationFilter?: string) => {
    if (!user || !sessionManager) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await makeAuthenticatedRequest(async () => {
        let query = supabase
          .from('job_listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }

        if (locationFilter) {
          query = query.ilike('location', `%${locationFilter}%`);
        }

        return await query.limit(50);
      }, { operationType: 'fetch_jobs' });

      if (fetchError) throw fetchError;

      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  }, [user, sessionManager]);

  // Fetch saved jobs with enhanced authentication
  const fetchSavedJobs = useCallback(async () => {
    if (!user || !sessionManager) return;

    try {
      const { data: savedData, error: savedError } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('saved_jobs')
          .select(`
            id,
            job_id,
            created_at,
            job_listings (
              id,
              title,
              company,
              location,
              salary,
              description,
              url,
              created_at
            )
          `)
          .order('created_at', { ascending: false });
      }, { operationType: 'fetch_saved_jobs' });

      if (savedError) throw savedError;

      const savedJobsData = (savedData || []).map((item: any) => ({
        ...item.job_listings,
        saved_at: item.created_at
      }));

      const savedJobIdSet = new Set((savedData || []).map((item: any) => item.job_listings.id));

      setSavedJobs(savedJobsData);
      setSavedJobIds(savedJobIdSet);
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
    }
  }, [user, sessionManager]);

  // Save a job with enhanced authentication
  const saveJob = useCallback(async (jobId: string) => {
    if (!user || !sessionManager) return;

    try {
      const { error: saveError } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('saved_jobs')
          .insert([{ job_id: jobId }])
          .select();
      }, { operationType: 'save_job' });

      if (saveError) throw saveError;

      // Update local state
      setSavedJobIds(prev => new Set([...prev, jobId]));
      
      // Refresh saved jobs to get the complete data
      await fetchSavedJobs();
    } catch (err) {
      console.error('Error saving job:', err);
      throw err;
    }
  }, [user, sessionManager, fetchSavedJobs]);

  // Unsave a job with enhanced authentication
  const unsaveJob = useCallback(async (jobId: string) => {
    if (!user || !sessionManager) return;

    try {
      const { error: unsaveError } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('saved_jobs')
          .delete()
          .eq('job_id', jobId);
      }, { operationType: 'unsave_job' });

      if (unsaveError) throw unsaveError;

      // Update local state
      setSavedJobIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (err) {
      console.error('Error unsaving job:', err);
      throw err;
    }
  }, [user, sessionManager]);

  // Search jobs
  const searchJobs = useCallback(async (searchQuery: string, locationFilter?: string) => {
    await fetchJobs(searchQuery, locationFilter);
  }, [fetchJobs]);

  // Refresh all data
  const refreshJobs = useCallback(async () => {
    await Promise.all([
      fetchJobs(),
      fetchSavedJobs()
    ]);
  }, [fetchJobs, fetchSavedJobs]);

  // Check if a job is saved
  const isJobSaved = useCallback((jobId: string) => {
    return savedJobIds.has(jobId);
  }, [savedJobIds]);

  // Initial data fetch
  useEffect(() => {
    if (user && sessionManager) {
      refreshJobs();
    }
  }, [user, sessionManager, refreshJobs]);

  return {
    jobs,
    savedJobs,
    isLoading,
    error,
    refreshJobs,
    saveJob,
    unsaveJob,
    isJobSaved,
    searchJobs
  };
};
