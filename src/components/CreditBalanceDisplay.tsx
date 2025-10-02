
import { useCachedUserCredits } from '@/hooks/useCachedUserCredits';
import { useSidebar } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Analytics } from '@/utils/analytics';

const CreditBalanceDisplay = () => {
  const { data: credits, isLoading, isPending } = useCachedUserCredits();
  const { state } = useSidebar();

  // Only show loading on initial load, not on subsequent fetches
  if ((isLoading || isPending) && !credits) {
    return (
      <div className="flex items-center gap-2 text-gray-900 text-sm font-orbitron">
        <Loader2 className="w-4 h-4 animate-spin" />
        {state === 'expanded' && <span>Loading credits...</span>}
      </div>
    );
  }

  // Always show credits - use cached data if available, fallback to 0 only if no data at all
  const balance = credits ? Math.max(Number(credits.current_balance) || 0, 0) : 0;

  return (
    <div className="text-sm font-orbitron transition-colors font-semibold text-gray-900">
      {state === 'expanded' ? (
        <span>Credits: {balance}</span>
      ) : (
        <span className="text-xs">{balance}</span>
      )}
    </div>
  );
};

export default CreditBalanceDisplay;
