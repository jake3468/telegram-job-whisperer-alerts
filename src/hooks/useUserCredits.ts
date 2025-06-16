
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';

// Simple type for credits response - matching actual database schema
type UserCreditsData = {
  id: string;
  user_profile_id: string; // This matches the actual database schema
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

// Fetches current user credit info from Supabase
export const useUserCredits = () => {
  const { user } = useUser();

  console.log('[useUserCredits][debug] Clerk user:', user?.id);

  if (!user) {
    console.warn('[useUserCredits][warn] Clerk user not found! You must be signed in for credits RLS to work.');
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
        // Fetch user_credits directly using the user's ID from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single();

        if (userError || !userData) {
          console.error('[useUserCredits] Error fetching user data:', userError);
          return { __error: userError || { message: 'User not found' }, __debug: { action: 'user_lookup_failed', clerk_id: user.id } };
        }

        console.log('[useUserCredits][debug] Found user ID:', userData.id);

        // Get user_profile_id from user_profile table
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('id')
          .eq('user_id', userData.id)
          .single();

        if (profileError || !profileData) {
          console.error('[useUserCredits] Error fetching user profile:', profileError);
          return { __error: profileError || { message: 'User profile not found' }, __debug: { action: 'profile_lookup_failed', user_id: userData.id } };
        }

        // Now fetch the credits using the user_profile_id
        const { data: credits, error } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_profile_id', profileData.id)
          .maybeSingle();

        console.log('[useUserCredits][debug] Credits query result:', credits, 'error:', error);

        if (error) {
          console.error('[useUserCredits] Error fetching credits:', error);
          return { __error: error, __debug: { action: 'fetch_failed', user_profile_id: profileData.id } };
        }

        if (!credits) {
          console.warn('[useUserCredits] No credits found for user_profile_id:', profileData.id);
          return { __error: { message: 'No credits found' }, __debug: { action: 'no_credits_found', user_profile_id: profileData.id } };
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
