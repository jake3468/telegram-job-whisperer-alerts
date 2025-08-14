import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { useAuthenticationValidator } from './useAuthenticationValidator';
import { logger } from '@/utils/logger';

/**
 * Enhanced user profile hook with better error handling and validation
 */
export const useEnhancedUserProfile = () => {
  const auth = useAuthenticationValidator();
  const { userProfile, loading, error, updateUserProfile, refetch } = useUserProfile();
  const [enhancedError, setEnhancedError] = useState<string | null>(null);

  // Combine authentication and profile errors
  useEffect(() => {
    if (auth.error) {
      setEnhancedError(auth.error);
    } else if (error) {
      setEnhancedError(error);
    } else {
      setEnhancedError(null);
    }
  }, [auth.error, error]);

  // Enhanced loading state
  const isLoading = auth.isLoading || loading;

  // Enhanced validation
  const isReady = auth.isValid && !isLoading && !enhancedError;


  return {
    userProfile,
    loading: isLoading,
    error: enhancedError,
    updateUserProfile,
    refetch,
    isReady,
    clerkUserId: auth.clerkUserId,
    isAuthValid: auth.isValid
  };
};