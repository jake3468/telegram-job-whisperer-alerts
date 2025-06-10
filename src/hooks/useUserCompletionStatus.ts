
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
        // Get user's database ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single();

        if (userError) {
          setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false });
          return;
        }

        // Check for resume
        const { data: resumeData, error: resumeError } = await supabase.storage
          .from('resumes')
          .list(user.id, {
            limit: 1,
            search: 'resume.pdf'
          });

        const hasResume = !resumeError && resumeData && resumeData.length > 0;

        // Check for bio in user_profile table
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('bio')
          .eq('user_id', userData.id)
          .single();

        const hasBio = !profileError && profileData?.bio && profileData.bio.trim().length > 0;

        const isComplete = hasResume && hasBio;

        setStatus({
          hasResume,
          hasBio,
          isComplete,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking user completion status:', error);
        setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false });
      }
    };

    checkUserCompletion();
  }, [user]);

  return status;
};
