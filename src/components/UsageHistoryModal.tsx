
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Loader2 } from 'lucide-react';
import { useCreditTransactions } from '@/hooks/useCreditTransactions';

const UsageHistoryModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: transactions, isLoading, error } = useCreditTransactions();

  const formatAmount = (amount: number) => {
    if (amount > 0) {
      return `+${amount}`;
    }
    return amount.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'initial_signup': 'Initial Signup',
      'feature_usage': 'Feature Usage',
      'free_monthly_reset': 'Monthly Reset',
      'subscription_add': 'Subscription',
      'manual_adjustment': 'Manual Adjustment',
      'credit_pack_purchase': 'Credit Pack'
    };
    return typeMap[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white font-orbitron text-xs"
        >
          <History className="w-4 h-4 mr-2" />
          Usage History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 border-blue-400/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-orbitron font-bold text-blue-100">
            Credit Usage History
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <span className="ml-2 text-blue-200">Loading transactions...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-300">
              Error loading transaction history
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-blue-200">
              No transaction history found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-blue-400/30 hover:bg-white/5">
                  <TableHead className="text-blue-200 font-orbitron">Date</TableHead>
                  <TableHead className="text-blue-200 font-orbitron">Type</TableHead>
                  <TableHead className="text-blue-200 font-orbitron">Description</TableHead>
                  <TableHead className="text-blue-200 font-orbitron text-right">Amount</TableHead>
                  <TableHead className="text-blue-200 font-orbitron text-right">Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="border-blue-400/20 hover:bg-white/5">
                    <TableCell className="text-blue-100 text-sm">
                      {formatDate(transaction.created_at)}
                    </TableCell>
                    <TableCell className="text-blue-100 text-sm font-medium">
                      {getTransactionTypeDisplay(transaction.transaction_type)}
                    </TableCell>
                    <TableCell className="text-blue-100 text-xs max-w-xs truncate">
                      {transaction.description || (transaction.feature_used ? `Used for ${transaction.feature_used}` : '-')}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm font-bold ${
                      transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatAmount(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-blue-100 text-right font-mono text-sm">
                      {transaction.balance_after.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UsageHistoryModal;
