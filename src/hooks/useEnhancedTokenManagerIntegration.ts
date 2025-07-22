
import { useEffect, useState } from 'react';
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
  const [isConnected, setIsConnected] = useState(false);
  
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
      setIsConnected(true);
      
      console.log('[TokenManagerIntegration] Connected enterprise session manager');
      
      return () => {
        // Cleanup on unmount or when disabled
        setEnterpriseSessionManager(null);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect enterprise session manager:', error);
      setIsConnected(false);
    }
  }, [sessionManager?.isReady, enabled]);

  // Return the session manager interface only if enabled and connected
  return enabled && sessionManager && isConnected ? {
    refreshToken: sessionManager.refreshToken,
    updateActivity: sessionManager.updateActivity,
    isTokenValid: sessionManager.isTokenValid,
    getCurrentToken: sessionManager.getCurrentToken,
    sessionStats: sessionManager.sessionStats,
    isConnected
  } : null;
};
