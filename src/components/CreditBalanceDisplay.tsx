
import { useUserCredits } from '@/hooks/useUserCredits';
import { useSidebar } from '@/components/ui/sidebar';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CreditBalanceDisplay = () => {
  const { data: credits, isLoading, error, isError, refetch } = useUserCredits();
  const { state } = useSidebar();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-fuchsia-200 text-sm font-orbitron">
        <Loader2 className="w-4 h-4 animate-spin" />
        {state === 'expanded' && <span>Loading credits...</span>}
      </div>
    );
  }

  // Handle error state - show retry option instead of defaulting to 0
  if (isError || !credits) {
    console.error('[CreditBalanceDisplay] Error loading credits:', error);
    return (
      <div className="flex items-center gap-2 text-orange-400 text-sm font-orbitron">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        {state === 'expanded' ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate">Credits failed to load</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-6 w-6 p-0 hover:bg-orange-400/20"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="h-5 w-5 p-0 hover:bg-orange-400/20"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
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
