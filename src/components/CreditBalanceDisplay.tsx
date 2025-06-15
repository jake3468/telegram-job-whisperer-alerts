
import { BadgeDollarSign } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";

const CreditBalanceDisplay = () => {
  const { data, isLoading, error } = useUserCredits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-fuchsia-200 font-orbitron text-xs">
        <BadgeDollarSign className="w-5 h-5 animate-pulse" />
        Loading...
      </div>
    );
  }

  if (error) {
    console.error("Error loading credits:", error);
    return (
      <div className="flex items-center gap-2 text-rose-400 font-orbitron text-xs">
        <BadgeDollarSign className="w-5 h-5" />
        Error loading credits
      </div>
    );
  }

  if (!data) {
    // This could mean no credit row exists for this profile
    console.warn("No credit balance found for user profile.");
    return (
      <div className="flex items-center gap-2 text-yellow-400 font-orbitron text-xs">
        <BadgeDollarSign className="w-5 h-5" />
        No credits found
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-fuchsia-200 font-orbitron text-sm px-2">
      <BadgeDollarSign className="w-5 h-5" />
      <span>
        {Number(data.current_balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} credits
      </span>
    </div>
  );
};
export default CreditBalanceDisplay;
