
import { useCreditCheck } from './useCreditCheck';

export function useLinkedInPostCreditCheck() {
  const requiredCredits = 3.0; // LinkedIn posts require 3 credits
  const { hasCredits, isLoading, showInsufficientCreditsPopup, creditBalance } = useCreditCheck(requiredCredits);
  
  // Refresh credits by re-fetching data without page reload
  const refreshCredits = async () => {
    // Since we removed the page reload, this function is no longer needed
    // Credit balance will be updated via real-time subscriptions
  };

  return {
    hasCredits,
    creditBalance,
    isLoading,
    showInsufficientCreditsPopup,
    requiredCredits,
    refreshCredits
  };
}
