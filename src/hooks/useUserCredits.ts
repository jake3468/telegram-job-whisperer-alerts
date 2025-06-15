
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

// Fetches current user credit info from Supabase
export const useUserCredits = () => {
  const { userProfile, loading: userProfileLoading } = useUserProfile();

  // Debug log: Show userProfile loading and ID
  console.log('[useUserCredits] userProfile:', userProfile, 'loading:', userProfileLoading);

  return useQuery({
    queryKey: ['user_credits', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) {
        console.warn('[useUserCredits] No userProfile.id, returning null');
        return null;
      }
      
      console.log('[useUserCredits] Querying user_credits for user_profile_id:', userProfile.id);
      
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_profile_id', userProfile.id)
        .single(); // Use single() instead of maybeSingle() since we expect exactly one record
        
      if (error) {
        console.error('[useUserCredits] Error from Supabase:', error);
        // If no record found, that's actually expected for some users
        if (error.code === 'PGRST116') {
          console.log('[useUserCredits] No user_credits record found for user_profile_id:', userProfile.id);
          return null;
        }
        throw error;
      }
      
      console.log('[useUserCredits] Fetched user_credits:', data);
      console.log('[useUserCredits] Current balance:', data?.current_balance);
      
      return data;
    },
    enabled: !!userProfile?.id && !userProfileLoading,
    staleTime: 30000,
    refetchInterval: 15000,
    // Add retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry if it's a "no data found" error
      if (error?.code === 'PGRST116') {
        return false;
      }
      return failureCount < 3;
    },
  });
};
