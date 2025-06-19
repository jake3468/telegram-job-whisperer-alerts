
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
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
  const { userProfile } = useUserProfile();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['credit_transactions', userProfile?.user_id],
    queryFn: async () => {
      if (!userProfile?.user_id) {
        console.warn('[useCreditTransactions] No user_id available from userProfile');
        return [];
      }
      
      console.log('[useCreditTransactions] Fetching transactions for user_id:', userProfile.user_id);
      console.log('[useCreditTransactions] Clerk user ID:', user?.id);
      
      // Debug: Check if we can get the JWT token
      try {
        const jwt = await user?.getToken?.({ template: 'supabase' });
        console.log('[useCreditTransactions] JWT token available:', !!jwt);
        if (jwt) {
          const payload = JSON.parse(atob(jwt.split('.')[1]));
          console.log('[useCreditTransactions] JWT sub claim:', payload.sub);
        }
      } catch (jwtError) {
        console.warn('[useCreditTransactions] JWT debug error:', jwtError);
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
