
import { BadgeDollarSign } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useUserProfile } from "@/hooks/useUserProfile";

const CreditBalanceDisplay = () => {
  const { data, isLoading, error } = useUserCredits();
  const { userProfile, loading: userProfileLoading } = useUserProfile();

  console.log('[CreditBalanceDisplay] Render - data:', data, 'isLoading:', isLoading, 'error:', error);
  console.log('[CreditBalanceDisplay] UserProfile:', userProfile, 'userProfileLoading:', userProfileLoading);

  if (isLoading || userProfileLoading) {
    return (
      <div className="flex flex-col gap-2 text-fuchsia-200 font-orbitron text-xs">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5 animate-pulse" />
          Loading credits...
        </div>
        <span className="text-[10px] text-fuchsia-300">
          Profile loading: {userProfileLoading ? 'yes' : 'no'}, Credits loading: {isLoading ? 'yes' : 'no'}
        </span>
        {userProfile?.id && (
          <span className="text-[10px] text-fuchsia-300 break-all">
            Profile ID: {userProfile.id}
          </span>
        )}
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
        <span className="text-[10px] break-all">{String(error)}</span>
        {userProfile?.id && (
          <span className="text-[10px] break-all">Profile ID: {userProfile.id}</span>
        )}
      </div>
    );
  }

  if (!data) {
    // This could mean no credit row exists for this profile
    console.warn("No credit balance found for user profile.");
    return (
      <div className="flex flex-col text-yellow-400 font-orbitron text-xs">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5" />
          No credits found
        </div>
        <span className="text-[10px] break-all">Debug: No data from user_credits</span>
        {userProfile?.id && (
          <span className="text-[10px] break-all">Profile ID: {userProfile.id}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 text-fuchsia-200 font-orbitron text-sm px-2">
      <div className="flex items-center gap-2">
        <BadgeDollarSign className="w-5 h-5" />
        <span>
          {Number(data.current_balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} credits
        </span>
      </div>
      <span className="text-[10px] text-fuchsia-300 break-all">Debug user_profile_id: {data.user_profile_id}</span>
    </div>
  );
};

export default CreditBalanceDisplay;
