import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

// Fetches current user credit info from Supabase
export const useUserCredits = () => {
  const { userProfile, isLoading: userProfileLoading } = useUserProfile();

  // Debug log: Show userProfile loading and ID
  console.log('[useUserCredits] userProfile:', userProfile, 'loading:', userProfileLoading);

  return useQuery({
    queryKey: ['user_credits', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) {
        console.warn('[useUserCredits] No userProfile.id, returning null');
        return null;
      }
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_profile_id', userProfile.id)
        .maybeSingle(); // safer in case no row exists
      if (error) {
        console.error('[useUserCredits] Error from Supabase:', error);
        throw error;
      }
      console.log('[useUserCredits] Fetched user_credits:', data);
      return data;
    },
    enabled: !!userProfile?.id,
    staleTime: 30000,
    refetchInterval: 15000,
    // Add onSettled to log whatever happens
    meta: {
      onSettled: (data: any, error: unknown) => {
        console.log('[useUserCredits] onSettled - data:', data, 'error:', error);
      }
    }
  });
};
