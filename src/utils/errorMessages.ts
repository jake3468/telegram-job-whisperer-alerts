
/**
 * Utility function to convert technical error messages to user-friendly ones
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  const lowerMessage = errorMessage.toLowerCase();

  // JWT and authentication-related errors
  if (
    lowerMessage.includes('jwt') ||
    lowerMessage.includes('token') ||
    lowerMessage.includes('expired') ||
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('auth') ||
    lowerMessage.includes('session') ||
    lowerMessage.includes('clerk') ||
    lowerMessage.includes('rls') ||
    lowerMessage.includes('policy') ||
    lowerMessage.includes('permission') ||
    error?.code === 'PGRST301' ||
    error?.code === '42501'
  ) {
    return "Please try again.";
  }

  // Network and server errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('500') ||
    lowerMessage.includes('502') ||
    lowerMessage.includes('503') ||
    lowerMessage.includes('504')
  ) {
    return "Connection issue. Please check your internet and try again.";
  }

  // Database errors
  if (
    lowerMessage.includes('database') ||
    lowerMessage.includes('postgres') ||
    lowerMessage.includes('supabase')
  ) {
    return "Unable to save. Please try again.";
  }

  // Generic fallback
  return "Something went wrong. Please try again.";
};
