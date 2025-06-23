
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase, testJWTTransmission, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { useUserInitialization } from './useUserInitialization';

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

  const securityAuditLog = (message: string, data?: any) => {
    console.log(`[SECURITY-AUDIT] ${message}`, data ? data : '');
  };

  const debugAuthentication = async () => {
    securityAuditLog('Starting enhanced authentication state audit with direct headers');
    securityAuditLog('Clerk user loaded:', isLoaded);
    securityAuditLog('Clerk user exists:', !!user);
    securityAuditLog('Clerk user ID:', user?.id);

    if (user) {
      try {
        // Test JWT transmission with direct headers
        const jwtTest = await testJWTTransmission();
        securityAuditLog('JWT transmission test result with direct headers:', jwtTest);

        // Test direct user lookup with enhanced error handling and explicit auth
        const { data: userLookup, error: userError } = await makeAuthenticatedRequest(() =>
          supabase
            .from('users')
            .select('*')
            .eq('clerk_id', user.id)
            .maybeSingle()
        );

        securityAuditLog('Direct user lookup result with auth headers:', userLookup ? 'Found' : 'Not found');
        if (userError) {
          securityAuditLog('Direct user lookup error details:', {
            message: userError.message,
            code: userError.code,
            details: userError.details
          });
        }

      } catch (error) {
        securityAuditLog('Authentication debug error:', error);
      }
    }
  };

  const fetchUserProfile = async () => {
    if (!isLoaded) {
      securityAuditLog('Clerk not loaded yet, waiting...');
      return;
    }

    if (!user) {
      securityAuditLog('No user found, stopping fetch');
      setLoading(false);
      setError(null);
      return;
    }

    try {
      securityAuditLog('Starting enhanced secure user profile fetch with direct auth headers for:', user.id);
      setError(null);

      // Enhanced authentication debugging with direct headers
      await debugAuthentication();

      // Add a longer delay to ensure JWT is properly set and transmitted
      securityAuditLog('Waiting for JWT transmission to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // First, try to get the user's database ID with enhanced error handling and direct auth
      let { data: userData, error: userError } = await makeAuthenticatedRequest(() =>
        supabase
          .from('users')
          .select('id, clerk_id, email, first_name, last_name')
          .eq('clerk_id', user.id)
          .maybeSingle()
      );

      securityAuditLog('User lookup result with direct auth:', userData ? 'Found' : 'Not found');
      if (userError) {
        securityAuditLog('User lookup error details:', {
          message: userError.message,
          code: userError.code,
          details: userError.details
        });
      }

      // If user doesn't exist in Supabase, initialize them
      if (!userData && !userError) {
        securityAuditLog('User not found in Supabase, initializing...');
        
        const initResult = await initializeUser();
        if (!initResult.success) {
          securityAuditLog('Failed to initialize user:', initResult.error);
          setError(`Failed to initialize user: ${initResult.error}`);
          setLoading(false);
          return;
        }

        // Try to fetch user data again after initialization
        const { data: newUserData, error: newUserError } = await makeAuthenticatedRequest(() =>
          supabase
            .from('users')
            .select('id, clerk_id, email, first_name, last_name')
            .eq('clerk_id', user.id)
            .maybeSingle()
        );

        if (newUserError || !newUserData) {
          securityAuditLog('Error fetching user after initialization:', newUserError);
          setError(`Error fetching user after initialization: ${newUserError?.message}`);
          setLoading(false);
          return;
        }

        userData = newUserData;
      } else if (userError) {
        securityAuditLog('Error fetching user:', userError);
        
        // Provide specific error message for JWT issues
        if (userError.code === '42501' || userError.message.includes('permission')) {
          setError('JWT authentication issue detected. Using enhanced direct header authentication.');
        } else {
          setError(`Error fetching user: ${userError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!userData) {
        securityAuditLog('No user data available after all attempts');
        setError('Unable to load user data - possible JWT configuration issue');
        setLoading(false);
        return;
      }

      // Now get the user profile with enhanced error handling and direct auth headers
      let profileAttempts = 0;
      const maxAttempts = 3;
      let profileData = null;
      let profileError = null;

      while (profileAttempts < maxAttempts && !profileData) {
        profileAttempts++;
        securityAuditLog(`User profile fetch attempt ${profileAttempts}/${maxAttempts} with direct auth headers`);

        const profileResult = await makeAuthenticatedRequest(() =>
          supabase
            .from('user_profile')
            .select('*')
            .eq('user_id', userData.id)
            .maybeSingle()
        );

        profileData = profileResult.data;
        profileError = profileResult.error;

        if (profileError) {
          securityAuditLog(`Profile fetch attempt ${profileAttempts} error:`, {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details
          });

          // If it's a permission error, wait a bit and retry
          if (profileError.code === '42501' || profileError.message.includes('permission')) {
            securityAuditLog('Permission error detected with direct auth, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            break; // Non-permission error, don't retry
          }
        }
      }

      securityAuditLog('User profile lookup result with direct auth:', profileData ? 'Accessible' : 'Not accessible');
      
      if (profileError) {
        securityAuditLog('Final profile lookup error with direct auth:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details
        });
        
        // Provide specific error message for JWT/RLS issues
        if (profileError.code === '42501' || profileError.message.includes('permission')) {
          setError('Profile access blocked by RLS even with direct auth headers. RLS policy may need adjustment.');
        } else {
          setError(`Error fetching profile: ${profileError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!profileData) {
        securityAuditLog('No profile found after all attempts with direct auth');
        setError('Profile not found - checking RLS policy configuration');
        setLoading(false);
        return;
      }

      securityAuditLog('Successfully fetched user profile with enhanced direct auth:', profileData.id);
      setUserProfile(profileData);
      setError(null);
    } catch (error) {
      securityAuditLog('Error in fetchUserProfile with direct auth:', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user || !userProfile) {
      securityAuditLog('Update attempt without authentication or profile');
      return { error: 'User not authenticated or profile not loaded' };
    }

    try {
      securityAuditLog('Attempting secure profile update with direct auth for:', userProfile.id);
      
      const { error } = await makeAuthenticatedRequest(() =>
        supabase
          .from('user_profile')
          .update(updates)
          .eq('id', userProfile.id)
      );

      if (error) {
        securityAuditLog('Error updating user profile with direct auth:', error);
        return { error: error.message };
      }

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      securityAuditLog('Profile updated successfully with direct auth');
      return { error: null };
    } catch (error) {
      securityAuditLog('Error in updateUserProfile with direct auth:', error);
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
