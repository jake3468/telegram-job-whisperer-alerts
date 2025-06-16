
import { BadgeDollarSign } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";

const CreditBalanceDisplay = () => {
  const { data: credits, isLoading, error, isFetching } = useUserCredits();

  console.log('[CreditBalanceDisplay] Render - credits:', credits, 'isLoading:', isLoading, 'error:', error);

  // Show a subtle loading state only when initially loading (no previous data)
  if (isLoading && !credits) {
    return (
      <div className="flex flex-col gap-2 text-fuchsia-200 font-orbitron text-xs">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5 animate-pulse opacity-70" />
          <span className="opacity-70">Loading...</span>
        </div>
      </div>
    );
  }

  // If we have credits data, always show it (even during background refetching)
  if (credits) {
    const balance = credits.current_balance ?? 0;

    return (
      <div className="flex flex-col gap-0.5 text-fuchsia-200 font-orbitron text-sm px-2">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className={`w-5 h-5 ${isFetching ? 'opacity-70' : ''}`} />
          <span className={isFetching ? 'opacity-70' : ''}>
            {Number(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} credits
          </span>
        </div>
      </div>
    );
  }

  // Only show error state if there's actually an error and no cached data
  if (error && !credits) {
    console.error("Error loading credits:", error);
    return (
      <div className="flex flex-col text-fuchsia-200 font-orbitron text-xs opacity-70">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5" />
          <span className="text-xs">Credits</span>
        </div>
      </div>
    );
  }

  // Fallback - should rarely be shown
  return (
    <div className="flex flex-col text-fuchsia-200 font-orbitron text-xs opacity-70">
      <div className="flex items-center gap-2">
        <BadgeDollarSign className="w-5 h-5" />
        <span className="text-xs">Credits</span>
      </div>
    </div>
  );
};

export default CreditBalanceDisplay;
