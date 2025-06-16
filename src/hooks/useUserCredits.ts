
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';

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

type ErrorResponse = {
  __error: any;
  __debug: any;
};

// Fetches current user credit info from Supabase using only user UUID
export const useUserCredits = () => {
  const { user } = useUser();

  console.log('[useUserCredits][debug] Clerk user:', user?.id);

  if (!user) {
    console.warn('[useUserCredits][warn] Clerk user not found! You must be signed in for credits to work.');
  }

  return useQuery({
    queryKey: ['user_credits', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.warn('[useUserCredits] No user.id, returning null');
        return null;
      }

      console.log('[useUserCredits][debug] Fetching credits for Clerk user:', user.id);

      try {
        // First get the user's UUID from the users table using their Clerk ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single();

        if (userError || !userData) {
          console.error('[useUserCredits] Error fetching user data:', userError);
          return { __error: userError || { message: 'User not found' }, __debug: { action: 'user_lookup_failed', clerk_id: user.id } };
        }

        console.log('[useUserCredits][debug] Found user UUID:', userData.id);

        // Now fetch credits using ONLY the user UUID - exactly as you suggested
        const { data: credits, error } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', userData.id)
          .single();

        console.log('[useUserCredits][debug] Credits query result:', credits, 'error:', error);

        if (error) {
          console.error('[useUserCredits] Error fetching credits:', error);
          return { __error: error, __debug: { action: 'fetch_failed', user_uuid: userData.id } };
        }

        if (!credits) {
          console.warn('[useUserCredits] No credits found for user UUID:', userData.id);
          return { __error: { message: 'No credits found' }, __debug: { action: 'no_credits_found', user_uuid: userData.id } };
        }

        console.log('[useUserCredits] Successfully fetched credits:', credits);
        return credits;
        
      } catch (err) {
        console.error('[useUserCredits] Exception during fetch:', err);
        return { __error: err, __debug: { action: 'fetch_exception', clerk_id: user.id } };
      }
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: (failureCount, error: any) => {
      console.log('[useUserCredits] Retry attempt:', failureCount, 'error:', error);
      // Don't retry RLS errors
      if (error?.code === 'PGRST301' || error?.code === 'PGRST116') {
        return false;
      }
      return failureCount < 2;
    },
  });
};
