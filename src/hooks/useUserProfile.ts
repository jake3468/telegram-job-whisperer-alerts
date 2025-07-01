
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useUserInitialization } from './useUserInitialization';
import { Environment } from '@/utils/environment';
import { UserProfile, UserProfileUpdateData } from '@/types/userProfile';
import { createUserProfileDebugger } from '@/utils/userProfileDebug';
import { 
  fetchUserFromDatabase, 
  fetchUserProfile as fetchUserProfileFromService, 
  updateUserProfileInDatabase 
} from '@/services/userProfileService';

const { debugLog } = createUserProfileDebugger();

export const useUserProfile = () => {
  const { user, isLoaded } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { initializeUser } = useUserInitialization();

  const fetchUserProfile = async () => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);

      // No artificial delays - fetch immediately
      const { data: userData, error: userError } = await fetchUserFromDatabase(user.id);

      let finalUserData = userData;

      // If user doesn't exist, initialize them
      if (!userData && !userError) {
        const initResult = await initializeUser();
        if (!initResult.success) {
          setError(`Failed to initialize user: ${initResult.error}`);
          setLoading(false);
          return;
        }

        // Fetch user data after initialization
        const { data: newUserData, error: newUserError } = await fetchUserFromDatabase(user.id);

        if (newUserError || !newUserData) {
          setError(`Error fetching user after initialization: ${newUserError?.message}`);
          setLoading(false);
          return;
        }

        finalUserData = newUserData;
      } else if (userError) {
        // Provide specific error messages
        if (userError.code === '42501' || userError.message.includes('permission')) {
          setError('Authentication issue detected. Please refresh the page.');
        } else if (userError.code === 'PGRST301' || userError.message.includes('JWSError')) {
          setError('JWT authentication failed. Please refresh the page.');
        } else {
          setError(`Error fetching user: ${userError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!finalUserData) {
        setError('Unable to load user data. Please refresh the page.');
        setLoading(false);
        return;
      }

      // Get user profile - simplified, no retry logic in production
      const maxAttempts = Environment.isProduction() ? 1 : 2;
      const { data: profileData, error: profileError } = await fetchUserProfileFromService(finalUserData.id, maxAttempts);
      
      if (profileError) {
        if (profileError.code === '42501' || profileError.message.includes('permission')) {
          setError('Profile access denied. Please refresh the page.');
        } else if (profileError.code === 'PGRST301' || profileError.message.includes('JWSError')) {
          setError('Authentication failed. Please refresh the page.');
        } else {
          setError(`Error fetching profile: ${profileError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!profileData) {
        setError('Profile not found. Please contact support.');
        setLoading(false);
        return;
      }

      setUserProfile(profileData);
      setError(null);
    } catch (error) {
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: UserProfileUpdateData) => {
    if (!user || !userProfile) {
      return { error: 'User not authenticated or profile not loaded' };
    }

    try {
      const { error } = await updateUserProfileInDatabase(userProfile.id, updates);

      if (error) {
        return { error: error.message };
      }

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error) {
      return { error: 'Failed to update profile' };
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
