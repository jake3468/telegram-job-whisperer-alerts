
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  bio: string | null;
  resume: string | null;
  bot_activated: boolean | null;
  bot_id: string | null;
  chat_id: string | null;
  created_at: string | null;
}

export const useUserProfile = () => {
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        // First get the user's database ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single();

        if (userError) {
          setError('User not found in database');
          setLoading(false);
          return;
        }

        // Then get or create the user profile
        let { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfileData, error: createError } = await supabase
            .from('user_profile')
            .insert({
              user_id: userData.id,
              bio: null,
              resume: null,
              bot_activated: false,
              bot_id: null,
              chat_id: null
            })
            .select()
            .single();

          if (createError) {
            setError('Failed to create user profile');
            setLoading(false);
            return;
          }

          profileData = newProfileData;
        } else if (profileError) {
          setError('User profile not found');
          setLoading(false);
          return;
        }

        setUserProfile(profileData);
        setError(null);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user found' };

    try {
      // Get the user's database ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userError) {
        return { error: 'User not found in database' };
      }

      // If no userProfile exists, create it first
      if (!userProfile) {
        const { data: newProfileData, error: createError } = await supabase
          .from('user_profile')
          .insert({
            user_id: userData.id,
            ...updates
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          return { error: 'Failed to create user profile' };
        }

        setUserProfile(newProfileData);
        return { data: newProfileData, error: null };
      }

      // Update existing profile
      const { data, error } = await supabase
        .from('user_profile')
        .update(updates)
        .eq('id', userProfile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return { error: 'Failed to update user profile' };
      }

      setUserProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error('Error updating user profile:', err);
      return { error: 'Failed to update user profile' };
    }
  };

  return {
    userProfile,
    loading,
    error,
    updateUserProfile,
  };
};
