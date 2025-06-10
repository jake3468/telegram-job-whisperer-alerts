
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase, setClerkToken } from '@/integrations/supabase/client';

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
        console.log('Fetching user profile for clerk_id:', user.id);
        
        // Get Clerk session token and set it for Supabase
        const token = await user.getToken({ template: 'supabase' });
        if (token) {
          setClerkToken(token);
        }
        
        // First get the user's database ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single();

        if (userError) {
          console.error('User not found in database:', userError);
          setError('User not found in database');
          setLoading(false);
          return;
        }

        console.log('Found user data:', userData);

        // Then get or create the user profile
        let { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('Creating new user profile');
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
            console.error('Failed to create user profile:', createError);
            setError('Failed to create user profile');
            setLoading(false);
            return;
          }

          profileData = newProfileData;
        } else if (profileError) {
          console.error('User profile fetch error:', profileError);
          setError('User profile not found');
          setLoading(false);
          return;
        }

        console.log('Profile data loaded:', profileData);
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
    if (!user) {
      console.error('No user found for update');
      return { error: 'No user found' };
    }

    try {
      console.log('Updating user profile with:', updates);
      
      // Get Clerk session token and set it for Supabase
      const token = await user.getToken({ template: 'supabase' });
      if (token) {
        setClerkToken(token);
        console.log('Set Clerk token for Supabase');
      }
      
      // Get the user's database ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userError) {
        console.error('User lookup failed:', userError);
        return { error: 'User not found in database' };
      }

      console.log('User found for update:', userData);

      // If no userProfile exists, create it first
      if (!userProfile) {
        console.log('Creating new profile during update');
        const { data: newProfileData, error: createError } = await supabase
          .from('user_profile')
          .insert({
            user_id: userData.id,
            bio: null,
            resume: null,
            bot_activated: false,
            bot_id: null,
            chat_id: null,
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
      console.log('Updating existing profile with ID:', userProfile.id);
      const { data, error } = await supabase
        .from('user_profile')
        .update(updates)
        .eq('id', userProfile.id)
        .eq('user_id', userData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return { error: 'Failed to update user profile' };
      }

      console.log('Profile updated successfully:', data);
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
