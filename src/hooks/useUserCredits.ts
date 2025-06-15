
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { useUser } from '@clerk/clerk-react';

// Fetches current user credit info from Supabase
export const useUserCredits = () => {
  const { user } = useUser();
  const { userProfile, loading: userProfileLoading } = useUserProfile();

  // Extra: log all related IDs and JWT for debugging
  console.log('[useUserCredits][debug] Clerk user:', user?.id);
  console.log('[useUserCredits][debug] UserProfile:', userProfile, 'loading:', userProfileLoading);

  // Added: Detect and warn if JWT is not present/invalid mapping
  // (for debugging issues with user_credits table RLS)
  if (!user) {
    console.warn(
      '[useUserCredits][warn] Clerk user not found! You must be signed in for credits RLS to work. No credits will load until Clerk JWT is attached.'
    );
  }
  if (userProfile && !userProfile.id) {
    console.warn(
      '[useUserCredits][warn] User profile exists but has no id. Credits will not show.'
    );
  }

  return useQuery({
    queryKey: ['user_credits', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) {
        console.warn('[useUserCredits] No userProfile.id, returning null');
        return null;
      }

      console.log('[useUserCredits][debug] Starting query for user_profile_id:', userProfile.id);

      // Query user_credits for this user_profile_id
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_profile_id', userProfile.id)
        .maybeSingle();

      console.log('[useUserCredits][debug] SQL Query for user_profile_id:', userProfile.id);
      console.log('[useUserCredits][debug] Supabase returned:', data, 'error:', error);

      // Error or nothing found
      if (error) {
        console.error('[useUserCredits] Error from Supabase:', error);
        return { __error: error };
      }
      if (!data) {
        console.warn('[useUserCredits] No row found in user_credits for user_profile_id:', userProfile.id);
        return null;
      }
      // Success!
      console.log('[useUserCredits] Successfully found credits:', data);
      return data;
    },
    enabled: !!userProfile?.id && !userProfileLoading,
    staleTime: 30000,
    refetchInterval: 15000,
    retry: (failureCount, error: any) => {
      // Don't retry if it's a "no data found" error
      if (error?.code === 'PGRST116') {
        return false;
      }
      return failureCount < 3;
    },
  });
};
