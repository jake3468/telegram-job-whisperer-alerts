
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
        console.warn('[useCreditTransactions] No user_id available');
        return [];
      }
      
      console.log('[useCreditTransactions] Fetching transactions for user_id:', userProfile.user_id);
      
      const { data: transactions, error } = await supabase
        .from('credit_transactions')
        .select('id, transaction_type, amount, balance_before, balance_after, description, feature_used, created_at')
        .eq('user_id', userProfile.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useCreditTransactions] Error fetching transactions:', error);
        throw error;
      }

      console.log('[useCreditTransactions] Successfully fetched transactions:', transactions?.length || 0);
      return transactions as CreditTransaction[];
    },
    enabled: !!userProfile?.user_id,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};
