
import { BadgeDollarSign } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useUser } from '@clerk/clerk-react';

const CreditBalanceDisplay = () => {
  const { data: credits, isLoading, error } = useUserCredits();
  const { user } = useUser();

  console.log('[CreditBalanceDisplay] Render - credits:', credits, 'isLoading:', isLoading, 'error:', error);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 text-fuchsia-200 font-orbitron text-xs">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5 animate-pulse" />
          Loading credits...
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Error loading credits:", error);
    return (
      <div className="flex flex-col text-rose-400 font-orbitron text-xs">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5" />
          <span className="text-xs">Error loading credits</span>
        </div>
      </div>
    );
  }

  if (!credits) {
    return (
      <div className="flex flex-col text-yellow-400 font-orbitron text-xs">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5" />
          No credits data available
        </div>
      </div>
    );
  }

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
};

export default CreditBalanceDisplay;
