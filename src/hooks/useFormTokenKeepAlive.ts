import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setClerkToken } from '@/integrations/supabase/client';

export const useFormTokenKeepAlive = (isFormActive: boolean = true) => {
  const { getToken } = useAuth();
  const keepAliveIntervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef<boolean>(false);

  // Silent token refresh function
  const silentTokenRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    
    try {
      isRefreshingRef.current = true;
      const token = await getToken({ template: 'supabase', skipCache: true });
      
      if (token) {
        await setClerkToken(token);
        console.log('[FormTokenKeepAlive] Token silently refreshed');
      }
    } catch (error) {
      console.error('[FormTokenKeepAlive] Silent token refresh failed:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [getToken]);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Set up keep-alive mechanism
  useEffect(() => {
    if (!isFormActive || !getToken) {
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
  }, [isFormActive, getToken, silentTokenRefresh]);

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
