
import { useCreditCheck } from './useCreditCheck';

export function useLinkedInPostCreditCheck() {
  const requiredCredits = 3.0; // LinkedIn posts require 3 credits
  const { hasCredits, isLoading, showInsufficientCreditsPopup, creditBalance } = useCreditCheck(requiredCredits);
  
  // Force refresh credits by re-fetching from database
  const refreshCredits = async () => {
    // Force a re-query by invalidating the cache
    window.location.reload();
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
