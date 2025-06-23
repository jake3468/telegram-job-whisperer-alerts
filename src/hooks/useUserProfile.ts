
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

  const debugAuthentication = async () => {
    console.log('[DEBUG] Debugging authentication state...');
    console.log('[DEBUG] Clerk user loaded:', isLoaded);
    console.log('[DEBUG] Clerk user exists:', !!user);
    console.log('[DEBUG] Clerk user ID:', user?.id);

    if (user) {
      try {
        // Test JWT debugging function
        const { data: debugData, error: debugError } = await supabase.rpc('debug_user_auth');
        console.log('[DEBUG] Supabase debug_user_auth result:', debugData);
        console.log('[DEBUG] Supabase debug_user_auth error:', debugError);

        // Test direct user lookup
        const { data: userLookup, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', user.id)
          .maybeSingle();

        console.log('[DEBUG] Direct user lookup result:', userLookup);
        console.log('[DEBUG] Direct user lookup error:', userError);

      } catch (error) {
        console.error('[DEBUG] Authentication debug error:', error);
      }
    }
  };

  const fetchUserProfile = async () => {
    if (!isLoaded) {
      console.log('[DEBUG] Clerk not loaded yet, waiting...');
      return;
    }

    if (!user) {
      console.log('[DEBUG] No user found, stopping fetch');
      setLoading(false);
      setError(null);
      return;
    }

    try {
      console.log('[DEBUG] Starting user profile fetch for:', user.id);
      setError(null);

      // Debug authentication state
      await debugAuthentication();

      // First, try to get the user's database ID
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, clerk_id, email, first_name, last_name')
        .eq('clerk_id', user.id)
        .maybeSingle();

      console.log('[DEBUG] User lookup result:', userData);
      console.log('[DEBUG] User lookup error:', userError);

      // If user doesn't exist in Supabase, initialize them
      if (!userData && !userError) {
        console.log('[DEBUG] User not found in Supabase, initializing...');
        
        const initResult = await initializeUser();
        if (!initResult.success) {
          console.error('[DEBUG] Failed to initialize user:', initResult.error);
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
          console.error('[DEBUG] Error fetching user after initialization:', newUserError);
          setError(`Error fetching user after initialization: ${newUserError?.message}`);
          setLoading(false);
          return;
        }

        userData = newUserData;
      } else if (userError) {
        console.error('[DEBUG] Error fetching user:', userError);
        setError(`Error fetching user: ${userError.message}`);
        setLoading(false);
        return;
      }

      if (!userData) {
        console.error('[DEBUG] No user data available after all attempts');
        setError('Unable to load user data');
        setLoading(false);
        return;
      }

      // Now get the user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

      console.log('[DEBUG] User profile lookup result:', profileData);
      console.log('[DEBUG] User profile lookup error:', profileError);

      if (profileError) {
        console.error('[DEBUG] Error fetching user profile:', profileError);
        setError(`Error fetching profile: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.log('[DEBUG] No profile found, this should not happen after initialization');
        setError('Profile not found');
        setLoading(false);
        return;
      }

      console.log('[DEBUG] Successfully fetched user profile:', profileData.id);
      setUserProfile(profileData);
      setError(null);
    } catch (error) {
      console.error('[DEBUG] Error in fetchUserProfile:', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user || !userProfile) {
      return { error: 'User not authenticated or profile not loaded' };
    }

    try {
      const { error } = await supabase
        .from('user_profile')
        .update(updates)
        .eq('id', userProfile.id);

      if (error) {
        console.error('[DEBUG] Error updating user profile:', error);
        return { error: error.message };
      }

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error) {
      console.error('[DEBUG] Error in updateUserProfile:', error);
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
