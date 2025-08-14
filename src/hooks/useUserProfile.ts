
import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useUserInitialization } from './useUserInitialization';
import { Environment } from '@/utils/environment';
import { UserProfile, UserProfileUpdateData } from '@/types/userProfile';
import { createUserProfileDebugger } from '@/utils/userProfileDebug';
import { getUserFriendlyErrorMessage } from '@/utils/errorMessages';
import { useEnterpriseAPIClient } from './useEnterpriseAPIClient';
import { 
  fetchUserFromDatabase, 
  fetchUserProfile as fetchUserProfileFromService, 
  updateUserProfileInDatabase 
} from '@/services/userProfileService';

const { debugLog } = createUserProfileDebugger();

export const useUserProfile = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { initializeUser } = useUserInitialization();
  const { makeAuthenticatedRequest } = useEnterpriseAPIClient();

  // Check if error is related to authentication/JWT (for logging)
  const isAuthError = (error: any): boolean => {
    const errorMessage = typeof error === 'string' ? error : error?.message || '';
    const lowerMessage = errorMessage.toLowerCase();
    
    return (
      lowerMessage.includes('jwt') ||
      lowerMessage.includes('token') ||
      lowerMessage.includes('expired') ||
      lowerMessage.includes('authentication') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('permission') ||
      error?.code === 'PGRST301' ||
      error?.code === '42501'
    );
  };

  const fetchUserProfile = async () => {
    if (!isLoaded) {
      debugLog('Clerk not loaded yet, waiting...');
      return;
    }

    if (!user) {
      debugLog('No user found, stopping fetch');
      setLoading(false);
      setError(null);
      return;
    }

    // Validate Clerk user ID format
    if (!user.id || user.id.length === 0) {
      debugLog('Invalid Clerk user ID');
      setError('Invalid user session. Please log in again.');
      setLoading(false);
      return;
    }

    // Add timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      debugLog('Profile fetch timed out after 30 seconds');
      setError('Loading took too long. Please refresh the page.');
      setLoading(false);
    }, 30000); // 30 second timeout

    try {
      setError(null);
      debugLog('Starting user profile fetch for Clerk ID:', user.id);

      // Enterprise-grade authenticated request with proper error handling
      const userResult = await makeAuthenticatedRequest(
        () => fetchUserFromDatabase(user.id)
      );
      
      if (userResult.error) {
        debugLog('User fetch error:', userResult.error);
        
        // Handle specific database errors
        if (userResult.error.message?.includes('invalid input syntax for type uuid')) {
          setError('Session error. Please log out and log in again.');
          setLoading(false);
          return;
        }
        
        setError(getUserFriendlyErrorMessage(userResult.error));
        setLoading(false);
        return;
      }

      debugLog('User lookup result:', userResult.data ? 'Found' : 'Not found');

      let finalUserData = userResult.data;

      // If user doesn't exist, initialize them (with deduplication)
      if (!finalUserData) {
        debugLog('User not found in Supabase, initializing...');
        
        const initResult = await initializeUser();
        if (!initResult.success) {
          debugLog('Failed to initialize user:', initResult.error);
          setError(getUserFriendlyErrorMessage(initResult.error));
          setLoading(false);
          return;
        }

        // Fetch user data after initialization with enterprise authentication
        const newUserResult = await makeAuthenticatedRequest(
          () => fetchUserFromDatabase(user.id)
        );

        if (newUserResult.error || !newUserResult.data) {
          debugLog('Error fetching user after initialization:', newUserResult.error);
          setError(getUserFriendlyErrorMessage(newUserResult.error));
          setLoading(false);
          return;
        }

        finalUserData = newUserResult.data;
      }

      if (!finalUserData) {
        debugLog('No user data available after all attempts');
        setError('Unable to load user data. Please refresh the page.');
        setLoading(false);
        return;
      }

      // Validate that we have a proper UUID for the user
      if (!finalUserData.id || typeof finalUserData.id !== 'string') {
        debugLog('Invalid user ID format:', finalUserData.id);
        setError('User data corruption detected. Please contact support.');
        setLoading(false);
        return;
      }

      // Get user profile with enterprise authentication
      const profileResult = await makeAuthenticatedRequest(
        () => fetchUserProfileFromService(finalUserData.id, 1)
      );

      debugLog('Profile lookup result:', profileResult.data ? 'Accessible' : 'Not accessible');
      
      if (profileResult.error) {
        debugLog('Profile lookup error:', profileResult.error);
        
        // Handle specific database errors
        if (profileResult.error.message?.includes('invalid input syntax for type uuid')) {
          setError('Profile data corruption. Please contact support.');
          setLoading(false);
          return;
        }
        
        setError(getUserFriendlyErrorMessage(profileResult.error));
        setLoading(false);
        return;
      }

      if (!profileResult.data) {
        debugLog('No profile found');
        setError('Profile not found. Please contact support.');
        setLoading(false);
        return;
      }

      debugLog('Successfully fetched user profile:', profileResult.data.id);
      setUserProfile(profileResult.data);
      setError(null);
    } catch (error) {
      // Check if this was a timeout abort
      if (error instanceof Error && error.name === 'AbortError') {
        debugLog('Profile fetch was aborted due to timeout');
        return; // Don't set error again, timeout handler already did
      }
      
      debugLog('Error in fetchUserProfile:', error);
      
      // Handle UUID format errors specifically
      if (error instanceof Error && error.message?.includes('invalid input syntax for type uuid')) {
        setError('Session error. Please log out and log in again.');
      } else {
        setError(getUserFriendlyErrorMessage(error));
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: UserProfileUpdateData) => {
    if (!user || !userProfile) {
      debugLog('Update attempt without authentication or profile');
      return { error: 'Please refresh the page and try again.' };
    }

    try {
      debugLog('Attempting profile update for:', userProfile.id);
      
      // Enterprise-grade authenticated request with automatic retry and silent recovery
      const result = await makeAuthenticatedRequest(
        () => updateUserProfileInDatabase(userProfile.id, updates)
      );
      
      if (result.error) {
        throw new Error(result.error.message || 'Update failed');
      }

      // Success - update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      debugLog('Profile updated successfully');
      return { error: null };

    } catch (error) {
      debugLog('Error in updateUserProfile:', error);
      return { error: getUserFriendlyErrorMessage(error) };
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user, isLoaded]);

  return {
    userProfile,
    loading,
    error,
    updateUserProfile,
    refetch: fetchUserProfile
  };
};
