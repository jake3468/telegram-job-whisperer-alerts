
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';

type CreditTransaction = {
  id: string;
  transaction_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  feature_used: string | null;
  created_at: string;
};

export const useCreditTransactions = () => {
  const { userProfile } = useUserProfile();
  
  return useQuery({
    queryKey: ['credit_transactions', userProfile?.user_id],
    queryFn: async () => {
      if (!userProfile?.user_id) {
        console.warn('[useCreditTransactions] No user_id available from userProfile');
        return [];
      }
      
      console.log('[useCreditTransactions] Fetching transactions for user_id:', userProfile.user_id);
      
      // Debug: Test the get_clerk_user_id function
      try {
        const { data: clerkUserId, error: clerkError } = await supabase.rpc('get_clerk_user_id');
        console.log('[useCreditTransactions] get_clerk_user_id result:', clerkUserId, 'error:', clerkError);
      } catch (debugError) {
        console.warn('[useCreditTransactions] get_clerk_user_id function error:', debugError);
      }
      
      try {
        const { data: transactions, error } = await supabase
          .from('credit_transactions')
          .select('id, transaction_type, amount, balance_before, balance_after, description, feature_used, created_at')
          .eq('user_id', userProfile.user_id)
          .order('created_at', { ascending: false });

        console.log('[useCreditTransactions] Credit transactions query result:', { transactions, error });

        if (error) {
          console.error('[useCreditTransactions] Error fetching transactions:', error);
          
          // If we get an RLS error, it means the JWT token isn't working
          if (error.message?.includes('policy')) {
            console.error('[useCreditTransactions] RLS policy blocked the query. This means the Clerk JWT is not being passed correctly to Supabase.');
          }
          
          return [];
        }

        console.log('[useCreditTransactions] Successfully fetched transactions count:', transactions?.length || 0);
        console.log('[useCreditTransactions] Transactions data:', transactions);
        
        return transactions as CreditTransaction[];
      } catch (error) {
        console.error('[useCreditTransactions] Unexpected error:', error);
        return [];
      }
    },
    enabled: !!userProfile?.user_id,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};
