
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
        // Check for resume
        const { data: resumeData, error: resumeError } = await supabase.storage
          .from('resumes')
          .list(user.id, {
            limit: 1,
            search: 'resume.pdf'
          });

        const hasResume = !resumeError && resumeData && resumeData.length > 0;

        // Check for bio
        const { data: bioData, error: bioError } = await supabase
          .from('users')
          .select('bio')
          .eq('clerk_id', user.id)
          .single();

        const hasBio = !bioError && bioData?.bio && bioData.bio.trim().length > 0;

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
