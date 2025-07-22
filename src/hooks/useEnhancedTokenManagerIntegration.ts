import { useEffect } from 'react';
import { useEnterpriseSessionManager } from './useEnterpriseSessionManager';
import { setEnterpriseSessionManager } from '@/integrations/supabase/client';

/**
 * Integration hook that connects the enterprise session manager to the Supabase client
 * This ensures all API calls use enterprise-grade session management with silent token refresh
 */
export const useEnhancedTokenManagerIntegration = () => {
  const sessionManager = useEnterpriseSessionManager();

  useEffect(() => {
    // Connect the enterprise session manager to the Supabase client
    setEnterpriseSessionManager(sessionManager);
    
    return () => {
      // Cleanup on unmount
      setEnterpriseSessionManager(null);
    };
  }, [sessionManager]);

  return sessionManager;
};