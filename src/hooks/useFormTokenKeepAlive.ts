import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useEnhancedTokenManagerIntegration } from './useEnhancedTokenManagerIntegration';

export const useFormTokenKeepAlive = (isFormActive: boolean = true) => {
  const { getToken } = useAuth();
  const sessionManager = useEnhancedTokenManagerIntegration();
  const keepAliveIntervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef<boolean>(false);

  // Silent token refresh function
  const silentTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current || !sessionManager) return;
    
    try {
      isRefreshingRef.current = true;
      
      // Use the enterprise session manager to refresh token
      const token = await sessionManager.refreshToken(true);
      
      if (token) {
        console.log('[FormTokenKeepAlive] Token silently refreshed via enterprise session manager');
      } else {
        console.warn('[FormTokenKeepAlive] Failed to refresh token');
      }
    } catch (error) {
      console.error('[FormTokenKeepAlive] Silent token refresh failed:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [getToken, sessionManager]);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Set up keep-alive mechanism
  useEffect(() => {
    if (!isFormActive || !getToken || !sessionManager) {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      return;
    }

    // Immediately refresh token when form becomes active
    silentTokenRefresh();

    // Refresh token every 30 seconds while form is active (more aggressive)
    keepAliveIntervalRef.current = setInterval(async () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // Only refresh if user was active in the last 10 minutes
      if (timeSinceLastActivity < 10 * 60 * 1000) {
        await silentTokenRefresh();
      }
    }, 30000); // 30 seconds

    return () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
    };
  }, [isFormActive, getToken, sessionManager, silentTokenRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
    };
  }, []);

  return {
    updateActivity,
    silentTokenRefresh
  };
};
