
import { BadgeDollarSign } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";

const CreditBalanceDisplay = () => {
  const { data: credits, isLoading, error } = useUserCredits();

  // Show loading only on initial load (no isFetching states)
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

  // Static display - show credits without any loading indicators
  if (credits) {
    const balance = credits.current_balance ?? 0;

    return (
      <div className="flex flex-col gap-0.5 text-fuchsia-200 font-orbitron text-sm px-2">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5" />
          <span>
            {Number(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} credits
          </span>
        </div>
      </div>
    );
  }

  // Show error state or fallback
  if (error && !credits) {
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
