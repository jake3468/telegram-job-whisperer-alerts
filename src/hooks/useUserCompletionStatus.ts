
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface CompletionStatus {
  hasResume: boolean;
  hasBio: boolean;
  isComplete: boolean;
  loading: boolean;
}

export const useUserCompletionStatus = (): CompletionStatus => {
  const { user } = useUser();
  const [status, setStatus] = useState<CompletionStatus>({
    hasResume: false,
    hasBio: false,
    isComplete: false,
    loading: true,
  });

  useEffect(() => {
    const checkUserCompletion = async () => {
      if (!user) {
        setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false });
        return;
      }

      try {
        // Get user's database ID - single attempt, no retries
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .maybeSingle();

        if (userError || !userData) {
          console.warn('User not found in database:', userError?.message);
          setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false });
          return;
        }

        // Check for resume
        let hasResume = false;
        try {
          const { data: resumeData, error: resumeError } = await supabase.storage
            .from('resumes')
            .list(user.id, {
              limit: 1,
              search: 'resume.pdf'
            });

          hasResume = !resumeError && resumeData && resumeData.length > 0;
        } catch (error) {
          console.warn('Resume check failed:', error);
          hasResume = false;
        }

        // Check for bio - single attempt, no retries
        let hasBio = false;
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profile')
            .select('bio')
            .eq('user_id', userData.id)
            .maybeSingle();

          hasBio = !profileError && profileData?.bio && profileData.bio.trim().length > 0;
        } catch (error) {
          console.warn('Bio check failed:', error);
          hasBio = false;
        }

        const isComplete = hasResume && hasBio;

        setStatus({
          hasResume,
          hasBio,
          isComplete,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking user completion status:', error);
        // On error, assume incomplete rather than showing false warnings
        setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false });
      }
    };

    // Add a longer delay to prevent rapid successive calls and allow JWT refresh
    const timeoutId = setTimeout(checkUserCompletion, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [user]);

  return status;
};
