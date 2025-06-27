
import { useUserCredits } from '@/hooks/useUserCredits';
import { useSidebar } from '@/components/ui/sidebar';
import { Loader2, AlertTriangle } from 'lucide-react';

const CreditBalanceDisplay = () => {
  const { data: credits, isLoading, error, isError } = useUserCredits();
  const { state } = useSidebar();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-fuchsia-200 text-sm font-orbitron">
        <Loader2 className="w-4 h-4 animate-spin" />
        {state === 'expanded' && <span>Loading...</span>}
      </div>
    );
  }

  // Handle error state - show warning but don't show 0 credits
  if (isError || !credits) {
    console.error('[CreditBalanceDisplay] Error loading credits:', error);
    return (
      <div className="flex items-center gap-2 text-orange-400 text-sm font-orbitron">
        <AlertTriangle className="w-4 h-4" />
        {state === 'expanded' ? (
          <span>Credits unavailable</span>
        ) : (
          <span className="text-xs">!</span>
        )}
      </div>
    );
  }

  // Ensure we have a valid number for current_balance - never show negative or invalid values
  const balance = Math.max(Number(credits.current_balance) || 0, 0);
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
