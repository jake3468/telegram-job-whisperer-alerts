
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
  
  return useQuery({
    queryKey: ['user_credits', userProfile?.user_id],
    queryFn: async () => {
      if (!userProfile?.user_id) {
        console.warn('[useUserCredits] No user_id available');
        return null;
      }
      
      console.log('[useUserCredits][debug] Fetching credits for user_id:', userProfile.user_id);
      
      try {
        const { data: credits, error } = await supabase
          .from('user_credits')
          .select('current_balance, free_credits, paid_credits, subscription_plan, next_reset_date, created_at, updated_at, id, user_id')
          .eq('user_id', userProfile.user_id)
          .maybeSingle();

        console.log('[useUserCredits][debug] Credits query result:', credits, 'error:', error);

        if (error) {
          console.error('[useUserCredits] Error fetching credits:', error);
          return null;
        }

        if (!credits) {
          console.warn('[useUserCredits] No credits found for user_id:', userProfile.user_id);
          return null;
        }

        console.log('[useUserCredits] Successfully fetched credits:', credits);
        return credits as UserCreditsData;

      } catch (err) {
        console.error('[useUserCredits] Exception during fetch:', err);
        return null;
      }
    },
    enabled: !!userProfile?.user_id,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
};
