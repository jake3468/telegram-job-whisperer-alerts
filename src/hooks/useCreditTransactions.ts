
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
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['credit_transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.warn('[useCreditTransactions] No clerk user ID available');
        return [];
      }
      
      console.log('[useCreditTransactions] Fetching transactions for clerk user_id:', user.id);
      
      try {
        // First get the internal user_id from the users table using clerk_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .maybeSingle();

        if (userError) {
          console.error('[useCreditTransactions] Error fetching user data:', userError);
          return [];
        }

        if (!userData) {
          console.warn('[useCreditTransactions] No user data found for clerk_id:', user.id);
          return [];
        }

        console.log('[useCreditTransactions] Found internal user_id:', userData.id);
        
        const { data: transactions, error } = await supabase
          .from('credit_transactions')
          .select('id, transaction_type, amount, balance_before, balance_after, description, feature_used, created_at')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[useCreditTransactions] Error fetching transactions:', error);
          return [];
        }

        console.log('[useCreditTransactions] Successfully fetched transactions:', transactions?.length || 0);
        return transactions as CreditTransaction[];
      } catch (error) {
        console.error('[useCreditTransactions] Unexpected error:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};
