import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useEnterpriseAuth } from './useEnterpriseAuth';

type JobBoardItem = Tables<'job_board'>;
type JobTrackerItem = Tables<'job_tracker'>;

export const useJobBoardData = () => {
  const { user: clerkUser } = useUser();
  const { executeWithRetry, isAuthReady } = useEnterpriseAuth();
  const [postedTodayJobs, setPostedTodayJobs] = useState<JobBoardItem[]>([]);
  const [last7DaysJobs, setLast7DaysJobs] = useState<JobBoardItem[]>([]);
  const [savedToTrackerJobs, setSavedToTrackerJobs] = useState<JobBoardItem[]>([]);
  const [jobTrackerStatus, setJobTrackerStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionIssue, setConnectionIssue] = useState(false);

  const fetchJobs = async (forceRefresh = false) => {
    if (!clerkUser) {
      // For non-logged in users, still show jobs but without personalization
      return executeWithRetry(async () => {
        setLoading(true);
        setError(null);
        setConnectionIssue(false);

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
      }, 3, 'fetch jobs for non-logged user').catch(err => {
        console.error('Error fetching job board data:', err);
        setError(err as Error);
        setConnectionIssue(true);
      }).finally(() => {
        setLoading(false);
      });
    }

    return executeWithRetry(async () => {
      setLoading(true);
      setError(null);
      setConnectionIssue(false);

      // Get user data with fallback error handling
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUser.id)
        .maybeSingle();

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', users?.id)
        .maybeSingle();

      // If user data issues, trigger connection issue instead of failing silently
      if (userError || profileError || !users || !userProfile) {
        console.error('User data fetch issue:', { userError, profileError });
        throw new Error('User data not found');
      }

      // First run cleanup function to categorize and delete old jobs
      await supabase.rpc('categorize_and_cleanup_jobs');

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

      // Check tracker status for saved jobs (with better error handling)
      const trackerStatus: Record<string, boolean> = {};
      if (savedToTracker.length > 0) {
        try {
          const { data: trackerJobs } = await supabase
            .from('job_tracker')
            .select('job_reference_id')
            .eq('user_id', userProfile.id)
            .not('job_reference_id', 'is', null);

          if (trackerJobs) {
            const trackerJobIds = new Set(trackerJobs.map(tj => tj.job_reference_id));
            savedToTracker.forEach(job => {
              if (job.job_reference_id) {
                trackerStatus[job.job_reference_id] = trackerJobIds.has(job.job_reference_id);
              }
            });
          }
        } catch (trackerError) {
          console.error('Error fetching tracker status:', trackerError);
          // Don't fail the entire fetch, just continue without tracker status
        }
      }

      setPostedTodayJobs(postedToday);
      setLast7DaysJobs(lastWeek);
      setSavedToTrackerJobs(savedToTracker);
      setJobTrackerStatus(trackerStatus);

    }, 5, 'fetch jobs for logged user').catch(err => {
      console.error('Error fetching job board data:', err);
      setError(err as Error);
      setConnectionIssue(true);
    }).finally(() => {
      setLoading(false);
    });
  };

  const markJobAsSaved = async (job: JobBoardItem) => {
    if (!clerkUser) {
      toast.error('Please log in to save jobs');
      return;
    }

    try {
      await executeWithRetry(async () => {
        // Get user from database using Clerk ID
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', clerkUser.id)
          .single();

        if (userError || !users) {
          throw new Error('User not found. Please try logging in again.');
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('user_profile')
          .select('id')
          .eq('user_id', users.id)
          .single();

        if (profileError || !userProfile) {
          throw new Error('User profile not found. Please complete your profile setup.');
        }

        // Generate job_reference_id when saving (this will be used later for job tracker)
        const jobReferenceId = crypto.randomUUID();

        // Update job as saved by user and set job_reference_id
        const { error: updateError } = await supabase
          .from('job_board')
          .update({ 
            is_saved_by_user: true,
            job_reference_id: jobReferenceId
          })
          .eq('id', job.id)
          .eq('user_id', userProfile.id);

        if (updateError) {
          throw updateError;
        }
      }, 5, 'mark job as saved');

      // Success - show message immediately
      toast.success('Job saved! Check the Saved section.');
      
      // Refresh data with separate error handling
      try {
        await fetchJobs();
      } catch (refreshError) {
        console.error('Error refreshing job data after save:', refreshError);
        // Don't show error to user, the main operation succeeded
      }
    } catch (err) {
      console.error('Error marking job as saved:', err);
      toast.error('Failed to save job. Please try again.');
    }
  };

  const saveToTracker = async (job: JobBoardItem) => {
    if (!clerkUser) {
      toast.error('Please log in to add jobs to tracker');
      return;
    }

    try {
      let shouldShowSuccess = false;

      await executeWithRetry(async () => {
        // Get user from database using Clerk ID
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', clerkUser.id)
          .maybeSingle();

        if (userError || !users) {
          throw new Error('User not found');
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('user_profile')
          .select('id')
          .eq('user_id', users.id)
          .single();

        if (profileError || !userProfile) {
          throw new Error('User profile not found');
        }

        // Generate job_reference_id if it doesn't exist (for jobs saved before recent changes)
        let jobReferenceId = job.job_reference_id;
        if (!jobReferenceId) {
          jobReferenceId = crypto.randomUUID();
          
          // Update the job_board record with the new job_reference_id
          const { error: updateError } = await supabase
            .from('job_board')
            .update({ job_reference_id: jobReferenceId })
            .eq('id', job.id)
            .eq('user_id', userProfile.id);

          if (updateError) {
            throw new Error('Failed to prepare job for tracker');
          }
        }

        // Check if job already exists in tracker using job_reference_id
        const { data: existingJob, error: checkError } = await supabase
          .from('job_tracker')
          .select('id')
          .eq('user_id', userProfile.id)
          .eq('job_reference_id', jobReferenceId)
          .maybeSingle();

        if (checkError) {
          throw new Error('Unable to check if job already exists');
        }

        if (existingJob) {
          toast.error('Job already added to tracker');
          return;
        }

        // Insert new job tracker record using job_reference_id
        const { error: insertError } = await supabase
          .from('job_tracker')
          .insert({
            user_id: userProfile.id,
            job_title: job.title,
            company_name: job.company_name,
            job_description: job.job_description || '',
            job_url: job.link_1_link || '',
            job_reference_id: jobReferenceId,
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
          throw insertError;
        }

        shouldShowSuccess = true;
      }, 5, 'save job to tracker');

      // Success actions with separate error handling
      if (shouldShowSuccess) {
        toast.success('Job added to tracker successfully!');
        
        try {
          await fetchJobs();
        } catch (refreshError) {
          console.error('Error refreshing job data after tracker save:', refreshError);
          // Don't show error to user, the main operation succeeded
        }
      }
    } catch (err) {
      console.error('Error saving job to tracker:', err);
      toast.error('Failed to add job to tracker. Please try again.');
    }
  };

  const deleteJobFromBoard = async (job: JobBoardItem) => {
    if (!clerkUser) {
      toast.error('Please log in to delete jobs');
      return;
    }

    try {
      await executeWithRetry(async () => {
        console.log('Deleting job from job_board:', job.id);

        // Get user profile
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', clerkUser.id)
          .single();

        if (userError || !users) {
          throw new Error('User not found. Please try logging in again.');
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('user_profile')
          .select('id')
          .eq('user_id', users.id)
          .single();

        if (profileError || !userProfile) {
          throw new Error('User profile not found.');
        }

        // Simply delete from job_board only
        const { error: deleteError, count } = await supabase
          .from('job_board')
          .delete({ count: 'exact' })
          .eq('id', job.id)
          .eq('user_id', userProfile.id);

        if (deleteError) {
          throw deleteError;
        }

        if (count === 0) {
          throw new Error('Job not found or you do not have permission to delete it');
        }
      }, 5, 'delete job from board');

      // Success - show message immediately
      toast.success('Job removed from saved jobs!');
      
      // Refresh data with separate error handling
      try {
        await fetchJobs();
      } catch (refreshError) {
        console.error('Error refreshing job data after delete:', refreshError);
        // Don't show error to user, the main operation succeeded
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      toast.error('Failed to delete job. Please try again.');
    }
  };

  const deleteJobFromTracker = async (jobReferenceId: string) => {
    if (!clerkUser) {
      toast.error('Please log in to delete jobs');
      return;
    }

    try {
      await executeWithRetry(async () => {
        // Get user profile
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', clerkUser.id)
          .single();

        if (userError || !users) {
          throw new Error('User not found. Please try logging in again.');
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('user_profile')
          .select('id')
          .eq('user_id', users.id)
          .single();

        if (profileError || !userProfile) {
          throw new Error('User profile not found.');
        }

        // Delete from job_tracker
        const { error: trackerDeleteError } = await supabase
          .from('job_tracker')
          .delete()
          .eq('user_id', userProfile.id)
          .eq('job_reference_id', jobReferenceId);

        if (trackerDeleteError) {
          throw trackerDeleteError;
        }

        // Delete from job_board if job_reference_id exists
        const { error: boardDeleteError } = await supabase
          .from('job_board')
          .delete()
          .eq('user_id', userProfile.id)
          .eq('job_reference_id', jobReferenceId);

        if (boardDeleteError) {
          console.error('Error deleting from job board:', boardDeleteError);
          // Don't show error for this as the main action was successful
        }
      }, 5, 'delete job from tracker');

      // Success - show message immediately
      toast.success('Job deleted from tracker successfully!');
      
      // Refresh data with separate error handling
      try {
        await fetchJobs();
      } catch (refreshError) {
        console.error('Error refreshing job data after tracker delete:', refreshError);
        // Don't show error to user, the main operation succeeded
      }
    } catch (err) {
      console.error('Error deleting job from tracker:', err);
      toast.error('Failed to delete job from tracker. Please try again.');
    }
  };

  const forceRefresh = async () => {
    try {
      // Clear error state immediately and show loading
      setError(null);
      setConnectionIssue(false);
      setLoading(true);
      
      // Clear existing data to force complete refresh
      setPostedTodayJobs([]);
      setLast7DaysJobs([]);
      setSavedToTrackerJobs([]);
      setJobTrackerStatus({});
      
      // Force refresh the data
      await fetchJobs(true);
      
      console.log('Job board data refreshed successfully');
    } catch (err) {
      console.error('Force refresh failed:', err);
      setError(err as Error);
      setConnectionIssue(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch jobs after authentication is ready
    if (isAuthReady || !clerkUser) {
      fetchJobs();
    }

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
  }, [isAuthReady, clerkUser]);

  return {
    postedTodayJobs,
    last7DaysJobs,
    savedToTrackerJobs,
    jobTrackerStatus,
    loading,
    error,
    connectionIssue,
    forceRefresh,
    saveToTracker,
    markJobAsSaved,
    deleteJobFromBoard,
    deleteJobFromTracker
  };
};