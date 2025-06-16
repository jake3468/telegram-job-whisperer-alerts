
import { BadgeDollarSign } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useClerkSupabaseDebug } from "@/hooks/useClerkSupabaseDebug";
import { useUser } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";

const CreditBalanceDisplay = () => {
  const { data: credits, isLoading, error } = useUserCredits();
  const { user } = useUser();
  const { debugClerkSupabaseIntegration } = useClerkSupabaseDebug();

  console.log('[CreditBalanceDisplay] Render - credits:', credits, 'isLoading:', isLoading, 'error:', error);

  const handleDebug = () => {
    debugClerkSupabaseIntegration();
  };

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
        <Button 
          onClick={handleDebug} 
          variant="ghost" 
          size="sm" 
          className="text-xs mt-1 text-rose-400 hover:text-rose-300"
        >
          Debug Connection
        </Button>
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
        <Button 
          onClick={handleDebug} 
          variant="ghost" 
          size="sm" 
          className="text-xs mt-1 text-yellow-400 hover:text-yellow-300"
        >
          Debug Connection
        </Button>
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
