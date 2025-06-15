
import { BadgeDollarSign } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useUserProfile } from "@/hooks/useUserProfile";

const CreditBalanceDisplay = () => {
  const { data: credits, isLoading, error } = useUserCredits();
  const { userProfile, loading: userProfileLoading } = useUserProfile();

  console.log('[CreditBalanceDisplay] Render - credits:', credits, 'isLoading:', isLoading, 'error:', error);
  console.log('[CreditBalanceDisplay] UserProfile:', userProfile, 'userProfileLoading:', userProfileLoading);

  if (isLoading || userProfileLoading) {
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
          Error loading credits
        </div>
      </div>
    );
  }

  if (!credits) {
    // This could mean no credit row exists for this profile
    console.warn("No credit balance found for user profile.");
    return (
      <div className="flex flex-col text-yellow-400 font-orbitron text-xs">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5" />
          No credits found
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 text-fuchsia-200 font-orbitron text-sm px-2">
      <div className="flex items-center gap-2">
        <BadgeDollarSign className="w-5 h-5" />
        <span>
          {Number(credits.current_balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} credits
        </span>
      </div>
    </div>
  );
};

export default CreditBalanceDisplay;
