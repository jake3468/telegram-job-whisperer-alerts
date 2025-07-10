
import { useCachedUserCredits } from '@/hooks/useCachedUserCredits';
import { useSidebar } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

const CreditBalanceDisplay = () => {
  const { data: credits, isLoading, isPending } = useCachedUserCredits();
  const { state } = useSidebar();

  // Only show loading on initial load, not on subsequent fetches
  if ((isLoading || isPending) && !credits) {
    return (
      <div className="flex items-center gap-2 text-fuchsia-200 text-sm font-orbitron">
        <Loader2 className="w-4 h-4 animate-spin" />
        {state === 'expanded' && <span>Loading credits...</span>}
      </div>
    );
  }

  // Always show credits - use cached data if available, fallback to 0 only if no data at all
  const balance = credits ? Math.max(Number(credits.current_balance) || 0, 0) : 0;
  const isLowCredits = balance < 5;

  return (
    <div className={`text-sm font-orbitron transition-colors ${
      isLowCredits ? 'text-orange-400' : 'text-fuchsia-200'
    }`}>
      {state === 'expanded' ? (
        <div className="flex flex-col gap-1">
          <span>Credits: {balance}</span>
          {isLowCredits && (
            <span className="text-xs text-orange-300">
              Low credits - consider upgrading
            </span>
          )}
        </div>
      ) : (
        <span className="text-xs">
          {balance}
          {isLowCredits && '⚠️'}
        </span>
      )}
    </div>
  );
};

export default CreditBalanceDisplay;
