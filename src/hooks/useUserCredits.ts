
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
        return null;
      }
      
      try {
        // Direct query with no excessive logging
        const { data: credits, error } = await supabase
          .from('user_credits')
          .select('current_balance, free_credits, paid_credits, subscription_plan, next_reset_date, created_at, updated_at, id, user_id')
          .eq('user_id', userProfile.user_id)
          .single();

        if (error) {
          // If no record found, try to initialize credits
          if (error.code === 'PGRST116') {
            try {
              const { data: initResult, error: initError } = await supabase.rpc('initialize_user_credits', {
                p_user_id: userProfile.user_id
              });
              
              if (!initError) {
                // Retry the query after initialization
                const { data: retryCredits, error: retryError } = await supabase
                  .from('user_credits')
                  .select('current_balance, free_credits, paid_credits, subscription_plan, next_reset_date, created_at, updated_at, id, user_id')
                  .eq('user_id', userProfile.user_id)
                  .single();
                  
                if (!retryError && retryCredits) {
                  return retryCredits as UserCreditsData;
                }
              }
            } catch (initError) {
              console.error('[useUserCredits] Failed to initialize credits:', initError);
            }
          }
          
          return null;
        }

        if (credits) {
          return credits as UserCreditsData;
        }

        return null;

      } catch (err) {
        console.error('[useUserCredits] Exception during fetch:', err);
        return null;
      }
    },
    enabled: !!userProfile?.user_id && !!user?.id,
    // Static configuration - no automatic refetching
    staleTime: Infinity, // Data never becomes stale during session
    gcTime: Infinity, // Keep data cached indefinitely during session
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: false, // Don't refetch on network reconnect
    refetchOnMount: true, // Only fetch on initial mount
    retry: 1, // Reduced retry attempts
  });
};
