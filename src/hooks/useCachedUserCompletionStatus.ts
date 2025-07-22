import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
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
  const { userProfile, loading: profileLoading, refetch: refetchProfile } = useCachedUserProfile();
  const [status, setStatus] = useState<CompletionStatus>(() => {
    // Initialize with cached data if available
    if (!user) {
      return { hasResume: false, hasBio: false, isComplete: false, loading: false, lastChecked: null };
    }

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedCompletionData = JSON.parse(cached);
        const now = Date.now();
        
        // Use cached data if it's for the same user and within cache duration
        if (parsedCache.userId === user.id && now - parsedCache.timestamp < CACHE_DURATION) {
          logger.debug('Initialized with cached user completion status:', parsedCache.status);
          return { ...parsedCache.status, loading: false }; // Ensure loading is false for cached data
        }
      }
    } catch (error) {
      logger.warn('Failed to initialize with cached user completion status:', error);
      localStorage.removeItem(CACHE_KEY);
    }

    // Default state if no valid cache
    return { hasResume: false, hasBio: false, isComplete: false, loading: true, lastChecked: null };
  });

  // Update status based on cached profile data
  useEffect(() => {
    if (!user) {
      setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false, lastChecked: new Date() });
      return;
    }

    if (profileLoading) {
      setStatus(prev => ({ ...prev, loading: true }));
      return;
    }

    if (userProfile) {
      const hasResume = !!(userProfile.resume && userProfile.resume.trim().length > 0);
      const hasBio = !!(userProfile.bio && userProfile.bio.trim().length > 0);
      const isComplete = hasResume && hasBio;

      // Only log in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log('Profile completion check from cached data:', {
          userId: user.id,
          hasResume,
          hasBio,
          isComplete
        });
      }

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
        logger.debug('Cached user completion status from profile data:', newStatus);
      } catch (cacheError) {
        logger.warn('Failed to cache user completion status:', cacheError);
      }
    }
  }, [user?.id, userProfile, profileLoading]);

  const refetchStatus = async () => {
    // Invalidate cache and force profile refresh
    localStorage.removeItem(CACHE_KEY);
    await refetchProfile();
  };

  return {
    ...status,
    refetchStatus
  };
};