
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
      
      // First, try to get existing credits
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_profile_id', userProfile.id)
        .maybeSingle();
        
      if (error) {
        console.error('[useUserCredits] Error from Supabase:', error);
        return { __error: error }; // Allow UI to show error details
      }
      
      // If credits exist, return them
      if (data) {
        console.log('[useUserCredits] Fetched user_credits:', data);
        console.log('[useUserCredits] Current balance:', data.current_balance);
        return data;
      }
      
      // If no credits found, initialize them
      console.log('[useUserCredits] No user_credits record found, initializing...');
      
      try {
        // Call the initialize_user_credits function
        const { data: initResult, error: initError } = await supabase.rpc('initialize_user_credits', {
          p_user_profile_id: userProfile.id
        });
        
        if (initError) {
          console.error('[useUserCredits] Error initializing credits:', initError);
          return { __error: initError };
        }
        
        console.log('[useUserCredits] Credits initialized successfully:', initResult);
        
        // Now fetch the newly created credits
        const { data: newCredits, error: fetchError } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_profile_id', userProfile.id)
          .single();
          
        if (fetchError) {
          console.error('[useUserCredits] Error fetching newly created credits:', fetchError);
          return { __error: fetchError };
        }
        
        console.log('[useUserCredits] Fetched newly created credits:', newCredits);
        return newCredits;
        
      } catch (initError) {
        console.error('[useUserCredits] Exception during initialization:', initError);
        return { __error: initError };
      }
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
