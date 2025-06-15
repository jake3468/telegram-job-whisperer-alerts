
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

  // Fall-through error detection for detailed errors
  const detailError = (credits as any)?.__error ?? error;
  if (detailError) {
    console.error("Error loading credits:", detailError);
    let msg = "Error loading credits.";
    if (detailError.code === "PGRST301") {
      msg += " (Not authorized by Row Level Security. Please check that you are logged in with the correct user.)";
    } else if (detailError.message) {
      msg += ` (${detailError.message})`;
    }
    return (
      <div className="flex flex-col text-rose-400 font-orbitron text-xs">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5" />
          {msg}
        </div>
      </div>
    );
  }

  if (!credits || (credits && (credits as any).__error)) {
    // Note: __error key checked above, so don't duplicate message here
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
          {Number((credits as any).current_balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} credits
        </span>
      </div>
    </div>
  );
};

export default CreditBalanceDisplay;
