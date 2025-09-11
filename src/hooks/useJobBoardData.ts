import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useEnterpriseAuth } from './useEnterpriseAuth';

type JobBoardItem = Tables<'job_board'>;
type JobTrackerItem = Tables<'job_tracker'>;

interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
}

interface SectionPagination {
  postedToday: PaginationState;
  last7Days: PaginationState;
  saved: PaginationState;
}

export const useJobBoardData = () => {
  const { user: clerkUser } = useUser();
  const { executeWithRetry, isAuthReady } = useEnterpriseAuth();
  const navigate = useNavigate();
  const [postedTodayJobs, setPostedTodayJobs] = useState<JobBoardItem[]>([]);
  const [last7DaysJobs, setLast7DaysJobs] = useState<JobBoardItem[]>([]);
  const [savedToTrackerJobs, setSavedToTrackerJobs] = useState<JobBoardItem[]>([]);
  const [jobTrackerStatus, setJobTrackerStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [connectionIssue, setConnectionIssue] = useState(false);
  
  // Section-specific loading states
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({
    postedToday: false,
    last7Days: false,
    saved: false
  });
  const [sectionLoaded, setSectionLoaded] = useState<Record<string, boolean>>({
    postedToday: false,
    last7Days: false,
    saved: false
  });
  
  // Pagination states
  const [pagination, setPagination] = useState<SectionPagination>({
    postedToday: { currentPage: 1, pageSize: 10, totalCount: 0 },
    last7Days: { currentPage: 1, pageSize: 10, totalCount: 0 },
    saved: { currentPage: 1, pageSize: 10, totalCount: 0 }
  });

  const fetchJobsForSection = async (
    section: 'postedToday' | 'last7Days' | 'saved',
    page: number = 1,
    pageSize: number = 10,
    userProfileId?: string
  ) => {
    if (!clerkUser && section === 'saved') return { jobs: [], count: 0 };
    
    const offset = (page - 1) * pageSize;
    
    if (!clerkUser) {
      // For non-logged in users
      const { data: jobBoardData, error: fetchError } = await supabase
        .from('job_board')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (fetchError) throw fetchError;

      const allJobs = jobBoardData || [];
      const today = new Date();
      const twentyThreeHoursAgo = new Date(today.getTime() - 23 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      let filteredJobs: JobBoardItem[] = [];
      if (section === 'postedToday') {
        filteredJobs = allJobs.filter(job => new Date(job.created_at) > twentyThreeHoursAgo);
      } else if (section === 'last7Days') {
        filteredJobs = allJobs.filter(job => {
          const createdAt = new Date(job.created_at);
          return createdAt <= twentyThreeHoursAgo && createdAt > sevenDaysAgo;
        });
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('job_board')
        .select('*', { count: 'exact', head: true });

      return { jobs: filteredJobs, count: count || 0 };
    }

    if (!userProfileId) throw new Error('User profile ID required');

    let query = supabase
      .from('job_board')
      .select('*')
      .eq('user_id', userProfileId);

    if (section === 'postedToday') {
      query = query.eq('section', 'posted_today').eq('is_saved_by_user', false);
    } else if (section === 'last7Days') {
      query = query.eq('section', 'last_7_days').eq('is_saved_by_user', false);
    } else if (section === 'saved') {
      query = query.eq('is_saved_by_user', true);
    }

    const { data: jobs, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (fetchError) throw fetchError;

    // Get count for pagination
    let countQuery = supabase
      .from('job_board')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userProfileId);

    if (section === 'postedToday') {
      countQuery = countQuery.eq('section', 'posted_today').eq('is_saved_by_user', false);
    } else if (section === 'last7Days') {
      countQuery = countQuery.eq('section', 'last_7_days').eq('is_saved_by_user', false);
    } else if (section === 'saved') {
      countQuery = countQuery.eq('is_saved_by_user', true);
    }

    const { count } = await countQuery;

    return { jobs: jobs || [], count: count || 0 };
  };

  // Fast count-only query for initial load
  const fetchAllCounts = async (userProfileId?: string) => {
    const counts = { postedToday: 0, last7Days: 0, saved: 0 };
    
    if (!clerkUser) {
      // For non-logged in users
      const { count } = await supabase
        .from('job_board')
        .select('*', { count: 'exact', head: true });
      
      // Estimate counts based on total (this is approximate)
      counts.postedToday = Math.floor((count || 0) * 0.3);
      counts.last7Days = Math.floor((count || 0) * 0.7);
      counts.saved = 0;
      return counts;
    }

    if (!userProfileId) return counts;

    // Get counts for all sections simultaneously for logged in users
    const [todayCount, weekCount, savedCount] = await Promise.all([
      supabase
        .from('job_board')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfileId)
        .eq('section', 'posted_today')
        .eq('is_saved_by_user', false),
      supabase
        .from('job_board')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfileId)
        .eq('section', 'last_7_days')
        .eq('is_saved_by_user', false),
      supabase
        .from('job_board')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfileId)
        .eq('is_saved_by_user', true)
    ]);

    counts.postedToday = todayCount.count || 0;
    counts.last7Days = weekCount.count || 0;
    counts.saved = savedCount.count || 0;

    return counts;
  };

  const fetchJobs = async (
    forceRefresh = false,
    specificSection?: 'postedToday' | 'last7Days' | 'saved'
  ) => {
    // Set section loading state
    if (specificSection) {
      setSectionLoading(prev => ({ ...prev, [specificSection]: true }));
    }

    if (!clerkUser) {
      // For non-logged in users, still show jobs but without personalization
      return executeWithRetry(async () => {
        if (!specificSection) {
          setLoading(true);
        }
        setError(null);
        setConnectionIssue(false);

        // Initial load: fetch counts for all sections + data for "postedToday" only
        if (!specificSection || specificSection === 'postedToday') {
          const counts = await fetchAllCounts();
          setPagination(prev => ({
            ...prev,
            postedToday: { ...prev.postedToday, totalCount: counts.postedToday },
            last7Days: { ...prev.last7Days, totalCount: counts.last7Days },
            saved: { ...prev.saved, totalCount: counts.saved }
          }));
          
          // Load "Posted Today" data
          const { jobs } = await fetchJobsForSection(
            'postedToday',
            pagination.postedToday.currentPage,
            pagination.postedToday.pageSize
          );
          setPostedTodayJobs(jobs);
          setSectionLoaded(prev => ({ ...prev, postedToday: true }));
        }

        // Load specific section if requested
        if (specificSection && specificSection !== 'postedToday') {
          const { jobs, count } = await fetchJobsForSection(
            specificSection,
            pagination[specificSection].currentPage,
            pagination[specificSection].pageSize
          );

          if (specificSection === 'last7Days') {
            setLast7DaysJobs(jobs);
          }
          
          setPagination(prev => ({
            ...prev,
            [specificSection]: { ...prev[specificSection], totalCount: count }
          }));
          setSectionLoaded(prev => ({ ...prev, [specificSection]: true }));
        }

        setSavedToTrackerJobs([]);
        return;
      }, 3, 'fetch jobs for non-logged user').catch(err => {
        console.error('Error fetching job board data:', err);
        setError(err as Error);
        setConnectionIssue(true);
      }).finally(() => {
        if (!specificSection) {
          setLoading(false);
        }
        if (specificSection) {
          setSectionLoading(prev => ({ ...prev, [specificSection]: false }));
        }
      });
    }

    return executeWithRetry(async () => {
      if (!specificSection) {
        setLoading(true);
      }
      setError(null);
      setConnectionIssue(false);

      // Validate Clerk user ID before database queries
      if (!clerkUser.id || typeof clerkUser.id !== 'string' || clerkUser.id.length === 0) {
        console.error('Invalid Clerk user ID:', clerkUser.id);
        throw new Error('Invalid user session. Please log out and log in again.');
      }

      // Get user data with proper error handling
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUser.id)
        .maybeSingle();

      if (userError) {
        console.error('User fetch error:', userError);
        
        // Handle UUID format errors specifically
        if (userError.message?.includes('invalid input syntax for type uuid')) {
          throw new Error('Session error. Please log out and log in again.');
        }
        
        throw new Error('Failed to fetch user data');
      }

      if (!users) {
        console.error('User not found for Clerk ID:', clerkUser.id);
        throw new Error('User not found. Please refresh the page.');
      }

      // Validate user ID format
      if (!users.id || typeof users.id !== 'string') {
        console.error('Invalid user ID format:', users.id);
        throw new Error('User data corruption. Please contact support.');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', users.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        
        // Handle UUID format errors specifically
        if (profileError.message?.includes('invalid input syntax for type uuid')) {
          throw new Error('Profile data corruption. Please contact support.');
        }
        
        throw new Error('Failed to fetch user profile');
      }

      if (!userProfile) {
        console.error('User profile not found for user ID:', users.id);
        throw new Error('User profile not found. Please contact support.');
      }

      // Initial load: fetch counts for all sections + data for "postedToday" only
      if (!specificSection) {
        const counts = await fetchAllCounts(userProfile.id);
        setPagination(prev => ({
          ...prev,
          postedToday: { ...prev.postedToday, totalCount: counts.postedToday },
          last7Days: { ...prev.last7Days, totalCount: counts.last7Days },
          saved: { ...prev.saved, totalCount: counts.saved }
        }));
        
        // Load "Posted Today" data
        const { jobs } = await fetchJobsForSection(
          'postedToday',
          pagination.postedToday.currentPage,
          pagination.postedToday.pageSize,
          userProfile.id
        );
        setPostedTodayJobs(jobs);
        setSectionLoaded(prev => ({ ...prev, postedToday: true }));
        return;
      }

      // Load specific section when requested
      const { jobs, count } = await fetchJobsForSection(
        specificSection,
        pagination[specificSection].currentPage,
        pagination[specificSection].pageSize,
        userProfile.id
      );

      if (specificSection === 'postedToday') {
        setPostedTodayJobs(jobs);
      } else if (specificSection === 'last7Days') {
        setLast7DaysJobs(jobs);
      } else if (specificSection === 'saved') {
        setSavedToTrackerJobs(jobs);
      }

      setPagination(prev => ({
        ...prev,
        [specificSection]: { ...prev[specificSection], totalCount: count }
      }));
      setSectionLoaded(prev => ({ ...prev, [specificSection]: true }));

      // Check tracker status for saved jobs only if we're fetching saved section
      if (specificSection === 'saved') {
        const trackerStatus: Record<string, boolean> = {};
        if (jobs.length > 0) {
          try {
            const { data: trackerJobs } = await supabase
              .from('job_tracker')
              .select('job_reference_id')
              .eq('user_id', userProfile.id)
              .not('job_reference_id', 'is', null);

            if (trackerJobs) {
              const trackerJobIds = new Set(trackerJobs.map(tj => tj.job_reference_id));
              jobs.forEach(job => {
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
        setJobTrackerStatus(trackerStatus);
      }

    }, 5, 'fetch jobs for logged user').catch(err => {
      console.error('Error fetching job board data:', err);
      setError(err as Error);
      setConnectionIssue(true);
    }).finally(() => {
      if (!specificSection) {
        setLoading(false);
      }
      if (specificSection) {
        setSectionLoading(prev => ({ ...prev, [specificSection]: false }));
      }
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
      toast.success('Job saved! Redirecting to Saved section...');
      
      // Refresh data with separate error handling
      try {
        await fetchJobs();
        // Add navigation callback to trigger tab switch in JobBoard component
        if ((window as any).jobBoardNavigationCallback) {
          (window as any).jobBoardNavigationCallback('saved-to-tracker');
        }
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
        toast.success('Job added to tracker! Redirecting to Job Tracker...');
        
        try {
          await fetchJobs();
          // Navigate to Job Tracker page with refresh state
          navigate('/job-tracker', { state: { refresh: true } });
        } catch (refreshError) {
          console.error('Error refreshing job data after tracker save:', refreshError);
          // Don't show error to user, the main operation succeeded
          // Still navigate even if refresh fails
          navigate('/job-tracker', { state: { refresh: true } });
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

  const loadSectionData = async (section: 'postedToday' | 'last7Days' | 'saved') => {
    if (sectionLoaded[section] && !sectionLoading[section]) {
      return; // Already loaded
    }
    
    try {
      await fetchJobs(false, section);
    } catch (err) {
      console.error(`Error loading ${section} section:`, err);
    }
  };

  const changePage = (section: 'postedToday' | 'last7Days' | 'saved', page: number) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], currentPage: page }
    }));
    
    // Fetch jobs for the specific section with new page
    fetchJobs(false, section);
  };

  const changePageSize = (section: 'postedToday' | 'last7Days' | 'saved', size: number) => {
    setPagination(prev => ({
      ...prev,
      [section]: { ...prev[section], pageSize: size, currentPage: 1 }
    }));
    
    // Fetch jobs for the specific section with new page size
    fetchJobs(false, section);
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
    deleteJobFromTracker,
    pagination,
    changePage,
    changePageSize,
    // New section-specific states and functions
    sectionLoading,
    sectionLoaded,
    loadSectionData
  };
};