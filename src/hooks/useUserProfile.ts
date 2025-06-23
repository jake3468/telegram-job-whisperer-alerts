
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase, testJWTTransmission, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { useUserInitialization } from './useUserInitialization';
import { Environment } from '@/utils/environment';

interface UserProfile {
  id: string;
  user_id: string;
  bio: string | null;
  resume: string | null;
  bot_activated: boolean | null;
  chat_id: string | null;
  cv_bot_activated: boolean;
  cv_chat_id: string | null;
  created_at: string | null;
}

export const useUserProfile = () => {
  const { user, isLoaded } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { initializeUser } = useUserInitialization();

  const debugLog = (message: string, data?: any) => {
    if (Environment.isDevelopment()) {
      console.log(`[UserProfile] ${message}`, data ? data : '');
    }
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

      // Reduced stabilization delay for production
      const stabilizationDelay = Environment.isProduction() ? 300 : 800;
      debugLog(`Waiting ${stabilizationDelay}ms for JWT transmission to stabilize...`);
      await new Promise(resolve => setTimeout(resolve, stabilizationDelay));

      // Get user's database ID
      const { data: userData, error: userError } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('users')
          .select('id, clerk_id, email, first_name, last_name')
          .eq('clerk_id', user.id)
          .maybeSingle();
      }, 'user lookup');

      debugLog('User lookup result:', userData ? 'Found' : 'Not found');

      let finalUserData = userData;

      // If user doesn't exist, initialize them
      if (!userData && !userError) {
        debugLog('User not found in Supabase, initializing...');
        
        const initResult = await initializeUser();
        if (!initResult.success) {
          debugLog('Failed to initialize user:', initResult.error);
          setError(`Failed to initialize user: ${initResult.error}`);
          setLoading(false);
          return;
        }

        // Fetch user data after initialization
        const { data: newUserData, error: newUserError } = await makeAuthenticatedRequest(async () => {
          return await supabase
            .from('users')
            .select('id, clerk_id, email, first_name, last_name')
            .eq('clerk_id', user.id)
            .maybeSingle();
        }, 'user lookup after initialization');

        if (newUserError || !newUserData) {
          debugLog('Error fetching user after initialization:', newUserError);
          setError(`Error fetching user after initialization: ${newUserError?.message}`);
          setLoading(false);
          return;
        }

        finalUserData = newUserData;
      } else if (userError) {
        debugLog('Error fetching user:', userError);
        
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
        debugLog('No user data available after all attempts');
        setError('Unable to load user data. Please refresh the page.');
        setLoading(false);
        return;
      }

      // Get user profile with optimized retry logic
      const maxAttempts = Environment.isProduction() ? 2 : 3;
      let profileData = null;
      let profileError = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        debugLog(`Profile fetch attempt ${attempt}/${maxAttempts}`);

        const profileResult = await makeAuthenticatedRequest(async () => {
          return await supabase
            .from('user_profile')
            .select('*')
            .eq('user_id', finalUserData.id)
            .maybeSingle();
        }, `profile fetch attempt ${attempt}`);

        profileData = profileResult.data;
        profileError = profileResult.error;

        if (!profileError) {
          break; // Success
        }

        // Only retry on permission errors and only in development
        if ((profileError.code === '42501' || profileError.message.includes('permission')) && 
            attempt < maxAttempts && Environment.isDevelopment()) {
          debugLog('Permission error, retrying...');
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          break; // Don't retry other errors or in production
        }
      }

      debugLog('Profile lookup result:', profileData ? 'Accessible' : 'Not accessible');
      
      if (profileError) {
        debugLog('Profile lookup error:', profileError);
        
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
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user || !userProfile) {
      debugLog('Update attempt without authentication or profile');
      return { error: 'User not authenticated or profile not loaded' };
    }

    try {
      debugLog('Attempting profile update for:', userProfile.id);
      
      const { error } = await makeAuthenticatedRequest(async () => {
        return await supabase
          .from('user_profile')
          .update(updates)
          .eq('id', userProfile.id);
      }, 'profile update');

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
