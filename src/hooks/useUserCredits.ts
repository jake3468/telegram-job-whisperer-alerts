
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, makeAuthenticatedRequest } from '@/integrations/supabase/client';
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
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['user_credits', userProfile?.user_id], // Make key depend on user_id for proper caching
    queryFn: async () => {
      // Wait for userProfile to be available before fetching
      if (!userProfile?.user_id) {
        return null;
      }
      
      try {
        console.log('[useUserCredits] Fetching credits for user:', userProfile.user_id);
        
        // Use authenticated request to ensure proper JWT token handling
        const { data: credits, error } = await makeAuthenticatedRequest(async () => {
          return await supabase
            .from('user_credits')
            .select('current_balance, free_credits, paid_credits, subscription_plan, next_reset_date, created_at, updated_at, id, user_id')
            .eq('user_id', userProfile.user_id)
            .single();
        }, 'fetch user credits');

        if (error) {
          // If no record found, try to initialize credits
          if (error.code === 'PGRST116') {
            try {
              console.log('[useUserCredits] No credits record found, initializing...');
              const { data: initResult, error: initError } = await makeAuthenticatedRequest(async () => {
                return await supabase.rpc('initialize_user_credits', {
                  p_user_id: userProfile.user_id
                });
              }, 'initialize user credits');
              
              if (!initError) {
                // Retry the query after initialization
                const { data: retryCredits, error: retryError } = await makeAuthenticatedRequest(async () => {
                  return await supabase
                    .from('user_credits')
                    .select('current_balance, free_credits, paid_credits, subscription_plan, next_reset_date, created_at, updated_at, id, user_id')
                    .eq('user_id', userProfile.user_id)
                    .single();
                }, 'retry fetch user credits');
                  
                if (!retryError && retryCredits) {
                  // Ensure current_balance is never null
                  const safeCredits = {
                    ...retryCredits,
                    current_balance: retryCredits.current_balance ?? 0
                  };
                  return safeCredits as UserCreditsData;
                }
              }
            } catch (initError) {
              console.error('[useUserCredits] Failed to initialize credits:', initError);
            }
          }
          
          console.error('[useUserCredits] Error fetching credits:', error);
          // Return a default credits object instead of throwing error
          return {
            id: '',
            user_id: userProfile.user_id,
            current_balance: 0,
            free_credits: 0,
            paid_credits: 0,
            subscription_plan: 'free',
            next_reset_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as UserCreditsData;
        }

        if (credits) {
          // Ensure current_balance is never null or undefined
          const safeCredits = {
            ...credits,
            current_balance: credits.current_balance ?? 0
          };
          return safeCredits as UserCreditsData;
        }

        // Fallback default object
        return {
          id: '',
          user_id: userProfile.user_id,
          current_balance: 0,
          free_credits: 0,
          paid_credits: 0,
          subscription_plan: 'free',
          next_reset_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as UserCreditsData;

      } catch (err) {
        console.error('[useUserCredits] Exception during fetch:', err);
        // Return default instead of throwing
        return {
          id: '',
          user_id: userProfile?.user_id || '',
          current_balance: 0,
          free_credits: 0,
          paid_credits: 0,
          subscription_plan: 'free',
          next_reset_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as UserCreditsData;
      }
    },
    enabled: !!userProfile?.user_id && !!user?.id, // Only enable when both are available
    staleTime: 10000, // Consider data stale after 10 seconds for more frequent updates
    gcTime: 300000, // Keep data cached for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus to ensure accurate balance
    refetchOnReconnect: true, // Refetch on network reconnect
    retry: 2, // Retry twice on failure
  });

  // Function to refresh credits data
  const refreshCredits = () => {
    queryClient.invalidateQueries({ queryKey: ['user_credits', userProfile?.user_id] });
  };

  return {
    ...query,
    refreshCredits
  };
};
