
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, X } from 'lucide-react';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';

interface UsageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getFeatureDisplayName = (featureUsed: string, transactionType: string) => {
  // Map feature names to user-friendly display names
  const featureMap: { [key: string]: string } = {
    'job_analysis': 'Job Analysis',
    'company_role_analysis': 'Company Analysis',
    'interview_prep': 'Interview Preparation',
    'cover_letter': 'Cover Letter',
    'linkedin_post': 'LinkedIn Posts',
    'linkedin_image': 'LinkedIn Image',
    'job_alert_execution': 'Job Alert',
    'resume_pdf': 'Resume PDF'
  };

  // For transaction types that aren't feature usage
  if (transactionType !== 'feature_usage') {
    const typeMap: { [key: string]: string } = {
      'initial_signup': 'Initial Signup Bonus',
      'free_monthly_reset': 'Monthly Credit Reset',
      'credit_pack_purchase': 'Credit Pack Purchase',
      'subscription_add': 'Subscription Credits'
    };
    return typeMap[transactionType] || transactionType;
  }

  // Return the mapped feature name or fallback to the original
  return featureMap[featureUsed] || featureUsed || 'Feature Usage';
};

const UsageHistoryModal: React.FC<UsageHistoryModalProps> = ({ isOpen, onClose }) => {
  const { data: transactions, isLoading, error } = useTransactionHistory();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gradient-to-br from-slate-900 to-gray-900 border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold text-white">Usage History</DialogTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <span className="ml-3 text-gray-300">Loading transaction history...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 text-lg">Failed to load transaction history</p>
              <p className="text-gray-400 text-sm mt-2">Please try again later</p>
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No transaction history found</p>
              <p className="text-gray-500 text-sm mt-2">Your usage will appear here once you start using features</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mobile-friendly table */}
              <div className="hidden md:block">
                {/* Desktop table view */}
                <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-5 gap-4 p-4 bg-gray-700/50 font-semibold text-gray-200 text-sm">
                    <div>Date</div>
                    <div>Type</div>
                    <div>Amount</div>
                    <div>Balance After</div>
                    <div>Description</div>
                  </div>
                  {transactions.map((transaction, index) => (
                    <div
                      key={transaction.id}
                      className={`grid grid-cols-5 gap-4 p-4 text-sm ${
                        index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/50'
                      }`}
                    >
                      <div className="text-gray-300">
                        {new Date(transaction.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="text-gray-200 font-medium">
                        {getFeatureDisplayName(transaction.feature_used, transaction.transaction_type)}
                      </div>
                      <div className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </div>
                      <div className="text-gray-300">
                        {transaction.balance_after}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {transaction.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-3">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-white font-medium">
                          {getFeatureDisplayName(transaction.feature_used, transaction.transaction_type)}
                        </div>
                        <div className={`font-semibold text-lg ${
                          transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                        <span>
                          {new Date(transaction.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>Balance: {transaction.balance_after}</span>
                      </div>
                      
                      {transaction.description && (
                        <div className="text-xs text-gray-500 mt-2">
                          {transaction.description}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default UsageHistoryModal;
