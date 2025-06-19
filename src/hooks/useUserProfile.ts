
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!user) {
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
        console.error('Error fetching user:', userError);
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
        console.error('Error fetching user profile:', profileError);
        setLoading(false);
        return;
      }

      setUserProfile(profileData);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
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
        console.error('Error updating user profile:', error);
        return { error: error.message };
      }

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return { error: 'Failed to update profile' };
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  return {
    userProfile,
    loading,
    updateUserProfile,
    refetch: fetchUserProfile
  };
};
