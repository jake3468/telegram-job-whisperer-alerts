
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

// Fetches current user credit info from Supabase
export const useUserCredits = () => {
  const { userProfile, loading: userProfileLoading } = useUserProfile();

  // Debug log: Show userProfile loading and ID
  console.log('[useUserCredits] userProfile:', userProfile, 'loading:', userProfileLoading);

  // Extra debug: Output the actual supabase headers to ensure the JWT is used
  try {
    // This cast may print headers info for deeper debugging
    // @ts-ignore
    const headers = (supabase as any).headers;
    console.log('[useUserCredits] Supabase client headers:', headers);
  } catch (e) {
    console.log('[useUserCredits] Unable to read Supabase headers:', e);
  }

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
        .maybeSingle();
        
      if (error) {
        console.error('[useUserCredits] Error from Supabase:', error);
        return { __error: error }; // Allow UI to show error details
      }
      
      console.log('[useUserCredits] Fetched user_credits:', data);
      if (data) {
        console.log('[useUserCredits] Current balance:', data.current_balance);
      } else {
        console.log('[useUserCredits] No user_credits record found for user_profile_id:', userProfile.id);
      }
      
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
