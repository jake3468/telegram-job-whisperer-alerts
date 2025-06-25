
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { format } from 'date-fns';

const SubscriptionStatusCard = () => {
  const { data: subscriptions, isLoading } = useSubscriptionStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">Loading subscription status...</div>
        </CardContent>
      </Card>
    );
  }

  const activeSubscriptions = subscriptions?.filter(sub => sub.status === 'active') || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeSubscriptions.length > 0 ? (
          <div className="space-y-4">
            {activeSubscriptions.map((subscription) => (
              <div key={subscription.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(subscription.status)}
                    <div>
                      <h3 className="font-medium">
                        {subscription.payment_products?.product_name || 'Unknown Plan'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {subscription.payment_products?.credits_amount} credits per month
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status}
                  </Badge>
                </div>
                
                {subscription.next_billing_date && (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Next billing: {format(new Date(subscription.next_billing_date), 'PPP')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500 mb-2">No active subscriptions</div>
            <p className="text-xs text-gray-400">
              Subscribe to get monthly credits automatically
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusCard;
