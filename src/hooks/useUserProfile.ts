
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

    try {
      setError(null);
      debugLog('Starting user profile fetch for:', user.id);

      // Enterprise-grade authenticated request
      const { data: userData, error: userError } = await makeAuthenticatedRequest(
        () => fetchUserFromDatabase(user.id)
      );
      debugLog('User lookup result:', userData ? 'Found' : 'Not found');

      let finalUserData = userData;

      // If user doesn't exist, initialize them (with deduplication)
      if (!userData && !userError) {
        debugLog('User not found in Supabase, initializing...');
        
        const initResult = await initializeUser();
        if (!initResult.success) {
          debugLog('Failed to initialize user:', initResult.error);
          setError(getUserFriendlyErrorMessage(initResult.error));
          setLoading(false);
          return;
        }

        // Fetch user data after initialization with enterprise authentication
        const { data: newUserData, error: newUserError } = await makeAuthenticatedRequest(
          () => fetchUserFromDatabase(user.id)
        );

        if (newUserError || !newUserData) {
          debugLog('Error fetching user after initialization:', newUserError);
          setError(getUserFriendlyErrorMessage(newUserError));
          setLoading(false);
          return;
        }

        finalUserData = newUserData;
      } else if (userError) {
        debugLog('Error fetching user:', userError);
        setError(getUserFriendlyErrorMessage(userError));
        setLoading(false);
        return;
      }

      if (!finalUserData) {
        debugLog('No user data available after all attempts');
        setError('Unable to load user data. Please refresh the page.');
        setLoading(false);
        return;
      }

      // Get user profile with enterprise authentication
      const { data: profileData, error: profileError } = await makeAuthenticatedRequest(
        () => fetchUserProfileFromService(finalUserData.id, 1)
      );

      debugLog('Profile lookup result:', profileData ? 'Accessible' : 'Not accessible');
      
      if (profileError) {
        debugLog('Profile lookup error:', profileError);
        setError(getUserFriendlyErrorMessage(profileError));
        setLoading(false);
        return;
      }

      if (!profileData) {
        debugLog('No profile found');
        setError('Profile not found. Please contact support.');
        setLoading(false);
        return;
      }

      debugLog('Successfully fetched user profile:', profileData.id);
      setUserProfile(profileData);
      setError(null);
    } catch (error) {
      debugLog('Error in fetchUserProfile:', error);
      setError(getUserFriendlyErrorMessage(error));
    } finally {
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
