
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';

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
  
  return useQuery({
    queryKey: ['credit_transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.warn('[useCreditTransactions] No user ID available');
        return [];
      }
      
      console.log('[useCreditTransactions] Fetching transactions for Clerk user:', user.id);
      
      try {
        const { data: transactions, error } = await supabase
          .from('credit_transactions')
          .select('id, transaction_type, amount, balance_before, balance_after, description, feature_used, created_at')
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
    enabled: isLoaded && !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};
