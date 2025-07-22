
import { useCallback, useRef, useState, useEffect } from 'react';
import { useEnhancedTokenManager } from './useEnhancedTokenManager';

interface TokenKeepAliveOptions {
  preemptiveRefreshMinutes?: number;
  activityTrackingEnabled?: boolean;
}

export const useOptimizedFormTokenKeepAlive = (
  enabled: boolean = true,
  options: TokenKeepAliveOptions = {}
) => {
  const { 
    refreshToken, 
    isReady, 
    isTokenValid 
  } = useEnhancedTokenManager();
  
  const {
    preemptiveRefreshMinutes = 10,
    activityTrackingEnabled = true
  } = options;

  const lastActivityRef = useRef<number>(Date.now());
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    if (!activityTrackingEnabled) return;
    lastActivityRef.current = Date.now();
  }, [activityTrackingEnabled]);

  // Smart token refresh with validation
  const smartTokenRefresh = useCallback(async (): Promise<boolean> => {
    if (!enabled || !isReady) return false;

    // Skip if token is still valid for the next 10 minutes
    if (isTokenValid()) return true;

    if (isRefreshing) {
      // Wait for ongoing refresh
      let attempts = 0;
      while (isRefreshing && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      return isTokenValid();
    }

    setIsRefreshing(true);
    try {
      const token = await refreshToken(true);
      return !!token;
    } catch (error) {
      console.warn('[TokenKeepAlive] Refresh failed:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [enabled, isReady, isTokenValid, refreshToken, isRefreshing]);

  // Proactive refresh based on activity
  useEffect(() => {
    if (!enabled || !isReady) return;

    const checkAndRefresh = async () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      // Only refresh if user was active in the last 15 minutes
      if (timeSinceActivity < 15 * 60 * 1000) {
        if (!isTokenValid()) {
          await smartTokenRefresh();
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAndRefresh, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [enabled, isReady, isTokenValid, smartTokenRefresh]);

  return {
    updateActivity,
    smartTokenRefresh,
    isReady: isReady && !isRefreshing,
    isRefreshing
  };
};
