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

type TransactionHistoryItem = {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  balanceAfter: number | null;
  featureUsed: string | null;
  source: string;
  paymentDetails?: {
    product_name: string | null;
    product_type: string | null;
    price_amount: number;
    currency: string | null;
    status: string;
  };
};

type CombinedTransaction = CreditTransaction | PaymentRecord;

export const useTransactionHistory = () => {
  const { userProfile } = useUserProfile();
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['transaction_history', userProfile?.user_id],
    queryFn: async () => {
      if (!userProfile?.user_id) {
        return [];
      }

      try {
        console.log('[useTransactionHistory] Fetching transaction history for user:', userProfile.user_id);
        
        // Get credit transactions
        const { data: creditTransactions, error: creditError } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', userProfile.user_id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (creditError) {
          console.error('[useTransactionHistory] Error fetching credit transactions:', creditError);
          throw creditError;
        }

        // Get payment records
        const { data: paymentRecords, error: paymentError } = await supabase
          .from('payment_records')
          .select(`
            *,
            payment_products!inner(
              product_name,
              product_type,
              credits_amount
            )
          `)
          .eq('user_id', userProfile.user_id)
          .eq('processed', true)
          .order('created_at', { ascending: false })
          .limit(50);

        if (paymentError) {
          console.error('[useTransactionHistory] Error fetching payment records:', paymentError);
          throw paymentError;
        }

        // Combine and format the transactions
        const allTransactions: TransactionHistoryItem[] = [];

        // Add credit transactions
        if (creditTransactions) {
          creditTransactions.forEach(transaction => {
            allTransactions.push({
              id: transaction.id,
              type: transaction.transaction_type,
              amount: Number(transaction.amount),
              description: transaction.description || 'Credit transaction',
              date: transaction.created_at,
              balanceAfter: Number(transaction.balance_after),
              featureUsed: transaction.feature_used,
              source: 'credit_transaction'
            });
          });
        }

        // Add payment records
        if (paymentRecords) {
          paymentRecords.forEach(payment => {
            const product = payment.payment_products;
            allTransactions.push({
              id: payment.id,
              type: payment.event_type,
              amount: Number(payment.credits_awarded || 0),
              description: `${product?.product_name || 'Product purchase'} - ${payment.status}`,
              date: payment.created_at,
              balanceAfter: null,
              featureUsed: null,
              source: 'payment_record',
              paymentDetails: {
                product_name: product?.product_name,
                product_type: product?.product_type,
                price_amount: Number(payment.amount || 0),
                currency: payment.currency,
                status: payment.status
              }
            });
          });
        }

        // Sort all transactions by date (newest first)
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        console.log('[useTransactionHistory] Successfully fetched', allTransactions.length, 'transactions');
        return allTransactions;

      } catch (err) {
        console.error('[useTransactionHistory] Exception during fetch:', err);
        throw err;
      }
    },
    enabled: !!userProfile?.user_id && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
