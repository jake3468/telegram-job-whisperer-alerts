
import { useState, useEffect, useCallback, useRef } from 'react';
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
import { debugLogger } from '@/utils/debugUtils';

const { debugLog } = createUserProfileDebugger();

// Request deduplication
const activeRequests = new Map<string, Promise<any>>();

export const useUserProfile = () => {
  const { user, isLoaded } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { initializeUser } = useUserInitialization();
  const requestRef = useRef<AbortController | null>(null);

  const fetchUserProfile = useCallback(async () => {
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

    // Check if there's already an active request for this user
    if (activeRequests.has(user.id)) {
      debugLogger.log('Profile fetch already in progress, waiting...');
      try {
        const result = await activeRequests.get(user.id);
        if (result?.userProfile) {
          setUserProfile(result.userProfile);
          setError(null);
        }
      } catch (err) {
        debugLogger.error('Error waiting for active request:', err);
      }
      setLoading(false);
      return;
    }

    // Cancel any previous request
    if (requestRef.current) {
      requestRef.current.abort();
    }

    requestRef.current = new AbortController();

    const fetchPromise = (async () => {
      try {
        setError(null);
        debugLog('Starting user profile fetch for:', user.id);

        const { data: userData, error: userError } = await fetchUserFromDatabase(user.id);
        debugLog('User lookup result:', userData ? 'Found' : 'Not found');

        let finalUserData = userData;

        // If user doesn't exist, initialize them
        if (!userData && !userError) {
          debugLog('User not found in Supabase, initializing...');
          
          const initResult = await initializeUser();
          if (!initResult.success) {
            debugLog('Failed to initialize user:', initResult.error);
            throw new Error(`Failed to initialize user: ${initResult.error}`);
          }

          // Fetch user data after initialization
          const { data: newUserData, error: newUserError } = await fetchUserFromDatabase(user.id);

          if (newUserError || !newUserData) {
            debugLog('Error fetching user after initialization:', newUserError);
            throw new Error(`Error fetching user after initialization: ${newUserError?.message}`);
          }

          finalUserData = newUserData;
        } else if (userError) {
          debugLog('Error fetching user:', userError);
          throw new Error(`Error fetching user: ${userError.message}`);
        }

        if (!finalUserData) {
          debugLog('No user data available after all attempts');
          throw new Error('Unable to load user data. Please refresh the page.');
        }

        // Get user profile - simplified, no retry logic in production
        const maxAttempts = Environment.isProduction() ? 1 : 2;
        const { data: profileData, error: profileError } = await fetchUserProfileFromService(finalUserData.id, maxAttempts);

        debugLog('Profile lookup result:', profileData ? 'Accessible' : 'Not accessible');
        
        if (profileError) {
          debugLog('Profile lookup error:', profileError);
          throw new Error(`Error fetching profile: ${profileError.message}`);
        }

        if (!profileData) {
          debugLog('No profile found');
          throw new Error('Profile not found. Please contact support.');
        }

        // Only log once every 5 minutes to prevent spam
        const lastLogTime = localStorage.getItem('profile_last_success_log');
        const now = Date.now();
        if (!lastLogTime || now - parseInt(lastLogTime) > 5 * 60 * 1000) {
          debugLog('Successfully fetched user profile:', profileData.id);
          localStorage.setItem('profile_last_success_log', now.toString());
        }

        return { userProfile: profileData };
      } catch (error) {
        debugLog('Error in fetchUserProfile:', error);
        throw error;
      }
    })();

    // Store active request
    activeRequests.set(user.id, fetchPromise);

    try {
      const result = await fetchPromise;
      setUserProfile(result.userProfile);
      setError(null);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      debugLog('Error in fetchUserProfile:', error);
      
      // Provide specific error messages based on error content
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('permission') || errorMessage.includes('42501')) {
        setError('Authentication issue detected. Please refresh the page.');
      } else if (errorMessage.includes('JWSError') || errorMessage.includes('PGRST301')) {
        setError('JWT authentication failed. Please refresh the page.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      // Clean up active request
      activeRequests.delete(user.id);
    }
  }, [user, isLoaded, initializeUser]);

  const updateUserProfile = useCallback(async (updates: UserProfileUpdateData) => {
    if (!user || !userProfile) {
      debugLog('Update attempt without authentication or profile');
      return { error: 'User not authenticated or profile not loaded' };
    }

    try {
      debugLog('Attempting profile update for:', userProfile.id);
      
      const { error } = await updateUserProfileInDatabase(userProfile.id, updates);

      if (error) {
        debugLog('Error updating user profile:', error);
        return { error: error.message };
      }

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      debugLog('Profile updated successfully');
      return { error: null };
    } catch (error) {
      debugLog('Error in updateUserProfile:', error);
      return { error: 'Failed to update profile' };
    }
  }, [user, userProfile]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return {
    userProfile,
    loading,
    error,
    updateUserProfile,
    refetch: fetchUserProfile
  };
};
