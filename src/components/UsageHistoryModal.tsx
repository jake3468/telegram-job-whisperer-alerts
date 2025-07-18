import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Loader2, CreditCard, Coins, X } from 'lucide-react';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
const UsageHistoryModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    data: transactions,
    isLoading,
    error
  } = useTransactionHistory();
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
  const formatPaymentAmount = (amount: number, currency: string) => {
    // Convert both INR and USD from their smallest units to main units
    const displayAmount = currency === 'INR' || currency === 'USD' ? amount / 100 : amount;
    const currencySymbol = currency === 'INR' ? '₹' : '$';
    return `${currencySymbol}${displayAmount}`;
  };
  const getTransactionTypeDisplay = (type: string, description: string | null) => {
    // Map transaction types to user-friendly names with specific page identification
    const typeMap: Record<string, string> = {
      'initial_signup': 'Initial Signup',
      'feature_usage': 'Feature Usage',
      'free_monthly_reset': 'Monthly Reset',
      'subscription_add': 'Subscription',
      'manual_adjustment': 'Manual Adjustment',
      'credit_pack_purchase': 'Credit Pack',
      'usage': 'AI Interview Used',
      'purchase': 'AI Interview Purchase'
    };

    // If it's feature usage, try to extract the specific page from description
    if (type === 'feature_usage' && description) {
      if (description.toLowerCase().includes('job analysis')) {
        return 'Job Analysis';
      } else if (description.toLowerCase().includes('linkedin') || description.toLowerCase().includes('post')) {
        return 'LinkedIn Posts';
      } else if (description.toLowerCase().includes('cover letter')) {
        return 'Cover Letter';
      } else if (description.toLowerCase().includes('interview')) {
        return 'Interview Prep';
      } else if (description.toLowerCase().includes('company') && description.toLowerCase().includes('analysis')) {
        return 'Company Analysis';
      } else if (description.toLowerCase().includes('resume')) {
        return 'Resume Builder';
      } else if (description.toLowerCase().includes('job alert')) {
        return 'Job Alerts';
      }
    }
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
  const getStatusColor = (status: string) => {
    if (status === 'active' || status === 'completed') {
      return 'bg-green-500/20 text-green-300';
    } else if (status === 'failed') {
      return 'bg-red-500/20 text-red-300';
    } else {
      return 'bg-gray-500/20 text-gray-300';
    }
  };
  const creditTransactions = transactions?.filter(tx => tx.source === 'credit_transaction' && tx.featureUsed !== 'AI Mock Interview') || [];
  const aiInterviewTransactions = transactions?.filter(tx => tx.source === 'credit_transaction' && tx.featureUsed === 'AI Mock Interview') || [];
  const paymentRecords = transactions?.filter(tx => tx.source === 'payment_record') || [];
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-white/20 font-orbitron text-xs text-gray-950 bg-stone-100">
          <History className="w-4 h-4 mr-2" />
          Usage History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 border-blue-400/30">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-orbitron font-bold text-blue-100">
              Transaction History
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-blue-200 hover:text-blue-100 hover:bg-blue-800/30"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {isLoading ? <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="ml-2 text-blue-200">Loading transactions...</span>
          </div> : error ? <div className="text-center py-8 text-red-300">
            Error loading transaction history
          </div> : <Tabs defaultValue="credits" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 gap-1 p-1 h-auto min-h-[48px]">
              <TabsTrigger value="credits" className="text-blue-200 data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-100 text-xs px-1 py-2 flex-col gap-1 whitespace-nowrap overflow-hidden">
                <Coins className="w-3 h-3 flex-shrink-0" />
                <span className="truncate text-center">
                  Credits ({creditTransactions.filter(tx => tx.featureUsed !== 'AI Mock Interview').length})
                </span>
              </TabsTrigger>
              <TabsTrigger value="ai-interviews" className="text-blue-200 data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-100 text-xs px-1 py-2 flex-col gap-1 whitespace-nowrap overflow-hidden">
                <History className="w-3 h-3 flex-shrink-0" />
                <span className="truncate text-center">
                  AI Interviews ({aiInterviewTransactions.length})
                </span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-blue-200 data-[state=active]:bg-blue-600/30 data-[state=active]:text-blue-100 text-xs px-1 py-2 flex-col gap-1 whitespace-nowrap overflow-hidden">
                <CreditCard className="w-3 h-3 flex-shrink-0" />
                <span className="truncate text-center">
                  Payments ({paymentRecords.length})
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="credits" className="overflow-hidden">
              {creditTransactions.length === 0 ? <div className="text-center py-8 text-blue-200">
                  No credit transactions found
                </div> : <ScrollArea className="h-[50vh] w-full">
                  {/* Mobile View */}
                  <div className="block md:hidden space-y-4">
                    {creditTransactions.map(transaction => <div key={transaction.id} className="bg-slate-800/40 rounded-lg p-4 border border-blue-400/20">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-blue-100 text-sm font-medium">
                            {getTransactionTypeDisplay(transaction.type, transaction.description)}
                          </div>
                          <div className={`text-sm font-bold font-mono ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatAmount(transaction.amount)}
                          </div>
                        </div>
                        <div className="text-blue-200 text-xs mb-2">
                          {formatDate(transaction.date)}
                        </div>
                        <div className="text-blue-100 text-xs mb-2 break-words">
                          {transaction.description || (transaction.featureUsed ? `Used for ${transaction.featureUsed}` : '-')}
                        </div>
                        <div className="text-blue-200 text-xs">
                          Balance: {transaction.balanceAfter?.toFixed(1) || '-'}
                        </div>
                      </div>)}
                  </div>

                  {/* Desktop/Tablet View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow className="border-blue-400/30 hover:bg-white/5">
                          <TableHead className="text-blue-200 font-orbitron" style={{width: '180px'}}>Date</TableHead>
                          <TableHead className="text-blue-200 font-orbitron" style={{width: '120px'}}>Type</TableHead>
                          <TableHead className="text-blue-200 font-orbitron" style={{width: '250px'}}>Description</TableHead>
                          <TableHead className="text-blue-200 font-orbitron text-right" style={{width: '80px'}}>Amount</TableHead>
                          <TableHead className="text-blue-200 font-orbitron text-right" style={{width: '90px'}}>Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditTransactions.map(transaction => <TableRow key={transaction.id} className="border-blue-400/20 hover:bg-white/5">
                            <TableCell className="text-blue-100 text-sm" style={{width: '180px'}}>
                              <div className="truncate">
                                {formatDate(transaction.date)}
                              </div>
                            </TableCell>
                            <TableCell className="text-blue-100 text-sm font-medium" style={{width: '120px'}}>
                              <div className="truncate">
                                {getTransactionTypeDisplay(transaction.type, transaction.description)}
                              </div>
                            </TableCell>
                            <TableCell className="text-blue-100 text-xs" style={{width: '250px'}}>
                              <div className="truncate" title={transaction.description || (transaction.featureUsed ? `Used for ${transaction.featureUsed}` : '-')}>
                                {transaction.description || (transaction.featureUsed ? `Used for ${transaction.featureUsed}` : '-')}
                              </div>
                            </TableCell>
                            <TableCell className={`text-right font-mono text-sm font-bold ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`} style={{width: '80px'}}>
                              <div className="truncate">
                                {formatAmount(transaction.amount)}
                              </div>
                            </TableCell>
                            <TableCell className="text-blue-100 text-right font-mono text-sm" style={{width: '90px'}}>
                              <div className="truncate">
                                {transaction.balanceAfter?.toFixed(1) || '-'}
                              </div>
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>}
            </TabsContent>

            <TabsContent value="ai-interviews" className="overflow-hidden">
              {aiInterviewTransactions.length === 0 ? <div className="text-center py-8 text-blue-200">
                  No AI interview transactions found
                </div> : <ScrollArea className="h-[50vh] w-full">
                  {/* Mobile View */}
                  <div className="block md:hidden space-y-4">
                    {aiInterviewTransactions.map(transaction => <div key={transaction.id} className="bg-slate-800/40 rounded-lg p-4 border border-blue-400/20">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-blue-100 text-sm font-medium">
                            {getTransactionTypeDisplay(transaction.type, transaction.description)}
                          </div>
                          <div className={`text-sm font-bold font-mono ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatAmount(transaction.amount)}
                          </div>
                        </div>
                        <div className="text-blue-200 text-xs mb-2">
                          {formatDate(transaction.date)}
                        </div>
                        <div className="text-blue-100 text-xs mb-2 break-words">
                          {transaction.description}
                        </div>
                         <div className="text-blue-200 text-xs">
                           Calls Remaining: {transaction.balanceAfter?.toFixed(0) || '-'}
                         </div>
                      </div>)}
                  </div>

                  {/* Desktop/Tablet View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table className="w-full min-w-[600px]">
                      <TableHeader>
                        <TableRow className="border-blue-400/30 hover:bg-white/5">
                          <TableHead className="text-blue-200 font-orbitron">Date</TableHead>
                          <TableHead className="text-blue-200 font-orbitron">Type</TableHead>
                          <TableHead className="text-blue-200 font-orbitron">Description</TableHead>
                           <TableHead className="text-blue-200 font-orbitron text-right">Calls</TableHead>
                           <TableHead className="text-blue-200 font-orbitron text-right">Remaining</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aiInterviewTransactions.map(transaction => <TableRow key={transaction.id} className="border-blue-400/20 hover:bg-white/5">
                            <TableCell className="text-blue-100 text-sm">
                              {formatDate(transaction.date)}
                            </TableCell>
                            <TableCell className="text-blue-100 text-sm font-medium">
                              {getTransactionTypeDisplay(transaction.type, transaction.description)}
                            </TableCell>
                            <TableCell className="text-blue-100 text-xs">
                              <div className="break-words" title={transaction.description}>
                                {transaction.description}
                              </div>
                            </TableCell>
                            <TableCell className={`text-right font-mono text-sm font-bold ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatAmount(transaction.amount)}
                            </TableCell>
                            <TableCell className="text-blue-100 text-right font-mono text-sm">
                              {transaction.balanceAfter?.toFixed(0) || '-'}
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>}
            </TabsContent>
            
            <TabsContent value="payments" className="overflow-hidden">
              {paymentRecords.length === 0 ? <div className="text-center py-8 text-blue-200">
                  No payment records found
                </div> : <ScrollArea className="h-[50vh] w-full">
                  {/* Mobile View */}
                  <div className="block md:hidden space-y-4">
                    {paymentRecords.map(record => <div key={record.id} className="bg-slate-800/40 rounded-lg p-4 border border-blue-400/20">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-blue-100 text-sm font-medium">
                            {getPaymentEventDisplay(record.type)}
                          </div>
                          <div className="text-green-400 text-sm font-bold font-mono">
                            {record.amount > 0 ? `+${record.amount}` : '-'}
                          </div>
                        </div>
                        <div className="text-blue-200 text-xs mb-2">
                          {formatDate(record.date)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                          <div className="text-blue-100 text-xs font-mono">
                            {record.paymentDetails?.price_amount && record.currency ? formatPaymentAmount(record.paymentDetails.price_amount, record.currency) : '-'}
                          </div>
                        </div>
                      </div>)}
                  </div>

                  {/* Desktop/Tablet View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table className="w-full min-w-[600px]">
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
                        {paymentRecords.map(record => <TableRow key={record.id} className="border-blue-400/20 hover:bg-white/5">
                            <TableCell className="text-blue-100 text-sm">
                              {formatDate(record.date)}
                            </TableCell>
                            <TableCell className="text-blue-100 text-sm font-medium">
                              {getPaymentEventDisplay(record.type)}
                            </TableCell>
                            <TableCell className="text-blue-100 text-xs">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(record.status)}`}>
                                {record.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-blue-100 text-right font-mono text-sm">
                              {record.paymentDetails?.price_amount && record.currency ? formatPaymentAmount(record.paymentDetails.price_amount, record.currency) : '-'}
                            </TableCell>
                            <TableCell className="text-green-400 text-right font-mono text-sm font-bold">
                              {record.amount > 0 ? `+${record.amount}` : '-'}
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>}
            </TabsContent>
          </Tabs>}
      </DialogContent>
    </Dialog>;
};
export default UsageHistoryModal;