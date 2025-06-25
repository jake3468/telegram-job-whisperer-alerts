
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
  record_type: 'credit';
};

type PaymentRecord = {
  id: string;
  event_type: string;
  amount: number | null;
  currency: string | null;
  status: string;
  product_id: string;
  credits_awarded: number | null;
  created_at: string;
  processed: boolean;
  customer_email: string;
  record_type: 'payment';
};

type CombinedTransaction = CreditTransaction | PaymentRecord;

export const useTransactionHistory = () => {
  const { user, isLoaded } = useUser();
  const { userProfile } = useUserProfile();
  
  return useQuery({
    queryKey: ['transaction_history', user?.id, userProfile?.user_id],
    queryFn: async () => {
      if (!user?.id || !userProfile?.user_id) {
        console.warn('[useTransactionHistory] No user ID available');
        return [];
      }
      
      console.log('[useTransactionHistory] Fetching transaction history for user:', user.id);
      
      try {
        // Fetch credit transactions
        const { data: creditTransactions, error: creditError } = await supabase
          .from('credit_transactions')
          .select('id, transaction_type, amount, balance_before, balance_after, description, feature_used, created_at')
          .eq('user_id', userProfile.user_id)
          .order('created_at', { ascending: false });

        if (creditError) {
          console.error('[useTransactionHistory] Error fetching credit transactions:', creditError);
        }

        // Fetch payment records
        const { data: paymentRecords, error: paymentError } = await supabase
          .from('payment_records')
          .select('id, event_type, amount, currency, status, product_id, credits_awarded, created_at, processed, customer_email')
          .eq('user_id', userProfile.user_id)
          .order('created_at', { ascending: false });

        if (paymentError) {
          console.error('[useTransactionHistory] Error fetching payment records:', paymentError);
        }

        // Combine and sort transactions
        const combinedTransactions: CombinedTransaction[] = [
          ...(creditTransactions || []).map(tx => ({ ...tx, record_type: 'credit' as const })),
          ...(paymentRecords || []).map(tx => ({ ...tx, record_type: 'payment' as const }))
        ];

        // Sort by created_at date (newest first)
        combinedTransactions.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        console.log('[useTransactionHistory] Successfully fetched combined transactions:', combinedTransactions.length);
        
        return combinedTransactions;
      } catch (error) {
        console.error('[useTransactionHistory] Unexpected error:', error);
        return [];
      }
    },
    enabled: isLoaded && !!user?.id && !!userProfile?.user_id,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};
