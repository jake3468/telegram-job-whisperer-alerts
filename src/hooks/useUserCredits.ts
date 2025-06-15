
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

        // No credit record found - but first check if it might be a duplicate key error scenario
        if (!data) {
          console.warn('[useUserCredits] No row found in user_credits for user_profile_id:', userProfile.id);
          
          // Try to query again with a different approach to see if record exists but RLS is blocking
          const { data: testData, error: testError } = await supabase
            .from('user_credits')
            .select('id, current_balance')
            .eq('user_profile_id', userProfile.id)
            .maybeSingle();
          
          console.log('[useUserCredits][debug] Test query result:', testData, 'error:', testError);
          
          // If we still get nothing, try to initialize
          if (!testData && !testError) {
            console.log('[useUserCredits] Attempting to initialize credits for user...');
            
            // Use the database function to initialize credits
            const { data: initResult, error: initError } = await supabase
              .rpc('initialize_user_credits', { p_user_profile_id: userProfile.id });
            
            console.log('[useUserCredits][debug] Initialize credits result:', initResult, 'error:', initError);
            
            // If we get a duplicate key error, it means the record exists but we can't see it
            if (initError && initError.code === '23505') {
              console.warn('[useUserCredits] Duplicate key error - record exists but RLS may be blocking access');
              // Return a special error object to indicate this scenario
              return { 
                __error: { 
                  ...initError, 
                  message: "Credit record exists but may not be accessible. Please check Row Level Security policies." 
                } 
              };
            }
            
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
          } else if (testData) {
            // We found data with the test query, return it
            console.log('[useUserCredits] Found credits with test query:', testData);
            return testData;
          } else {
            // Test query also failed
            console.error('[useUserCredits] Test query also failed:', testError);
            return { __error: testError };
          }
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
      // Don't retry if it's a "no data found" error or duplicate key error
      if (error?.code === 'PGRST116' || error?.code === '23505') {
        return false;
      }
      return failureCount < 3;
    },
  });
};
