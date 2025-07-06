
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface CompletionStatus {
  hasResume: boolean;
  hasBio: boolean;
  isComplete: boolean;
  loading: boolean;
  lastChecked: Date | null;
}

export const useUserCompletionStatus = (): CompletionStatus & { refetchStatus: () => Promise<void> } => {
  const { user } = useUser();
  const [status, setStatus] = useState<CompletionStatus>({
    hasResume: false,
    hasBio: false,
    isComplete: false,
    loading: true,
    lastChecked: null,
  });

  const checkUserCompletion = async () => {
    if (!user) {
      setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false, lastChecked: new Date() });
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true }));

      // Get user's database ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .maybeSingle();

      if (userError || !userData) {
        console.warn('User not found in database:', userError?.message);
        setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false, lastChecked: new Date() });
        return;
      }

      // Check for resume with better error handling
      let hasResume = false;
      try {
        const { data: resumeData, error: resumeError } = await supabase.storage
          .from('resumes')
          .list(user.id, {
            limit: 1,
            search: 'resume.pdf'
          });

        hasResume = !resumeError && resumeData && resumeData.length > 0;
        console.log('Resume check result:', { hasResume, resumeData: resumeData?.length, resumeError });
      } catch (error) {
        console.warn('Resume check failed:', error);
        hasResume = false;
      }

      // Check for bio with better error handling
      let hasBio = false;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('bio')
          .eq('user_id', userData.id)
          .maybeSingle();

        hasBio = !profileError && profileData?.bio && profileData.bio.trim().length > 0;
        console.log('Bio check result:', { hasBio, bioLength: profileData?.bio?.length, profileError });
      } catch (error) {
        console.warn('Bio check failed:', error);
        hasBio = false;
      }

      const isComplete = hasResume && hasBio;
      console.log('Profile completion status:', { hasResume, hasBio, isComplete });

      setStatus({
        hasResume,
        hasBio,
        isComplete,
        loading: false,
        lastChecked: new Date(),
      });
    } catch (error) {
      console.error('Error checking user completion status:', error);
      setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false, lastChecked: new Date() });
    }
  };

  const refetchStatus = async () => {
    await checkUserCompletion();
  };

  useEffect(() => {
    // Initial check with a small delay to allow for JWT refresh
    const timeoutId = setTimeout(checkUserCompletion, 500);
    
    return () => clearTimeout(timeoutId);
  }, [user]);

  // Auto-refresh completion status every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const intervalId = setInterval(checkUserCompletion, 30000);
    return () => clearInterval(intervalId);
  }, [user]);

  return {
    ...status,
    refetchStatus
  };
};
