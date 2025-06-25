
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, CreditCard, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
import { format } from 'date-fns';

const PaymentHistoryModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: paymentHistory, isLoading } = usePaymentHistory();

  const getStatusIcon = (status: string, eventType: string) => {
    if (status === 'active' || status === 'completed') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (status === 'failed') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getEventTypeDisplay = (eventType: string) => {
    switch (eventType) {
      case 'payment.completed':
        return 'Payment Completed';
      case 'payment.failed':
        return 'Payment Failed';
      case 'subscription.renewed':
        return 'Subscription Renewed';
      case 'subscription.created':
        return 'Subscription Created';
      case 'subscription.cancelled':
        return 'Subscription Cancelled';
      default:
        return eventType;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          Payment History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment History
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading payment history...</div>
            </div>
          ) : paymentHistory && paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.status, payment.event_type)}
                      <div>
                        <h3 className="font-medium">
                          {payment.payment_products?.product_name || 'Unknown Product'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {getEventTypeDisplay(payment.event_type)}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <div className="font-medium">
                        {payment.amount ? `${payment.currency} ${payment.amount.toFixed(2)}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Credits:</span>
                      <div className="font-medium text-green-600">
                        +{payment.credits_awarded}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Quantity:</span>
                      <div className="font-medium">{payment.quantity}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <div className="font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(payment.created_at), 'PPp')}
                      </div>
                    </div>
                  </div>
                  
                  {payment.payment_id && (
                    <div className="mt-2 text-xs text-gray-500">
                      Payment ID: {payment.payment_id}
                    </div>
                  )}
                  
                  {payment.subscription_id && (
                    <div className="mt-1 text-xs text-gray-500">
                      Subscription ID: {payment.subscription_id}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Payment History</h3>
              <p className="text-gray-500">Your payment transactions will appear here.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentHistoryModal;
