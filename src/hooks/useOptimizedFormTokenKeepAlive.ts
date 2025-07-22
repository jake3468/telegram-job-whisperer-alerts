import { useEffect, useRef, useCallback } from 'react';
import { useEnhancedTokenManager } from './useEnhancedTokenManager';

export const useOptimizedFormTokenKeepAlive = (isFormActive: boolean = true) => {
  const { refreshToken, isReady, isTokenValid } = useEnhancedTokenManager();
  const keepAliveIntervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  const componentMountedRef = useRef<boolean>(true);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    if (componentMountedRef.current) {
      lastActivityRef.current = Date.now();
    }
  }, []);

  // Smart token refresh - only when needed
  const smartTokenRefresh = useCallback(async () => {
    if (!componentMountedRef.current || !isReady) return;
    
    try {
      // Only refresh if token is expiring soon or invalid
      if (!isTokenValid()) {
        const token = await refreshToken();
        if (token) {
          console.log('[OptimizedFormKeepAlive] Token refreshed successfully');
        }
      }
    } catch (error) {
      console.error('[OptimizedFormKeepAlive] Token refresh failed:', error);
    }
  }, [refreshToken, isReady, isTokenValid]);

  // Set up optimized keep-alive mechanism
  useEffect(() => {
    if (!isFormActive || !isReady) {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      return;
    }

    // Initial token check
    smartTokenRefresh();

    // Check token every 3 minutes (reduced from 30 seconds)
    keepAliveIntervalRef.current = setInterval(async () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // Only refresh if user was active in the last 20 minutes
      if (timeSinceLastActivity < 20 * 60 * 1000) {
        await smartTokenRefresh();
      }
    }, 3 * 60 * 1000); // 3 minutes

    return () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
    };
  }, [isFormActive, isReady, smartTokenRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
    };
  }, []);

  return {
    updateActivity,
    smartTokenRefresh,
    isReady
  };
};
