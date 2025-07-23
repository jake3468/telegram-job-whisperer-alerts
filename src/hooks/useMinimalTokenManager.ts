import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const useMinimalTokenManager = (isActive: boolean = true) => {
  const { getToken } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef<boolean>(false);

  // Update activity timestamp (no aggressive tracking)
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Minimal token refresh - only when explicitly needed
  const refreshTokenIfNeeded = useCallback(async () => {
    if (isRefreshingRef.current || !getToken) return null;
    
    try {
      isRefreshingRef.current = true;
      const token = await getToken({ template: 'supabase' });
      return token;
    } catch (error) {
      console.error('[MinimalTokenManager] Token refresh failed:', error);
      return null;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [getToken]);

  // No aggressive intervals - just provide utilities
  useEffect(() => {
    if (isActive) {
      // Update activity on mount
      updateActivity();
    }
  }, [isActive, updateActivity]);

  return {
    updateActivity,
    refreshTokenIfNeeded
  };
};