
import { Badge } from '@/components/ui/badge';
import { useUserCredits } from '@/hooks/useUserCredits';
import { Crown, Sparkles } from 'lucide-react';

const SubscriptionBadge = () => {
  const { data: credits, isLoading } = useUserCredits();

  if (isLoading) {
    return (
      <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/30 text-xs px-2 py-1">
        Loading...
      </Badge>
    );
  }

  const subscriptionPlan = credits?.subscription_plan || 'free';
  const isPremium = subscriptionPlan === 'premium';

  return (
    <Badge 
      className={`text-xs px-2 py-1 font-orbitron ${
        isPremium 
          ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-200 border-yellow-400/30' 
          : 'bg-blue-500/20 text-blue-200 border-blue-400/30'
      }`}
    >
      {isPremium ? (
        <>
          <Crown className="w-3 h-3 mr-1" />
          Premium
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 mr-1" />
          Free Plan
        </>
      )}
    </Badge>
  );
};

export default SubscriptionBadge;
