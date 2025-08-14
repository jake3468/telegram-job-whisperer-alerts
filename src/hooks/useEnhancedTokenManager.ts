
import { useUser, useAuth } from '@clerk/clerk-react';
import { useCallback, useRef, useState, useEffect } from 'react';
import { setClerkToken } from '@/integrations/supabase/client';

interface TokenManager {
  refreshCount: number;
  lastRefresh: number;
  isRefreshing: boolean;
  failureCount: number;
}

const globalTokenManager: TokenManager = {
  refreshCount: 0,
  lastRefresh: 0,
  isRefreshing: false,
  failureCount: 0
};

// Global token cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export const useEnhancedTokenManager = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if token is still valid (enterprise-grade buffer)
  const isTokenValid = useCallback(() => {
    if (!cachedToken || !tokenExpiry) return false;
    const now = Date.now();
    const bufferTime = 2 * 60 * 1000; // 2 minutes buffer (enterprise standard)
    return (tokenExpiry - now) > bufferTime;
  }, []);

  // Enhanced token refresh with exponential backoff
  const refreshToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    if (!user || !getToken) return null;

    // Use cached token if still valid and not forcing refresh
    if (!forceRefresh && isTokenValid()) {
      return cachedToken;
    }

    // Prevent concurrent refresh attempts
    if (globalTokenManager.isRefreshing) {
      // Wait for ongoing refresh to complete
      let attempts = 0;
      while (globalTokenManager.isRefreshing && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      return cachedToken;
    }

    globalTokenManager.isRefreshing = true;
    
    // Exponential backoff for failures
    const backoffDelay = Math.min(1000 * Math.pow(2, globalTokenManager.failureCount), 30000);
    
    try {
      if (globalTokenManager.failureCount > 0) {
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }

      const token = await getToken({ 
        template: 'supabase', 
        skipCache: true 
      });

      if (token) {
        // Decode JWT to get expiration
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          tokenExpiry = payload.exp * 1000; // Convert to milliseconds
        } catch (e) {
          // Fallback: assume 4 hour expiry
          tokenExpiry = Date.now() + (4 * 60 * 60 * 1000);
        }

        cachedToken = token;
        globalTokenManager.lastRefresh = Date.now();
        globalTokenManager.refreshCount++;
        globalTokenManager.failureCount = 0;

        const success = await setClerkToken(token);
        if (success) {
          
          return token;
        }
      }

      throw new Error('Failed to set token');
    } catch (error) {
      globalTokenManager.failureCount++;
      console.error(`[TokenManager] Token refresh failed (attempt ${globalTokenManager.failureCount}):`, error);
      
      // Reset refresh flag after failure
      setTimeout(() => {
        globalTokenManager.isRefreshing = false;
      }, backoffDelay);
      
      return null;
    } finally {
      globalTokenManager.isRefreshing = false;
    }
  }, [user, getToken, isTokenValid]);

  // Initialize token on mount
  useEffect(() => {
    const initializeToken = async () => {
      if (!user || !getToken) return;
      
      const token = await refreshToken(true);
      setIsReady(!!token);
    };

    initializeToken();
  }, [user, getToken, refreshToken]);

  // Professional token refresh (every 5 minutes for active users)
  useEffect(() => {
    if (!isReady) return;

    let userActivity = Date.now();
    
    // Track user activity
    const updateActivity = () => {
      userActivity = Date.now();
    };
    
    // Add activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    const proactiveRefresh = setInterval(async () => {
      const timeSinceActivity = Date.now() - userActivity;
      
      // Only refresh if user was active in the last 10 minutes
      if (timeSinceActivity < 10 * 60 * 1000) {
        if (!isTokenValid()) {
          await refreshToken(true);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(proactiveRefresh);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [isReady, refreshToken, isTokenValid]);

  return {
    refreshToken,
    isReady,
    isTokenValid,
    tokenStats: {
      refreshCount: globalTokenManager.refreshCount,
      lastRefresh: globalTokenManager.lastRefresh,
      failureCount: globalTokenManager.failureCount
    }
  };
};
