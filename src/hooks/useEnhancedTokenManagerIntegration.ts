
import { useEffect } from 'react';
import { useEnterpriseSessionManager } from './useEnterpriseSessionManager';
import { setEnterpriseSessionManager } from '@/integrations/supabase/client';

interface UseEnhancedTokenManagerIntegrationOptions {
  enabled?: boolean;
}

/**
 * Integration hook that connects the enterprise session manager to the Supabase client
 * This ensures all API calls use enterprise-grade session management with silent token refresh
 */
export const useEnhancedTokenManagerIntegration = (options: UseEnhancedTokenManagerIntegrationOptions = {}) => {
  const { enabled = true } = options;
  
  // Always call the hook but conditionally initialize based on enabled flag
  const sessionManager = useEnterpriseSessionManager();

  useEffect(() => {
    // Only connect if enabled
    if (!enabled) {
      console.log('[TokenManagerIntegration] Token manager integration disabled');
      return;
    }

    if (!sessionManager) {
      console.log('[TokenManagerIntegration] Session manager not ready yet');
      return;
    }

    try {
      console.log('[TokenManagerIntegration] Connecting enterprise session manager to Supabase client');
      
      // Connect the enterprise session manager to the Supabase client
      setEnterpriseSessionManager(sessionManager);
      
      // Force an initial token refresh to ensure authentication
      if (sessionManager.refreshToken) {
        sessionManager.refreshToken(true).then((token: string | null) => {
          if (token) {
            console.log('[TokenManagerIntegration] Initial token refresh completed successfully');
          } else {
            console.error('[TokenManagerIntegration] Initial token refresh failed');
          }
        }).catch((error: any) => {
          console.error('[TokenManagerIntegration] Initial token refresh error:', error);
        });
      }
      
      return () => {
        console.log('[TokenManagerIntegration] Cleaning up enterprise session manager');
        // Cleanup on unmount or when disabled
        setEnterpriseSessionManager(null);
      };
    } catch (error) {
      console.error('[TokenManagerIntegration] Failed to connect enterprise session manager:', error);
    }
  }, [sessionManager, enabled]);

  // Return the session manager interface only if enabled, otherwise return null
  return enabled && sessionManager ? {
    refreshToken: sessionManager.refreshToken,
    updateActivity: sessionManager.updateActivity,
    isTokenValid: sessionManager.isTokenValid,
    getCurrentToken: sessionManager.getCurrentToken,
    sessionStats: sessionManager.sessionStats
  } : null;
};
