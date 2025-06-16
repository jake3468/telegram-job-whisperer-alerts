
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
      
      console.log('[useUserCredits] Fetching credits for user_id:', userProfile.user_id);
      
      try {
        // Query the user_credits table directly using the user_id
        const { data: credits, error } = await supabase
          .from('user_credits')
          .select('current_balance, free_credits, paid_credits, subscription_plan, next_reset_date, created_at, updated_at, id, user_id')
          .eq('user_id', userProfile.user_id)
          .maybeSingle();

        console.log('[useUserCredits] Credits query result:', credits, 'error:', error);

        if (error) {
          console.error('[useUserCredits] Error fetching credits:', error);
          return null;
        }

        if (!credits) {
          console.warn('[useUserCredits] No credits found for user_id:', userProfile.user_id);
          
          // Try to initialize credits if none exist
          try {
            console.log('[useUserCredits] Attempting to initialize credits...');
            const { data: initResult, error: initError } = await supabase.rpc('initialize_user_credits', {
              p_user_id: userProfile.user_id
            });
            
            console.log('[useUserCredits] Initialize result:', initResult, 'error:', initError);
            
            if (!initError) {
              // Retry the query after initialization
              const { data: retryCredits, error: retryError } = await supabase
                .from('user_credits')
                .select('current_balance, free_credits, paid_credits, subscription_plan, next_reset_date, created_at, updated_at, id, user_id')
                .eq('user_id', userProfile.user_id)
                .maybeSingle();
                
              if (!retryError && retryCredits) {
                console.log('[useUserCredits] Successfully fetched credits after initialization:', retryCredits);
                return retryCredits as UserCreditsData;
              }
            }
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
