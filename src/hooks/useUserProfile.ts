
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
        console.log('Fetching user profile for clerk_id:', user.id);
        
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

        // Then get the user profile - use maybeSingle() to avoid errors when no profile exists
        let { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userData.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError('Error fetching user profile');
          setLoading(false);
          return;
        }

        // If no profile exists, create one
        if (!profileData) {
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
        }

        console.log('Profile data loaded:', profileData);
        // Ensure bot_id is included in the profile data
        const completeProfileData: UserProfile = {
          ...profileData,
          bot_id: profileData.bot_id || null
        };
        setUserProfile(completeProfileData);
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

      // Check if userProfile exists in state, if not, fetch it first
      let currentProfile = userProfile;
      if (!currentProfile) {
        console.log('No profile in state, fetching from database');
        const { data: fetchedProfile, error: fetchError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userData.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching profile for update:', fetchError);
          return { error: 'Failed to fetch profile for update' };
        }

        currentProfile = fetchedProfile;
      }

      // If no profile exists, create it
      if (!currentProfile) {
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

        const completeNewProfile: UserProfile = {
          ...newProfileData,
          bot_id: newProfileData.bot_id || null
        };
        setUserProfile(completeNewProfile);
        return { data: completeNewProfile, error: null };
      }

      // Update existing profile using the profile ID
      console.log('Updating existing profile with ID:', currentProfile.id);
      const { data, error } = await supabase
        .from('user_profile')
        .update(updates)
        .eq('id', currentProfile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return { error: 'Failed to update user profile' };
      }

      console.log('Profile updated successfully:', data);
      const completeUpdatedProfile: UserProfile = {
        ...data,
        bot_id: data.bot_id || null
      };
      setUserProfile(completeUpdatedProfile);
      return { data: completeUpdatedProfile, error: null };
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
