
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
      'credit_pack_purchase': 'Credit Pack',
      'job_analysis': 'Job Analysis',
      'linkedin_posts': 'LinkedIn Posts',
      'linkedin_image': 'LinkedIn Image',
      'interview_prep': 'Interview Prep',
      'cover_letter': 'Cover Letter',
      'company_analysis': 'Company Analysis'
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

  const creditTransactions = transactions?.filter(tx => tx.source === 'credit_transaction') || [];
  const paymentRecords = transactions?.filter(tx => tx.source === 'payment_record') || [];

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
      <DialogContent className="max-w-6xl max-h-[85vh] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 border-blue-400/30">
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
            
            <TabsContent value="credits" className="overflow-hidden">
              {creditTransactions.length === 0 ? (
                <div className="text-center py-8 text-blue-200">
                  No credit transactions found
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[55vh] rounded-lg border border-blue-400/20">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-800/90 backdrop-blur-sm">
                      <TableRow className="border-blue-400/30 hover:bg-white/5">
                        <TableHead className="text-blue-200 font-orbitron min-w-[140px]">Date</TableHead>
                        <TableHead className="text-blue-200 font-orbitron min-w-[120px]">Type</TableHead>
                        <TableHead className="text-blue-200 font-orbitron min-w-[200px]">Description</TableHead>
                        <TableHead className="text-blue-200 font-orbitron text-right min-w-[80px]">Amount</TableHead>
                        <TableHead className="text-blue-200 font-orbitron text-right min-w-[100px]">Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="border-blue-400/20 hover:bg-white/5">
                          <TableCell className="text-blue-100 text-xs sm:text-sm">
                            {formatDate(transaction.date)}
                          </TableCell>
                          <TableCell className="text-blue-100 text-xs sm:text-sm font-medium">
                            {getTransactionTypeDisplay(transaction.type)}
                          </TableCell>
                          <TableCell className="text-blue-100 text-xs sm:text-sm max-w-xs">
                            <div className="truncate" title={transaction.description || (transaction.featureUsed ? `Used for ${transaction.featureUsed}` : '-')}>
                              {transaction.description || (transaction.featureUsed ? `Used for ${transaction.featureUsed}` : '-')}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-mono text-xs sm:text-sm font-bold ${
                            transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatAmount(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-blue-100 text-right font-mono text-xs sm:text-sm">
                            {transaction.balanceAfter?.toFixed(1) || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="payments" className="overflow-hidden">
              {paymentRecords.length === 0 ? (
                <div className="text-center py-8 text-blue-200">
                  No payment records found
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[55vh] rounded-lg border border-blue-400/20">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-800/90 backdrop-blur-sm">
                      <TableRow className="border-blue-400/30 hover:bg-white/5">
                        <TableHead className="text-blue-200 font-orbitron min-w-[140px]">Date</TableHead>
                        <TableHead className="text-blue-200 font-orbitron min-w-[140px]">Event</TableHead>
                        <TableHead className="text-blue-200 font-orbitron min-w-[100px]">Status</TableHead>
                        <TableHead className="text-blue-200 font-orbitron text-right min-w-[80px]">Amount</TableHead>
                        <TableHead className="text-blue-200 font-orbitron text-right min-w-[80px]">Credits</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRecords.map((record) => (
                        <TableRow key={record.id} className="border-blue-400/20 hover:bg-white/5">
                          <TableCell className="text-blue-100 text-xs sm:text-sm">
                            {formatDate(record.date)}
                          </TableCell>
                          <TableCell className="text-blue-100 text-xs sm:text-sm font-medium">
                            {getPaymentEventDisplay(record.type)}
                          </TableCell>
                          <TableCell className="text-blue-100 text-xs sm:text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              record.status === 'active' || record.status === 'completed'
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {record.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-blue-100 text-right font-mono text-xs sm:text-sm">
                            {record.paymentDetails?.price_amount && record.currency 
                              ? `${record.currency === 'INR' ? '₹' : '$'}${record.paymentDetails.price_amount}` 
                              : '-'}
                          </TableCell>
                          <TableCell className="text-green-400 text-right font-mono text-xs sm:text-sm font-bold">
                            {record.amount > 0 ? `+${record.amount}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UsageHistoryModal;
