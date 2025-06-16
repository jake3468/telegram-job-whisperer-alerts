
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
        // First, let's check if the user_profile_id exists in user_credits table
        const { data: existingCredits, error: checkError } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_profile_id', userProfile.id)
          .maybeSingle();

        console.log('[useUserCredits][debug] Existing credits check:', existingCredits, 'error:', checkError);

        // If there's an RLS error, log it specifically
        if (checkError) {
          console.error('[useUserCredits] RLS or other error:', checkError);
          
          // Try to get more debugging info
          const debugInfo = {
            error_code: checkError.code,
            error_message: checkError.message,
            user_profile_id: userProfile.id,
            clerk_user_id: user?.id,
          };
          
          console.error('[useUserCredits] Debug info:', debugInfo);
          return { __error: checkError, __debug: debugInfo };
        }

        // If no credit record found, try to initialize
        if (!existingCredits) {
          console.log('[useUserCredits] No credit record found, attempting to initialize...');
          
          try {
            // Use the database function to initialize credits
            const { data: initResult, error: initError } = await supabase
              .rpc('initialize_user_credits', { p_user_profile_id: userProfile.id });
            
            console.log('[useUserCredits][debug] Initialize credits result:', initResult, 'error:', initError);
            
            if (initError) {
              console.error('[useUserCredits] Failed to initialize credits:', initError);
              return { __error: initError, __debug: { action: 'initialize_failed', user_profile_id: userProfile.id } };
            }
            
            // Now query again to get the newly created record
            const { data: newData, error: newError } = await supabase
              .from('user_credits')
              .select('*')
              .eq('user_profile_id', userProfile.id)
              .maybeSingle();
            
            if (newError) {
              console.error('[useUserCredits] Error fetching newly created credits:', newError);
              return { __error: newError, __debug: { action: 'fetch_after_init_failed', user_profile_id: userProfile.id } };
            }
            
            console.log('[useUserCredits] Successfully initialized and retrieved credits:', newData);
            return newData;
          } catch (initErr) {
            console.error('[useUserCredits] Exception during initialization:', initErr);
            return { __error: initErr, __debug: { action: 'init_exception', user_profile_id: userProfile.id } };
          }
        }

        // Success - credits found!
        console.log('[useUserCredits] Successfully found credits:', existingCredits);
        return existingCredits;
        
      } catch (err) {
        console.error('[useUserCredits] Caught exception in main try block:', err);
        return { __error: err, __debug: { action: 'main_exception', user_profile_id: userProfile.id } };
      }
    },
    enabled: !!userProfile?.id && !userProfileLoading && !!user,
    staleTime: 30000,
    refetchInterval: 60000, // Increased interval to reduce spam
    retry: (failureCount, error: any) => {
      console.log('[useUserCredits] Retry attempt:', failureCount, 'error:', error);
      // Don't retry RLS errors
      if (error?.code === 'PGRST301' || error?.code === 'PGRST116') {
        return false;
      }
      return failureCount < 2; // Reduced retry attempts
    },
  });
};
