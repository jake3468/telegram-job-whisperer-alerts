import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type JobBoardItem = Tables<'job_board'>;
type JobTrackerItem = Tables<'job_tracker'>;

export const useJobBoardData = () => {
  const { user: clerkUser } = useUser();
  const [postedTodayJobs, setPostedTodayJobs] = useState<JobBoardItem[]>([]);
  const [last7DaysJobs, setLast7DaysJobs] = useState<JobBoardItem[]>([]);
  const [savedToTrackerJobs, setSavedToTrackerJobs] = useState<JobBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      if (!clerkUser) {
        // For non-logged in users, still show jobs but without personalization
        const { data: jobBoardData, error: fetchError } = await supabase
          .from('job_board')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        const allJobs = jobBoardData || [];
        
        // Categorize jobs for non-logged in users (no saved functionality)
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

        setPostedTodayJobs(postedToday);
        setLast7DaysJobs(lastWeek);
        setSavedToTrackerJobs([]);
        return;
      }

      // First run cleanup function to categorize and delete old jobs
      await supabase.rpc('categorize_and_cleanup_jobs');

      // Get user profile using Clerk user ID
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUser.id)
        .single();

      if (userError || !users) {
        throw new Error('User not found in database');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', users.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('User profile not found');
      }

      // Fetch job_board data for this user
      const { data: jobBoardData, error: fetchError } = await supabase
        .from('job_board')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const allJobs = jobBoardData || [];

      // Categorize jobs based on time and saved status
      const today = new Date();
      const twentyThreeHoursAgo = new Date(today.getTime() - 23 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Posted Today: Recent jobs that are NOT saved by user
      const postedToday = allJobs.filter(job => 
        new Date(job.created_at) > twentyThreeHoursAgo && 
        !job.is_saved_by_user
      );

      // Last 7 Days: Older jobs that are NOT saved by user
      const lastWeek = allJobs.filter(job => {
        const createdAt = new Date(job.created_at);
        return createdAt <= twentyThreeHoursAgo && 
               createdAt > sevenDaysAgo && 
               !job.is_saved_by_user;
      });

      // Saved: Jobs marked as saved by user
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

  const markJobAsSaved = async (job: JobBoardItem) => {
    try {
      // Check Clerk authentication
      if (!clerkUser) {
        toast.error('Please log in to save jobs');
        return;
      }

      // Get user from database using Clerk ID
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUser.id)
        .single();

      if (userError || !users) {
        toast.error('User not found. Please try logging in again.');
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', users.id)
        .single();

      if (profileError || !userProfile) {
        toast.error('User profile not found. Please complete your profile setup.');
        return;
      }

      // Update job as saved by user
      const { error: updateError } = await supabase
        .from('job_board')
        .update({ is_saved_by_user: true })
        .eq('id', job.id)
        .eq('user_id', userProfile.id);

      if (updateError) {
        console.error('Error marking job as saved:', updateError);
        toast.error(`Failed to save job: ${updateError.message}`);
        return;
      }

      toast.success('Job saved! Check the Saved section.');
      // Refresh data to update job sections
      await fetchJobs();

    } catch (err) {
      console.error('Unexpected error marking job as saved:', err);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const saveToTracker = async (job: JobBoardItem) => {
    try {
      // Check Clerk authentication
      if (!clerkUser) {
        toast.error('Please log in to add jobs to tracker');
        return;
      }

      // Get user from database using Clerk ID
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUser.id)
        .single();

      if (userError || !users) {
        toast.error('User not found. Please try logging in again.');
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', users.id)
        .single();

      if (profileError || !userProfile) {
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
        toast.error('Job already added to tracker');
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
        toast.error(`Failed to add job to tracker: ${insertError.message}`);
        return;
      }

      toast.success('Job added to tracker successfully!');
      // Refresh data to update sections
      await fetchJobs();

    } catch (err) {
      console.error('Unexpected error saving job to tracker:', err);
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