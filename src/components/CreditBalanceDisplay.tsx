
import { useUserCredits } from '@/hooks/useUserCredits';
import { useSidebar } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

const CreditBalanceDisplay = () => {
  const { data: credits, isLoading, error } = useUserCredits();
  const { state } = useSidebar();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-fuchsia-200 text-sm font-orbitron">
        <Loader2 className="w-4 h-4 animate-spin" />
        {state === 'expanded' && <span>Loading...</span>}
      </div>
    );
  }

  if (error || !credits || credits.current_balance === null || credits.current_balance === undefined) {
    return (
      <div className="text-fuchsia-200 text-sm font-orbitron">
        {state === 'expanded' ? 'Credits: --' : '--'}
      </div>
    );
  }

  const balance = Number(credits.current_balance);
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
