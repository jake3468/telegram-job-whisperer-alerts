
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

  // Handle errors with more detailed messaging
  const detailError = (credits as any)?.__error ?? error;
  const debugInfo = (credits as any)?.__debug;
  
  if (detailError) {
    console.error("Error loading credits:", detailError);
    console.error("Debug info:", debugInfo);
    
    let msg = "Error loading credits.";
    
    if (detailError.code === "PGRST301") {
      msg = "Not authorized to view credits. Please check authentication.";
    } else if (detailError.message === "No credits found") {
      msg = "Credits not found. Please contact support.";
    } else if (detailError.message) {
      msg = `Error: ${detailError.message}`;
    }
    
    return (
      <div className="flex flex-col text-rose-400 font-orbitron text-xs">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5" />
          <span className="text-xs">{msg}</span>
        </div>
        {userProfile?.id && (
          <div className="text-xs opacity-60 mt-1">
            Profile ID: {userProfile.id.substring(0, 8)}...
          </div>
        )}
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

  // Ensure we have a valid credits object with current_balance
  const balance = (credits as any)?.current_balance ?? 0;

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
