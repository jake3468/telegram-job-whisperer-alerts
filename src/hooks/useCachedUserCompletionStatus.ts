import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface CompletionStatus {
  hasResume: boolean;
  hasBio: boolean;
  isComplete: boolean;
  loading: boolean;
  lastChecked: Date | null;
}

interface CachedCompletionData {
  status: CompletionStatus;
  timestamp: number;
  userId: string;
}

const CACHE_KEY = 'aspirely_user_completion_status_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const useCachedUserCompletionStatus = (): CompletionStatus & { refetchStatus: () => Promise<void> } => {
  const { user } = useUser();
  const [status, setStatus] = useState<CompletionStatus>({
    hasResume: false,
    hasBio: false,
    isComplete: false,
    loading: true,
    lastChecked: null,
  });

  // Load cached data immediately on mount
  useEffect(() => {
    if (!user) {
      setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false, lastChecked: new Date() });
      return;
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedCompletionData = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's for the same user and within cache duration
        if (parsedCache.userId === user.id && now - parsedCache.timestamp < CACHE_DURATION) {
          setStatus(parsedCache.status);
          logger.debug('Loaded cached user completion status:', parsedCache.status);
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached user completion status:', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, [user?.id]);

  // Fetch fresh data when needed
  useEffect(() => {
    if (!user) return;
    
    // Only fetch if we don't have cached data
    const shouldFetch = status.loading || !status.lastChecked;
    if (shouldFetch) {
      checkUserCompletion();
    }
  }, [user?.id]);

  const checkUserCompletion = async (showErrors = false) => {
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
        if (showErrors) {
          console.warn('User not found in database:', userError?.message);
        }
        const fallbackStatus = { hasResume: false, hasBio: false, isComplete: false, loading: false, lastChecked: new Date() };
        setStatus(fallbackStatus);
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
      } catch (error) {
        if (showErrors) {
          console.warn('Resume check failed:', error);
        }
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
      } catch (error) {
        if (showErrors) {
          console.warn('Bio check failed:', error);
        }
        hasBio = false;
      }

      const isComplete = hasResume && hasBio;
      const newStatus = {
        hasResume,
        hasBio,
        isComplete,
        loading: false,
        lastChecked: new Date(),
      };

      setStatus(newStatus);

      // Cache the data
      try {
        const cacheData: CachedCompletionData = {
          status: newStatus,
          timestamp: Date.now(),
          userId: user.id
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        logger.debug('Cached user completion status:', newStatus);
      } catch (cacheError) {
        logger.warn('Failed to cache user completion status:', cacheError);
      }

    } catch (error) {
      if (showErrors) {
        console.error('Error checking user completion status:', error);
      }
      setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false, lastChecked: new Date() });
    }
  };

  const refetchStatus = async () => {
    await checkUserCompletion(true);
  };

  const invalidateCache = () => {
    localStorage.removeItem(CACHE_KEY);
    checkUserCompletion();
  };

  return {
    ...status,
    refetchStatus
  };
};