
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
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
  const { user, isLoaded } = useUser();
  const { userProfile } = useUserProfile();
  
  return useQuery({
    queryKey: ['credit_transactions', user?.id, userProfile?.user_id],
    queryFn: async () => {
      if (!user?.id || !userProfile?.user_id) {
        console.warn('[useCreditTransactions] No user ID available');
        return [];
      }
      
      console.log('[useCreditTransactions] Fetching transactions for Clerk user:', user.id);
      console.log('[useCreditTransactions] Database user_id:', userProfile.user_id);
      
      try {
        // Debug: Check what JWT claims are available
        const { data: jwtDebug, error: jwtError } = await supabase.rpc('debug_jwt_claims');
        console.log('[useCreditTransactions] JWT Debug:', jwtDebug, 'Error:', jwtError);
        
        // Query with explicit user_id filter since RLS might not be working correctly
        const { data: transactions, error } = await supabase
          .from('credit_transactions')
          .select('id, transaction_type, amount, balance_before, balance_after, description, feature_used, created_at')
          .eq('user_id', userProfile.user_id)
          .order('created_at', { ascending: false });

        console.log('[useCreditTransactions] Credit transactions query result:', { transactions, error });

        if (error) {
          console.error('[useCreditTransactions] Error fetching transactions:', error);
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
    enabled: isLoaded && !!user?.id && !!userProfile?.user_id,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};
