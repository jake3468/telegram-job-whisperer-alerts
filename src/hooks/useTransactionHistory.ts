
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useUserProfile } from '@/hooks/useUserProfile';

type TransactionHistoryItem = {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  balanceAfter: number | null;
  featureUsed: string | null;
  source: 'credit_transaction' | 'payment_record';
  // Credit transaction specific fields
  transaction_type?: string;
  balance_after?: number;
  feature_used?: string;
  created_at?: string;
  // Payment record specific fields
  event_type?: string;
  status?: string;
  currency?: string;
  credits_awarded?: number;
  paymentDetails?: {
    product_name: string | null;
    product_type: string | null;
    price_amount: number;
    currency: string | null;
    status: string;
  };
};

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

        // Get payment records with product details
        const { data: paymentRecords, error: paymentError } = await supabase
          .from('payment_records')
          .select(`
            id,
            event_type,
            amount,
            currency,
            status,
            product_id,
            credits_awarded,
            created_at,
            processed,
            customer_email
          `)
          .eq('user_id', userProfile.user_id)
          .eq('processed', true)
          .order('created_at', { ascending: false })
          .limit(50);

        if (paymentError) {
          console.error('[useTransactionHistory] Error fetching payment records:', paymentError);
          throw paymentError;
        }

        // Get product details separately
        const productIds = paymentRecords?.map(p => p.product_id).filter(Boolean) || [];
        const { data: products } = await supabase
          .from('payment_products')
          .select('product_id, product_name, product_type')
          .in('product_id', productIds);

        const productMap = new Map(products?.map(p => [p.product_id, p]) || []);

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
              source: 'credit_transaction',
              // Include original fields for filtering
              transaction_type: transaction.transaction_type,
              balance_after: Number(transaction.balance_after),
              feature_used: transaction.feature_used,
              created_at: transaction.created_at
            });
          });
        }

        // Add payment records
        if (paymentRecords) {
          paymentRecords.forEach(payment => {
            const product = productMap.get(payment.product_id);
            allTransactions.push({
              id: payment.id,
              type: payment.event_type,
              amount: Number(payment.credits_awarded || 0),
              description: `${product?.product_name || 'Product purchase'} - ${payment.status}`,
              date: payment.created_at,
              balanceAfter: null,
              featureUsed: null,
              source: 'payment_record',
              // Include original fields for filtering
              event_type: payment.event_type,
              status: payment.status,
              currency: payment.currency,
              credits_awarded: payment.credits_awarded,
              created_at: payment.created_at,
              paymentDetails: {
                product_name: product?.product_name || null,
                product_type: product?.product_type || null,
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
