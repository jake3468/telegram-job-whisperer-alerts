import { useUser, useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

interface AuthValidationResult {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  clerkUserId: string | null;
}

/**
 * Hook to validate authentication state and provide consistent error handling
 * for UUID format issues and session problems
 */
export const useAuthenticationValidator = (): AuthValidationResult => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [validationState, setValidationState] = useState<AuthValidationResult>({
    isValid: false,
    isLoading: true,
    error: null,
    clerkUserId: null
  });

  useEffect(() => {
    const validateAuth = async () => {
      if (!isLoaded) {
        setValidationState({
          isValid: false,
          isLoading: true,
          error: null,
          clerkUserId: null
        });
        return;
      }

      if (!user) {
        setValidationState({
          isValid: false,
          isLoading: false,
          error: null,
          clerkUserId: null
        });
        return;
      }

      // Validate Clerk user ID format
      if (!user.id || typeof user.id !== 'string' || user.id.length === 0) {
        setValidationState({
          isValid: false,
          isLoading: false,
          error: 'Invalid user session. Please log out and log in again.',
          clerkUserId: null
        });
        return;
      }

      // Validate that we can get a token
      try {
        const token = await getToken();
        if (!token) {
          setValidationState({
            isValid: false,
            isLoading: false,
            error: 'Authentication token not available. Please log in again.',
            clerkUserId: user.id
          });
          return;
        }

        // All validations passed
        setValidationState({
          isValid: true,
          isLoading: false,
          error: null,
          clerkUserId: user.id
        });
      } catch (error) {
        console.error('Token validation error:', error);
        setValidationState({
          isValid: false,
          isLoading: false,
          error: 'Authentication error. Please log in again.',
          clerkUserId: user.id
        });
      }
    };

    validateAuth();
  }, [user, isLoaded, getToken]);

  return validationState;
};

/**
 * Utility function to validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Utility function to handle database UUID errors
 */
export const handleUUIDError = (error: any): string => {
  if (error?.message?.includes('invalid input syntax for type uuid')) {
    if (error.message.includes('user_')) {
      return 'Session error. Please log out and log in again.';
    }
    return 'Data format error. Please contact support.';
  }
  
  return error?.message || 'An unexpected error occurred.';
};