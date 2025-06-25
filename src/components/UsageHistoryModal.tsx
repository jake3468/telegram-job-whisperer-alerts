
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Loader2, CreditCard, Coins } from 'lucide-react';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';

const UsageHistoryModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: transactions, isLoading, error } = useTransactionHistory();

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

  const getPaymentEventDisplay = (eventType: string) => {
    const eventMap: Record<string, string> = {
      'payment.completed': 'Payment Completed',
      'payment.failed': 'Payment Failed',
      'subscription.created': 'Subscription Created',
      'subscription.renewed': 'Subscription Renewed',
      'subscription.cancelled': 'Subscription Cancelled'
    };
    return eventMap[eventType] || eventType;
  };

  const creditTransactions = transactions?.filter(tx => tx.record_type === 'credit') || [];
  const paymentRecords = transactions?.filter(tx => tx.record_type === 'payment') || [];

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
      <DialogContent className="max-w-5xl max-h-[80vh] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 border-blue-400/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-orbitron font-bold text-blue-100">
            Transaction History
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="ml-2 text-blue-200">Loading transactions...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-300">
            Error loading transaction history
          </div>
        ) : (
          <Tabs defaultValue="credits" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
              <TabsTrigger value="credits" className="text-blue-200 data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-100">
                <Coins className="w-4 h-4 mr-2" />
                Credit Usage ({creditTransactions.length})
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-blue-200 data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-100">
                <CreditCard className="w-4 h-4 mr-2" />
                Payment History ({paymentRecords.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="credits" className="overflow-auto max-h-[50vh]">
              {creditTransactions.length === 0 ? (
                <div className="text-center py-8 text-blue-200">
                  No credit transactions found
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
                    {creditTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-blue-400/20 hover:bg-white/5">
                        <TableCell className="text-blue-100 text-sm">
                          {transaction.record_type === 'credit' && formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell className="text-blue-100 text-sm font-medium">
                          {transaction.record_type === 'credit' && getTransactionTypeDisplay(transaction.transaction_type)}
                        </TableCell>
                        <TableCell className="text-blue-100 text-xs max-w-xs truncate">
                          {transaction.record_type === 'credit' && (transaction.description || (transaction.feature_used ? `Used for ${transaction.feature_used}` : '-'))}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-sm font-bold ${
                          transaction.record_type === 'credit' && transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.record_type === 'credit' && formatAmount(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-blue-100 text-right font-mono text-sm">
                          {transaction.record_type === 'credit' && transaction.balance_after.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="payments" className="overflow-auto max-h-[50vh]">
              {paymentRecords.length === 0 ? (
                <div className="text-center py-8 text-blue-200">
                  No payment records found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-blue-400/30 hover:bg-white/5">
                      <TableHead className="text-blue-200 font-orbitron">Date</TableHead>
                      <TableHead className="text-blue-200 font-orbitron">Event</TableHead>
                      <TableHead className="text-blue-200 font-orbitron">Status</TableHead>
                      <TableHead className="text-blue-200 font-orbitron text-right">Amount</TableHead>
                      <TableHead className="text-blue-200 font-orbitron text-right">Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRecords.map((record) => (
                      <TableRow key={record.id} className="border-blue-400/20 hover:bg-white/5">
                        <TableCell className="text-blue-100 text-sm">
                          {record.record_type === 'payment' && formatDate(record.created_at)}
                        </TableCell>
                        <TableCell className="text-blue-100 text-sm font-medium">
                          {record.record_type === 'payment' && getPaymentEventDisplay(record.event_type)}
                        </TableCell>
                        <TableCell className="text-blue-100 text-xs">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            record.record_type === 'payment' && record.status === 'active' 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {record.record_type === 'payment' && record.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-blue-100 text-right font-mono text-sm">
                          {record.record_type === 'payment' && record.amount && record.currency 
                            ? `${record.currency === 'INR' ? '₹' : '$'}${record.amount}` 
                            : '-'}
                        </TableCell>
                        <TableCell className="text-green-400 text-right font-mono text-sm font-bold">
                          {record.record_type === 'payment' && record.credits_awarded 
                            ? `+${record.credits_awarded}` 
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UsageHistoryModal;
