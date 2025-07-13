import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type JobBoardItem = Tables<'job_board'>;

export const useJobBoardData = () => {
  const [jobs, setJobs] = useState<JobBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('job_board')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setJobs(data || []);
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
    jobs,
    loading,
    error,
    forceRefresh
  };
};