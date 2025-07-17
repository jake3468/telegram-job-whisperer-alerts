/**
 * Utility function to convert technical error messages to user-friendly ones
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
  const errorMessage = typeof error === 'string' ? error : error?.message || '';
  const lowerMessage = errorMessage.toLowerCase();

  // Check for various technical error patterns
  if (
    lowerMessage.includes('jwt') ||
    lowerMessage.includes('token') ||
    lowerMessage.includes('expired') ||
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('auth') ||
    lowerMessage.includes('session') ||
    lowerMessage.includes('clerk') ||
    lowerMessage.includes('supabase') ||
    lowerMessage.includes('rls') ||
    lowerMessage.includes('policy') ||
    lowerMessage.includes('permission') ||
    lowerMessage.includes('database') ||
    lowerMessage.includes('postgres') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('500') ||
    lowerMessage.includes('502') ||
    lowerMessage.includes('503') ||
    lowerMessage.includes('504')
  ) {
    return "Please refresh the page to continue";
  }

  // For any other technical errors, also return the generic message
  return "Please refresh the page to continue";
};