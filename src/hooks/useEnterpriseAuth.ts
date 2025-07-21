
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
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  // More conservative token refresh - refresh 3 minutes before expiration
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
        
        // Schedule refresh 3 minutes before expiration (more conservative)
        const refreshTime = Math.max(timeUntilExpiry - (3 * 60 * 1000), 30000); // At least 30 seconds
        
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        refreshTimeoutRef.current = setTimeout(async () => {
          await refreshToken();
        }, refreshTime);
      }
    } catch (error) {
      // Silent error handling - don't log token refresh scheduling errors
    }
  }, [user, getToken]);

  // Enhanced token refresh with silent error handling
  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (!user || !getToken) return null;
    
    // If already refreshing, return the existing promise
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    
    setIsRefreshing(true);
    
    const refreshPromise = (async () => {
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const token = await getToken({ template: 'supabase', skipCache: true });
          
          if (token && token !== lastTokenRef.current) {
            const success = await setClerkToken(token);
            if (success) {
              lastTokenRef.current = token;
              
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
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Exponential backoff: wait 1s, 2s, 4s
            const delay = Math.pow(2, retryCount - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      return null;
    })();
    
    refreshPromise.finally(() => {
      setIsRefreshing(false);
      refreshPromiseRef.current = null;
    });
    
    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [user, getToken, scheduleTokenRefresh]);

  // Enhanced request executor with silent JWT error handling
  const executeWithRetry = useCallback(async <T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    description: string = 'database operation'
  ): Promise<T> => {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        // If currently refreshing, wait for it to complete
        if (refreshPromiseRef.current) {
          await refreshPromiseRef.current;
          // Add delay to ensure token propagation
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const result = await requestFn();
        return result;
      } catch (error: any) {
        attempts++;
        
        // Check if it's a JWT expiration error
        const isJWTError = error?.message?.toLowerCase().includes('jwt') || 
                          error?.message?.toLowerCase().includes('expired') ||
                          error?.message?.toLowerCase().includes('unauthorized') ||
                          error?.code === 'PGRST301';
        
        if (isJWTError && attempts < maxRetries) {
          // Silent JWT error handling - don't log these errors
          
          // If already refreshing, queue the request
          if (isRefreshing || refreshPromiseRef.current) {
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
            // Wait for the token to propagate
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue; // Retry the request
          }
        }
        
        // For non-JWT errors or max retries reached, throw a user-friendly error
        if (attempts >= maxRetries) {
          // Convert technical errors to user-friendly messages
          if (isJWTError) {
            throw new Error('Please refresh the page to continue');
          }
          throw error;
        }
        
        // Wait before retry for non-JWT errors
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
    
    throw new Error(`Operation failed after ${maxRetries} attempts`);
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
            const token = await getToken({ template: 'supabase', skipCache: true });
            return token;
          } catch (error) {
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
          }
        }
      } catch (error) {
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
      refreshPromiseRef.current = null;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    }
  }, [user, isAuthReady]);

  return {
    isAuthReady,
    isRefreshing,
    executeWithRetry,
    refreshToken
  };
};
