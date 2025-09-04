
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles } from 'lucide-react';

interface SubscriptionBadgeProps {
  credits?: any;
}

const SubscriptionBadge = ({ credits }: SubscriptionBadgeProps) => {
  return (
    <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 text-xs px-2 py-1 font-orbitron">
      <Sparkles className="w-3 h-3 mr-1" />
      Free Plan
    </Badge>
  );
};

export default SubscriptionBadge;
