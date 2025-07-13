import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type JobBoardItem = Tables<'job_board'>;

export const useJobBoardData = () => {
  const [postedTodayJobs, setPostedTodayJobs] = useState<JobBoardItem[]>([]);
  const [last7DaysJobs, setLast7DaysJobs] = useState<JobBoardItem[]>([]);
  const [savedJobs, setSavedJobs] = useState<JobBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchJobs = useCallback(async (showRefreshingIndicator = false) => {
    try {
      if (showRefreshingIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Check authentication state first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Session error:', sessionError);
        // Continue without user-specific data
      }

      // Run cleanup and categorization first
      await supabase.rpc('categorize_and_cleanup_jobs');

      // Fetch jobs by section
      const { data: postedToday, error: postedTodayError } = await supabase
        .from('job_board')
        .select('*')
        .eq('section', 'posted_today')
        .order('created_at', { ascending: false });

      const { data: last7Days, error: last7DaysError } = await supabase
        .from('job_board')
        .select('*')
        .eq('section', 'last_7_days')
        .order('created_at', { ascending: false });

      let saved: JobBoardItem[] = [];

      // Only fetch saved jobs if user is authenticated
      if (session?.user) {
        try {
          // Get user profile directly
          const { data: profileData, error: profileError } = await supabase
            .from('user_profile')
            .select('id')
            .maybeSingle();

          if (profileData?.id && !profileError) {
            // Get job tracker entries
            const { data: userJobTracker, error: trackerError } = await supabase
              .from('job_tracker')
              .select('job_title, company_name')
              .eq('user_id', profileData.id);

            if (!trackerError && userJobTracker && userJobTracker.length > 0) {
              // Get all job board entries and filter for saved ones
              const { data: allJobBoard, error: allJobBoardError } = await supabase
                .from('job_board')
                .select('*')
                .order('created_at', { ascending: false });

              if (!allJobBoardError && allJobBoard) {
                saved = allJobBoard.filter(job => 
                  userJobTracker.some(tracker => 
                    tracker.job_title === job.title && 
                    tracker.company_name === job.company_name
                  )
                );
              }
            }
          }
        } catch (savedJobsError) {
          console.warn('Error fetching saved jobs:', savedJobsError);
          // Continue without saved jobs data
        }
      }

      if (postedTodayError) throw postedTodayError;
      if (last7DaysError) throw last7DaysError;

      setPostedTodayJobs(postedToday || []);
      setLast7DaysJobs(last7Days || []);
      setSavedJobs(saved);
      setLastFetch(Date.now());
    } catch (err) {
      console.error('Error fetching job board data:', err);
      setError(err as Error);
      if (!showRefreshingIndicator) {
        toast.error('Failed to load job opportunities');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const forceRefresh = useCallback(() => {
    fetchJobs(true);
  }, [fetchJobs]);

  const backgroundRefresh = useCallback(() => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - lastFetch > fiveMinutes) {
      fetchJobs(true);
    }
  }, [fetchJobs, lastFetch]);

  useEffect(() => {
    fetchJobs();

    // Set up background refresh every 10 minutes
    const backgroundInterval = setInterval(backgroundRefresh, 10 * 60 * 1000);

    // Set up real-time subscription for job board updates
    const channel = supabase
      .channel('job-board-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_board'
        },
        (payload) => {
          console.log('Job board change detected:', payload);
          fetchJobs(true); // Background refresh when changes occur
        }
      )
      .subscribe();

    return () => {
      clearInterval(backgroundInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchJobs, backgroundRefresh]);

  return {
    postedTodayJobs,
    last7DaysJobs,
    savedJobs,
    loading,
    error,
    isRefreshing,
    forceRefresh
  };
};