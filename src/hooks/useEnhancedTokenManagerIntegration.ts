import { useEffect } from 'react';
import { useEnhancedTokenManager } from './useEnhancedTokenManager';
import { setEnhancedTokenManager } from '@/integrations/supabase/client';

/**
 * Integration hook that connects the enhanced token manager to the Supabase client
 * This ensures all API calls use the same enterprise-grade token management
 */
export const useEnhancedTokenManagerIntegration = () => {
  const tokenManager = useEnhancedTokenManager();

  useEffect(() => {
    // Connect the enhanced token manager to the Supabase client
    setEnhancedTokenManager(tokenManager);
    
    return () => {
      // Cleanup on unmount
      setEnhancedTokenManager(null);
    };
  }, [tokenManager]);

  return tokenManager;
};