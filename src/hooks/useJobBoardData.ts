import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type JobBoardItem = Tables<'job_board'>;
type JobTrackerItem = Tables<'job_tracker'>;

export const useJobBoardData = () => {
  const [postedTodayJobs, setPostedTodayJobs] = useState<JobBoardItem[]>([]);
  const [last7DaysJobs, setLast7DaysJobs] = useState<JobBoardItem[]>([]);
  const [savedToTrackerJobs, setSavedToTrackerJobs] = useState<JobBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // First run cleanup function to categorize and delete old jobs
      await supabase.rpc('categorize_and_cleanup_jobs');

      // Fetch all job_board data
      const { data: jobBoardData, error: fetchError } = await supabase
        .from('job_board')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Get user profile to find saved tracker jobs
      const { data: { user } } = await supabase.auth.getUser();
      let trackerJobIds: string[] = [];
      
      if (user) {
        const { data: userProfile } = await supabase
          .from('user_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (userProfile) {
          const { data: trackerJobs } = await supabase
            .from('job_tracker')
            .select('company_name, job_title')
            .eq('user_id', userProfile.id);

          if (trackerJobs) {
            // Create a Set of job signatures for quick lookup
            trackerJobIds = trackerJobs.map(job => `${job.company_name}-${job.job_title}`);
          }
        }
      }

      const allJobs = jobBoardData || [];

      // Categorize jobs
      const today = new Date();
      const twentyThreeHoursAgo = new Date(today.getTime() - 23 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const postedToday = allJobs.filter(job => 
        new Date(job.created_at) > twentyThreeHoursAgo
      );

      const lastWeek = allJobs.filter(job => {
        const createdAt = new Date(job.created_at);
        return createdAt <= twentyThreeHoursAgo && createdAt > sevenDaysAgo;
      });

      const savedToTracker = allJobs.filter(job => 
        trackerJobIds.includes(`${job.company_name}-${job.title}`)
      );

      setPostedTodayJobs(postedToday);
      setLast7DaysJobs(lastWeek);
      setSavedToTrackerJobs(savedToTracker);

    } catch (err) {
      console.error('Error fetching job board data:', err);
      setError(err as Error);
      toast.error('Failed to load job opportunities');
    } finally {
      setLoading(false);
    }
  };

  const saveToTracker = async (job: JobBoardItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to save jobs');
        return;
      }

      const { data: userProfile } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!userProfile) {
        toast.error('User profile not found');
        return;
      }

      // Check if job already exists in tracker
      const { data: existingJob } = await supabase
        .from('job_tracker')
        .select('id')
        .eq('user_id', userProfile.id)
        .eq('company_name', job.company_name)
        .eq('job_title', job.title)
        .single();

      if (existingJob) {
        toast.error('Job already saved to tracker');
        return;
      }

      // Insert new job tracker record
      const { error: insertError } = await supabase
        .from('job_tracker')
        .insert({
          user_id: userProfile.id,
          job_title: job.title,
          company_name: job.company_name,
          job_description: job.job_description,
          job_url: job.link_1_link,
          status: 'saved'
        });

      if (insertError) {
        throw insertError;
      }

      toast.success('Job saved to tracker successfully!');
      // Refresh data to update the saved to tracker section
      fetchJobs();

    } catch (err) {
      console.error('Error saving job to tracker:', err);
      toast.error('Failed to save job to tracker');
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
    savedToTrackerJobs,
    loading,
    error,
    forceRefresh,
    saveToTracker
  };
};