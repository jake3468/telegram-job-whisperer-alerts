
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
        // Get user's database ID with retry logic
        let userData = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries && !userData) {
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_id', user.id)
            .single();

          if (!error && data) {
            userData = data;
            break;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 500));
          }
        }

        if (!userData) {
          console.warn('User not found in database after retries');
          setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false });
          return;
        }

        // Check for resume with improved error handling
        let hasResume = false;
        try {
          const { data: resumeData, error: resumeError } = await supabase.storage
            .from('resumes')
            .list(user.id, {
              limit: 1,
              search: 'resume.pdf'
            });

          hasResume = !resumeError && resumeData && resumeData.length > 0;
        } catch (resumeError) {
          console.warn('Resume check failed:', resumeError);
          hasResume = false;
        }

        // Check for bio with improved error handling and retry logic
        let hasBio = false;
        retryCount = 0;

        while (retryCount < maxRetries && !hasBio) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('user_profile')
              .select('bio')
              .eq('user_id', userData.id)
              .single();

            if (!profileError && profileData?.bio && profileData.bio.trim().length > 0) {
              hasBio = true;
              break;
            }

            if (profileError && profileError.code !== 'PGRST116') { // Not "no rows" error
              throw profileError;
            }

            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 300));
            }
          } catch (bioError) {
            console.warn(`Bio check attempt ${retryCount + 1} failed:`, bioError);
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 300));
            }
          }
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

    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(checkUserCompletion, 100);
    
    return () => clearTimeout(timeoutId);
  }, [user]);

  return status;
};
