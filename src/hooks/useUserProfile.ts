
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

        // Then get the user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        if (profileError) {
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
    if (!userProfile) return { error: 'No user profile found' };

    try {
      const { data, error } = await supabase
        .from('user_profile')
        .update(updates)
        .eq('id', userProfile.id)
        .select()
        .single();

      if (error) throw error;

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
