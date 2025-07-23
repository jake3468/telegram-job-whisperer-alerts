
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
    // Only connect if enabled and session manager is ready
    if (!enabled || !sessionManager?.isReady) {
      return;
    }

    try {
      // Connect the enterprise session manager to the Supabase client
      setEnterpriseSessionManager(sessionManager);
      
      return () => {
        // Cleanup on unmount or when disabled
        setEnterpriseSessionManager(null);
      };
    } catch (error) {
      console.error('Failed to connect enterprise session manager:', error);
    }
  }, [sessionManager?.isReady, enabled]);

  // Return the session manager interface only if enabled and ready
  return enabled && sessionManager?.isReady ? {
    refreshToken: sessionManager.refreshToken,
    updateActivity: sessionManager.updateActivity,
    isTokenValid: sessionManager.isTokenValid,
    getCurrentToken: sessionManager.getCurrentToken,
    ensureTokenForOperation: sessionManager.ensureTokenForOperation,
    sessionStats: sessionManager.sessionStats,
    isReady: sessionManager.isReady
  } : null;
};
