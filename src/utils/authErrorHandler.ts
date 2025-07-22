/**
 * Professional authentication error handling utility
 * Converts technical errors to user-friendly messages and provides recovery strategies
 */

export interface AuthError {
  isAuthError: boolean;
  userMessage: string;
  shouldRetry: boolean;
  retryDelay: number;
  recoveryAction: 'silent_retry' | 'token_refresh' | 'page_refresh' | 'user_action';
}

/**
 * Analyzes an error and determines the appropriate user-friendly response
 */
export const analyzeAuthError = (error: any, attemptCount: number = 0): AuthError => {
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  const lowerMessage = errorMessage.toLowerCase();

  // Check for authentication-related errors
  const isAuthError = 
    lowerMessage.includes('jwt') ||
    lowerMessage.includes('token') ||
    lowerMessage.includes('expired') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('auth') ||
    lowerMessage.includes('session') ||
    lowerMessage.includes('clerk') ||
    lowerMessage.includes('supabase') ||
    lowerMessage.includes('rls') ||
    lowerMessage.includes('policy') ||
    lowerMessage.includes('permission') ||
    error?.code === 'PGRST301';

  // Handle authentication errors
  if (isAuthError) {
    if (attemptCount === 0) {
      return {
        isAuthError: true,
        userMessage: 'Saving...',
        shouldRetry: true,
        retryDelay: 500,
        recoveryAction: 'silent_retry'
      };
    } else if (attemptCount < 3) {
      return {
        isAuthError: true,
        userMessage: 'Reconnecting...',
        shouldRetry: true,
        retryDelay: 1000 * attemptCount,
        recoveryAction: 'token_refresh'
      };
    } else {
      return {
        isAuthError: true,
        userMessage: 'Connection issue. Please try again.',
        shouldRetry: false,
        retryDelay: 0,
        recoveryAction: 'user_action'
      };
    }
  }

  // Handle network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('500') ||
    lowerMessage.includes('502') ||
    lowerMessage.includes('503') ||
    lowerMessage.includes('504')
  ) {
    if (attemptCount < 2) {
      return {
        isAuthError: false,
        userMessage: 'Saving...',
        shouldRetry: true,
        retryDelay: 1000,
        recoveryAction: 'silent_retry'
      };
    } else {
      return {
        isAuthError: false,
        userMessage: 'Connection issue. Please check your internet and try again.',
        shouldRetry: false,
        retryDelay: 0,
        recoveryAction: 'user_action'
      };
    }
  }

  // Handle all other errors
  return {
    isAuthError: false,
    userMessage: 'Unable to save. Please try again.',
    shouldRetry: false,
    retryDelay: 0,
    recoveryAction: 'user_action'
  };
};

/**
 * User-friendly error messages for common scenarios
 */
export const getProgressiveErrorMessage = (attemptCount: number): string => {
  switch (attemptCount) {
    case 0:
      return 'Saving...';
    case 1:
      return 'Reconnecting...';
    case 2:
      return 'Still trying...';
    default:
      return 'Connection issue. Please try again.';
  }
};