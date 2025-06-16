
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

// Fetches current user credit info from Supabase using direct SQL approach
export const useUserCredits = () => {
  const { user } = useUser();

  console.log('[useUserCredits][debug] Clerk user:', user?.id);

  return useQuery({
    queryKey: ['user_credits', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.warn('[useUserCredits] No user.id, returning null');
        return null;
      }

      console.log('[useUserCredits][debug] Fetching credits for Clerk user:', user.id);

      try {
        // Direct query using the simple SQL you suggested
        // First get the user's UUID from the users table using their Clerk ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .maybeSingle();

        if (userError) {
          console.error('[useUserCredits] Error fetching user data:', userError);
          return null;
        }

        if (!userData) {
          console.warn('[useUserCredits] No user found for Clerk ID:', user.id);
          return null;
        }

        console.log('[useUserCredits][debug] Found user UUID:', userData.id);

        // Now get credits using the exact SQL approach you mentioned
        const { data: credits, error } = await supabase
          .from('user_credits')
          .select('current_balance, free_credits, paid_credits, subscription_plan, next_reset_date, created_at, updated_at, id, user_id')
          .eq('user_id', userData.id)
          .maybeSingle();

        console.log('[useUserCredits][debug] Credits query result:', credits, 'error:', error);

        if (error) {
          console.error('[useUserCredits] Error fetching credits:', error);
          return null;
        }

        if (!credits) {
          console.warn('[useUserCredits] No credits found for user UUID:', userData.id);
          return null;
        }

        console.log('[useUserCredits] Successfully fetched credits:', credits);
        return credits as UserCreditsData;
        
      } catch (err) {
        console.error('[useUserCredits] Exception during fetch:', err);
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
};
