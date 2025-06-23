
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
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
    securityAuditLog('Starting authentication state audit');
    securityAuditLog('Clerk user loaded:', isLoaded);
    securityAuditLog('Clerk user exists:', !!user);
    securityAuditLog('Clerk user ID:', user?.id);

    if (user) {
      try {
        // Test JWT debugging function with security audit
        const { data: debugData, error: debugError } = await supabase.rpc('debug_user_auth');
        securityAuditLog('Supabase debug_user_auth result:', debugData);
        if (debugError) {
          securityAuditLog('Supabase debug_user_auth error:', debugError);
        }

        // Test direct user lookup with RLS protection
        const { data: userLookup, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', user.id)
          .maybeSingle();

        securityAuditLog('Direct user lookup result:', userLookup ? 'Found' : 'Not found');
        if (userError) {
          securityAuditLog('Direct user lookup error:', userError);
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
      securityAuditLog('Starting secure user profile fetch for:', user.id);
      setError(null);

      // Debug authentication state with security audit
      await debugAuthentication();

      // First, try to get the user's database ID with RLS protection
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, clerk_id, email, first_name, last_name')
        .eq('clerk_id', user.id)
        .maybeSingle();

      securityAuditLog('User lookup result:', userData ? 'Found' : 'Not found');
      if (userError) {
        securityAuditLog('User lookup error:', userError);
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
        const { data: newUserData, error: newUserError } = await supabase
          .from('users')
          .select('id, clerk_id, email, first_name, last_name')
          .eq('clerk_id', user.id)
          .maybeSingle();

        if (newUserError || !newUserData) {
          securityAuditLog('Error fetching user after initialization:', newUserError);
          setError(`Error fetching user after initialization: ${newUserError?.message}`);
          setLoading(false);
          return;
        }

        userData = newUserData;
      } else if (userError) {
        securityAuditLog('Error fetching user:', userError);
        setError(`Error fetching user: ${userError.message}`);
        setLoading(false);
        return;
      }

      if (!userData) {
        securityAuditLog('No user data available after all attempts');
        setError('Unable to load user data');
        setLoading(false);
        return;
      }

      // Now get the user profile with RLS protection
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

      securityAuditLog('User profile lookup result:', profileData ? 'Accessible' : 'Not accessible');
      if (profileError) {
        securityAuditLog('User profile lookup error:', profileError);
      }

      if (profileError) {
        securityAuditLog('Error fetching user profile:', profileError);
        setError(`Error fetching profile: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (!profileData) {
        securityAuditLog('No profile found, this should not happen after initialization');
        setError('Profile not found');
        setLoading(false);
        return;
      }

      securityAuditLog('Successfully fetched user profile with enhanced security:', profileData.id);
      setUserProfile(profileData);
      setError(null);
    } catch (error) {
      securityAuditLog('Error in fetchUserProfile:', error);
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
      securityAuditLog('Attempting secure profile update for:', userProfile.id);
      
      const { error } = await supabase
        .from('user_profile')
        .update(updates)
        .eq('id', userProfile.id);

      if (error) {
        securityAuditLog('Error updating user profile:', error);
        return { error: error.message };
      }

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      securityAuditLog('Profile updated successfully');
      return { error: null };
    } catch (error) {
      securityAuditLog('Error in updateUserProfile:', error);
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
