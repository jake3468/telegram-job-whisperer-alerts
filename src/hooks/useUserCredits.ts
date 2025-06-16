
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { useUser } from '@clerk/clerk-react';

// Fetches current user credit info from Supabase
export const useUserCredits = () => {
  const { user } = useUser();
  const { userProfile, loading: userProfileLoading } = useUserProfile();

  console.log('[useUserCredits][debug] Clerk user:', user?.id);
  console.log('[useUserCredits][debug] UserProfile:', userProfile, 'loading:', userProfileLoading);

  if (!user) {
    console.warn('[useUserCredits][warn] Clerk user not found! You must be signed in for credits RLS to work.');
  }
  if (userProfile && !userProfile.id) {
    console.warn('[useUserCredits][warn] User profile exists but has no id. Credits will not show.');
  }

  return useQuery({
    queryKey: ['user_credits', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) {
        console.warn('[useUserCredits] No userProfile.id, returning null');
        return null;
      }

      console.log('[useUserCredits][debug] Fetching credits for user_profile_id:', userProfile.id);

      try {
        // Simply fetch the existing credits record - no initialization needed
        const { data: credits, error } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_profile_id', userProfile.id)
          .maybeSingle();

        console.log('[useUserCredits][debug] Credits query result:', credits, 'error:', error);

        if (error) {
          console.error('[useUserCredits] Error fetching credits:', error);
          return { __error: error, __debug: { action: 'fetch_failed', user_profile_id: userProfile.id } };
        }

        if (!credits) {
          console.warn('[useUserCredits] No credits found for user_profile_id:', userProfile.id);
          return { __error: { message: 'No credits found' }, __debug: { action: 'no_credits_found', user_profile_id: userProfile.id } };
        }

        console.log('[useUserCredits] Successfully fetched credits:', credits);
        return credits;
        
      } catch (err) {
        console.error('[useUserCredits] Exception during fetch:', err);
        return { __error: err, __debug: { action: 'fetch_exception', user_profile_id: userProfile.id } };
      }
    },
    enabled: !!userProfile?.id && !userProfileLoading && !!user,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: (failureCount, error: any) => {
      console.log('[useUserCredits] Retry attempt:', failureCount, 'error:', error);
      // Don't retry RLS errors
      if (error?.code === 'PGRST301' || error?.code === 'PGRST116') {
        return false;
      }
      return failureCount < 2;
    },
  });
};
