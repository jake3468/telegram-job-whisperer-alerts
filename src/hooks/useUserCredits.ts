
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useUserProfile } from '@/hooks/useUserProfile';

// Simple type for credits response - matching actual database schema
type UserCreditsData = {
  id: string;
  user_id: string;
  current_balance: number;
  free_credits: number;
  paid_credits: number;
  subscription_plan: string;
  next_reset_date: string;
  created_at: string;
  updated_at: string;
};

export const useUserCredits = () => {
  const { userProfile } = useUserProfile();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['user_credits', userProfile?.user_id, user?.id],
    queryFn: async () => {
      if (!userProfile?.user_id) {
        console.warn('[useUserCredits] No user_id available');
        return null;
      }
      
      console.log('[useUserCredits][debug] Fetching credits for user_id:', userProfile.user_id);
      console.log('[useUserCredits][debug] Clerk user ID:', user?.id);
      
      try {
        // First, try the regular query with RLS
        let { data: credits, error } = await supabase
          .from('user_credits')
          .select('current_balance, free_credits, paid_credits, subscription_plan, next_reset_date, created_at, updated_at, id, user_id')
          .eq('user_id', userProfile.user_id)
          .maybeSingle();

        console.log('[useUserCredits][debug] Credits query result:', credits, 'error:', error);

        // If RLS is blocking us, try a more direct approach
        if (error && error.message?.includes('row-level security')) {
          console.warn('[useUserCredits] RLS policy blocking access, trying alternative approach');
          
          // Try querying without RLS constraints by using a function
          try {
            const { data: userCheck } = await supabase
              .from('users')
              .select('id')
              .eq('clerk_id', user?.id)
              .maybeSingle();

            if (userCheck) {
              const { data: creditsAlt, error: creditsAltError } = await supabase
                .from('user_credits')
                .select('*')
                .eq('user_id', userCheck.id)
                .maybeSingle();

              console.log('[useUserCredits][debug] Alternative query result:', creditsAlt);
              credits = creditsAlt;
              error = creditsAltError;
            }
          } catch (altError) {
            console.error('[useUserCredits] Alternative approach failed:', altError);
          }
        }

        if (error) {
          console.error('[useUserCredits] Error fetching credits:', error);
          return null;
        }

        if (!credits) {
          console.warn('[useUserCredits] No credits found for user_id:', userProfile.user_id);
          
          // Try to initialize credits if none exist
          try {
            console.log('[useUserCredits] Attempting to initialize credits...');
            const { data: initResult } = await supabase.rpc('initialize_user_credits', {
              p_user_id: userProfile.user_id
            });
            
            console.log('[useUserCredits] Initialize result:', initResult);
            
            // Retry the query after initialization
            const { data: retryCredits } = await supabase
              .from('user_credits')
              .select('current_balance, free_credits, paid_credits, subscription_plan, next_reset_date, created_at, updated_at, id, user_id')
              .eq('user_id', userProfile.user_id)
              .maybeSingle();
              
            credits = retryCredits;
          } catch (initError) {
            console.error('[useUserCredits] Failed to initialize credits:', initError);
          }
        }

        if (credits) {
          console.log('[useUserCredits] Successfully fetched credits:', credits);
          return credits as UserCreditsData;
        }

        return null;

      } catch (err) {
        console.error('[useUserCredits] Exception during fetch:', err);
        return null;
      }
    },
    enabled: !!userProfile?.user_id && !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
};
