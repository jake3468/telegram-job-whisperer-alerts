
import { useCallback } from 'react';
import { useEnterpriseSessionManager } from './useEnterpriseSessionManager';
import { makeAuthenticatedRequest as makeAuthenticatedRequestClient } from '@/integrations/supabase/client';

interface APIRequestOptions {
  maxRetries?: number;
  silentRetry?: boolean;
  retryDelays?: number[];
}

export const useEnterpriseAPIClient = () => {
  const { refreshToken, isTokenValid, updateActivity } = useEnterpriseSessionManager();

  // Less aggressive API request wrapper with better error handling
  const makeAuthenticatedRequest = useCallback(async <T>(
    operation: () => Promise<T>,
    options: APIRequestOptions = {}
  ): Promise<T> => {
    const {
      maxRetries = 2, // Reduced from 3 to 2
      silentRetry = true,
      retryDelays = [1000, 2000] // Reduced retry delays
    } = options;

    // Update user activity
    updateActivity();

    // Less aggressive pre-request token validation
    if (!isTokenValid()) {
      console.log('[EnterpriseAPI] Token expired, refreshing...');
      await refreshToken(true);
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Success - return result
        if (attempt > 0) {
          console.log(`[EnterpriseAPI] Request succeeded on retry ${attempt}`);
        }
        
        return result;
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries - 1;
        const isAuthError = error?.message?.includes('JWT') || 
                           error?.message?.includes('token') ||
                           error?.message?.includes('unauthorized') ||
                           error?.message?.includes('violates row-level security') ||
                           error?.code === 'PGRST301';

        // For auth errors, try token refresh only once
        if (isAuthError && !isLastAttempt) {
          console.log(`[EnterpriseAPI] Auth error detected, refreshing token (attempt ${attempt + 1})`);
          const newToken = await refreshToken(true);
          
          if (newToken) {
            // Wait before retry
            if (retryDelays[attempt]) {
              await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
            }
            continue;
          }
        }

        // For network errors, retry with delay
        if (!isAuthError && !isLastAttempt && silentRetry) {
          console.log(`[EnterpriseAPI] Network error, retrying (attempt ${attempt + 1}):`, error.message);
          if (retryDelays[attempt]) {
            await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
          }
          continue;
        }

        // Last attempt or non-retryable error
        if (isLastAttempt) {
          console.error(`[EnterpriseAPI] Request failed after ${maxRetries} attempts:`, error);
          
          // Convert technical errors to user-friendly messages
          if (isAuthError) {
            throw new Error('Authentication issue. Please refresh the page and try again.');
          } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
            throw new Error('Network connection issue. Please check your internet and try again.');
          } else {
            // Preserve original error for debugging, but make it user-friendly
            throw new Error(error?.message || 'Something went wrong. Please try again.');
          }
        }

        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Request failed');
  }, [refreshToken, isTokenValid, updateActivity]);

  // Optimistic update wrapper
  const makeOptimisticRequest = useCallback(async <T>(
    operation: () => Promise<T>,
    optimisticUpdate: () => void,
    revertUpdate: () => void,
    options: APIRequestOptions = {}
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Apply optimistic update immediately
      optimisticUpdate();
      
      // Perform actual request
      await makeAuthenticatedRequest(operation, {
        ...options,
        silentRetry: true // Always use silent retry for optimistic updates
      });
      
      return { success: true };
    } catch (error: any) {
      // Revert optimistic update on failure
      revertUpdate();
      
      return { 
        success: false, 
        error: error?.message || 'Please try again'
      };
    }
  }, [makeAuthenticatedRequest]);

  return {
    makeAuthenticatedRequest,
    makeOptimisticRequest
  };
};
