
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, makeAuthenticatedRequest, refreshJWTToken } from '@/integrations/supabase/client';
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
  const { user, isLoaded: isClerkLoaded } = useUser();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['user_credits', userProfile?.user_id], 
    queryFn: async () => {
      // Ensure we have both Clerk user and user profile before proceeding
      if (!isClerkLoaded || !user?.id || !userProfile?.user_id) {
        throw new Error('Authentication not ready');
      }
      
      // Proactively refresh JWT token before making request
      await refreshJWTToken();
      
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // Use authenticated request with enhanced error handling
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
                  return {
                    ...retryCredits,
                    current_balance: Math.max(Number(retryCredits.current_balance) || 0, 0)
                  } as UserCreditsData;
                }
              }
            }
            
            // For JWT or auth errors, refresh token and retry
            if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('expired')) {
              await refreshJWTToken();
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
            
            // For other errors, also retry with backoff
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
              continue;
            }
            
            throw new Error(`Failed to fetch credits after ${maxRetries} attempts: ${error.message}`);
          }

          if (credits) {
            // Ensure current_balance is never null or undefined and is a valid number
            const safeCredits = {
              ...credits,
              current_balance: Math.max(Number(credits.current_balance) || 0, 0)
            };
            return safeCredits as UserCreditsData;
          }

          throw new Error('No credits data returned from query');

        } catch (err) {
          retryCount++;
          
          if (retryCount < maxRetries) {
            await refreshJWTToken();
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            continue;
          }
          
          throw err;
        }
      }
      
      throw new Error(`Failed to fetch credits after ${maxRetries} attempts`);
    },
    enabled: !!(isClerkLoaded && user?.id && userProfile?.user_id),
    staleTime: 10000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    retry: false,
    retryDelay: 0,
    placeholderData: (previousData) => previousData,
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
