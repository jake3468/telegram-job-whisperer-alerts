import { useState, useEffect } from 'react';
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

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

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

      // Fetch user's job tracker entries to find saved jobs
      const { data: userJobTracker, error: trackerError } = await supabase
        .from('job_tracker')
        .select('job_title, company_name')
        .eq('user_id', (await supabase.from('user_profile').select('id').eq('user_id', (await supabase.from('users').select('id').eq('clerk_id', (await supabase.auth.getUser()).data.user?.id || '').single()).data?.id || '').single()).data?.id || '');

      // Find job_board entries that match saved tracker entries
      const { data: allJobBoard, error: allJobBoardError } = await supabase
        .from('job_board')
        .select('*')
        .order('created_at', { ascending: false });

      const saved = allJobBoard?.filter(job => 
        userJobTracker?.some(tracker => 
          tracker.job_title === job.title && 
          tracker.company_name === job.company_name
        )
      ) || [];

      if (postedTodayError) throw postedTodayError;
      if (last7DaysError) throw last7DaysError;
      if (trackerError) throw trackerError;
      if (allJobBoardError) throw allJobBoardError;

      setPostedTodayJobs(postedToday || []);
      setLast7DaysJobs(last7Days || []);
      setSavedJobs(saved || []);
    } catch (err) {
      console.error('Error fetching job board data:', err);
      setError(err as Error);
      toast.error('Failed to load job opportunities');
    } finally {
      setLoading(false);
    }
  };

  const forceRefresh = () => {
    fetchJobs();
  };

  useEffect(() => {
    fetchJobs();

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
          fetchJobs(); // Refresh the data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    postedTodayJobs,
    last7DaysJobs,
    savedJobs,
    loading,
    error,
    forceRefresh
  };
};