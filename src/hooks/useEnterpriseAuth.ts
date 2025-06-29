
import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect, useRef, useCallback, useState } from 'react';
import { setClerkToken, setTokenRefreshFunction } from '@/integrations/supabase/client';

interface RequestQueueItem {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export const useEnterpriseAuth = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const requestQueueRef = useRef<RequestQueueItem[]>([]);
  const lastTokenRef = useRef<string | null>(null);

  // Proactive token refresh - refresh 5 minutes before expiration
  const scheduleTokenRefresh = useCallback(async () => {
    if (!user || !getToken) return;

    try {
      const token = await getToken({ template: 'supabase', skipCache: true });
      if (token) {
        // Decode JWT to get expiration time
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;
        
        // Schedule refresh 5 minutes before expiration
        const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 30000); // At least 30 seconds
        
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        refreshTimeoutRef.current = setTimeout(async () => {
          await refreshToken();
        }, refreshTime);
        
        console.log(`[EnterpriseAuth] Token refresh scheduled in ${Math.round(refreshTime / 1000)} seconds`);
      }
    } catch (error) {
      console.error('[EnterpriseAuth] Error scheduling token refresh:', error);
    }
  }, [user, getToken]);

  // Enhanced token refresh with retry logic
  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (!user || !getToken || isRefreshing) return null;
    
    console.log('[EnterpriseAuth] Starting token refresh');
    setIsRefreshing(true);
    
    try {
      const token = await getToken({ template: 'supabase', skipCache: true });
      
      if (token && token !== lastTokenRef.current) {
        const success = await setClerkToken(token);
        if (success) {
          lastTokenRef.current = token;
          console.log('[EnterpriseAuth] Token refreshed successfully');
          
          // Process queued requests
          const queuedRequests = [...requestQueueRef.current];
          requestQueueRef.current = [];
          
          for (const item of queuedRequests) {
            try {
              const result = await item.fn();
              item.resolve(result);
            } catch (error) {
              item.reject(error);
            }
          }
          
          // Schedule next refresh
          scheduleTokenRefresh();
          
          return token;
        }
      }
      return token;
    } catch (error) {
      console.error('[EnterpriseAuth] Token refresh failed:', error);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [user, getToken, isRefreshing, scheduleTokenRefresh]);

  // Enterprise-level request executor with automatic retry
  const executeWithRetry = useCallback(async <T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 2
  ): Promise<T> => {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        return await requestFn();
      } catch (error: any) {
        attempts++;
        
        // Check if it's a JWT expiration error
        const isJWTError = error?.message?.toLowerCase().includes('jwt') || 
                          error?.message?.toLowerCase().includes('expired') ||
                          error?.message?.toLowerCase().includes('unauthorized');
        
        if (isJWTError && attempts < maxRetries) {
          console.log(`[EnterpriseAuth] JWT error detected, attempting refresh (attempt ${attempts}/${maxRetries})`);
          
          // If already refreshing, queue the request
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              requestQueueRef.current.push({
                fn: requestFn,
                resolve,
                reject
              });
            });
          }
          
          // Try to refresh token
          const newToken = await refreshToken();
          if (newToken) {
            // Wait a bit for the token to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            continue; // Retry the request
          }
        }
        
        // If not a JWT error or max retries reached, throw the error
        throw error;
      }
    }
    
    throw new Error('Max retries exceeded');
  }, [refreshToken, isRefreshing]);

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isLoaded || !user || !getToken) {
        setIsAuthReady(false);
        return;
      }

      try {
        // Set up the token refresh function
        const refreshFunction = async () => {
          try {
            console.log('[EnterpriseAuth] Token refresh function called');
            const token = await getToken({ template: 'supabase', skipCache: true });
            console.log('[EnterpriseAuth] New token obtained from Clerk');
            return token;
          } catch (error) {
            console.error('[EnterpriseAuth] Failed to get token from Clerk:', error);
            return null;
          }
        };

        setTokenRefreshFunction(refreshFunction);

        // Get initial token
        const token = await getToken({ template: 'supabase', skipCache: true });
        
        if (token) {
          const success = await setClerkToken(token);
          if (success) {
            lastTokenRef.current = token;
            setIsAuthReady(true);
            scheduleTokenRefresh();
            console.log('[EnterpriseAuth] Initial authentication setup completed');
          }
        }
      } catch (error) {
        console.error('[EnterpriseAuth] Error in authentication initialization:', error);
        setIsAuthReady(false);
      }
    };

    initializeAuth();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [isLoaded, user, getToken, scheduleTokenRefresh]);

  // Cleanup on user logout
  useEffect(() => {
    if (!user && isAuthReady) {
      setClerkToken(null);
      lastTokenRef.current = null;
      setIsAuthReady(false);
      requestQueueRef.current = [];
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      console.log('[EnterpriseAuth] User logged out, authentication cleared');
    }
  }, [user, isAuthReady]);

  return {
    isAuthReady,
    isRefreshing,
    executeWithRetry,
    refreshToken
  };
};
