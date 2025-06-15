
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

      console.log('[useUserCredits][debug] Starting query for user_profile_id:', userProfile.id);

      try {
        // Query user_credits for this user_profile_id
        const { data, error } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_profile_id', userProfile.id)
          .maybeSingle();

        console.log('[useUserCredits][debug] SQL Query for user_profile_id:', userProfile.id);
        console.log('[useUserCredits][debug] Supabase returned:', data, 'error:', error);

        // Error occurred
        if (error) {
          console.error('[useUserCredits] Error from Supabase:', error);
          return { __error: error };
        }

        // No credit record found - initialize credits
        if (!data) {
          console.log('[useUserCredits] No credit record found, initializing credits...');
          
          // Use the database function to initialize credits
          const { data: initResult, error: initError } = await supabase
            .rpc('initialize_user_credits', { p_user_profile_id: userProfile.id });
          
          console.log('[useUserCredits][debug] Initialize credits result:', initResult, 'error:', initError);
          
          if (initError) {
            console.error('[useUserCredits] Failed to initialize credits:', initError);
            return { __error: initError };
          }
          
          // Now query again to get the newly created record
          const { data: newData, error: newError } = await supabase
            .from('user_credits')
            .select('*')
            .eq('user_profile_id', userProfile.id)
            .single();
          
          if (newError) {
            console.error('[useUserCredits] Error fetching newly created credits:', newError);
            return { __error: newError };
          }
          
          console.log('[useUserCredits] Successfully initialized and retrieved credits:', newData);
          return newData;
        }

        // Success!
        console.log('[useUserCredits] Successfully found credits:', data);
        return data;
      } catch (err) {
        console.error('[useUserCredits] Caught exception:', err);
        return { __error: err };
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
