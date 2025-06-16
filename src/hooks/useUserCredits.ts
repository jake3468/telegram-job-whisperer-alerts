
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
  const { userProfile } = useUserProfile(); // This should contain the UUID from users table
  
  return useQuery({
    queryKey: ['user_credits', userProfile?.id], // assuming userProfile.id is the UUID
    queryFn: async () => {
      if (!userProfile?.id) {
        console.warn('[useUserCredits] No user UUID available');
        return null;
      }
      
      console.log('[useUserCredits][debug] Fetching credits for user UUID:', userProfile.id);
      
      try {
        // Direct join query - exactly like your SQL
        const { data: result, error } = await supabase
          .from('user_credits')
          .select(`
            current_balance,
            free_credits,
            paid_credits,
            subscription_plan,
            next_reset_date,
            created_at,
            updated_at,
            id,
            user_id,
            users!inner(id)
          `)
          .eq('users.id', userProfile.id)
          .single();

        console.log('[useUserCredits][debug] Query result:', result, 'error:', error);

        if (error) {
          console.error('[useUserCredits] Error fetching credits:', error);
          return null;
        }

        if (!result) {
          console.warn('[useUserCredits] No credits found for user UUID:', userProfile.id);
          return null;
        }

        console.log('[useUserCredits] Successfully fetched credits:', result);
        return result as UserCreditsData;

      } catch (err) {
        console.error('[useUserCredits] Exception during fetch:', err);
        return null;
      }
    },
    enabled: !!userProfile?.id,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
};
