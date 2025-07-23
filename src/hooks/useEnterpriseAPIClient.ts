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

  // Enterprise-grade API request wrapper with silent authentication recovery
  const makeAuthenticatedRequest = useCallback(async <T>(
    operation: () => Promise<T>,
    options: APIRequestOptions = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      silentRetry = true,
      retryDelays = [500, 1000, 2000]
    } = options;

    console.log('[EnterpriseAPI] Starting authenticated request with options:', options);

    // Update user activity
    updateActivity();

    // Pre-request token validation (only if token is clearly expired)
    const tokenValid = isTokenValid();
    console.log('[EnterpriseAPI] Token valid before request:', tokenValid);
    
    if (!tokenValid) {
      console.log('[EnterpriseAPI] Pre-validating token...');
      const newToken = await refreshToken(true);
      console.log('[EnterpriseAPI] Token refresh result:', !!newToken);
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
        console.error(`[EnterpriseAPI] Request failed on attempt ${attempt + 1}:`, error);
        
        const isLastAttempt = attempt === maxRetries - 1;
        const isAuthError = error?.message?.includes('JWT') || 
                           error?.message?.includes('token') ||
                           error?.message?.includes('unauthorized') ||
                           error?.message?.includes('Row Level Security') ||
                           error?.code === 'PGRST301' ||
                           error?.code === '42501';

        console.log(`[EnterpriseAPI] Error analysis: isAuthError=${isAuthError}, isLastAttempt=${isLastAttempt}`);

        // For auth errors, try token refresh
        if (isAuthError && !isLastAttempt) {
          console.log(`[EnterpriseAPI] Auth error detected, refreshing token (attempt ${attempt + 1})`);
          const newToken = await refreshToken(true);
          console.log(`[EnterpriseAPI] Token refresh for retry result:`, !!newToken);
          
          if (newToken) {
            // Wait before retry
            if (retryDelays[attempt]) {
              console.log(`[EnterpriseAPI] Waiting ${retryDelays[attempt]}ms before retry`);
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
            throw new Error('Please try again');
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