
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { useEnterpriseSessionManager } from '@/hooks/useEnterpriseSessionManager';
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
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes - synchronized with profile cache

export const useCachedUserCompletionStatus = (): CompletionStatus & { refetchStatus: () => Promise<void> } => {
  const { user } = useUser();
  const { userProfile, loading: profileLoading, refetch: refetchProfile, isShowingCachedData } = useCachedUserProfile();
  const sessionManager = useEnterpriseSessionManager();
  
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
          return { ...parsedCache.status, loading: false };
        }
      }
    } catch (error) {
      logger.warn('Failed to initialize with cached user completion status:', error);
      localStorage.removeItem(CACHE_KEY);
    }

    // Default state if no valid cache
    return { hasResume: false, hasBio: false, isComplete: false, loading: true, lastChecked: null };
  });

  // Check if we should defer completion status checks during token refresh
  const shouldDeferCheck = () => {
    if (!sessionManager) return false;
    
    // Check if token is currently being refreshed
    const sessionStats = sessionManager.sessionStats;
    const timeSinceLastActivity = Date.now() - sessionStats.lastActivity;
    
    // If session manager is not ready or token is being refreshed, defer
    if (!sessionManager.isReady || timeSinceLastActivity > 30000) {
      return true;
    }
    
    return false;
  };

  // Update status based on cached profile data with token awareness
  useEffect(() => {
    if (!user) {
      setStatus({ hasResume: false, hasBio: false, isComplete: false, loading: false, lastChecked: new Date() });
      return;
    }

    // If we're showing cached profile data or session is not ready, show loading
    if (profileLoading || shouldDeferCheck()) {
      setStatus(prev => ({ ...prev, loading: true }));
      return;
    }

    if (userProfile) {
      // Use the resume text field as specified by the user
      const hasResume = !!(userProfile.resume && userProfile.resume.trim().length > 0);
      const hasBio = !!(userProfile.bio && userProfile.bio.trim().length > 0);
      const isComplete = hasResume && hasBio;

      // Only log in development environment and not too frequently
      if (process.env.NODE_ENV === 'development') {
        const lastLogTime = localStorage.getItem('completion_status_last_log');
        const now = Date.now();
        if (!lastLogTime || now - parseInt(lastLogTime) > 5 * 60 * 1000) {
          console.log('Profile completion check from cached data:', {
            userId: user.id,
            hasResume,
            hasBio,
            isComplete,
            isShowingCachedData,
            sessionReady: sessionManager?.isReady
          });
          localStorage.setItem('completion_status_last_log', now.toString());
        }
      }

      const newStatus = {
        hasResume,
        hasBio,
        isComplete,
        loading: false,
        lastChecked: new Date(),
      };

      setStatus(newStatus);

      // Cache the data with synchronized timestamp
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
    } else if (!isShowingCachedData) {
      // Only show loading if we're not showing cached data
      setStatus(prev => ({ ...prev, loading: true }));
    }
  }, [user?.id, userProfile, profileLoading, isShowingCachedData, sessionManager?.isReady]);

  const refetchStatus = async () => {
    // Invalidate cache and force profile refresh
    localStorage.removeItem(CACHE_KEY);
    
    // Clear completion status log to allow fresh logging
    localStorage.removeItem('completion_status_last_log');
    
    // Force refresh of profile data
    await refetchProfile();
  };

  return {
    ...status,
    refetchStatus
  };
};
