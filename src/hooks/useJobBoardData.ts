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
      let trackerJobRefIds: string[] = [];
      
      if (user) {
        const { data: userProfile } = await supabase
          .from('user_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (userProfile) {
          const { data: trackerJobs } = await supabase
            .from('job_tracker')
            .select('job_reference_id')
            .eq('user_id', userProfile.id);

          if (trackerJobs) {
            // Create a Set of job reference IDs for quick lookup
            trackerJobRefIds = trackerJobs.map(job => job.job_reference_id).filter(Boolean);
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
        job.is_saved_by_user === true
      );

      setPostedTodayJobs(postedToday);
      setLast7DaysJobs(lastWeek);
      setSavedToTrackerJobs(savedToTracker);

    } catch (err) {
      console.error('Error fetching job board data:', err);
      setError(err as Error);
      
      // Check if it's an authentication error and suggest refresh
      if (err instanceof Error && (err.message.includes('JWT') || err.message.includes('expired') || err.message.includes('unauthorized'))) {
        toast.error('Session expired. Please refresh the page to continue.');
      } else {
        toast.error('Failed to load job opportunities');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveToTracker = async (job: JobBoardItem) => {
    try {
      // First check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Please log in to save jobs to tracker');
        return;
      }

      // Get user profile with better error handling
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        toast.error('Unable to access user profile. Please try again.');
        return;
      }

      if (!userProfile) {
        toast.error('User profile not found. Please complete your profile setup.');
        return;
      }

      // Check if job already exists in tracker using job_reference_id
      const { data: existingJob, error: checkError } = await supabase
        .from('job_tracker')
        .select('id')
        .eq('user_id', userProfile.id)
        .eq('job_reference_id', job.job_reference_id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing job:', checkError);
        toast.error('Unable to check if job already exists. Please try again.');
        return;
      }

      if (existingJob) {
        toast.error('Job already saved to tracker');
        return;
      }

      // Insert new job tracker record with all required fields
      const { error: insertError } = await supabase
        .from('job_tracker')
        .insert({
          user_id: userProfile.id,
          job_title: job.title,
          company_name: job.company_name,
          job_description: job.job_description || '',
          job_url: job.link_1_link || '',
          job_reference_id: job.job_reference_id,
          status: 'saved',
          order_position: 0,
          // Set all boolean fields explicitly
          company_researched: false,
          job_role_analyzed: false,
          resume_updated: false,
          cover_letter_prepared: false,
          interview_prep_guide_received: false,
          ai_mock_interview_attempted: false,
          interview_call_received: false,
          ready_to_apply: false
        });

      if (insertError) {
        console.error('Error saving job to tracker:', insertError);
        toast.error(`Failed to save job: ${insertError.message}`);
        return;
      }

      toast.success('Job saved to tracker successfully!');
      // Refresh data to update the saved to tracker section
      await fetchJobs();

    } catch (err) {
      console.error('Unexpected error saving job to tracker:', err);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const markJobAsSaved = async (jobId: string) => {
    try {
      // First check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error('Please log in to save jobs');
        return;
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !userProfile) {
        toast.error('Unable to access user profile. Please try again.');
        return;
      }

      // Update job as saved by user
      const { error: updateError } = await supabase
        .from('job_board')
        .update({ is_saved_by_user: true })
        .eq('id', jobId)
        .eq('user_id', userProfile.id);

      if (updateError) {
        console.error('Error marking job as saved:', updateError);
        toast.error(`Failed to save job: ${updateError.message}`);
        return;
      }

    } catch (err) {
      console.error('Unexpected error marking job as saved:', err);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const forceRefresh = async () => {
    try {
      // Clear error state immediately and show loading
      setError(null);
      setLoading(true);
      
      // Clear existing data to force complete refresh
      setPostedTodayJobs([]);
      setLast7DaysJobs([]);
      setSavedToTrackerJobs([]);
      
      // Force refresh the data
      await fetchJobs();
      
      console.log('Job board data refreshed successfully');
    } catch (err) {
      console.error('Force refresh failed:', err);
      
      // Check if it's a JWT/auth error and force page reload
      if (err instanceof Error && (
        err.message.includes('JWT') || 
        err.message.includes('expired') || 
        err.message.includes('unauthorized') ||
        err.message.includes('PGRST301')
      )) {
        console.log('Authentication error detected, reloading page...');
        window.location.reload();
        return;
      }
      
      setError(err as Error);
    } finally {
      setLoading(false);
    }
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
    saveToTracker,
    markJobAsSaved
  };
};